import React from 'react'
import { TicketCard } from './TicketCard'
import { Ticket } from '@/types'

interface TicketGridProps {
  tickets: Ticket[]
  onBid?: (ticketId: string) => void
  onBuy?: (ticketId: string) => void
  currentUserAddress?: string
  isLoading?: boolean
}

export function TicketGrid({ tickets, onBid, onBuy, currentUserAddress, isLoading }: TicketGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-80"></div>
          </div>
        ))}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">
          No tickets available at the moment
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Check back later for new listings
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onBid={onBid}
          onBuy={onBuy}
          isOwner={currentUserAddress === ticket.seller}
        />
      ))}
    </div>
  )
}
