const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying minimal TicketToken contract to Base Sepolia...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy TicketToken with minimal parameters
  console.log("Deploying minimal TicketToken...");
  const TicketToken = await ethers.getContractFactory("TicketToken");
  
  // Use minimal URI and deployer as owner
  const ticketToken = await TicketToken.deploy("", deployer.address);
  await ticketToken.waitForDeployment();
  console.log("TicketToken deployed to:", await ticketToken.getAddress());

  console.log("\n=== Minimal Deployment Summary ===");
  console.log("Network: Base Sepolia");
  console.log("TicketToken:", await ticketToken.getAddress());
  console.log("Deployer:", deployer.address);
  console.log("Note: This is a minimal deployment. You can mint tickets later.");
  
  // Save deployment addresses to a file
  const deploymentInfo = {
    network: "base-sepolia",
    deployer: deployer.address,
    contracts: {
      ticketToken: await ticketToken.getAddress()
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
  console.log("TicketToken:", `https://sepolia.basescan.org/address/${await ticketToken.getAddress()}`);
  
  console.log("\n💰 Next steps:");
  console.log("1. Get more ETH for TicketAuction deployment");
  console.log("2. Deploy TicketAuction: npx hardhat run scripts/deploy-auction-only.cjs --network base-sepolia");
  console.log("3. Mint tickets later when you have more ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
