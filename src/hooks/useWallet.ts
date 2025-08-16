import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { WalletConnection } from '@/types'

export function useWallet() {
  const [connection, setConnection] = useState<WalletConnection>({
    isConnected: false
  })

  // Privy hooks for account abstraction
  const { 
    login, 
    logout, 
    authenticated, 
    user, 
    ready,
    createWallet,
    linkWallet,
    unlinkWallet
  } = usePrivy()

  // Wagmi hooks for MetaMask
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  // MetaMask connector
  const metaMaskConnector = connectors.find(
    connector => connector.name === 'MetaMask'
  )

  const connectMetaMask = async () => {
    if (metaMaskConnector) {
      try {
        await connect({ connector: metaMaskConnector })
      } catch (error) {
        console.error('Failed to connect MetaMask:', error)
      }
    }
  }

  const disconnectMetaMask = () => {
    disconnect()
  }

  // Privy account abstraction methods
  const connectPrivy = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Failed to connect Privy:', error)
    }
  }

  const createSmartWallet = async () => {
    try {
      // Ensure user is authenticated first
      if (!authenticated) {
        console.log('User not authenticated, starting login flow...')
        await login()
        // Wait for authentication to complete
        return new Promise((resolve, reject) => {
          const checkAuth = () => {
            if (authenticated && user) {
              console.log('User authenticated, creating wallet...')
              createWallet()
                .then(resolve)
                .catch(reject)
            } else {
              setTimeout(checkAuth, 100)
            }
          }
          checkAuth()
        })
      }
      
      // User is already authenticated, create wallet
      console.log('User authenticated, creating smart wallet...')
      const newWallet = await createWallet()
      console.log('Created smart wallet:', newWallet)
      
      return newWallet
    } catch (error) {
      console.error('Failed to create smart wallet:', error)
      throw error
    }
  }

  const ensureSmartWallet = async () => {
    try {
      // Ensure user is authenticated first
      if (!authenticated) {
        console.log('User not authenticated, starting login flow...')
        await login()
        // Wait for authentication to complete
        return new Promise((resolve, reject) => {
          const checkAuth = () => {
            if (authenticated && user) {
              console.log('User authenticated, checking for existing wallet...')
              const existingWallet = getSmartWalletAddress()
              
              if (existingWallet) {
                console.log('Using existing smart wallet:', existingWallet)
                resolve(existingWallet)
              } else {
                console.log('No existing smart wallet found, creating new one...')
                createWallet()
                  .then(resolve)
                  .catch(reject)
              }
            } else {
              setTimeout(checkAuth, 100)
            }
          }
          checkAuth()
        })
      }

      // User is already authenticated, check for existing wallet
      const existingWallet = getSmartWalletAddress()
      
      if (existingWallet) {
        console.log('Using existing smart wallet:', existingWallet)
        return existingWallet
      } else {
        // Create new smart wallet if none exists
        console.log('No existing smart wallet found, creating new one...')
        const newWallet = await createWallet()
        console.log('Created new smart wallet:', newWallet)
        return newWallet
      }
    } catch (error) {
      console.error('Failed to ensure smart wallet:', error)
      throw error
    }
  }

  const linkExternalWallet = async () => {
    try {
      // Ensure user is authenticated first
      if (!authenticated) {
        console.log('User not authenticated, starting login flow...')
        await login()
        return
      }
      
      // Open the link wallet modal
      await linkWallet()
      console.log('Opened link wallet modal')
    } catch (error) {
      console.error('Failed to open link wallet modal:', error)
      throw error
    }
  }

  const unlinkExternalWallet = async (walletAddress: string) => {
    try {
      await unlinkWallet(walletAddress)
      console.log('Unlinked external wallet:', walletAddress)
    } catch (error) {
      console.error('Failed to unlink external wallet:', error)
      throw error
    }
  }

  const disconnectPrivy = () => {
    logout()
  }

  // Get the primary smart wallet address
  const getSmartWalletAddress = () => {
    if (user?.wallet?.address) {
      return user.wallet.address
    }
    
    // If user has linked wallets, get the first one
    if (user?.linkedAccounts && user.linkedAccounts.length > 0) {
      const linkedWallet = user.linkedAccounts.find(account => account.type === 'wallet')
      return linkedWallet?.address
    }
    
    return null
  }

  // Check if user has a deployed smart wallet
  const hasDeployedSmartWallet = () => {
    return !!getSmartWalletAddress()
  }

  // Update connection state based on active wallet
  useEffect(() => {
    if (wagmiConnected && wagmiAddress) {
      setConnection({
        isConnected: true,
        address: wagmiAddress,
        provider: 'metamask'
      })
    } else if (authenticated) {
      const smartWalletAddress = getSmartWalletAddress()
      if (smartWalletAddress) {
        setConnection({
          isConnected: true,
          address: smartWalletAddress,
          provider: 'privy'
        })
      } else {
        setConnection({
          isConnected: false
        })
      }
    } else {
      setConnection({
        isConnected: false
      })
    }
  }, [wagmiConnected, wagmiAddress, authenticated, user])

  return {
    connection,
    connectMetaMask,
    disconnectMetaMask,
    connectPrivy,
    disconnectPrivy,
    createSmartWallet,
    ensureSmartWallet,
    linkExternalWallet,
    unlinkExternalWallet,
    getSmartWalletAddress,
    hasDeployedSmartWallet,
    ready,
    authenticated,
    user
  }
}
