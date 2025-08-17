const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Auction ID 4 Details...\n");

  const AUCTION_CONTRACT_ADDRESS = "0x6E1A041298615362580065019E6Eab566dBC66a0";
  
  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("🔑 Current Signer:", signer.address);

  // Create contract instance
  const auctionContract = await ethers.getContractAt("TicketAuction", AUCTION_CONTRACT_ADDRESS);

  try {
    // Get auction details
    const auction = await auctionContract.getAuction(4);
    
    console.log("📋 Auction ID 4 Details:");
    console.log("Auction ID:", auction.auctionId.toString());
    console.log("Seller:", auction.seller);
    console.log("Is Active:", auction.isActive);
    console.log("Is Settled:", auction.isSettled);
    console.log("Start Price:", ethers.formatUnits(auction.startPrice, 6), "USDC");
    console.log("Current Highest Bid:", ethers.formatUnits(auction.highestBid, 6), "USDC");
    console.log("Min Increment:", ethers.formatUnits(auction.minIncrement, 6), "USDC");
    
    // Check if current user is seller
    if (signer.address.toLowerCase() === auction.seller.toLowerCase()) {
      console.log("\n❌ ISSUE FOUND: You are the seller of this auction!");
      console.log("   The smart contract prevents sellers from bidding on their own auctions.");
      console.log("   This is why the transaction is reverting.");
    } else {
      console.log("\n✅ You are not the seller - you should be able to bid.");
    }
    
    // Check minimum bid requirement using BigInt
    const highestBid = BigInt(auction.highestBid.toString());
    const minIncrement = BigInt(auction.minIncrement.toString());
    const minBidRequired = highestBid + minIncrement;
    console.log("\n💰 Minimum Bid Required:", ethers.formatUnits(minBidRequired, 6), "USDC");
    
    // Check your bid amount (0.04 USDC = 40,000 wei)
    const yourBidAmount = ethers.parseUnits("0.04", 6);
    console.log("Your Bid Amount:", ethers.formatUnits(yourBidAmount, 6), "USDC");
    
    if (yourBidAmount < minBidRequired) {
      console.log("❌ Your bid is below the minimum required amount!");
    } else {
      console.log("✅ Your bid meets the minimum requirement");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
