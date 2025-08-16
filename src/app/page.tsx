'use client'

import React, { useState } from 'react'
import { WalletConnect } from '@/components/tickets/WalletConnect'
import { TicketGrid } from '@/components/tickets/TicketGrid'
import { BidModal } from '@/components/tickets/BidModal'
import { SellTicketModal } from '@/components/tickets/SellTicketModal'
import { MyTickets } from '@/components/tickets/MyTickets'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWallet } from '@/hooks/useWallet'
import { useTickets } from '@/hooks/useTickets'
import { Ticket } from '@/types'
import { formatUSDC } from '@/lib/utils'
import { Ticket as TicketIcon, DollarSign, Users, TrendingUp, Plus } from 'lucide-react'

export default function Home() {
  const { connection } = useWallet()
  const { 
    tickets, 
    isLoading, 
    placeBid, 
    buyTicket,
    listTicket,
    removeTicket,
    refreshTickets,
    getUserTickets
  } = useTickets()
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

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

  const stats = [
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <TicketIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TicketBid</h1>
                <p className="text-sm text-muted-foreground">Decentralized Ticket Trading</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`} className="bg-card rounded-lg p-6 border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-semibold">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Available Tickets</h2>
            <p className="text-muted-foreground mt-2">
              Browse and bid on tokenized event tickets
            </p>
          </div>
          <div className="flex items-center gap-4">
            {connection.isConnected && (
              <>
                <Button 
                  onClick={() => setIsSellModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Sell Ticket
                </Button>
                <Badge variant="secondary" className="text-sm">
                  Connected: {connection.provider === 'privy' ? 'Smart Wallet' : connection.provider}
                </Badge>
              </>
            )}
          </div>
        </div>

        {!connection.isConnected ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                <TicketIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">
                Connect your wallet or create a smart wallet to start trading tickets on the blockchain
              </p>
            </div>
          </div>
        ) : (
          <>
            <TicketGrid
              tickets={tickets}
              onBid={handleBid}
              onBuy={handleBuy}
              currentUserAddress={connection.address}
              isLoading={isLoading}
            />
            
            {/* My Tickets Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-6">My Listed Tickets</h3>
              <MyTickets
                tickets={getUserTickets(connection.address || '')}
                onRemoveTicket={handleRemoveTicket}
                isLoading={isLoading}
              />
            </div>
          </>
        )}
      </main>

      {/* Bid Modal */}
      {selectedTicket && (
        <BidModal
          ticket={selectedTicket}
          isOpen={isBidModalOpen}
          onClose={() => {
            setIsBidModalOpen(false)
            setSelectedTicket(null)
          }}
          onPlaceBid={handlePlaceBid}
          isLoading={isProcessing}
        />
      )}

      {/* Sell Ticket Modal */}
      <SellTicketModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onSubmit={handleSellTicket}
        isLoading={isProcessing}
        userAddress={connection.address}
      />
    </div>
  )
}
