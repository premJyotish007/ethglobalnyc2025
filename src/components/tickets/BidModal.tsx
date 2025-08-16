import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Ticket } from '@/types'
import { formatUSDC, parseUSDC } from '@/lib/utils'
import { DollarSign, X } from 'lucide-react'

interface BidModalProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
  onPlaceBid: (ticketId: string, amount: bigint) => void
  isLoading?: boolean
}

export function BidModal({ ticket, isOpen, onClose, onPlaceBid, isLoading }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (bidAmount && parseFloat(bidAmount) > 0) {
      onPlaceBid(ticket.id, parseUSDC(bidAmount))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Place Bid</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Bid on {ticket.eventName} - Section {ticket.section}, Row {ticket.row}, Seat {ticket.seat}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Price:</span>
                <span className="font-semibold">{formatUSDC(ticket.price)} USDC</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="bidAmount" className="text-sm font-medium">
                  Your Bid Amount (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bidAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading || !bidAmount || parseFloat(bidAmount) <= 0}
                >
                  {isLoading ? 'Placing Bid...' : 'Place Bid'}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
