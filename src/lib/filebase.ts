export async function uploadToFilebase(metadata: ReadingMetadata): Promise<string> {
    try {
        console.log('Attempting to upload metadata:', JSON.stringify(metadata, null, 2));

        // Create a JSON Blob/File of the metadata
        const metadataBlob = new Blob([JSON.stringify(metadata)], {
            type: 'application/json'
        });

        const formData = new FormData();
        formData.append('file', metadataBlob, 'reading.json');

        const response = await fetch('https://api.filebase.io/v1/ipfs/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.FILEBASE_API_KEY}`
                // Don't set Content-Type - FormData will set it automatically
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
        return data.cid;
    } catch (error) {
        console.error('Error uploading to Filebase:', error);
        throw error;
    }
}
