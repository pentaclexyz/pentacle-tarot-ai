// components/MintButton.jsx
import { useState } from 'react';
import { ethers } from 'ethers';
import TarotNFTAbi from '@/abi/TarotNFT.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function MintButton({ cid }) {
    const [loading, setLoading] = useState(false);
    const [tokenId, setTokenId] = useState(null);
    const [error, setError] = useState(null);

    // Construct the token URI using the metadata CID from Filebase
    const tokenURI = `https://pentacle.myfilebase.com/ipfs/${cid}`;

    const mintNFT = async (tokenURI) => {
        if (!window.ethereum) {
            throw new Error('Please install MetaMask');
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(CONTRACT_ADDRESS, TarotNFTAbi, signer);

        // Mint the NFT by calling your contract's mint function
        const tx = await nftContract.mintNFT(await signer.getAddress(), tokenURI);
        const receipt = await tx.wait();

        // Extract tokenId from receipt if available
        const mintedTokenId = receipt.events[0].args.tokenId.toNumber();
        return mintedTokenId;
    };

    const handleMint = async () => {
        try {
            setLoading(true);
            const mintedTokenId = await mintNFT(tokenURI);
            setTokenId(mintedTokenId);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleMint} disabled={loading}>
                {loading ? 'Minting...' : 'Mint NFT'}
            </button>
            {error && <p>Error: {error}</p>}
            {tokenId !== null && <p>NFT minted with Token ID: {tokenId}</p>}
        </div>
    );
}
