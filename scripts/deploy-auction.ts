import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

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
  const usdcTokenAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7c"; // Base Sepolia USDC testnet

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

  // Verify the deployment
  console.log("\nVerifying deployment...");
  const deployedContract = await ethers.getContractAt("TicketAuction", auctionAddress);
  const usdcToken = await deployedContract.usdcToken();
  const ticketToken = await deployedContract.ticketToken();
  const coordinator = await deployedContract.coordinator();
  const owner = await deployedContract.owner();

  console.log("Verification successful:");
  console.log("- USDC Token:", usdcToken);
  console.log("- Ticket Token:", ticketToken);
  console.log("- Coordinator:", coordinator);
  console.log("- Owner:", owner);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract Address:", auctionAddress);
  console.log("🔗 Base Sepolia Explorer: https://sepolia.basescan.org/address/" + auctionAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
