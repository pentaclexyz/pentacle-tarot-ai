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
        if (!process.env.FILEBASE_ACCESS_KEY || !process.env.FILEBASE_SECRET_KEY || !process.env.FILEBASE_BUCKET_NAME) {
            throw new Error('Missing required Filebase credentials');
        }

        console.log('Attempting to upload metadata:', JSON.stringify(metadata, null, 2));

        const metadataBlob = new Blob([JSON.stringify(metadata)], {
            type: 'application/json'
        });

        const formData = new FormData();
        formData.append('file', metadataBlob, 'reading.json');

        const headers: HeadersInit = {
            'Authorization': `Basic ${Buffer.from(process.env.FILEBASE_ACCESS_KEY + ':' + process.env.FILEBASE_SECRET_KEY).toString('base64')}`,
            'x-amz-bucket': process.env.FILEBASE_BUCKET_NAME
        };

        const response = await fetch('https://s3.filebase.com', {
            method: 'POST',
            headers,
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Filebase error response:', errorText);
            throw new Error(`Filebase upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Filebase success response:', data);
        return data.Location || data.cid;
    } catch (error) {
        console.error('Error uploading to Filebase:', error);
        throw error;
    }
}
