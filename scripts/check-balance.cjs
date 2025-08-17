const { ethers } = require("hardhat");

async function main() {
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Checking balance for account:", deployer.address);

  // Get provider for Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  
  // Check ETH balance
  const balance = await provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  
  console.log("ETH Balance:", balanceInEth, "ETH");
  console.log("ETH Balance (wei):", balance.toString());
  
  // Check if balance is sufficient for gas
  const estimatedGas = 300000; // Estimated gas for minting
  const gasPrice = ethers.parseUnits("0.001", "gwei"); // 0.001 gwei
  const estimatedCost = estimatedGas * gasPrice;
  const estimatedCostInEth = ethers.formatEther(estimatedCost);
  
  console.log("\nGas Estimation:");
  console.log("Estimated gas:", estimatedGas);
  console.log("Gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  console.log("Estimated cost:", estimatedCostInEth, "ETH");
  
  if (balance > estimatedCost) {
    console.log("✅ Sufficient balance for transaction");
  } else {
    console.log("❌ Insufficient balance for transaction");
    console.log("You need at least", estimatedCostInEth, "ETH");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
