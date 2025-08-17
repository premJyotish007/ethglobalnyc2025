const { ethers } = require("hardhat");

async function main() {
  // Set your ticket details here - modify these values for different tickets
  const eventName = "Taylor Swift - The Eras Tour";
  const section = "VIP Floor";
  const row = "A";
  const seat = "1-5";
  const priceInUSDC = 500;
  const amount = 1;
  const daysFromNow = 90; // 90 days from now
  
  console.log("Minting ticket with details:");
  console.log("Event:", eventName);
  console.log("Section:", section);
  console.log("Row:", row);
  console.log("Seat:", seat);
  console.log("Price:", priceInUSDC, "USDC");
  console.log("Amount:", amount);
  console.log("Event Date:", daysFromNow, "days from now");
  console.log("---");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Minting tickets with account:", deployer.address);

  // Get the TicketToken contract
  const TicketToken = await ethers.getContractFactory("TicketToken");
  
  // Use the newly deployed contract address on Base Sepolia
  const ticketTokenAddress = "0x4D4503B3aaf33d3dFc0388B26e14972ac62140ad";
  const ticketToken = TicketToken.attach(ticketTokenAddress);

  // Use a proper future date based on parameter
  const currentTime = Math.floor(Date.now() / 1000);
  const eventDate = currentTime + (daysFromNow * 24 * 60 * 60);
  
  const price = ethers.parseUnits(priceInUSDC.toString(), 6); // Convert USDC to wei (6 decimals)

  console.log("Creating tickets with proper future date...");
  console.log("Event:", eventName);
  console.log("Section:", section);
  console.log("Row:", row);
  console.log("Seat:", seat);
  console.log("Current timestamp:", currentTime);
  console.log("Event timestamp:", eventDate);
  console.log("Event Date:", new Date(eventDate * 1000).toLocaleDateString());
  console.log("Price per ticket:", ethers.formatUnits(price, 6), "USDC");
  console.log("Amount:", amount);

  // Use default gas settings
  const tx = await ticketToken.createTickets(
    deployer.address,
    amount,
    eventName,
    section,
    row,
    seat,
    eventDate,
    price
  );

  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");
  
  // Wait for transaction to be mined
  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
  console.log("Gas used:", receipt.gasUsed.toString());

  // Get the token ID that was created by checking the event logs
  const event = receipt.logs.find(log => {
    try {
      const parsed = ticketToken.interface.parseLog(log);
      return parsed && parsed.name === 'TicketCreated';
    } catch {
      return false;
    }
  });
  
  if (event) {
    const parsedEvent = ticketToken.interface.parseLog(event);
    const tokenId = parsedEvent.args.tokenId;
    console.log("Token ID created:", tokenId.toString());
    
    // Check balance
    const balance = await ticketToken.balanceOf(deployer.address, tokenId);
    console.log("Balance for token ID", tokenId.toString() + ":", balance.toString());
  } else {
    console.log("Could not determine token ID from transaction logs");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    console.log("\nTransaction failed. Check the error above.");
    process.exit(1);
  });
