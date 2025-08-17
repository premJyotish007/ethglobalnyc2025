const { ethers } = require("hardhat");

async function main() {
  // Get the deployer (who wants to approve USDC spending)
  const [deployer] = await ethers.getSigners();
  console.log("Approving USDC spending for account:", deployer.address);

  // Real Base Sepolia USDC address
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  
  // USDC ABI (ERC20 standard functions)
  const usdcABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  // Create contract instance
  const usdcContract = new ethers.Contract(usdcAddress, usdcABI, deployer);

  // Auction contract address (you'll need to update this after deployment)
  const auctionAddress = "0x4f0ebF8e705ec90D29928E85CFc1666d3595768a"; // Updated with deployed address
  
  try {
    // Check current allowance
    const currentAllowance = await usdcContract.allowance(deployer.address, auctionAddress);
    console.log("Current USDC allowance for auction contract:", ethers.formatUnits(currentAllowance, 6), "USDC");
    
    // Check USDC balance
    const balance = await usdcContract.balanceOf(deployer.address);
    console.log("Current USDC balance:", ethers.formatUnits(balance, 6), "USDC");
    
    if (balance === 0n) {
      console.log("❌ No USDC balance. You need to get some USDC from Base Sepolia faucet first.");
      console.log("Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
      return;
    }
    
    // Approve a large amount for bidding (e.g., 1000 USDC)
    const approveAmount = ethers.parseUnits("1000", 6); // 1000 USDC
    
    console.log("Approving", ethers.formatUnits(approveAmount, 6), "USDC for auction contract...");
    
    const tx = await usdcContract.approve(auctionAddress, approveAmount);
    await tx.wait();
    
    console.log("✅ USDC approval successful!");
    console.log("Transaction hash:", tx.hash);
    
    // Check new allowance
    const newAllowance = await usdcContract.allowance(deployer.address, auctionAddress);
    console.log("New USDC allowance:", ethers.formatUnits(newAllowance, 6), "USDC");
    
    console.log("🎉 You can now place bids on auctions!");
    
  } catch (error) {
    console.error("❌ Error approving USDC:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 You need ETH for gas fees. Get some from Base Sepolia faucet.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
