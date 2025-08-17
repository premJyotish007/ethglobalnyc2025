const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TicketAuction contract to Base Sepolia...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Base Sepolia USDC address (real USDC, not mock)
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  console.log("Using Base Sepolia USDC address:", usdcAddress);

  // Read existing deployment info to get TicketToken address
  const fs = require('fs');
  let deploymentInfo;
  try {
    deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  } catch (error) {
    console.error("❌ Could not read deployment-info.json");
    console.log("Please deploy TicketToken first using: npx hardhat run scripts/deploy-ticket-token.cjs --network base-sepolia");
    return;
  }

  const ticketTokenAddress = deploymentInfo.contracts.ticketToken;
  if (!ticketTokenAddress) {
    console.error("❌ No TicketToken address found in deployment-info.json");
    return;
  }

  console.log("Using existing TicketToken address:", ticketTokenAddress);

  // Deploy TicketAuction
  console.log("Deploying TicketAuction...");
  const TicketAuction = await ethers.getContractFactory("TicketAuction");
  const ticketAuction = await TicketAuction.deploy(
    usdcAddress, // Real USDC token address
    ticketTokenAddress, // Existing TicketToken address
    deployer.address, // Coordinator address (same as deployer for now)
    deployer.address // Initial owner
  );
  await ticketAuction.waitForDeployment();
  console.log("TicketAuction deployed to:", await ticketAuction.getAddress());

  console.log("\n=== Deployment Summary ===");
  console.log("Network: Base Sepolia");
  console.log("USDC (Real):", usdcAddress);
  console.log("TicketToken:", ticketTokenAddress);
  console.log("TicketAuction:", await ticketAuction.getAddress());
  console.log("Deployer:", deployer.address);
  
  // Update deployment info with new contract
  deploymentInfo.contracts.usdc = usdcAddress;
  deploymentInfo.contracts.ticketAuction = await ticketAuction.getAddress();
  
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info updated in deployment-info.json");
  
  console.log("\n🔗 Base Sepolia Explorer Links:");
  console.log("USDC:", `https://sepolia.basescan.org/address/${usdcAddress}`);
  console.log("TicketToken:", `https://sepolia.basescan.org/address/${ticketTokenAddress}`);
  console.log("TicketAuction:", `https://sepolia.basescan.org/address/${await ticketAuction.getAddress()}`);
  
  console.log("\n🎉 Deployment complete! You can now:");
  console.log("1. Test the system with your 30 USDC");
  console.log("2. Create auctions using the frontend");
  console.log("3. Place bids on auctions");
  
  console.log("\n💰 To get USDC for testing:");
  console.log("Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
