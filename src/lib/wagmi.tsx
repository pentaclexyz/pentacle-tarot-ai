'use client'

import { http } from 'viem'
import { createConfig } from 'wagmi'
import { mantle } from 'wagmi/chains'
import { ConnectKitProvider, getDefaultConfig } from "connectkit"
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const config = createConfig(
    getDefaultConfig({
        chains: [mantle],
        transports: {
            [mantle.id]: http()
        },
        walletConnectProjectId: "", // not needed if we're not using WalletConnect
        appName: "Your App",
    })
)

interface ProvidersProps {
    children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
    const queryClient = new QueryClient()

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
