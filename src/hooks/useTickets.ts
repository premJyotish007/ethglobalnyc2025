import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Ticket, Bid } from '@/types'
import { MarketplaceService } from '@/lib/marketplace'


// Function to load tickets from JSON file
const loadTicketsFromFile = async (): Promise<Ticket[]> => {
  try {
    const response = await fetch('/data/tickets.json')
    if (!response.ok) {
      throw new Error('Failed to fetch tickets')
    }
    const data = await response.json()
    // Convert price strings back to BigInt
    return data.map((ticket: any) => ({
      ...ticket,
      price: BigInt(ticket.price)
    }))
  } catch (error) {
    console.error('Error loading tickets from file:', error)
    return []
  }
}

// Helper function to read existing bids from localStorage
const readBids = (): Bid[] => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ticketBids')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert amount strings back to BigInt
        return parsed.map((bid: any) => ({
          ...bid,
          amount: BigInt(bid.amount)
        }))
      }
    }
  } catch (error) {
    console.error('Error reading bids from localStorage:', error)
  }
  return []
}

// Helper function to write bids to localStorage
const writeBids = (bids: Bid[]) => {
  try {
    if (typeof window !== 'undefined') {
      // Convert BigInt to string for JSON serialization
      const serializableBids = bids.map(bid => ({
        ...bid,
        amount: bid.amount.toString()
      }))
      localStorage.setItem('ticketBids', JSON.stringify(serializableBids))
    }
  } catch (error) {
    console.error('Error writing bids to localStorage:', error)
  }
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load tickets and bids on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTickets(await loadTicketsFromFile())
      
      // Load existing bids from localStorage
      const existingBids = readBids()
      setBids(existingBids)
      
      setIsLoading(false)
    }

    loadData()
  }, [])

  const placeBid = async (ticketId: string, amount: bigint, bidder: string) => {
    const newBid: Bid = {
      id: Date.now().toString(),
      ticketId,
      bidder,
      amount,
      timestamp: Date.now()
    }

    const updatedBids = [...bids, newBid]
    setBids(updatedBids)
    
    // Persist to localStorage
    writeBids(updatedBids)

    // TODO: Add smart contract call
    console.log(`Placing bid of ${amount} USDC on ticket ${ticketId}`)
    
    return newBid
  }

  const buyTicket = async (ticketId: string, buyer: string) => {
    try {
      // Get the ticket details
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Check if we have a wallet connection
      if (!window.ethereum) {
        throw new Error('No wallet connected');
      }

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create marketplace service
      const marketplaceService = new MarketplaceService(provider, signer);
      
      // Buy the ticket (amount = 1 for now)
      const success = await marketplaceService.buyTicket(
        ticket.tokenId,
        1,
        ticket.price
      );

      if (success) {
        // Remove ticket from listings
        setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
        console.log(`Successfully bought ticket ${ticketId}`);
      }
      
      return success;
    } catch (error) {
      console.error('Failed to buy ticket:', error);
      throw error;
    }
  }

  const listTicket = async (ticket: Omit<Ticket, 'id' | 'tokenId'>) => {
    const newTicket: Ticket = {
      ...ticket,
      id: Date.now().toString(),
      tokenId: Date.now().toString(),
      isListed: true
    }

    setTickets(prev => [...prev, newTicket])
    
    // In a real app, this would be a smart contract call
    console.log('Listing new ticket:', newTicket)
    
    return newTicket
  }

  const refreshTickets = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/data/tickets.json')
      if (response.ok) {
        const data = await response.json()
        // Convert price strings back to BigInt
        const ticketsWithBigInt = data.map((ticket: any) => ({
          ...ticket,
          price: BigInt(ticket.price)
        }))
        setTickets(ticketsWithBigInt)
      }
    } catch (error) {
      console.error('Error refreshing tickets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getUserTickets = (userAddress: string) => {
    return tickets.filter(ticket => ticket.seller === userAddress)
  }

  const getUserBids = (userAddress: string) => {
    return bids.filter(bid => bid.bidder === userAddress)
  }

  const removeTicket = async (ticketId: string) => {
    try {
      // Call API to delete ticket from database
      const response = await fetch(`/api/tickets?id=${ticketId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete ticket from database')
      }

      const result = await response.json()
      console.log('Ticket deleted from database:', result)
      
      // Remove from local state
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId))
      
      return true
    } catch (error) {
      console.error('Error deleting ticket:', error)
      throw error
    }
  }

  return {
    tickets,
    bids,
    isLoading,
    placeBid,
    buyTicket,
    listTicket,
    removeTicket,
    refreshTickets,
    getUserTickets,
    getUserBids
  }
}
