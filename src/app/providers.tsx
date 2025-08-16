'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import { ReactNode } from 'react'

const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID' }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider 
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id'}
          config={{
            loginMethods: ['email', 'wallet'],
            appearance: {
              theme: 'light',
              accentColor: '#3b82f6',
              showWalletLoginFirst: false,
            },
            defaultChain: mainnet,
            supportedChains: [mainnet, sepolia],
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
            },
          }}
        >
          {children}
        </PrivyProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
