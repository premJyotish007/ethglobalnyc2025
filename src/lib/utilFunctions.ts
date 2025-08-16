import { Ticket } from '@/types'
import { formatUSDC } from '@/lib/utils'
import { Ticket as TicketIcon, DollarSign, Users, TrendingUp } from 'lucide-react'
import { ethers } from 'ethers'

export interface HandleFunctionsProps {
  connection: {
    address?: string
    isConnected: boolean
    provider?: string
  }
  tickets: Ticket[]
  placeBid: (ticketId: string, amount: bigint, bidder: string) => Promise<any>
  buyTicket: (ticketId: string, buyer: string) => Promise<boolean>
  removeTicket: (ticketId: string) => Promise<boolean>
  refreshTickets: () => Promise<void>
  setIsProcessing: (loading: boolean) => void
  setIsBidModalOpen: (open: boolean) => void
  setSelectedTicket: (ticket: Ticket | null) => void
  setIsSellModalOpen: (open: boolean) => void
  onBidPlaced?: () => void
}

export const createHandleFunctions = ({
  connection,
  tickets,
  placeBid,
  buyTicket,
  removeTicket,
  refreshTickets,
  setIsProcessing,
  setIsBidModalOpen,
  setSelectedTicket,
  setIsSellModalOpen,
  onBidPlaced
}: HandleFunctionsProps) => {
  const handleBid = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (ticket) {
      // Check if bidding has expired
      const isBiddingExpired = ticket.bidExpiryTime ? Date.now() / 1000 > ticket.bidExpiryTime : false
      
      if (isBiddingExpired) {
        console.log('Bidding has expired for this ticket')
        return
      }
      
      setSelectedTicket(ticket)
      setIsBidModalOpen(true)
    }
  }

  const handleBuy = async (ticketId: string) => {
    if (!connection.address) return
    
    setIsProcessing(true)
    try {
      await buyTicket(ticketId, connection.address)
      // Show success message
    } catch (error) {
      console.error('Failed to buy ticket:', error)
      // Show error message
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePlaceBid = async (ticketId: string, amount: bigint, existingBidId?: string) => {
    if (!connection.address) return
    
    setIsProcessing(true)
    try {
      // Find the ticket to get tokenId and tokenContractAddress
      const ticket = tickets.find(t => t.id === ticketId)
      if (!ticket) {
        throw new Error('Ticket not found')
      }

      let response
      if (existingBidId) {
        // Update existing bid
        response = await fetch('/api/bids', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bidId: existingBidId,
            amount: amount.toString()
          }),
        })
      } else {
        // Create new bid
        response = await fetch('/api/bids', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bidder: connection.address,
            amount: amount.toString(), // Convert BigInt to string for JSON serialization
            tokenId: ticket.tokenId,
            tokenContractAddress: ticket.tokenContractAddress,
            recipient: ticket.seller // Address of the ticket seller
          }),
        })
      }

      if (!response.ok) {
        throw new Error(existingBidId ? 'Failed to update bid in database' : 'Failed to store bid to database')
      }

      const result = await response.json()
      console.log(existingBidId ? 'Bid updated in database:' : 'Bid stored to database:', result)
      
      // Also call the original placeBid function for any additional logic
      await placeBid(ticketId, amount, connection.address)
      
      // Trigger refresh of bid data
      onBidPlaced?.()
      
      setIsBidModalOpen(false)
      setSelectedTicket(null)
      // Show success message
    } catch (error) {
      console.error(existingBidId ? 'Failed to update bid:' : 'Failed to place bid:', error)
      // Show error message
    } finally {
      setIsProcessing(false)
    }
  }
  const handleSellTicket = async (ticketData: {
    auctionId: any; tokenId: string; price: bigint; ticketInfo?: any;
  }) => {
    if (!connection.address) return
    
    setIsProcessing(true)
    try {
      // Step 1: Call API to persist ticket to database
      
      // Step 2: Create auction on blockchain using MetaMask
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Request account access
          const accounts = await (window.ethereum as any).request({ method: 'eth_requestAccounts' })
          const userAddress = accounts[0]

          // Create provider and signer from MetaMask
          const provider = new ethers.BrowserProvider(window.ethereum as any)
          const signer = await provider.getSigner()

          // Import auction contract ABI and address
          const { AUCTION_CONTRACT_ABI, CONTRACT_ADDRESS_AUCTION_DATA } = await import('@/lib/contract')

          // Create contract instance
          const auctionContract = new ethers.Contract(
            CONTRACT_ADDRESS_AUCTION_DATA!,
            AUCTION_CONTRACT_ABI,
            signer
          )

          // Prepare auction parameters
          const ticketId = ticketData.tokenId
          const ticketCount = 1
          const startPrice = ticketData.price
          const buyNowPrice = ticketData.price // Same as start price for simplicity
          const minIncrement = ethers.parseEther("0.01") // 0.01 ETH minimum increment
          const expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now

          console.log('Creating auction with parameters:', {
            ticketId,
            ticketCount,
            startPrice: startPrice.toString(),
            buyNowPrice: buyNowPrice.toString(),
            minIncrement: minIncrement.toString(),
            expiryTime
          })

          // Call the createAuction function
          const tx = await auctionContract.createAuction(
            ticketId,
            ticketCount,
            startPrice,
            buyNowPrice,
            minIncrement,
            expiryTime
          )

          console.log('Auction transaction sent:', tx.hash)

          // Wait for transaction to be mined
          const receipt = await tx.wait()
          console.log('Auction transaction confirmed:', receipt)

          // Get the auction ID from the event
          const auctionCreatedEvent = receipt.logs.find((log: any) => {
            try {
              const parsedLog = auctionContract.interface.parseLog(log)
              return parsedLog?.name === 'AuctionCreated'
            } catch (error) {
              return false
            }
          })

          if (auctionCreatedEvent) {
            const parsedLog = auctionContract.interface.parseLog(auctionCreatedEvent)
            if (parsedLog) {
              const auctionId = parsedLog.args.auctionId.toString()
              ticketData.auctionId = auctionId
              const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ticketData: {
                    ...ticketData,
                    price: ticketData.price.toString() // Convert BigInt to string for JSON serialization
                  },
                  userAddress: connection.address
                }),
              })
        
              if (!response.ok) {
                throw new Error('Failed to add ticket to database')
              }
        
              const result = await response.json()
              console.log('Ticket added to database:', result)
              
              console.log('Auction created successfully with ID:', auctionId)
            }
          }

        } catch (auctionError) {
          console.error('Failed to create auction:', auctionError)
          // Don't throw here - the ticket was already added to database
          // Just log the error and continue
        }
      }
      
      // Refresh the tickets list to show the new ticket
      await refreshTickets()
      
      setIsSellModalOpen(false)
      // Show success message
    } catch (error) {
      console.error('Failed to list ticket:', error)
      // Show error message
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveTicket = async (ticketId: string) => {
    setIsProcessing(true)
    try {
      await removeTicket(ticketId)
      // Show success message
    } catch (error) {
      console.error('Failed to remove ticket:', error)
      // Show error message
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelBid = async (bidId: string) => {
    setIsProcessing(true)
    try {
      console.log('Cancelling bid with ID:', bidId)
      
      // Call API to cancel bid
      const response = await fetch(`/api/bids?id=${bidId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel bid')
      }

      const result = await response.json()
      console.log('Bid cancelled successfully:', result)
      
      // Trigger refresh of bid data
      onBidPlaced?.()
      
      setIsBidModalOpen(false)
      setSelectedTicket(null)
      // Show success message
    } catch (error) {
      console.error('Failed to cancel bid:', error)
      // Show error message
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    handleBid,
    handleBuy,
    handlePlaceBid,
    handleSellTicket,
    handleRemoveTicket,
    handleCancelBid
  }
}

export const createStats = (tickets: Ticket[]) => [
  {
    label: 'Total Tickets',
    value: tickets.length,
    icon: TicketIcon,
    color: 'text-blue-600'
  },
  {
    label: 'Total Value',
    value: `${formatUSDC(tickets.reduce((sum, ticket) => sum + ticket.price, BigInt(0)))} USDC`,
    icon: DollarSign,
    color: 'text-green-600'
  },
  {
    label: 'Active Sellers',
    value: new Set(tickets.map(t => t.seller)).size,
    icon: Users,
    color: 'text-purple-600'
  },
  {
    label: 'Avg Price',
    value: tickets.length > 0 
      ? `${formatUSDC(tickets.reduce((sum, ticket) => sum + ticket.price, BigInt(0)) / BigInt(tickets.length))} USDC`
      : '0 USDC',
    icon: TrendingUp,
    color: 'text-orange-600'
  }
]
