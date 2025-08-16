// Contract configuration
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '0xEc05b206132935F27A5e150c365eEE8D0906cE8b'

// Contract ABI for the functions we need
export const CONTRACT_ABI = [
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function getTicketInfo(uint256 tokenId) view returns (tuple(string eventName, string section, string row, string seat, uint256 eventDate, uint256 price, bool isActive) ticket, bool isUsed)",
  "function getCurrentTokenId() view returns (uint256)",
  "function createTickets(address to, uint256 amount, string memory eventName, string memory section, string memory row, string memory seat, uint256 eventDate, uint256 price) public",
  "function swapExactOutputSingle(address tokenIn, address tokenOut,address recipient, uint256 amountOut, uint256 amountInMaximum) external returns (uint256 amountIn)", 
  "function swapExactInputSingle(address tokenIn,address tokenOut, address recipient, uint256 amountIn) external returns (uint256 amountOut)"
]
