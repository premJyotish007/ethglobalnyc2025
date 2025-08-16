'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Ticket } from '@/types'
import { formatUSDC } from '@/lib/utils'
import { Calendar, MapPin, Ticket as TicketIcon, DollarSign } from 'lucide-react'

interface MyTicketsProps {
  tickets: Ticket[]
  onRemoveTicket?: (ticketId: string) => void
  isLoading?: boolean
}

export function MyTickets({ tickets, onRemoveTicket, isLoading }: MyTicketsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <TicketIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tickets Listed</h3>
          <p className="text-muted-foreground">
            You haven't listed any tickets for sale yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="overflow-hidden">
          <div className="flex">
            {ticket.imageUrl && (
              <div className="w-24 h-24 bg-muted flex-shrink-0">
                <img
                  src={ticket.imageUrl}
                  alt={ticket.eventName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{ticket.eventName}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(ticket.eventDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {ticket.venue}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Section {ticket.section}, Row {ticket.row}, Seat {ticket.seat}</span>
                    <div className="flex items-center gap-1 font-semibold text-green-600">
                      <DollarSign className="h-4 w-4" />
                      {formatUSDC(ticket.price)} USDC
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Listed</Badge>
                  {onRemoveTicket && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveTicket(ticket.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
