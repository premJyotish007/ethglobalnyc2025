import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { CONTRACT_ADDRESS } from '@/lib/contract'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokenId, price, userAddress } = body

    // Read existing tickets
    const ticketsPath = path.join(process.cwd(), 'public', 'data', 'tickets.json')
    const ticketsData = fs.readFileSync(ticketsPath, 'utf8')
    const tickets = JSON.parse(ticketsData)

    // Create new ticket entry
    const newTicket = {
      id: (tickets.length + 1).toString(),
      eventName: `NFT Ticket #${tokenId}`, // This would come from the smart contract in a real app
      eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      venue: "NFT Marketplace",
      section: "NFT",
      row: "A",
      seat: tokenId,
      price: price.toString(),
      seller: userAddress,
      tokenId: tokenId,
      tokenContractAddress: CONTRACT_ADDRESS,
      isListed: true,
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
    }

    // Add new ticket to the array
    tickets.push(newTicket)

    // Write back to file
    fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2))

    return NextResponse.json({ success: true, ticket: newTicket })
  } catch (error) {
    console.error('Error adding ticket:', error)
    return NextResponse.json(
      { error: 'Failed to add ticket' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('id')
    
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    // Read existing tickets
    const ticketsPath = path.join(process.cwd(), 'public', 'data', 'tickets.json')
    const ticketsData = fs.readFileSync(ticketsPath, 'utf8')
    const tickets = JSON.parse(ticketsData)

    // Find and remove the ticket
    const ticketIndex = tickets.findIndex((ticket: any) => ticket.id === ticketId)
    
    if (ticketIndex === -1) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    const removedTicket = tickets.splice(ticketIndex, 1)[0]

    // Write back to file
    fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2))

    return NextResponse.json({ 
      success: true, 
      message: 'Ticket deleted successfully',
      deletedTicket: removedTicket 
    })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    )
  }
}
