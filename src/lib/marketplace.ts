import { ethers } from 'ethers';
import { TicketMarketplace__factory } from '../../contracts/typechain-types';

// Contract addresses - update these after deployment
const MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '';
// Using a mock address for now to test basic functionality
const USDC_ADDRESS = '0x0000000000000000000000000000000000000000';

// ABI for the marketplace contract
const MARKETPLACE_ABI = [
  "function buyTicket(uint256 tokenId, uint256 amount) external",
  "function getListing(uint256 tokenId) external view returns (tuple(address seller, uint256 price, uint256 amount, bool isActive, uint256 createdAt))",
  "function isTicketListed(uint256 tokenId) external view returns (bool)",
  "event TicketSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 amount)"
];

export class MarketplaceService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private marketplace: ethers.Contract;

  constructor(provider: ethers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.marketplace = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
  }

  /**
   * Buy a ticket from the marketplace
   */
  async buyTicket(tokenId: string, amount: number, price: bigint): Promise<boolean> {
    try {
      // For testing, skip USDC approval and just call the marketplace
      console.log(`Attempting to buy ticket ${tokenId} for ${price} wei`);
      
      // Then buy the ticket
      const tx = await this.marketplace.buyTicket(tokenId, amount);
      await tx.wait();
      
      console.log(`Successfully bought ${amount} ticket(s) with ID ${tokenId}`);
      return true;
    } catch (error) {
      console.error('Error buying ticket:', error);
      throw error;
    }
  }

  /**
   * Approve USDC spending for the marketplace
   */
  private async approveUSDC(amount: bigint): Promise<void> {
    const usdcContract = new ethers.Contract(
      USDC_ADDRESS,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)'
      ],
      this.signer
    );

    // Check current allowance
    const currentAllowance = await usdcContract.allowance(
      await this.signer.getAddress(),
      MARKETPLACE_ADDRESS
    );

    if (currentAllowance < amount) {
      const approveTx = await usdcContract.approve(MARKETPLACE_ADDRESS, amount);
      await approveTx.wait();
      console.log('USDC approval successful');
    }
  }

  /**
   * Get listing information for a ticket
   */
  async getListing(tokenId: string) {
    try {
      const listing = await this.marketplace.getListing(tokenId);
      return {
        seller: listing.seller,
        price: listing.price,
        amount: listing.amount,
        isActive: listing.isActive,
        createdAt: listing.createdAt
      };
    } catch (error) {
      console.error('Error getting listing:', error);
      return null;
    }
  }

  /**
   * Check if a ticket is listed
   */
  async isTicketListed(tokenId: string): Promise<boolean> {
    try {
      return await this.marketplace.isTicketListed(tokenId);
    } catch (error) {
      console.error('Error checking if ticket is listed:', error);
      return false;
    }
  }
}

