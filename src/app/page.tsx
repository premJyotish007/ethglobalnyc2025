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
import { useAuctions } from '@/hooks/useAuctions'
import { useActiveAuctions } from '@/hooks/useActiveAuctions'
import { Ticket } from '@/types'
import { Ticket as TicketIcon, DollarSign, Users, TrendingUp, Plus } from 'lucide-react'
import { createHandleFunctions, createStats } from '@/lib/utilFunctions'

export default function Home() {
  const { connection } = useWallet()
  const { 
    tickets, 
    isLoading: ticketsLoading, 
    placeBid, 
    buyTicket,
    listTicket,
    removeTicket,
    refreshTickets,
    getUserTickets
  } = useTickets()
  
  const { createAuction, isCreatingAuction } = useAuctions()
  
  // Use the new hook for active auctions
  const { auctions: activeAuctions, dummyTickets, isLoading: auctionsLoading, error: auctionsError, refreshAuctions } = useActiveAuctions()
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isBidModalOpen, setIsBidModalOpen] = useState(false)
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [bidRefreshKey, setBidRefreshKey] = useState(0)
  const [userBids, setUserBids] = useState<any[]>([])

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

  // Handle selling ticket (creating auction)
  const handleSellTicket = async (ticketData: any) => {
    try {
      setIsProcessing(true)
      
      // Create auction with the ticket data
      await createAuction({
        ticketId: ticketData.tokenId,
        startPrice: Number(ticketData.startPrice) / 1000000, // Convert from BigInt to USDC
        buyNowPrice: Number(ticketData.buyNowPrice) / 1000000,
        minIncrement: Number(ticketData.minIncrement) / 1000000,
        expiryDays: Math.ceil(Number(ticketData.expiryTime - BigInt(Math.floor(Date.now() / 1000))) / (24 * 60 * 60))
      })
      
      setIsSellModalOpen(false)
      refreshTickets() // Refresh to show updated ticket status
      refreshAuctions() // Refresh auctions to show the new one
      
    } catch (error) {
      console.error('Error selling ticket:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Create handle functions using utility
  const {
    handleBid,
    handleBuy,
    handlePlaceBid,
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
  
  // Combine loading states
  const isLoading = ticketsLoading || auctionsLoading

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
                  disabled={isCreatingAuction}
                >
                  <Plus className="h-4 w-4" />
                  {isCreatingAuction ? 'Creating Auction...' : 'Create Auction'}
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
              tickets={[
                // Convert blockchain auctions to ticket format
                ...activeAuctions.map(auction => ({
                  id: `auction-${auction.auctionId}`, // Unique prefix for auctions
                  tokenId: auction.ticketId.toString(),
                  eventName: auction.ticketInfo?.eventName || `Ticket #${auction.ticketId}`,
                  section: auction.ticketInfo?.section || 'Unknown',
                  row: auction.ticketInfo?.row || 'Unknown',
                  seat: auction.ticketInfo?.seat || 'Unknown',
                  eventDate: auction.ticketInfo?.eventDate || 'Unknown',
                  price: auction.startPrice,
                  seller: auction.seller,
                  auctionId: auction.auctionId,
                  startPrice: auction.startPrice,
                  buyNowPrice: auction.buyNowPrice,
                  minIncrement: auction.minIncrement,
                  expiryTime: auction.expiryTime,
                  highestBid: auction.highestBid,
                  highestBidder: auction.highestBidder,
                  isBlockchainAuction: true, // Flag to identify blockchain auctions
                  tokenContractAddress: "0x4D4503B3aaf33d3dFc0388B26e14972ac62140ad" // From deployment info
                })),
                // Add dummy tickets
                ...dummyTickets.map(ticket => ({
                  ...ticket,
                  id: `dummy-${ticket.id}`, // Unique prefix for dummy tickets
                  isBlockchainAuction: false // Flag to identify dummy tickets
                }))
              ]}
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
                userAddress={connection.address}
              />
            </div>
          </>
        )}
      </main>

      {/* Bid Modal is now handled by TicketGrid component */}

      {/* Sell Ticket Modal */}
      <SellTicketModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onSubmit={handleSellTicket}
        isLoading={isCreatingAuction}
        userAddress={connection.address}
      />
    </div>
  )
}
