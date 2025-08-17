const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TicketAuction contract to Base Sepolia...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Base Sepolia USDC address (real USDC, not mock)
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  console.log("Using Base Sepolia USDC address:", usdcAddress);

  // Deploy TicketToken
  console.log("Deploying TicketToken...");
  const TicketToken = await ethers.getContractFactory("TicketToken");
  const ticketToken = await TicketToken.deploy("https://api.example.com/tickets/{id}", deployer.address);
  await ticketToken.waitForDeployment();
  console.log("TicketToken deployed to:", await ticketToken.getAddress());

  // Deploy TicketAuction
  console.log("Deploying TicketAuction...");
  const TicketAuction = await ethers.getContractFactory("TicketAuction");
  const ticketAuction = await TicketAuction.deploy(
    usdcAddress, // Real USDC token address
    await ticketToken.getAddress(), // Ticket token address
    deployer.address, // Coordinator address (same as deployer for now)
    deployer.address // Initial owner
  );
  await ticketAuction.waitForDeployment();
  console.log("TicketAuction deployed to:", await ticketAuction.getAddress());

  // Mint some tickets for testing
  console.log("Minting test tickets...");
  const eventName = "ETHGlobal NYC 2025";
  const section = "VIP";
  const row = "A";
  const seat = "1-5";
  const eventDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now
  const price = ethers.parseUnits("100", 6); // 100 USDC
  const amount = 5; // 5 tickets

  const createTicketsTx = await ticketToken.createTickets(
    deployer.address,
    amount,
    eventName,
    section,
    row,
    seat,
    eventDate,
    price
  );
  await createTicketsTx.wait();
  console.log("Minted 5 test tickets");

  console.log("\n=== Deployment Summary ===");
  console.log("Network: Base Sepolia");
  console.log("USDC (Real):", usdcAddress);
  console.log("TicketToken:", await ticketToken.getAddress());
  console.log("TicketAuction:", await ticketAuction.getAddress());
  console.log("Deployer:", deployer.address);
  console.log("\n=== Test Data ===");
  console.log("Ticket Balance:", await ticketToken.balanceOf(deployer.address, 1));
  console.log("Note: You'll need real USDC to test bidding. Get some from Base Sepolia faucet.");
  
  // Save deployment addresses to a file
  const deploymentInfo = {
    network: "base-sepolia",
    deployer: deployer.address,
    contracts: {
      usdc: usdcAddress,
      ticketToken: await ticketToken.getAddress(),
      ticketAuction: await ticketAuction.getAddress()
    },
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-info.json");
  
  console.log("\n🔗 Base Sepolia Explorer Links:");
  console.log("USDC:", `https://sepolia.basescan.org/address/${usdcAddress}`);
  console.log("TicketToken:", `https://sepolia.basescan.org/address/${await ticketToken.getAddress()}`);
  console.log("TicketAuction:", `https://sepolia.basescan.org/address/${await ticketAuction.getAddress()}`);
  
  console.log("\n💰 To get USDC for testing:");
  console.log("1. Visit Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
  console.log("2. Or use other Base Sepolia faucets");
  console.log("3. You'll need real USDC to place bids on auctions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
