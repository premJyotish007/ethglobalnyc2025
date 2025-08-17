import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TicketAuction contract to Base Sepolia...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy MockUSDC first (if not already deployed)
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  console.log("MockUSDC deployed to:", await mockUSDC.getAddress());

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
    await mockUSDC.getAddress(), // USDC token address
    await ticketToken.getAddress(), // Ticket token address
    deployer.address, // Coordinator address (same as deployer for now)
    deployer.address // Initial owner
  );
  await ticketAuction.waitForDeployment();
  console.log("TicketAuction deployed to:", await ticketAuction.getAddress());

  // Mint some USDC to the deployer for testing
  console.log("Minting test USDC...");
  const mintTx = await mockUSDC.mint(deployer.address, ethers.parseUnits("10000", 6)); // 10,000 USDC
  await mintTx.wait();
  console.log("Minted 10,000 USDC to deployer");

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
  console.log("MockUSDC:", await mockUSDC.getAddress());
  console.log("TicketToken:", await ticketToken.getAddress());
  console.log("TicketAuction:", await ticketAuction.getAddress());
  console.log("Deployer:", deployer.address);
  console.log("\n=== Test Data ===");
  console.log("USDC Balance:", ethers.formatUnits(await mockUSDC.balanceOf(deployer.address), 6));
  console.log("Ticket Balance:", await ticketToken.balanceOf(deployer.address, 1));
  
  // Save deployment addresses to a file
  const deploymentInfo = {
    network: "base-sepolia",
    deployer: deployer.address,
    contracts: {
      mockUSDC: await mockUSDC.getAddress(),
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
  console.log("MockUSDC:", `https://sepolia.basescan.org/address/${await mockUSDC.getAddress()}`);
  console.log("TicketToken:", `https://sepolia.basescan.org/address/${await ticketToken.getAddress()}`);
  console.log("TicketAuction:", `https://sepolia.basescan.org/address/${await ticketAuction.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
