const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("Deploying TicketAuction contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the TicketToken contract address from environment
  const ticketTokenAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS;
  if (!ticketTokenAddress) {
    throw new Error("NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS not found in environment variables");
  }

  // For Base Sepolia, we'll use a testnet USDC address
  // This is a mock USDC token for testing - in production you'd use the real USDC address
  const usdcTokenAddress = "0x0000000000000000000000000000000000000000"; // Mock USDC address for testing

  // Set coordinator address (using deployer for now, you can change this)
  const coordinatorAddress = deployer.address;

  console.log("Deployment parameters:");
  console.log("- USDC Token Address:", usdcTokenAddress);
  console.log("- Ticket Token Address:", ticketTokenAddress);
  console.log("- Coordinator Address:", coordinatorAddress);
  console.log("- Owner Address:", deployer.address);

  // Deploy the TicketAuction contract
  const TicketAuction = await ethers.getContractFactory("TicketAuction");
  const auctionContract = await TicketAuction.deploy(
    usdcTokenAddress,
    ticketTokenAddress,
    coordinatorAddress,
    deployer.address // initial owner
  );

  await auctionContract.waitForDeployment();
  const auctionAddress = await auctionContract.getAddress();

  console.log("\n✅ TicketAuction deployed successfully!");
  console.log("Contract Address:", auctionAddress);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract Address:", auctionAddress);
  console.log("🔗 Base Sepolia Explorer: https://sepolia.basescan.org/address/" + auctionAddress);
  
  console.log("\n📋 Deployment Summary:");
  console.log("- USDC Token Address:", usdcTokenAddress);
  console.log("- Ticket Token Address:", ticketTokenAddress);
  console.log("- Coordinator Address:", coordinatorAddress);
  console.log("- Owner Address:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
