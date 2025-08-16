'use client'

import React, { useState, useEffect } from 'react'
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
import { Ticket as TicketIcon, DollarSign, Users, TrendingUp, Plus } from 'lucide-react'
import { createHandleFunctions, createStats } from '@/lib/utilFunctions'

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
  const [bidRefreshKey, setBidRefreshKey] = useState(0)
  const [userBids, setUserBids] = useState<any[]>([])
  const [faqOpen, setFaqOpen] = useState(false)

  // Function to refresh bid data
  const refreshBids = () => {
    setBidRefreshKey(prev => prev + 1)
    fetchUserBids()
  }

  // Fetch user's bids
  const fetchUserBids = async () => {
    if (!connection.address) {
      setUserBids([])
      return
    }

    try {
      const response = await fetch('/api/bids')
      if (response.ok) {
        const data = await response.json()
        const userBids = data.bids.filter((bid: any) => bid.bidder === connection.address)
        setUserBids(userBids)
      }
    } catch (error) {
      console.error('Error fetching user bids:', error)
    }
  }

  // Get current user's bid for selected ticket
  const getCurrentUserBid = () => {
    if (!selectedTicket || !connection.address) return undefined
    return userBids.find(bid => bid.tokenId === selectedTicket.tokenId)
  }

  // Create handle functions using utility
  const {
    handleBid,
    handleBuy,
    handlePlaceBid,
    handleSellTicket,
    handleRemoveTicket,
    handleCancelBid
  } = createHandleFunctions({
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
    onBidPlaced: refreshBids
  })

  // Fetch user bids when connection changes
  useEffect(() => {
    fetchUserBids()
  }, [connection.address])

  const stats = createStats(tickets)

  // Add a quick link to the https://faucet.circle.com/ to get some testnet USDC
  // Add a quick link to the https://sepolia.base.org/ to view the transactions
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

      {/* Quick Links Section */}
      <section className="py-4 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6">
            <a 
              href="https://faucet.circle.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <DollarSign className="h-4 w-4" />
              Get Testnet USDC
            </a>
            <a 
              href={`https://sepolia.basescan.org/address/${connection.address}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
            >
              <TrendingUp className="h-4 w-4" />
              View Your Transactions
            </a>
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
              key={bidRefreshKey}
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

            {/* FAQ Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <button
                    onClick={() => setFaqOpen(!faqOpen)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="font-semibold">How do I know my tickets are real?</span>
                    <Plus className={`h-5 w-5 transition-transform ${faqOpen ? 'rotate-45' : ''}`} />
                  </button>
                  {faqOpen && (
                    <div className="mt-4 pt-4 border-t text-muted-foreground space-y-4">
                      <p>
                        We know your event is important to you. In the rare case there&apos;s an issue with your order, we&apos;ll make it right with comparable or better tickets, or your money back.
                      </p>
                      <div>
                        <p className="font-semibold mb-2">What happens if someone tries to sell fake tickets on TicketBid?</p>
                        <p>
                          Our Seller Policies require sellers to only list valid tickets, provide accurate information in the ticket listing, and fulfill orders with the correct tickets in time for the event.
                        </p>
                        <p className="mt-2">
                          If a seller does not follow these policies, we&apos;ll step in to obtain the correct tickets from the seller, or offer you replacement tickets or a full refund. If the seller cannot provide the correct tickets, their account will be charged and/or suspended to protect marketplace quality.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
          onCancelBid={handleCancelBid}
          currentUserBid={getCurrentUserBid()}
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
