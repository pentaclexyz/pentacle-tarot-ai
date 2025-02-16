// src/lib/filebase.ts
import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";

export interface ReadingMetadata {
    name: string;
    description: string;
    reading: {
        cards: string;
        interpretation: string;
        timestamp: string;
        type: string;
    };
    image?: string;
}

const getS3Client = () => {
    if (
        !process.env.FILEBASE_ACCESS_KEY ||
        !process.env.FILEBASE_SECRET_KEY ||
        !process.env.FILEBASE_BUCKET_NAME
    ) {
        throw new Error("Missing required Filebase credentials");
    }

    return new S3Client({
        endpoint: "https://s3.filebase.com",
        region: "us-east-1",
        credentials: {
            accessKeyId: process.env.FILEBASE_ACCESS_KEY,
            secretAccessKey: process.env.FILEBASE_SECRET_KEY,
        },
    });
};

/**
 * Uploads JSON metadata to Filebase and returns the IPFS CID.
 */
export async function uploadToFilebase(
    metadata: ReadingMetadata
): Promise<string> {
    try {
        console.log("Attempting to upload metadata:", JSON.stringify(metadata, null, 2));

        const s3Client = getS3Client();

        // Generate a unique filename for the JSON file
        const filename = `reading-${Date.now()}.json`;

        const putCommand = new PutObjectCommand({
            Bucket: process.env.FILEBASE_BUCKET_NAME,
            Key: filename,
            Body: JSON.stringify(metadata),
            ContentType: "application/json",
        });

        const putResponse = await s3Client.send(putCommand);
        console.log("Filebase upload success:", putResponse);

        // Wait briefly to ensure metadata is updated on Filebase
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const headCommand = new HeadObjectCommand({
            Bucket: process.env.FILEBASE_BUCKET_NAME,
            Key: filename,
        });
        const headResponse = await s3Client.send(headCommand);
        console.log("File metadata:", headResponse);


        const ipfsCid = headResponse.Metadata?.["cid"];
        if (!ipfsCid) {
            throw new Error("IPFS CID not found in Filebase metadata");
        }

        return ipfsCid;
    } catch (error) {
        console.error("Error uploading to Filebase:", error);
        throw error;
    }
}

/**
 * Fetches an image from the given URL, uploads it to Filebase, and returns the IPFS CID.
 */
export async function uploadImageToFilebase(imageUrl: string): Promise<string> {
    try {
        console.log("Attempting to upload image from URL:", imageUrl);

        // Fetch the image from Cloudinary (or any other source)
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error("Failed to fetch image from Cloudinary");
        }

        // Convert the response to an ArrayBuffer
        const imageBuffer = await imageResponse.arrayBuffer();

        const s3Client = getS3Client();

        // Generate a unique filename for the image
        const filename = `image-${Date.now()}.jpg`;

        const putCommand = new PutObjectCommand({
            Bucket: process.env.FILEBASE_BUCKET_NAME,
            Key: filename,
            Body: Buffer.from(imageBuffer), // Convert ArrayBuffer to Buffer (Node environment)
            ContentType: "image/jpeg",
        });

        const putResponse = await s3Client.send(putCommand);
        console.log("Image upload success:", putResponse);

        // Wait briefly to ensure metadata is updated on Filebase
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const headCommand = new HeadObjectCommand({
            Bucket: process.env.FILEBASE_BUCKET_NAME,
            Key: filename,
        });
        const headResponse = await s3Client.send(headCommand);
        console.log("Image file metadata:", headResponse);

        const ipfsCid = headResponse.Metadata?.["cid"];
        if (!ipfsCid) {
            throw new Error("IPFS CID not found in Filebase metadata for image");
        }

        return ipfsCid;
    } catch (error) {
        console.error("Error uploading image to Filebase:", error);
        throw error;
    }
}
