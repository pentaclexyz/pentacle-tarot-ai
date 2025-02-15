// src/lib/filebase.ts
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
        console.log('Attempting to upload metadata:', JSON.stringify(metadata, null, 2));

        // Format specifically for Filebase IPFS API
        const filebasePayload = {
            pinataOptions: {
                cidVersion: 1
            },
            pinataMetadata: {
                name: metadata.name
            },
            pinataContent: metadata
        };

        console.log('Formatted payload for Filebase:', JSON.stringify(filebasePayload, null, 2));

        const response = await fetch('https://api.filebase.io/v1/ipfs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.FILEBASE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filebasePayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Filebase error response:', errorText);
            throw new Error(`Filebase upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Filebase success response:', data);
        return data.cid;
    } catch (error) {
        console.error('Error uploading to Filebase:', error);
        throw error;
    }
}
