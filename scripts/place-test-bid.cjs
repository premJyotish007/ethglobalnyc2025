const { ethers } = require("hardhat");

async function main() {
  console.log("Placing test bid on Auction ID 4...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Bidding with account:", deployer.address);

  // Contract addresses
  const auctionAddress = "0x4f0ebF8e705ec90D29928E85CFc1666d3595768a";
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  // Auction contract ABI (minimal for bidding)
  const auctionABI = [
    "function bid(uint256 auctionId, uint256 bidPrice) external",
    "function getAuction(uint256 auctionId) external view returns (tuple(uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address,uint256,bool,bool))"
  ];

  // USDC contract ABI
  const usdcABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)"
  ];

  try {
    // Create provider and signer
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    const usdcContract = new ethers.Contract(usdcAddress, usdcABI, provider);
    const auctionContract = new ethers.Contract(auctionAddress, auctionABI, deployer);

    // Check USDC balance
    const usdcBalance = await usdcContract.balanceOf(deployer.address);
    console.log("USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

    // Check allowance
    const allowance = await usdcContract.allowance(deployer.address, auctionAddress);
    console.log("USDC Allowance:", ethers.formatUnits(allowance, 6), "USDC");

    // Get auction details
    const auction = await auctionContract.getAuction(4); // Auction ID 4
    const startPrice = auction[3]; // startPrice is at index 3
    const minIncrement = auction[5]; // minIncrement is at index 5
    
    console.log("Auction ID 4 Details:");
    console.log("Start Price:", ethers.formatUnits(startPrice, 6), "USDC");
    console.log("Min Increment:", ethers.formatUnits(minIncrement, 6), "USDC");

    // Place bid at start price (0.01 USDC)
    const bidAmount = startPrice;
    console.log(`\nPlacing bid of ${ethers.formatUnits(bidAmount, 6)} USDC...`);

    const bidTx = await auctionContract.bid(4, bidAmount);
    console.log("Bid transaction sent! Hash:", bidTx.hash);
    
    console.log("Waiting for confirmation...");
    await bidTx.wait();
    
    console.log("✅ Bid placed successfully!");
    console.log("Transaction hash:", bidTx.hash);
    console.log("You are now the highest bidder on Auction ID 4!");

  } catch (error) {
    console.error("❌ Error placing bid:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 You need more ETH for gas fees");
    } else if (error.message.includes("allowance")) {
      console.log("💡 You need to approve USDC spending first");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
