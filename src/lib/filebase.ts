// src/lib/filebase.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

export async function uploadToFilebase(metadata: ReadingMetadata): Promise<string> {
    try {
        if (!process.env.FILEBASE_ACCESS_KEY || !process.env.FILEBASE_SECRET_KEY || !process.env.FILEBASE_BUCKET_NAME) {
            throw new Error('Missing required Filebase credentials');
        }

        console.log('Attempting to upload metadata:', JSON.stringify(metadata, null, 2));

        // Configure S3 client for Filebase
        const s3Client = new S3Client({
            endpoint: "https://s3.filebase.com",
            region: "us-east-1", // Filebase uses us-east-1
            credentials: {
                accessKeyId: process.env.FILEBASE_ACCESS_KEY,
                secretAccessKey: process.env.FILEBASE_SECRET_KEY
            }
        });

        // Generate a unique filename
        const filename = `reading-${Date.now()}.json`;

        // Create the upload command
        const command = new PutObjectCommand({
            Bucket: process.env.FILEBASE_BUCKET_NAME,
            Key: filename,
            Body: JSON.stringify(metadata),
            ContentType: 'application/json'
        });

        // Upload the file
        const response = await s3Client.send(command);

        console.log('Filebase upload success:', response);

        // Return the filename or a success indicator
        return filename;
    } catch (error) {
        console.error('Error uploading to Filebase:', error);
        throw error;
    }
}
