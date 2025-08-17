const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying only TicketAuction contract to Base Sepolia...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Base Sepolia USDC address (real USDC, not mock)
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  console.log("Using Base Sepolia USDC address:", usdcAddress);

  // Use the TicketToken address from the last successful deployment
  const ticketTokenAddress = "0xD252C2A8DC02Da67d5E8F5134D10a86759092784";
  console.log("Using existing TicketToken address:", ticketTokenAddress);

  // Deploy TicketAuction
  console.log("Deploying TicketAuction...");
  const TicketAuction = await ethers.getContractFactory("TicketAuction");
  const ticketAuction = await TicketAuction.deploy(
    usdcAddress, // Real USDC token address
    ticketTokenAddress, // Existing Ticket token address
    deployer.address, // Coordinator address (same as deployer for now)
    deployer.address // Initial owner
  );
  await ticketAuction.waitForDeployment();
  console.log("TicketAuction deployed to:", await ticketAuction.getAddress());

  console.log("\n=== Deployment Summary ===");
  console.log("Network: Base Sepolia");
  console.log("USDC (Real):", usdcAddress);
  console.log("TicketToken (existing):", ticketTokenAddress);
  console.log("TicketAuction:", await ticketAuction.getAddress());
  console.log("Deployer:", deployer.address);
  
  // Save deployment addresses to a file
  const deploymentInfo = {
    network: "base-sepolia",
    deployer: deployer.address,
    contracts: {
      usdc: usdcAddress,
      ticketToken: ticketTokenAddress,
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
  console.log("TicketToken:", `https://sepolia.basescan.org/address/${ticketTokenAddress}`);
  console.log("TicketAuction:", `https://sepolia.basescan.org/address/${await ticketAuction.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
