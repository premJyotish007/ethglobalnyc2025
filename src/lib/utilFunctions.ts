import { Ticket } from '@/types'
import { formatUSDC } from '@/lib/utils'
import { Ticket as TicketIcon, DollarSign, Users, TrendingUp } from 'lucide-react'

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
  setIsSellModalOpen
}: HandleFunctionsProps) => {
  const handleBid = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (ticket) {
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

  const handlePlaceBid = async (ticketId: string, amount: bigint) => {
    if (!connection.address) return
    
    setIsProcessing(true)
    try {
      await placeBid(ticketId, amount, connection.address)
      setIsBidModalOpen(false)
      setSelectedTicket(null)
      // Show success message
    } catch (error) {
      console.error('Failed to place bid:', error)
      // Show error message
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSellTicket = async (ticketData: { tokenId: string; price: bigint; ticketInfo?: any }) => {
    if (!connection.address) return
    
    setIsProcessing(true)
    try {
      // Call API to persist ticket to database
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

  return {
    handleBid,
    handleBuy,
    handlePlaceBid,
    handleSellTicket,
    handleRemoveTicket
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
