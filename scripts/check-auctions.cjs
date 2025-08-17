const { ethers } = require("hardhat");

async function main() {
  console.log("Checking active auctions on Base Sepolia...");
  
  // Auction contract address
  const auctionAddress = "0x4f0ebF8e705ec90D29928E85CFc1666d3595768a";
  
  try {
    // Get provider for Base Sepolia
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    
    // Basic ABI for checking auctions
    const auctionABI = [
      "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, uint256 ticketId, uint256 ticketCount, uint256 startPrice, uint256 buyNowPrice, uint256 minIncrement, uint256 expiryTime, address seller, address highestBidder, uint256 highestBid, bool isActive, bool isSettled))",
      "function getActiveAuctions() view returns (uint256[])",
      "function getAuctionCount() view returns (uint256)"
    ];
    
    const auctionContract = new ethers.Contract(auctionAddress, auctionABI, provider);
    
    console.log("\n1. Checking auction count...");
    try {
      const auctionCount = await auctionContract.getAuctionCount();
      console.log("Total auctions created:", auctionCount.toString());
    } catch (error) {
      console.log("Could not get auction count:", error.message);
    }
    
    console.log("\n2. Checking for active auctions...");
    
    // Check first few auction IDs
    for (let i = 1; i <= 5; i++) {
      try {
        const auction = await auctionContract.getAuction(i);
        
        if (auction && auction.auctionId.toString() !== "0") {
          console.log(`\n✅ Auction ID ${i}:`);
          console.log("   Ticket ID:", auction.ticketId.toString());
          console.log("   Ticket Count:", auction.ticketCount.toString());
          console.log("   Start Price:", ethers.formatUnits(auction.startPrice, 6), "USDC");
          console.log("   Buy Now Price:", ethers.formatUnits(auction.buyNowPrice, 6), "USDC");
          console.log("   Min Increment:", ethers.formatUnits(auction.minIncrement, 6), "USDC");
          console.log("   Expiry Time:", new Date(Number(auction.expiryTime) * 1000).toLocaleDateString());
          console.log("   Seller:", auction.seller);
          console.log("   Highest Bidder:", auction.highestBidder);
          console.log("   Highest Bid:", auction.highestBid.toString() === "0" ? "No bids yet" : ethers.formatUnits(auction.highestBid, 6) + " USDC");
          console.log("   Is Active:", auction.isActive);
          console.log("   Is Settled:", auction.isSettled);
        } else {
          console.log(`❌ Auction ID ${i}: Does not exist`);
        }
      } catch (error) {
        console.log(`❌ Auction ID ${i}: Error or does not exist`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error checking auctions:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
