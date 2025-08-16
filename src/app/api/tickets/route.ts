import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { AUCTION_CONTRACT_ABI, CONTRACT_ADDRESS, CONTRACT_ADDRESS_AUCTION_DATA } from '@/lib/contract'
import { ethers } from 'ethers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketData, userAddress } = body

    // Read existing tickets
    const ticketsPath = path.join(process.cwd(), 'public', 'data', 'tickets.json')
    const ticketsData = fs.readFileSync(ticketsPath, 'utf8')
    const tickets = JSON.parse(ticketsData)
    



    // Create new ticket entry using the complete ticketData
    const newTicket = {
      id: (tickets.length + 1).toString(),
      eventName: ticketData.ticketInfo?.eventName || `NFT Ticket #${ticketData.tokenId}`,
      eventDate: ticketData.ticketInfo?.eventDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      venue: "NFT Marketplace",
      section: ticketData.ticketInfo?.section || "NFT",
      row: ticketData.ticketInfo?.row || "A",
      seat: ticketData.ticketInfo?.seat || ticketData.tokenId,
      price: ticketData.price, // Convert string back to BigInt for storage
      seller: userAddress,
      tokenId: ticketData.tokenId,
      tokenContractAddress: CONTRACT_ADDRESS,
      isListed: true,
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
      bidExpiryTime: Math.floor(Date.now() / 1000) + (2 * 60) // 2 minutes from now in Unix timestamp
    }

    // Add new ticket to the array
    tickets.push(newTicket)

    // Write back to file
    fs.writeFileSync(ticketsPath, JSON.stringify(tickets, null, 2))

    // Create signer with private key for testing
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
    const privateKey = "0x8c9c0a01e8ffcdba8dbe930fca42b7fb6047b88b350c97b9462757d5e53d6515"; // Replace with your private key
    const signer = new ethers.Wallet(privateKey, provider);
    const walletAddress = await signer.getAddress();
    
    console.log('Wallet address:', walletAddress);

    const TICKET_TOKEN_ABI = [
      "function setApprovalForAll(address operator, bool approved) external",
      "function isApprovedForAll(address owner, address operator) external view returns (bool)",
      "function balanceOf(address account, uint256 id) external view returns (uint256)",
      "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external",
      "function getTicketInfo(uint256 tokenId) external view returns (tuple(string eventName, string section, string row, string seat, uint256 eventDate, uint256 price, bool isActive), bool isUsed)",
      "function isTicketValid(uint256 tokenId) external view returns (bool)"
  ];
    
    // Check ticket balance first
    const ticketContract = new ethers.Contract(CONTRACT_ADDRESS!, TICKET_TOKEN_ABI, provider);

    

    let isApproved = await ticketContract.isApprovedForAll(walletAddress, CONTRACT_ADDRESS_AUCTION_DATA!);
    const ticketContractSigner = new ethers.Contract(
      CONTRACT_ADDRESS!, 
      TICKET_TOKEN_ABI, 
      signer  // This is crucial!
  );
    
    if (!isApproved) {
        await ticketContractSigner.setApprovalForAll(CONTRACT_ADDRESS_AUCTION_DATA, true);
    }

    isApproved = await ticketContract.isApprovedForAll(walletAddress, CONTRACT_ADDRESS_AUCTION_DATA!);

    
    console.log('Is approved for auction contract:', isApproved);
    
    const ticketBalance = await ticketContract.balanceOf(walletAddress, ticketData.tokenId);
    console.log('Ticket balance for token ID', ticketData.tokenId, ':', ticketBalance.toString());
    
    // Check if ticket already has an active auction
    const auction_contract_read = new ethers.Contract(CONTRACT_ADDRESS_AUCTION_DATA!, AUCTION_CONTRACT_ABI, provider);
    const activeAuctionId = await auction_contract_read.getActiveAuctionForTicket(ticketData.tokenId);
    console.log('Active auction ID for ticket', ticketData.tokenId, ':', activeAuctionId.toString());
    
    if (ticketBalance.toString() === '0') {
      throw new Error('Insufficient ticket balance. Wallet does not own this ticket.');
    }
    
    if (activeAuctionId.toString() !== '0') {
      throw new Error('Ticket already has an active auction.');
    }
    
    // createAuction parameters: (ticketId, ticketCount, startPrice, buyNowPrice, minIncrement, expiryTime)
    const ticketId = ticketData.tokenId;
    const ticketCount = 1; // Assuming 1 ticket per auction
    const startPrice = ticketData.price;
    const buyNowPrice = ticketData.price; // Same as start price for simplicity
    const minIncrement = ethers.parseEther("0.01"); // 0.01 ETH minimum increment
    const expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
    
    console.log('Creating auction with parameters:', {
      ticketId,
      ticketCount,
      startPrice: startPrice.toString(),
      buyNowPrice: buyNowPrice.toString(),
      minIncrement: minIncrement.toString(),
      expiryTime
    });
    
    // Create auction contract with signer for transaction
    const auction_contract = new ethers.Contract(CONTRACT_ADDRESS_AUCTION_DATA!, AUCTION_CONTRACT_ABI, signer);
    
    const auctionId = await auction_contract.createAuction(
      ticketId, 
      ticketCount, 
      startPrice, 
      buyNowPrice, 
      minIncrement, 
      expiryTime
    )
    console.log('Auction created with ID:', auctionId)

    return NextResponse.json({ success: true, ticket: newTicket, auctionId: auctionId.toString() })
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
