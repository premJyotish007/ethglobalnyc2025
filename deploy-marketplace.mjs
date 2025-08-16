import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("Deploying TicketMarketplace to Base Sepolia...");

  // Get the contract factory using artifacts
  const TicketMarketplace = await hre.artifacts.readArtifact("TicketMarketplace");
  
  // Get the deployer account - using ethers v6 syntax
  const provider = new ethers.JsonRpcProvider(process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("Deploying with account:", await wallet.getAddress());
  
  // Create contract factory
  const factory = new ethers.ContractFactory(
    TicketMarketplace.abi,
    TicketMarketplace.bytecode,
    wallet
  );
  
  // Base Sepolia USDC address (this is the testnet USDC)
  // Using a mock address for now to test deployment
  const USDC_ADDRESS = "0x0000000000000000000000000000000000000000";
  
  // Deploy the marketplace contract
  const marketplace = await factory.deploy(
    "0xEc05b206132935F27A5e150c365eEE8D0906cE8b", // Your deployed TicketToken contract address
    USDC_ADDRESS,
    await wallet.getAddress(), // Use the deployer's address as owner
    {
      gasLimit: 3000000,
    }
  );

  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  console.log("TicketMarketplace deployed to:", marketplaceAddress);
  console.log("USDC Token address:", USDC_ADDRESS);
  console.log("Owner address:", await wallet.getAddress());
  
  console.log("\nDeployment successful! 🎉");
  console.log("Make sure to update your .env file with:");
  console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
