import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Ticket } from '@/types'
import { formatAddress, formatUSDC } from '@/lib/utils'
import { Calendar, Copy, MapPin, Ticket as TicketIcon } from 'lucide-react'

interface TicketCardProps {
  ticket: Ticket
  onBid?: (ticketId: string) => void
  onBuy?: (ticketId: string) => void
  isOwner?: boolean
}

export function TicketCard({ ticket, onBid, onBuy, isOwner }: TicketCardProps) {
  return (
    <Card className="w-full max-w-sm hover:shadow-lg transition-shadow overflow-hidden">
      {/* Ticket Image */}
      {ticket.imageUrl && (
        <div className="w-full h-48 bg-muted overflow-hidden">
          <img
            src={ticket.imageUrl}
            alt={ticket.eventName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a default concert image if the main image fails
              e.currentTarget.src = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"
            }}
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-lg flex-1 min-w-0 break-words">{ticket.eventName}</CardTitle>
          <Badge variant={ticket.isListed ? "default" : "secondary"} className="flex-shrink-0">
            {ticket.isListed ? "Listed" : "Not Listed"}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {new Date(ticket.eventDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          <span>{ticket.venue}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="font-medium">Section:</span>
            <p>{ticket.section}</p>
          </div>
          <div>
            <span className="font-medium">Row:</span>
            <p>{ticket.row}</p>
          </div>
          <div>
            <span className="font-medium">Seat:</span>
            <p>{ticket.seat}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4" />
            <span className="text-sm">Token ID: {ticket.tokenId}</span>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price:</span>
            <span className="text-lg font-bold">{formatUSDC(ticket.price)} USDC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Ticket Token Contract:</span>
            <span className="text-sm">{formatAddress(ticket.tokenContractAddress)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(ticket.tokenContractAddress)}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {!isOwner && ticket.isListed && (
          <>
            <Button 
              onClick={() => onBid?.(ticket.id)} 
              className="flex-1"
              variant="outline"
            >
              Place Bid
            </Button>
            <Button 
              onClick={() => onBuy?.(ticket.id)} 
              className="flex-1"
            >
              Buy Now
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
