"use client";

import { PrivyProvider, PrivyClientConfig } from '@privy-io/react-auth';

export function PrivyProviderConfig({ children }: { children: React.ReactNode }) {
    const privyConfig: PrivyClientConfig = {
        loginMethods: ['wallet'],
        appearance: {
            theme: 'light',
            accentColor: '#676FFF',
            showWalletLoginFirst: true,
        },
        supportedChains: [{
            name: 'mantle',
            id: 5000,
            rpcUrls: {
                default: {
                    http: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz'],
                },
            },
            nativeCurrency: {
                name: 'MNT',
                symbol: 'MNT',
                decimals: 18,
            },
        }],
        defaultChain: {
            name: 'mantle',
            id: 5000,
            rpcUrls: {
                default: {
                    http: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.mantle.xyz'],
                },
            },
            nativeCurrency: {
                name: 'MNT',
                symbol: 'MNT',
                decimals: 18,
            },
        },
    };

    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
            config={privyConfig}
        >
            {children}
        </PrivyProvider>
    );
}

export default PrivyProviderConfig;
