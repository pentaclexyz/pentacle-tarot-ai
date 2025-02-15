// src/lib/filebase.ts

// Types
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

// Configuration
interface FilebaseConfig {
    bucket: string;
    accessKey: string;
    secretKey: string;
    endpoint: string;
    apiKey: string;
}

export const filebaseConfig: FilebaseConfig = {
    bucket: process.env.FILEBASE_BUCKET_NAME!,
    accessKey: process.env.FILEBASE_ACCESS_KEY!,
    secretKey: process.env.FILEBASE_SECRET_KEY!,
    endpoint: 'https://api.filebase.io/v1/ipfs',
    apiKey: process.env.FILEBASE_API_KEY!
};

// Upload function
export async function uploadToFilebase(metadata: ReadingMetadata): Promise<string> {
    try {
        const response = await fetch(filebaseConfig.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${filebaseConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });

        if (!response.ok) {
            throw new Error(`Filebase upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.cid;
    } catch (error) {
        console.error('Error uploading to Filebase:', error);
        throw error;
    }
}
