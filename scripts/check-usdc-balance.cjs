const { ethers } = require("hardhat");

async function main() {
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Checking balances for account:", deployer.address);

  // Get provider for Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  
  // Check ETH balance
  const ethBalance = await provider.getBalance(deployer.address);
  const ethBalanceInEth = ethers.formatEther(ethBalance);
  
  console.log("ETH Balance:", ethBalanceInEth, "ETH");
  
  // Check USDC balance (Real USDC contract)
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const usdcABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];
  
  const usdcContract = new ethers.Contract(usdcAddress, usdcABI, provider);
  
  try {
    const usdcBalance = await usdcContract.balanceOf(deployer.address);
    const decimals = await usdcContract.decimals();
    const usdcBalanceFormatted = ethers.formatUnits(usdcBalance, decimals);
    
    console.log("USDC Balance:", usdcBalanceFormatted, "USDC");
    
    // Check if you have enough USDC for bidding
    const minBidAmount = ethers.parseUnits("0.01", decimals); // 0.01 USDC minimum bid
    
    if (usdcBalance >= minBidAmount) {
      console.log("✅ Sufficient USDC for bidding");
      console.log("You can place bids starting from 0.01 USDC");
    } else {
      console.log("❌ Insufficient USDC for bidding");
      console.log("You need at least 0.01 USDC to place a bid");
      console.log("Get testnet USDC from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    }
    
  } catch (error) {
    console.log("❌ Could not check USDC balance:", error.message);
    console.log("Make sure you're connected to Base Sepolia network");
  }
  
  // Check if balance is sufficient for gas
  const estimatedGas = 300000n; // Estimated gas for bidding (as BigInt)
  const gasPrice = ethers.parseUnits("0.001", "gwei"); // 0.001 gwei
  const estimatedCost = estimatedGas * gasPrice;
  const estimatedCostInEth = ethers.formatEther(estimatedCost);
  
  console.log("\nGas Estimation:");
  console.log("Estimated gas:", estimatedGas.toString());
  console.log("Gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  console.log("Estimated cost:", estimatedCostInEth, "ETH");
  
  // Convert both to BigInt for comparison
  if (ethBalance > estimatedCost) {
    console.log("✅ Sufficient ETH for gas fees");
  } else {
    console.log("❌ Insufficient ETH for gas fees");
    console.log("You need at least", estimatedCostInEth, "ETH");
    console.log("Current balance:", ethers.formatEther(ethBalance), "ETH");
    
    // Calculate how much more you need
    const needed = estimatedCost - ethBalance;
    console.log("Additional ETH needed:", ethers.formatEther(needed), "ETH");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
