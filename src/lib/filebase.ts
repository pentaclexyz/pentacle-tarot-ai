// src/lib/filebase.ts
export async function uploadToFilebase(metadata: ReadingMetadata): Promise<string> {
    try {
        console.log('Attempting to upload metadata:', JSON.stringify(metadata, null, 2));

        const metadataBlob = new Blob([JSON.stringify(metadata)], {
            type: 'application/json'
        });

        const formData = new FormData();
        formData.append('file', metadataBlob, 'reading.json');

        // Use the S3 endpoint instead
        const response = await fetch('https://s3.filebase.com', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(process.env.FILEBASE_ACCESS_KEY + ':' + process.env.FILEBASE_SECRET_KEY).toString('base64')}`,
                'x-amz-bucket': process.env.FILEBASE_BUCKET_NAME
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Filebase error response:', errorText);
            throw new Error(`Filebase upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Filebase success response:', data);
        return data.Location || data.cid; // S3 returns Location
    } catch (error) {
        console.error('Error uploading to Filebase:', error);
        throw error;
    }
}
