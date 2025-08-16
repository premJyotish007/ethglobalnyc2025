import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWallet } from '@/hooks/useWallet'
import { formatAddress } from '@/lib/utils'
import { Wallet, LogOut, User, Plus, Link, Unlink, Loader2, Copy } from 'lucide-react'

export function WalletConnect() {
  const { 
    connection, 
    connectMetaMask, 
    disconnectMetaMask, 
    connectPrivy, 
    disconnectPrivy,
    createSmartWallet,
    ensureSmartWallet,
    linkExternalWallet,
    unlinkExternalWallet,
    hasDeployedSmartWallet,
    ready,
    user,
    authenticated
  } = useWallet()

  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [isLinkingWallet, setIsLinkingWallet] = useState(false)
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Reset signing in state when authentication changes
  useEffect(() => {
    if (authenticated && isSigningIn) {
      setIsSigningIn(false)
    }
  }, [authenticated, isSigningIn])

  // Reset signing in state if user was signing in but is no longer authenticated
  useEffect(() => {
    if (!authenticated && isSigningIn) {
      // Check if user cancelled the sign-in flow
      const timeout = setTimeout(() => {
        if (!authenticated) {
          setIsSigningIn(false)
        }
      }, 5000) // Reset after 5 seconds if still not authenticated

      return () => clearTimeout(timeout)
    }
  }, [authenticated, isSigningIn])

  const handleCreateSmartWallet = async () => {
    setIsCreatingWallet(true)
    try {
      await createSmartWallet()
    } catch (error) {
      console.error('Failed to create smart wallet:', error)
    } finally {
      setIsCreatingWallet(false)
    }
  }

  const handleSignInWithPrivy = async () => {
    setIsSigningIn(true)
    try {
      // This will automatically handle smart wallet deployment
      await ensureSmartWallet()
    } catch (error) {
      console.error('Failed to sign in with Privy:', error)
      setIsSigningIn(false) // Reset state on error
    }
  }

  const handleLinkWallet = async () => {
    setIsLinkingWallet(true)
    try {
      await linkExternalWallet()
    } catch (error) {
      console.error('Failed to link wallet:', error)
    } finally {
      setIsLinkingWallet(false)
    }
  }

  if (!ready) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (connection.isConnected) {
    const hasExistingWallet = hasDeployedSmartWallet()
    
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            {hasExistingWallet 
              ? 'Your wallet is ready for trading'
              : 'Your new smart wallet is ready for trading'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address:</span>
            <span className="text-sm font-mono">{formatAddress(connection.address!)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type:</span>
            <Badge variant="outline" className="capitalize">
              {connection.provider === 'privy' ? 'Smart Wallet' : connection.provider}
            </Badge>
          </div>
          
          {connection.provider === 'privy' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={hasExistingWallet ? "default" : "secondary"}>
                {hasExistingWallet ? 'Existing Wallet' : 'New Wallet'}
              </Badge>
            </div>
          )}
          
          {/* Linked Accounts Section */}
          {user?.linkedAccounts && user.linkedAccounts.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Linked Accounts</h4>
              <div className="space-y-2">
                {user.linkedAccounts
                  .filter(account => account.type === 'wallet')
                  .map((account, index) => {
                    const walletAddress = (account as any).address || ''
                    return (
                      <div key={`linked-wallet-${walletAddress}-${index}`} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">External Wallet:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">
                            {formatAddress(walletAddress)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(walletAddress)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={connection.provider === 'metamask' ? disconnectMetaMask : disconnectPrivy}
              variant="outline"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show authentication in progress state
  if (authenticated && !connection.isConnected) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Setting up your smart wallet...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
        <CardDescription>
          Choose your preferred wallet or create a smart wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={connectMetaMask}
          className="w-full"
          variant="outline"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect MetaMask
        </Button>
        <Button 
          onClick={handleSignInWithPrivy}
          className="w-full"
          variant="outline"
          disabled={isSigningIn}
        >
          {isSigningIn ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <User className="h-4 w-4 mr-2" />
          )}
          {isSigningIn ? 'Signing in with Privy...' : 'Sign in with Privy'}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Smart wallets provide enhanced security and gasless transactions
        </p>
      </CardContent>
    </Card>
  )
}
