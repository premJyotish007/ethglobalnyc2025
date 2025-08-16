'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Ticket, Plus, X, Wallet, Calendar, MapPin, DollarSign } from 'lucide-react'
import { formatUSDC } from '@/lib/utils'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'

interface TicketInfo {
  eventName: string
  section: string
  row: string
  seat: string
  eventDate: string
  price: string
  isActive: boolean
}

interface UserTicket {
  tokenId: string
  balance: number
  ticketInfo: TicketInfo
  isUsed: boolean
}

interface SellTicketFormData {
  tokenId: string
  price: string
}

interface SellTicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (ticketData: { tokenId: string; price: bigint }) => Promise<void>
  isLoading: boolean
  userAddress?: string
}



export function SellTicketModal({ isOpen, onClose, onSubmit, isLoading, userAddress }: SellTicketModalProps) {
  const [userTickets, setUserTickets] = useState<UserTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null)
  const [formData, setFormData] = useState<SellTicketFormData>({
    tokenId: '',
    price: ''
  })
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)

  function convertUnixTimestampToDate(unixTimestamp: BigInt): string {
    const date = new Date(Number(unixTimestamp) * 1000);
    return date.toLocaleDateString();
  } 

  // Load user's tickets from the smart contract
  const loadUserTickets = async () => {
    if (!userAddress || !window.ethereum) return

    setIsLoadingTickets(true)
    try {
      const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
      console.log(CONTRACT_ADDRESS, CONTRACT_ABI)
      const contract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, provider)
      
      const currentTokenId = await contract.getCurrentTokenId()
      const tickets: UserTicket[] = []

      // Batch check balances and get ticket info in parallel for efficiency
      const tokenIds = Array.from({ length: Number(currentTokenId) - 1 }, (_, i) => i + 1)
      
      // Batch all balance checks
      const balancePromises = tokenIds.map(id => contract.balanceOf(userAddress, id))
      const balances = await Promise.all(balancePromises)
      
      // Filter to only tokens the user owns
      const ownedTokenIds = tokenIds.filter((_, index) => balances[index] > 0)
      
      // Batch get ticket info for owned tokens only
      const ticketInfoPromises = ownedTokenIds.map(id => contract.getTicketInfo(id))
      const ticketInfoResults = await Promise.all(ticketInfoPromises)
      
      // Build tickets array
      ownedTokenIds.forEach((tokenId, index) => {
        const [ticketInfo, isUsed] = ticketInfoResults[index]
        const balance = balances[tokenIds.indexOf(tokenId)]
        
        tickets.push({
          tokenId: tokenId.toString(),
          balance: balance,
          ticketInfo: {
            eventName: ticketInfo.eventName,
            section: ticketInfo.section,
            row: ticketInfo.row,
            seat: ticketInfo.seat,
            eventDate: convertUnixTimestampToDate(ticketInfo.eventDate),
            price: formatUSDC(ticketInfo.price),
            isActive: ticketInfo.isActive
          },
          isUsed
        })
      })

      setUserTickets(tickets)
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setIsLoadingTickets(false)
    }
  }

  useEffect(() => {
    if (isOpen && userAddress) {
      loadUserTickets()
    }
  }, [isOpen, userAddress])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTicket || !formData.price) {
      return
    }

    const priceInWei = BigInt(Math.floor(parseFloat(formData.price) * 1000000)) // Convert USDC to wei (6 decimals)
    
    await onSubmit({
      tokenId: selectedTicket.tokenId,
      price: priceInWei
    })

    // Reset form
    setFormData({
      tokenId: '',
      price: ''
    })
    setSelectedTicket(null)
  }

  const handleInputChange = (field: keyof SellTicketFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const selectTicket = (ticket: UserTicket) => {
    setSelectedTicket(ticket)
    setFormData(prev => ({ ...prev, tokenId: ticket.tokenId }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Sell Your Tokenized Tickets
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User's Tickets Section */}
          <div>
            {isLoadingTickets ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading your tickets...</p>
              </div>
            ) : userTickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No NFT Tickets Found</h4>
                <p className="text-muted-foreground">
                  You don't have any NFT tickets in your wallet to sell.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {userTickets.map((ticket) => (
                  <Card 
                    key={ticket.tokenId} 
                    className={`cursor-pointer transition-colors ${
                      selectedTicket?.tokenId === ticket.tokenId 
                        ? 'ring-2 ring-primary' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => selectTicket(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{ticket.ticketInfo.eventName}</h4>
                            <Badge variant={ticket.isUsed ? "destructive" : "secondary"}>
                              {ticket.isUsed ? "Used" : "Available"}
                            </Badge>
                            {!ticket.ticketInfo.isActive && (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {ticket.ticketInfo.eventDate}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Section {ticket.ticketInfo.section}, Row {ticket.ticketInfo.row}, Seat {ticket.ticketInfo.seat}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">Token ID: {ticket.tokenId}</span>
                            <span className="text-muted-foreground">Balance: {ticket.balance}</span>
                            <div className="flex items-center gap-1 font-semibold text-green-600">
                              <DollarSign className="h-4 w-4" />
                              {ticket.ticketInfo.price} USDC
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sell Form */}
          {selectedTicket && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Sell Ticket with token ID #{selectedTicket.tokenId}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selling Price (USDC)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5.00"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Original price: {selectedTicket.ticketInfo.price} USDC. This is the price you will could recieve from a "buy now" transaction.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !selectedTicket.ticketInfo.isActive || selectedTicket.isUsed} 
                    className="flex-1"
                  >
                    {isLoading ? 'Listing...' : 'List for Sale'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
