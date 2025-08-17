const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging Auction ID 4...\n");

  // Contract addresses from deployment
  const AUCTION_CONTRACT_ADDRESS = "0x4f0ebF8e705ec90D29928E85CFc1666d3595768a";
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const TICKET_TOKEN_ADDRESS = "0x4D4503B3aaf33d3dFc0388B26e14972ac62140ad";

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("🔑 Signer:", signer.address);

  // Create contract instances
  const auctionContract = await ethers.getContractAt("TicketAuction", AUCTION_CONTRACT_ADDRESS);
  const usdcContract = await ethers.getContractAt("IERC20", USDC_ADDRESS);

  try {
    // Check auction details
    console.log("📋 Checking Auction Details...");
    const auction = await auctionContract.getAuction(4);
    
    console.log("Auction ID:", auction.auctionId.toString());
    console.log("Ticket ID:", auction.ticketId.toString());
    console.log("Start Price:", ethers.formatUnits(auction.startPrice, 6), "USDC");
    console.log("Buy Now Price:", ethers.formatUnits(auction.buyNowPrice, 6), "USDC");
    console.log("Min Increment:", ethers.formatUnits(auction.minIncrement, 6), "USDC");
    console.log("Expiry Time:", new Date(Number(auction.expiryTime) * 1000).toLocaleString());
    console.log("Seller:", auction.seller);
    console.log("Highest Bidder:", auction.highestBidder);
    console.log("Highest Bid:", ethers.formatUnits(auction.highestBid, 6), "USDC");
    console.log("Is Active:", auction.isActive);
    console.log("Is Settled:", auction.isSettled);

    // Check current timestamp
    const currentBlock = await ethers.provider.getBlock("latest");
    const currentTime = currentBlock.timestamp;
    console.log("\n⏰ Current Block Time:", new Date(currentTime * 1000).toLocaleString());
    console.log("⏰ Auction Expiry Time:", new Date(Number(auction.expiryTime) * 1000).toLocaleString());
    console.log("⏰ Time Until Expiry:", Number(auction.expiryTime) - currentTime, "seconds");

    // Check if auction is expired
    if (currentTime >= Number(auction.expiryTime)) {
      console.log("❌ Auction has EXPIRED!");
    } else {
      console.log("✅ Auction is still active");
    }

    // Check minimum bid requirement - convert to BigNumber first
    const highestBidBN = BigInt(auction.highestBid.toString());
    const minIncrementBN = BigInt(auction.minIncrement.toString());
    const startPriceBN = BigInt(auction.startPrice.toString());
    const minBid = highestBidBN + minIncrementBN;
    
    console.log("\n💰 Bid Requirements:");
    console.log("Start Price:", ethers.formatUnits(startPriceBN, 6), "USDC");
    console.log("Current Highest Bid:", ethers.formatUnits(highestBidBN, 6), "USDC");
    console.log("Min Increment:", ethers.formatUnits(minIncrementBN, 6), "USDC");
    console.log("Minimum Bid Required:", ethers.formatUnits(minBid, 6), "USDC");

    // Check if user is seller
    if (signer.address.toLowerCase() === auction.seller.toLowerCase()) {
      console.log("❌ You are the seller - cannot bid on your own auction!");
    } else {
      console.log("✅ You are not the seller - can place bids");
    }

    // Check USDC balance and allowance
    console.log("\n💵 USDC Status:");
    const balance = await usdcContract.balanceOf(signer.address);
    console.log("Your USDC Balance:", ethers.formatUnits(balance, 6), "USDC");
    
    const allowance = await usdcContract.allowance(signer.address, AUCTION_CONTRACT_ADDRESS);
    console.log("USDC Allowance for Auction Contract:", ethers.formatUnits(allowance, 6), "USDC");

    // Test bid amount (0.03 USDC = 30,000 wei)
    const testBidAmount = ethers.parseUnits("0.03", 6);
    console.log("\n🧪 Testing Bid Amount:", ethers.formatUnits(testBidAmount, 6), "USDC");

    if (testBidAmount < startPriceBN) {
      console.log("❌ Bid amount is below start price!");
    } else {
      console.log("✅ Bid amount meets start price requirement");
    }

    if (testBidAmount < minBid) {
      console.log("❌ Bid amount is below minimum bid requirement!");
    } else {
      console.log("✅ Bid amount meets minimum bid requirement");
    }

    if (balance < testBidAmount) {
      console.log("❌ Insufficient USDC balance!");
    } else {
      console.log("✅ Sufficient USDC balance");
    }

    if (allowance < testBidAmount) {
      console.log("❌ Insufficient USDC allowance!");
    } else {
      console.log("✅ Sufficient USDC allowance");
    }

  } catch (error) {
    console.error("❌ Error checking auction:", error.message);
    
    // Try to get more specific error info
    if (error.data) {
      console.log("Error Data:", error.data);
    }
    
    if (error.reason) {
      console.log("Error Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
