import { ethers } from 'ethers';

// Contract ABI - minimal version for createTickets function
const contractABI = [
  "function createTickets(address to, uint256 amount, string memory eventName, string memory section, string memory row, string memory seat, uint256 eventDate, uint256 price) public"
];

// Contract configuration
const CONTRACT_ADDRESS = "0xe2d00e49ff19f6e4ec5edb023117fb4b869213d2";
const TO_ADDRESS = '0xe7d0A248Ee60B2B91d83a54AEe5da92ea62E3304';

async function createTickets() {
  try {
    // Connect to provider (replace with your RPC URL)
    const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
    
    // Connect with private key (replace with your private key)
    const privateKey = "c1a9102a3fb9d34ccc273073cc1cc83256497ed8f69e8568116de79cfb0fc50b";
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
    
    // Ticket parameters
    const amount = 1;
    const eventName = "random 3";
    const section = "100";
    const row = "A";
    const seat = "15";
    const eventDate = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
    // set the price to 0.2 USDC
    const price = ethers.parseUnits("0.2", 6);
    
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


