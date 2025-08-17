const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying TicketToken contract to Base Sepolia...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy TicketToken only
  console.log("Deploying TicketToken...");
  const TicketToken = await ethers.getContractFactory("TicketToken");
  const ticketToken = await TicketToken.deploy("https://api.example.com/tickets/{id}", deployer.address);
  await ticketToken.waitForDeployment();
  console.log("TicketToken deployed to:", await ticketToken.getAddress());

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
  console.log("TicketToken:", await ticketToken.getAddress());
  console.log("Deployer:", deployer.address);
  console.log("Ticket Balance:", await ticketToken.balanceOf(deployer.address, 1));
  
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
  
  console.log("\n💰 Next step: Deploy TicketAuction contract");
  console.log("Run: npx hardhat run scripts/deploy-auction-only.cjs --network base-sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
