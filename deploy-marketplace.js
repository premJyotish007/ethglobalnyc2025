import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TicketMarketplace to Base Sepolia...");

  // Get the contract factory
  const TicketMarketplace = await ethers.getContractFactory("TicketMarketplace");

  // Base Sepolia USDC address (this is the testnet USDC)
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7c";
  
  // Deploy the marketplace contract
  const marketplace = await TicketMarketplace.deploy(
    "0x...", // TODO: Replace with your deployed TicketToken contract address
    USDC_ADDRESS,
    "0x...", // TODO: Replace with your wallet address as owner
    {
      gasLimit: 3000000,
    }
  );

  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("TicketMarketplace deployed to:", marketplaceAddress);
  console.log("USDC Token address:", USDC_ADDRESS);
  console.log("Owner address:", "0x..."); // TODO: Replace with your address
  
  console.log("\nDeployment successful! 🎉");
  console.log("Make sure to update your frontend with this contract address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

