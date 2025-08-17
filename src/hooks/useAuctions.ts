import { useState, useEffect, useCallback } from 'react'
import { useWallet } from './useWallet'
import { Ticket, Auction } from '@/types'
import { TicketAuctionContract } from '@/contracts/interfaces'
import { AUCTION_CONTRACT_ADDRESS, AUCTION_CONTRACT_ABI } from '@/lib/contract'
import { ethers } from 'ethers'

export function useAuctions() {
  const { connection } = useWallet()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [userBids, setUserBids] = useState<Map<number, bigint>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingAuction, setIsCreatingAuction] = useState(false)

  // Mock data for now - in real implementation, this would come from the blockchain
  const mockAuctions: Auction[] = [
    {
      auctionId: 1,
      ticketId: BigInt(1),
      ticketCount: BigInt(1),
      startPrice: BigInt(300000), // 0.3 USDC (6 decimals) - ALLOWED!
      buyNowPrice: BigInt(500000), // 0.5 USDC
      minIncrement: BigInt(10000), // 0.01 USDC
      expiryTime: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24 hours from now
      seller: "0x1234567890123456789012345678901234567890",
      highestBidder: "0x0000000000000000000000000000000000000000",
      highestBid: BigInt(0),
      isActive: true,
      isSettled: false
    },
    {
      auctionId: 2,
      ticketId: BigInt(2),
      ticketCount: BigInt(1),
      startPrice: BigInt(100000), // 0.1 USDC (6 decimals) - ALLOWED!
      buyNowPrice: BigInt(200000), // 0.2 USDC
      minIncrement: BigInt(10000), // 0.01 USDC
      expiryTime: BigInt(Math.floor(Date.now() / 1000) + 172800), // 48 hours from now
      seller: "0x1234567890123456789012345678901234567890",
      highestBidder: "0x0987654321098765432109876543210987654321",
      highestBid: BigInt(150000), // 0.15 USDC
      isActive: true,
      isSettled: false
    }
  ]

  // Load auctions
  const loadAuctions = useCallback(async () => {
    if (!connection.isConnected) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // In real implementation, this would call the smart contract
      // For now, we'll use mock data
      setAuctions(mockAuctions)
      
      // Load user bids if connected
      if (connection.address) {
        const bids = new Map<number, bigint>()
        // Mock user bids - in real implementation, query the contract
        if (connection.address.toLowerCase() === "0x0987654321098765432109876543210987654321") {
          bids.set(2, BigInt(150000)) // 0.15 USDC bid on auction 2
        }
        setUserBids(bids)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions')
    } finally {
      setIsLoading(false)
    }
  }, [connection])

  // Create a new auction
  const createAuction = useCallback(async (auctionData: {
    ticketId: string
    startPrice: number
    buyNowPrice: number
    minIncrement: number
    expiryDays: number
  }) => {
    if (!connection.isConnected || !connection.address) {
      throw new Error('Wallet not connected')
    }

    setIsCreatingAuction(true)
    setError(null)

    try {
      // Convert to USDC decimals (6 decimals)
      const startPrice = BigInt(Math.floor(auctionData.startPrice * 1000000))
      const buyNowPrice = BigInt(Math.floor(auctionData.buyNowPrice * 1000000))
      const minIncrement = BigInt(Math.floor(auctionData.minIncrement * 1000000))
      
      // Calculate expiry time
      const expiryTime = BigInt(Math.floor(Date.now() / 1000) + (auctionData.expiryDays * 24 * 60 * 60))
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const auctionContract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AUCTION_CONTRACT_ABI, signer)
      
      // Create the auction
      const tx = await auctionContract.createAuction(
        BigInt(auctionData.ticketId),
        1, // ticketCount - assuming 1 ticket per auction
        startPrice,
        buyNowPrice,
        minIncrement,
        expiryTime
      )
      
      console.log('Creating auction...', tx.hash)
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      console.log('Auction created successfully!', receipt)
      
      // Refresh auctions
      await loadAuctions()
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create auction')
      throw err
    } finally {
      setIsCreatingAuction(false)
    }
  }, [connection, loadAuctions])

  // Place a bid on an auction
  const placeBid = useCallback(async (auctionId: number, bidAmount: bigint) => {
    if (!connection.isConnected || !connection.address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      // In real implementation, this would:
      // 1. Check USDC allowance
      // 2. Call the bid() function on the auction contract
      // 3. Wait for transaction confirmation
      
      // For now, simulate the bid
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate transaction time
      
      // Update local state
      setAuctions(prev => prev.map(auction => {
        if (auction.auctionId === auctionId) {
          return {
            ...auction,
            highestBid: bidAmount,
            highestBidder: connection.address
          }
        }
        return auction
      }))

      // Update user bids
      setUserBids(prev => new Map(prev).set(auctionId, bidAmount))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [connection])

  // Buy now (execute buy now price)
  const buyNow = useCallback(async (auctionId: number) => {
    if (!connection.isConnected || !connection.address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      // In real implementation, this would call the buyNow() function
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate transaction time
      
      // Update local state
      setAuctions(prev => prev.map(auction => {
        if (auction.auctionId === auctionId) {
          return {
            ...auction,
            isActive: false,
            isSettled: true,
            highestBidder: connection.address,
            highestBid: auction.buyNowPrice
          }
        }
        return auction
      }))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute buy now')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [connection])

  // Get auction by ID
  const getAuction = useCallback((auctionId: number) => {
    return auctions.find(auction => auction.auctionId === auctionId)
  }, [auctions])

  // Get user's current bid on an auction
  const getUserBid = useCallback((auctionId: number) => {
    return userBids.get(auctionId)
  }, [userBids])

  // Check if user can bid (not the seller and auction is active)
  const canBid = useCallback((auction: Auction) => {
    if (!connection.address || !auction.isActive || auction.isSettled) return false
    return connection.address.toLowerCase() !== auction.seller.toLowerCase()
  }, [connection.address])

  // Check if user can buy now
  const canBuyNow = useCallback((auction: Auction) => {
    if (!connection.address || !auction.isActive || auction.isSettled) return false
    if (auction.buyNowPrice === BigInt(0)) return false
    return connection.address.toLowerCase() !== auction.seller.toLowerCase()
  }, [connection.address])

  // Load auctions when provider or address changes
  useEffect(() => {
    loadAuctions()
  }, [loadAuctions])

  return {
    auctions,
    userBids,
    isLoading,
    error,
    isCreatingAuction,
    createAuction,
    placeBid,
    buyNow,
    getAuction,
    getUserBid,
    canBid,
    canBuyNow,
    loadAuctions
  }
}
