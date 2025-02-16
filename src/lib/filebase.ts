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

export async function uploadToFilebase(
    metadata: ReadingMetadata
): Promise<string> {
    try {
        if (
            !process.env.FILEBASE_ACCESS_KEY ||
            !process.env.FILEBASE_SECRET_KEY ||
            !process.env.FILEBASE_BUCKET_NAME
        ) {
            throw new Error("Missing required Filebase credentials");
        }

        console.log("Attempting to upload metadata:", JSON.stringify(metadata, null, 2));

        // Configure S3 client for Filebase
        const s3Client = new S3Client({
            endpoint: "https://s3.filebase.com",
            region: "us-east-1", // Filebase uses us-east-1
            credentials: {
                accessKeyId: process.env.FILEBASE_ACCESS_KEY,
                secretAccessKey: process.env.FILEBASE_SECRET_KEY,
            },
        });

        // Generate a unique filename
        const filename = `reading-${Date.now()}.json`;

        // Create the upload command
        const putCommand = new PutObjectCommand({
            Bucket: process.env.FILEBASE_BUCKET_NAME,
            Key: filename,
            Body: JSON.stringify(metadata),
            ContentType: "application/json",
        });

        // Upload the file
        const putResponse = await s3Client.send(putCommand);
        console.log("Filebase upload success:", putResponse);

        // Optionally, wait a bit for metadata to update
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Retrieve the file metadata (which includes the IPFS CID)
        const headCommand = new HeadObjectCommand({
            Bucket: process.env.FILEBASE_BUCKET_NAME,
            Key: filename,
        });
        const headResponse = await s3Client.send(headCommand);
        console.log("File metadata:", headResponse);

        // Filebase stores the IPFS CID in the metadata (the key may vary, often it's 'cid')
        const cid = headResponse.Metadata?.["cid"];
        if (!cid) {
            throw new Error("IPFS CID not found in Filebase metadata");
        }

        return cid;
    } catch (error) {
        console.error("Error uploading to Filebase:", error);
        throw error;
    }
}
