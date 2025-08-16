import { ethers } from 'ethers';
import { AUCTION_CONTRACT_ABI, CONTRACT_ADDRESS_AUCTION_DATA } from './contract';

// USDC ABI for approval
const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)"
];

export interface CreateAuctionParams {
  ticketId: number;
  ticketCount: number;
  startPrice: bigint; // USDC amount with 6 decimals
  buyNowPrice: bigint; // USDC amount with 6 decimals
  minIncrement: bigint; // USDC amount with 6 decimals
  expiryTime: number; // Unix timestamp
  rpcUrl?: string;
}

export interface AuctionResult {
  success: boolean;
  auctionId: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  effectiveGasPrice: string;
}

export interface AuctionDetails {
  auctionId: string;
  ticketId: string;
  ticketCount: string;
  startPrice: string;
  buyNowPrice: string;
  minIncrement: string;
  expiryTime: string;
  seller: string;
  highestBidder: string;
  highestBid: string;
  isActive: boolean;
  isSettled: boolean;
}

/**
 * Create an auction for tickets using MetaMask or Privy wallet
 */
export async function createAuction(
  params: CreateAuctionParams,
  signer: ethers.Signer
): Promise<AuctionResult> {
  const {
    ticketId,
    ticketCount,
    startPrice,
    buyNowPrice,
    minIncrement,
    expiryTime,
    rpcUrl = 'https://sepolia.base.org'
  } = params;

  try {
    console.log('Creating auction with parameters:', {
      ticketId,
      ticketCount,
      startPrice: ethers.formatUnits(startPrice, 6) + ' USDC',
      buyNowPrice: ethers.formatUnits(buyNowPrice, 6) + ' USDC',
      minIncrement: ethers.formatUnits(minIncrement, 6) + ' USDC',
      expiryTime: new Date(expiryTime * 1000).toISOString()
    });

    // Get the signer address
    const signerAddress = await signer.getAddress();
    console.log('Signer address:', signerAddress);

    // Create contract instances
    const auctionContract = new ethers.Contract(CONTRACT_ADDRESS_AUCTION_DATA!, AUCTION_CONTRACT_ABI, signer);

    // Check if user has enough tickets
    console.log('Checking ticket balance...');
    const ticketTokenAddress = await auctionContract.ticketToken();
    const ticketTokenContract = new ethers.Contract(ticketTokenAddress, [
      "function balanceOf(address account, uint256 id) view returns (uint256)"
    ], signer);
    
    const ticketBalance = await ticketTokenContract.balanceOf(signerAddress, ticketId);
    console.log('Ticket balance:', ticketBalance.toString());
    
    if (ticketBalance < ticketCount) {
      throw new Error(`Insufficient ticket balance. You have ${ticketBalance} tickets, need ${ticketCount}`);
    }

    // Check if ticket already has an active auction
    console.log('Checking for existing auctions...');
    const existingAuctionId = await auctionContract.getActiveAuctionForTicket(ticketId);
    if (existingAuctionId > 0) {
      throw new Error(`Ticket ${ticketId} already has an active auction (ID: ${existingAuctionId})`);
    }

    // Approve auction contract to transfer tickets (if needed)
    console.log('Approving ticket transfer...');
    const ticketTokenApprovalContract = new ethers.Contract(ticketTokenAddress, [
      "function setApprovalForAll(address operator, bool approved) returns (bool)",
      "function isApprovedForAll(address owner, address operator) view returns (bool)"
    ], signer);

    const isApproved = await ticketTokenApprovalContract.isApprovedForAll(signerAddress, CONTRACT_ADDRESS_AUCTION_DATA);
    if (!isApproved) {
      console.log('Setting approval for ticket transfer...');
      const approveTx = await ticketTokenApprovalContract.setApprovalForAll(CONTRACT_ADDRESS_AUCTION_DATA, true);
      await approveTx.wait();
      console.log('Ticket approval confirmed');
    }

    // Create the auction
    console.log('Creating auction...');
    const createAuctionTx = await auctionContract.createAuction(
      ticketId,
      ticketCount,
      startPrice,
      buyNowPrice,
      minIncrement,
      expiryTime
    );

    console.log('Transaction hash:', createAuctionTx.hash);
    console.log('Waiting for confirmation...');

    // Wait for transaction to be mined
    const receipt = await createAuctionTx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);

    // Get the auction ID from the event
    const auctionCreatedEvent = receipt.logs.find(log => {
      try {
        const parsed = auctionContract.interface.parseLog(log);
        return parsed.name === 'AuctionCreated';
      } catch {
        return false;
      }
    });

    if (auctionCreatedEvent) {
      const parsedEvent = auctionContract.interface.parseLog(auctionCreatedEvent);
      const auctionId = parsedEvent.args.auctionId;
      console.log('Auction created successfully!');
      console.log('Auction ID:', auctionId.toString());
      
      return {
        success: true,
        auctionId: auctionId.toString(),
        transactionHash: createAuctionTx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString()
      };
    } else {
      throw new Error('AuctionCreated event not found in transaction receipt');
    }

  } catch (error) {
    console.error('Error creating auction:', error);
    throw error;
  }
}

/**
 * Get auction details
 */
export async function getAuction(auctionId: number, rpcUrl: string = 'https://sepolia.base.org'): Promise<AuctionDetails> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const auctionContract = new ethers.Contract(CONTRACT_ADDRESS_AUCTION_DATA!, AUCTION_CONTRACT_ABI, provider);
    
    const auction = await auctionContract.getAuction(auctionId);
    
    return {
      auctionId: auction.auctionId.toString(),
      ticketId: auction.ticketId.toString(),
      ticketCount: auction.ticketCount.toString(),
      startPrice: ethers.formatUnits(auction.startPrice, 6) + ' USDC',
      buyNowPrice: ethers.formatUnits(auction.buyNowPrice, 6) + ' USDC',
      minIncrement: ethers.formatUnits(auction.minIncrement, 6) + ' USDC',
      expiryTime: new Date(Number(auction.expiryTime) * 1000).toISOString(),
      seller: auction.seller,
      highestBidder: auction.highestBidder,
      highestBid: ethers.formatUnits(auction.highestBid, 6) + ' USDC',
      isActive: auction.isActive,
      isSettled: auction.isSettled
    };
  } catch (error) {
    console.error('Error getting auction:', error);
    throw error;
  }
}

/**
 * Place a bid on an auction
 */
export async function placeBid(
  auctionId: number,
  bidAmount: bigint,
  signer: ethers.Signer
): Promise<{ success: boolean; transactionHash: string }> {
  try {
    const auctionContract = new ethers.Contract(CONTRACT_ADDRESS_AUCTION_DATA!, AUCTION_CONTRACT_ABI, signer);
    
    console.log(`Placing bid of ${ethers.formatUnits(bidAmount, 6)} USDC on auction ${auctionId}...`);
    
    const bidTx = await auctionContract.bid(auctionId, bidAmount);
    console.log('Bid transaction hash:', bidTx.hash);
    
    const receipt = await bidTx.wait();
    console.log('Bid confirmed in block:', receipt.blockNumber);
    
    return {
      success: true,
      transactionHash: bidTx.hash
    };
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
}

/**
 * Buy now for an auction
 */
export async function buyNow(
  auctionId: number,
  signer: ethers.Signer
): Promise<{ success: boolean; transactionHash: string }> {
  try {
    const auctionContract = new ethers.Contract(CONTRACT_ADDRESS_AUCTION_DATA!, AUCTION_CONTRACT_ABI, signer);
    
    console.log(`Executing buy now for auction ${auctionId}...`);
    
    const buyNowTx = await auctionContract.buyNow(auctionId);
    console.log('Buy now transaction hash:', buyNowTx.hash);
    
    const receipt = await buyNowTx.wait();
    console.log('Buy now confirmed in block:', receipt.blockNumber);
    
    return {
      success: true,
      transactionHash: buyNowTx.hash
    };
  } catch (error) {
    console.error('Error executing buy now:', error);
    throw error;
  }
}

/**
 * Get all active auctions
 */
export async function getActiveAuctions(rpcUrl: string = 'https://sepolia.base.org'): Promise<AuctionDetails[]> {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const auctionContract = new ethers.Contract(CONTRACT_ADDRESS_AUCTION_DATA!, AUCTION_CONTRACT_ABI, provider);
    
    // Get the current auction counter to know how many auctions exist
    const auctionCounter = await auctionContract._auctionCounter();
    const activeAuctions: AuctionDetails[] = [];
    
    // Check each auction ID to see if it's active
    for (let i = 1; i < auctionCounter; i++) {
      try {
        const auction = await auctionContract.getAuction(i);
        if (auction.isActive && !auction.isSettled) {
          activeAuctions.push({
            auctionId: auction.auctionId.toString(),
            ticketId: auction.ticketId.toString(),
            ticketCount: auction.ticketCount.toString(),
            startPrice: ethers.formatUnits(auction.startPrice, 6) + ' USDC',
            buyNowPrice: ethers.formatUnits(auction.buyNowPrice, 6) + ' USDC',
            minIncrement: ethers.formatUnits(auction.minIncrement, 6) + ' USDC',
            expiryTime: new Date(Number(auction.expiryTime) * 1000).toISOString(),
            seller: auction.seller,
            highestBidder: auction.highestBidder,
            highestBid: ethers.formatUnits(auction.highestBid, 6) + ' USDC',
            isActive: auction.isActive,
            isSettled: auction.isSettled
          });
        }
      } catch (error) {
        // Skip auctions that don't exist or have errors
        continue;
      }
    }
    
    return activeAuctions;
  } catch (error) {
    console.error('Error getting active auctions:', error);
    throw error;
  }
}

/**
 * Utility function to create auction parameters with proper USDC formatting
 */
export function createAuctionParams(
  ticketId: number,
  ticketCount: number,
  startPriceUSD: number,
  buyNowPriceUSD: number,
  minIncrementUSD: number,
  expiryDays: number = 7
): CreateAuctionParams {
  return {
    ticketId,
    ticketCount,
    startPrice: ethers.parseUnits(startPriceUSD.toString(), 6),
    buyNowPrice: ethers.parseUnits(buyNowPriceUSD.toString(), 6),
    minIncrement: ethers.parseUnits(minIncrementUSD.toString(), 6),
    expiryTime: Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60)
  };
}
