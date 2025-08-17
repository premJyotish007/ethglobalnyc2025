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
      // Create provider for blockchain interaction
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Create auction contract instance
      const auctionContract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AUCTION_CONTRACT_ABI, provider)
      
      // Create ticket contract instance to get ticket info
      const ticketContract = new ethers.Contract("0xD252C2A8DC02Da67d5E8F5134D10a86759092784", [
        "function getTicketInfo(uint256 tokenId) view returns (tuple(string eventName, string section, string row, string seat, uint256 eventDate, uint256 price, bool isActive) ticket, bool isUsed)"
      ], provider)
      
      const activeAuctions: Auction[] = []
      
      // Check first 10 auction IDs for active auctions
      for (let i = 1; i <= 10; i++) {
        try {
          const auction = await auctionContract.getAuction(i)
          
          // Check if auction exists and is active
          if (auction && auction.auctionId.toString() !== "0" && auction.isActive && !auction.isSettled) {
            // Get ticket info for this auction
            let ticketInfo
            try {
              const [ticketData, isUsed] = await ticketContract.getTicketInfo(auction.ticketId)
              ticketInfo = {
                eventName: ticketData.eventName,
                section: ticketData.section,
                row: ticketData.row,
                seat: ticketData.seat,
                eventDate: new Date(Number(ticketData.eventDate) * 1000).toLocaleDateString(),
                price: ethers.formatUnits(ticketData.price, 6),
                isActive: ticketData.isActive
              }
            } catch (error) {
              console.log(`Could not get ticket info for token ID ${auction.ticketId}:`, error)
            }

            activeAuctions.push({
              auctionId: Number(auction.auctionId),
              ticketId: auction.ticketId,
              ticketCount: auction.ticketCount,
              startPrice: auction.startPrice,
              buyNowPrice: auction.buyNowPrice,
              minIncrement: auction.minIncrement,
              expiryTime: auction.expiryTime,
              seller: auction.seller,
              highestBidder: auction.highestBidder,
              highestBid: auction.highestBid,
              isActive: auction.isActive,
              isSettled: auction.isSettled
            })
          }
        } catch (error) {
          // Auction doesn't exist or error occurred, continue to next
          continue
        }
      }
      
      setAuctions(activeAuctions)
      
      // Load user bids if connected
      if (connection.address) {
        const bids = new Map<number, bigint>()
        // Query real user bids from the contract
        for (const auction of activeAuctions) {
          try {
            const userBid = await auctionContract.getBid(auction.auctionId, connection.address)
            if (userBid.toString() !== "0") {
              bids.set(auction.auctionId, userBid)
            }
          } catch (error) {
            // User has no bid on this auction
          }
        }
        setUserBids(bids)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions')
      // Fallback to mock data if blockchain fails
      setAuctions(mockAuctions)
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
      // Create provider and signer for blockchain interaction
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // Create auction contract instance
      const auctionContract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AUCTION_CONTRACT_ABI, signer)
      
      // Create USDC contract instance for allowance check
      const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
      const usdcABI = [
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
      ]
      const usdcContract = new ethers.Contract(usdcAddress, usdcABI, signer)
      
      // Check USDC allowance for auction contract
      const allowance = await usdcContract.allowance(connection.address, AUCTION_CONTRACT_ADDRESS)
      
      if (allowance < bidAmount) {
        console.log('Approving USDC spending...')
        const approveTx = await usdcContract.approve(AUCTION_CONTRACT_ADDRESS, bidAmount)
        await approveTx.wait()
        console.log('USDC approved for auction contract')
      }
      
      // Place the bid on the blockchain
      console.log(`Placing bid of ${ethers.formatUnits(bidAmount, 6)} USDC on auction ${auctionId}...`)
      const bidTx = await auctionContract.bid(auctionId, bidAmount)
      
      // Wait for transaction confirmation
      const receipt = await bidTx.wait()
      console.log('Bid placed successfully! Transaction hash:', bidTx.hash)
      
      // Refresh auctions to get updated blockchain state
      await loadAuctions()
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [connection, loadAuctions])

  // Buy now (execute buy now price)
  const buyNow = useCallback(async (auctionId: number) => {
    if (!connection.isConnected || !connection.address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create provider and signer for blockchain interaction
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // Create auction contract instance
      const auctionContract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS, AUCTION_CONTRACT_ABI, signer)
      
      // Create USDC contract instance for allowance check
      const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
      const usdcABI = [
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)"
      ]
      const usdcContract = new ethers.Contract(usdcAddress, usdcABI, signer)
      
      // Get auction details to know the buy now price
      const auction = await auctionContract.getAuction(auctionId)
      const buyNowPrice = auction.buyNowPrice
      
      // Check USDC allowance for auction contract
      const allowance = await usdcContract.allowance(connection.address, AUCTION_CONTRACT_ADDRESS)
      
      if (allowance < buyNowPrice) {
        console.log('Approving USDC spending...')
        const approveTx = await usdcContract.approve(AUCTION_CONTRACT_ADDRESS, buyNowPrice)
        await approveTx.wait()
        console.log('USDC approved for auction contract')
      }
      
      // Execute buy now on the blockchain
      console.log(`Executing buy now for ${ethers.formatUnits(buyNowPrice, 6)} USDC on auction ${auctionId}...`)
      const buyNowTx = await auctionContract.buyNow(auctionId)
      
      // Wait for transaction confirmation
      const receipt = await buyNowTx.wait()
      console.log('Buy now executed successfully! Transaction hash:', buyNowTx.hash)
      
      // Refresh auctions to get updated blockchain state
      await loadAuctions()
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute buy now')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [connection, loadAuctions])

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
