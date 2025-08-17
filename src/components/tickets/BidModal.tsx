import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket } from '@/types'
import { formatUSDC } from '@/lib/utils'
import { DollarSign, Clock, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface BidModalProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
  onBidPlaced: (bidAmount: bigint) => void
  currentHighestBid?: bigint
}

export function BidModal({ ticket, isOpen, onClose, onBidPlaced, currentHighestBid }: BidModalProps) {
  const [bidAmount, setBidAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setBidAmount('')
      setError('')
      // Set default bid amount to minimum required
      if (ticket.startPrice) {
        setBidAmount(formatUSDC(ticket.startPrice))
      }
    }
  }, [isOpen, ticket.startPrice])

  if (!isOpen) return null

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setError('Please enter a valid bid amount')
      return
    }

    const bidAmountBigInt = BigInt(Math.floor(parseFloat(bidAmount) * 1000000)) // Convert to USDC decimals (6)
    
    // Validate minimum bid - allow any bid >= startPrice
    if (ticket.startPrice && bidAmountBigInt < ticket.startPrice) {
      setError(`Bid must be at least ${formatUSDC(ticket.startPrice)} USDC`)
      return
    }

    // Validate bid increment
    if (ticket.minIncrement && currentHighestBid) {
      const minBid = currentHighestBid + ticket.minIncrement
      if (bidAmountBigInt < minBid) {
        setError(`Bid must be at least ${formatUSDC(minBid)} USDC (current bid + min increment)`)
        return
      }
    }

    setIsLoading(true)
    
    try {
      // Call the onBidPlaced callback (this will be handled by the parent component)
      await onBidPlaced(bidAmountBigInt)
      
      toast.success(
        "Bid Placed Successfully!",
        `Your bid of ${formatUSDC(bidAmountBigInt)} USDC has been placed.`
      )
      
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid')
      toast.error(
        "Bid Failed",
        err instanceof Error ? err.message : 'Failed to place bid'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const getMinBidAmount = () => {
    if (currentHighestBid && ticket.minIncrement) {
      return currentHighestBid + ticket.minIncrement
    }
    return ticket.startPrice || BigInt(0)
  }

  const minBidAmount = getMinBidAmount()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Place Bid
          </CardTitle>
          <CardDescription>
            Bid on {ticket.eventName} - {ticket.section}, Row {ticket.row}, Seat {ticket.seat}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Auction Info */}
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Starting Price:</span>
              <span className="font-medium">{formatUSDC(ticket.startPrice || BigInt(0))} USDC</span>
            </div>
            {currentHighestBid && currentHighestBid > BigInt(0) && (
              <div className="flex justify-between text-sm">
                <span>Current Highest Bid:</span>
                <span className="font-medium text-blue-600">{formatUSDC(currentHighestBid)} USDC</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Minimum Bid:</span>
              <span className="font-medium text-green-600">{formatUSDC(minBidAmount)} USDC</span>
            </div>
            {ticket.minIncrement && (
              <div className="flex justify-between text-sm">
                <span>Min Increment:</span>
                <span className="font-medium">{formatUSDC(ticket.minIncrement)} USDC</span>
              </div>
            )}
            {ticket.expiryTime && (
              <div className="flex justify-between text-sm">
                <span>Expires:</span>
                <span className="font-medium">{new Date(Number(ticket.expiryTime) * 1000).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Bid Form */}
          <form onSubmit={handleBidSubmit} className="space-y-4">
            <div>
              <label htmlFor="bidAmount" className="block text-sm font-medium mb-2">
                Your Bid Amount (USDC)
              </label>
              <Input
                id="bidAmount"
                type="number"
                step="0.01"
                min={Number(minBidAmount) / 1000000}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Minimum: ${formatUSDC(minBidAmount)} USDC`}
                className="w-full"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum bid: {formatUSDC(minBidAmount)} USDC
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Placing Bid...' : 'Place Bid'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
