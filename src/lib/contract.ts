// Contract configuration
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '0x4D4503B3aaf33d3dFc0388B26e14972ac62140ad'

export const AUCTION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS || '0x4f0ebF8e705ec90D29928E85CFc1666d3595768a'

export const CONTRACT_ADDRESS_AUCTION_DATA = process.env.NEXT_PUBLIC_AUCTION_DATA_CONTRACT_ADDRESS || '0x4f0ebF8e705ec90D29928E85CFc1666d3595768a'

// Import auction contract ABI
import auctionABI from '../../contracts/auctionDataABI.json'

// Export auction contract ABI
export const AUCTION_CONTRACT_ABI = auctionABI

// Contract ABI for the functions we need
export const CONTRACT_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function getTicketInfo(uint256 tokenId) view returns (tuple(string eventName, string section, string row, string seat, uint256 eventDate, uint256 price, bool isActive) ticket, bool isUsed)",
  "function getCurrentTokenId() view returns (uint256)",
  "function createTickets(address to, uint256 amount, string memory eventName, string memory section, string memory row, string memory seat, uint256 eventDate, uint256 price) public",
  "function setApprovalForAll(address operator, bool approved) public",
  "function isApprovedForAll(address owner, address operator) view returns (bool)"
]

