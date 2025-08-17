import { useState } from 'react'
import { ethers } from 'ethers'
import { AUCTION_CONTRACT_ADDRESS, AUCTION_CONTRACT_ABI, CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { useToast } from './useToast'

export interface CreateAuctionParams {
  tokenId: string
  startPrice: bigint
  buyNowPrice: bigint
  minIncrement: bigint
  expiryTime: bigint
  ticketInfo?: any
}

export interface BidParams {
  auctionId: string
  bidAmount: bigint
}

export function useAuctions() {
  const [isCreatingAuction, setIsCreatingAuction] = useState(false)
  const [isBidding, setIsBidding] = useState(false)
  const { toast } = useToast()

  const createAuction = async (params: CreateAuctionParams) => {
    if (!window.ethereum) {
      toast.error("Error", "Please connect your wallet first")
      return
    }

    setIsCreatingAuction(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // First, approve the auction contract to transfer tickets
      const ticketContract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, signer)
      const auctionContract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS!, AUCTION_CONTRACT_ABI, signer)
      
      // Check if already approved
      const isApproved = await ticketContract.isApprovedForAll(await signer.getAddress(), AUCTION_CONTRACT_ADDRESS!)
      
      if (!isApproved) {
        toast.info("Approving tickets...", "Please approve the auction contract to transfer your tickets")
        
        const approveTx = await ticketContract.setApprovalForAll(AUCTION_CONTRACT_ADDRESS!, true)
        await approveTx.wait()
        
        toast.success("Approval successful!", "Now creating auction...")
      }
      
      // Also check if the user has enough tickets
      const userBalance = await ticketContract.balanceOf(await signer.getAddress(), BigInt(params.tokenId))
      if (userBalance < 1) {
        throw new Error(`Insufficient tickets. You have ${userBalance} tickets for token ID ${params.tokenId}`)
      }

      // Create the auction
      const tx = await auctionContract.createAuction(
        BigInt(params.tokenId), // Convert string to BigInt
        1, // ticketCount - assuming 1 ticket per auction for now
        params.startPrice,
        params.buyNowPrice,
        params.minIncrement,
        params.expiryTime
      )

      toast.info("Creating auction...", "Please wait for the transaction to be confirmed")

      const receipt = await tx.wait()
      
      // Get auction ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          return auctionContract.interface.parseLog(log)
        } catch {
          return false
        }
      })

      if (event) {
        const parsedEvent = auctionContract.interface.parseLog(event)
        const auctionId = parsedEvent.args.auctionId
        
        toast.success("Auction created!", `Auction ID: ${auctionId.toString()}`)
        
        return auctionId.toString()
      }

      toast.success("Auction created!", "Your tickets are now up for auction")

    } catch (error: any) {
      console.error('Error creating auction:', error)
      toast.error("Error creating auction", error.message || "Something went wrong")
      throw error
    } finally {
      setIsCreatingAuction(false)
    }
  }

  const placeBid = async (params: BidParams) => {
    if (!window.ethereum) {
      toast.error("Error", "Please connect your wallet first")
      return
    }

    setIsBidding(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      const auctionContract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS!, AUCTION_CONTRACT_ABI, signer)
      
      // Get USDC contract address from auction contract
      const usdcAddress = await auctionContract.usdcToken()
      
      // Create USDC contract instance (minimal ABI for transferFrom)
      const usdcABI = [
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)"
      ]
      
      const usdcContract = new ethers.Contract(usdcAddress, usdcABI, signer)
      
      // Check and approve USDC spending
      const allowance = await usdcContract.allowance(await signer.getAddress(), AUCTION_CONTRACT_ADDRESS!)
      
      if (allowance < params.bidAmount) {
        toast.info("Approving USDC...", "Please approve the auction contract to spend your USDC")
        
        const approveTx = await usdcContract.approve(AUCTION_CONTRACT_ADDRESS!, params.bidAmount)
        await approveTx.wait()
        
        toast.success("USDC approved!", "Now placing bid...")
      }

      // Place the bid
      const tx = await auctionContract.bid(params.auctionId, params.bidAmount)
      
      toast.info("Placing bid...", "Please wait for the transaction to be confirmed")

      await tx.wait()
      
      toast.success("Bid placed!", "Your bid has been submitted successfully")

    } catch (error: any) {
      console.error('Error placing bid:', error)
      toast.error("Error placing bid", error.message || "Something went wrong")
      throw error
    } finally {
      setIsBidding(false)
    }
  }

  const buyNow = async (auctionId: string) => {
    if (!window.ethereum) {
      toast.error("Error", "Please connect your wallet first")
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      const auctionContract = new ethers.Contract(AUCTION_CONTRACT_ADDRESS!, AUCTION_CONTRACT_ABI, signer)
      
      // Get auction details to know the buy now price
      const auction = await auctionContract.getAuction(auctionId)
      const buyNowPrice = auction.buyNowPrice
      
      // Get USDC contract address from auction contract
      const usdcAddress = await auctionContract.usdcToken()
      
      // Create USDC contract instance
      const usdcABI = [
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)"
      ]
      
      const usdcContract = new ethers.Contract(usdcAddress, usdcABI, signer)
      
      // Check and approve USDC spending
      const allowance = await usdcContract.allowance(await signer.getAddress(), AUCTION_CONTRACT_ADDRESS!)
      
      if (allowance < buyNowPrice) {
        toast.info("Approving USDC...", "Please approve the auction contract to spend your USDC")
        
        const approveTx = await usdcContract.approve(AUCTION_CONTRACT_ADDRESS!, buyNowPrice)
        await approveTx.wait()
        
        toast.success("USDC approved!", "Now executing buy now...")
      }

      // Execute buy now
      const tx = await auctionContract.buyNow(auctionId)
      
      toast.info("Executing buy now...", "Please wait for the transaction to be confirmed")

      await tx.wait()
      
      toast.success("Purchase successful!", "You have successfully purchased the tickets")

    } catch (error: any) {
      console.error('Error executing buy now:', error)
      toast.error("Error executing buy now", error.message || "Something went wrong")
      throw error
    }
  }

  return {
    createAuction,
    placeBid,
    buyNow,
    isCreatingAuction,
    isBidding
  }
}
