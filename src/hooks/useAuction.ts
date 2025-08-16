import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { AUCTION_CONTRACT_ABI, CONTRACT_ADDRESS_AUCTION_DATA } from '@/lib/contract'
import { useWallet } from './useWallet'

export interface CreateAuctionParams {
  ticketId: string | number
  ticketCount?: number
  startPrice: string | number
  buyNowPrice?: string | number
  minIncrement?: string | number
  expiryTime?: number
}

export interface AuctionResult {
  success: boolean
  auctionId?: string
  transactionHash?: string
  error?: string
}

export function useAuction() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { connection } = useWallet()

  const createAuction = useCallback(async (params: CreateAuctionParams): Promise<AuctionResult> => {
    if (!connection.isConnected || !connection.address) {
      return {
        success: false,
        error: 'Wallet not connected'
      }
    }

    setIsCreating(true)
    setError(null)

    try {
      // Check if MetaMask is available
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed')
      }

      // Request account access
      const accounts = await (window.ethereum as any).request({ method: 'eth_requestAccounts' })
      const userAddress = accounts[0]

      // Create provider and signer from MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum as any)
      const signer = await provider.getSigner()

      // Validate parameters
      const {
        ticketId,
        ticketCount = 1,
        startPrice,
        buyNowPrice = startPrice,
        minIncrement = ethers.parseEther("0.01"),
        expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
      } = params

      // Convert parameters to BigNumber
      const ticketIdBN = ethers.toBigInt(ticketId)
      const ticketCountBN = ethers.toBigInt(ticketCount)
      const startPriceBN = ethers.toBigInt(startPrice)
      const buyNowPriceBN = ethers.toBigInt(buyNowPrice)
      const minIncrementBN = ethers.toBigInt(minIncrement)
      const expiryTimeBN = ethers.toBigInt(expiryTime)

      // Create contract instance
      const auctionContract = new ethers.Contract(
        CONTRACT_ADDRESS_AUCTION_DATA!,
        AUCTION_CONTRACT_ABI,
        signer
      )

      console.log('Creating auction with parameters:', {
        ticketId: ticketIdBN.toString(),
        ticketCount: ticketCountBN.toString(),
        startPrice: startPriceBN.toString(),
        buyNowPrice: buyNowPriceBN.toString(),
        minIncrement: minIncrementBN.toString(),
        expiryTime: expiryTimeBN.toString()
      })

      // Call the createAuction function
      const tx = await auctionContract.createAuction(
        ticketIdBN,
        ticketCountBN,
        startPriceBN,
        buyNowPriceBN,
        minIncrementBN,
        expiryTimeBN
      )

      console.log('Transaction sent:', tx.hash)

      // Wait for transaction to be mined
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)

      // Get the auction ID from the event
      const auctionCreatedEvent = receipt.logs.find(log => {
        try {
          const parsedLog = auctionContract.interface.parseLog(log)
          return parsedLog.name === 'AuctionCreated'
        } catch (error) {
          return false
        }
      })

      let auctionId = null
      if (auctionCreatedEvent) {
        const parsedLog = auctionContract.interface.parseLog(auctionCreatedEvent)
        auctionId = parsedLog.args.auctionId.toString()
        console.log('Auction created with ID:', auctionId)
      }

      return {
        success: true,
        auctionId: auctionId,
        transactionHash: tx.hash
      }

    } catch (error: any) {
      console.error('Error creating auction:', error)
      const errorMessage = error.message || 'Failed to create auction'
      setError(errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsCreating(false)
    }
  }, [connection])

  const checkTicketBalance = useCallback(async (ticketId: string | number): Promise<boolean> => {
    if (!connection.isConnected || !connection.address) {
      return false
    }

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        return false
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Check ticket balance
      const ticketContract = new ethers.Contract(
        CONTRACT_ADDRESS!,
        ["function balanceOf(address account, uint256 id) view returns (uint256)"],
        provider
      )

      const balance = await ticketContract.balanceOf(connection.address, ticketId)
      return balance.gt(0)
    } catch (error) {
      console.error('Error checking ticket balance:', error)
      return false
    }
  }, [connection])

  const checkExistingAuction = useCallback(async (ticketId: string | number): Promise<string | null> => {
    if (!connection.isConnected) {
      return null
    }

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        return null
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      
      const auctionContract = new ethers.Contract(
        CONTRACT_ADDRESS_AUCTION_DATA!,
        AUCTION_CONTRACT_ABI,
        provider
      )

      const auctionId = await auctionContract.getActiveAuctionForTicket(ticketId)
      return auctionId.toString() !== '0' ? auctionId.toString() : null
    } catch (error) {
      console.error('Error checking existing auction:', error)
      return null
    }
  }, [connection])

  return {
    createAuction,
    checkTicketBalance,
    checkExistingAuction,
    isCreating,
    error
  }
}
