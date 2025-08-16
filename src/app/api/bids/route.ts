import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bidder, amount, tokenId, tokenContractAddress, recipient } = body

    // Read existing bids
    const bidsPath = path.join(process.cwd(), 'public', 'data', 'bids.json')
    
    // Create directory if it doesn't exist
    const dir = path.dirname(bidsPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Read existing bids or create empty array
    let bids = []
    if (fs.existsSync(bidsPath)) {
      const bidsData = fs.readFileSync(bidsPath, 'utf8')
      bids = JSON.parse(bidsData)
    }

    // Create new bid entry
    const newBid = {
      id: (bids.length + 1).toString(),
      bidder: bidder,
      amount: amount.toString(), // Store as string to handle BigInt
      tokenId: tokenId,
      tokenContractAddress: tokenContractAddress,
      recipient: recipient, // Address of the ticket seller
      timestamp: Date.now(),
      status: 'active' // active, accepted, rejected, cancelled
    }

    // Add new bid to the array
    bids.push(newBid)

    // Write back to file
    fs.writeFileSync(bidsPath, JSON.stringify(bids, null, 2))

    return NextResponse.json({ success: true, bid: newBid })
  } catch (error) {
    console.error('Error adding bid:', error)
    return NextResponse.json(
      { error: 'Failed to add bid' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { bidId, amount } = body

    if (!bidId || !amount) {
      return NextResponse.json(
        { error: 'Bid ID and amount are required' },
        { status: 400 }
      )
    }

    const bidsPath = path.join(process.cwd(), 'public', 'data', 'bids.json')
    
    if (!fs.existsSync(bidsPath)) {
      return NextResponse.json(
        { error: 'No bids found' },
        { status: 404 }
      )
    }

    const bidsData = fs.readFileSync(bidsPath, 'utf8')
    const bids = JSON.parse(bidsData)

    // Find the bid to update
    const bidIndex = bids.findIndex((bid: any) => bid.id === bidId)
    
    if (bidIndex === -1) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      )
    }

    // Update the bid amount
    bids[bidIndex].amount = amount.toString()
    bids[bidIndex].timestamp = Date.now()

    // Write back to file
    fs.writeFileSync(bidsPath, JSON.stringify(bids, null, 2))

    return NextResponse.json({ 
      success: true, 
      message: 'Bid updated successfully',
      updatedBid: bids[bidIndex]
    })
  } catch (error) {
    console.error('Error updating bid:', error)
    return NextResponse.json(
      { error: 'Failed to update bid' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('tokenId')
    
    const bidsPath = path.join(process.cwd(), 'public', 'data', 'bids.json')
    
    if (!fs.existsSync(bidsPath)) {
      return NextResponse.json({ bids: [] })
    }

    const bidsData = fs.readFileSync(bidsPath, 'utf8')
    const bids = JSON.parse(bidsData)

    // Filter by tokenId if provided
    if (tokenId) {
      const filteredBids = bids.filter((bid: any) => bid.tokenId === tokenId)
      return NextResponse.json({ bids: filteredBids })
    }

    return NextResponse.json({ bids })
  } catch (error) {
    console.error('Error reading bids:', error)
    return NextResponse.json(
      { error: 'Failed to read bids' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bidId = searchParams.get('id')
    
    if (!bidId) {
      return NextResponse.json(
        { error: 'Bid ID is required' },
        { status: 400 }
      )
    }

    const bidsPath = path.join(process.cwd(), 'public', 'data', 'bids.json')
    
    if (!fs.existsSync(bidsPath)) {
      return NextResponse.json(
        { error: 'No bids found' },
        { status: 404 }
      )
    }

    const bidsData = fs.readFileSync(bidsPath, 'utf8')
    const bids = JSON.parse(bidsData)

    // Find and remove the bid
    const bidIndex = bids.findIndex((bid: any) => bid.id === bidId)
    
    if (bidIndex === -1) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      )
    }

    const removedBid = bids.splice(bidIndex, 1)[0]

    // Write back to file
    fs.writeFileSync(bidsPath, JSON.stringify(bids, null, 2))

    return NextResponse.json({ 
      success: true, 
      message: 'Bid cancelled successfully',
      deletedBid: removedBid 
    })
  } catch (error) {
    console.error('Error cancelling bid:', error)
    return NextResponse.json(
      { error: 'Failed to cancel bid' },
      { status: 500 }
    )
  }
}
