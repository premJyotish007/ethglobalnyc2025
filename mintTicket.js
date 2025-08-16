const { ethers } = require('ethers');

// Contract ABI - minimal version for createTickets function
const contractABI = [
  "function createTickets(address to, uint256 amount, string memory eventName, string memory section, string memory row, string memory seat, uint256 eventDate, uint256 price) public"
];

// Contract configuration
const CONTRACT_ADDRESS = "0xEc05b206132935F27A5e150c365eEE8D0906cE8b";
const TO_ADDRESS = '0xe7d0A248Ee60B2B91d83a54AEe5da92ea62E3304';

async function createTickets() {
  try {
    // Connect to provider (replace with your RPC URL)
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
    
    // Connect with private key (replace with your private key)
    const privateKey = "0x8c9c0a01e8ffcdba8dbe930fca42b7fb6047b88b350c97b9462757d5e53d6515";
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
    
    // Ticket parameters
    const amount = 1;
    const eventName = "Weeknd Concert";
    const section = "100";
    const row = "A";
    const seat = "15";
    const eventDate = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
    // set the price to 10 USDC
    const price = ethers.parseUnits("10", 6);
    
    console.log('Creating ticket...');
    console.log('To:', TO_ADDRESS);
    console.log('Event:', eventName);
    console.log('Price:', ethers.formatEther(price), 'ETH');
    
    // Call createTickets function
    const tx = await contract.createTickets(
      TO_ADDRESS,
      amount,
      eventName,
      section,
      row,
      seat,
      eventDate,
      price
    );
    
    console.log('Transaction hash:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the function
createTickets();


