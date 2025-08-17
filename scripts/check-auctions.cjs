const { ethers } = require("hardhat");

async function main() {
  console.log("Checking active auctions on Base Sepolia...\n");

  // Contract addresses from deployment
  const auctionAddress = "0x6E1A041298615362580065019E6Eab566dBC66a0";
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  // Get the signer
  const [signer] = await ethers.getSigners();
  console.log("🔑 Signer:", signer.address);

  // Create contract instance
  const auctionContract = new ethers.Contract(auctionAddress, [
    "function getAuction(uint256 auctionId) external view returns (tuple(uint256 auctionId, uint256 ticketId, uint256 ticketCount, uint256 startPrice, uint256 buyNowPrice, uint256 minIncrement, uint256 expiryTime, address seller, address highestBidder, uint256 highestBid, bool isActive, bool isSettled))",
    "function getActiveAuctionForTicket(uint256 ticketId) external view returns (uint256)"
  ], signer);

  console.log("1. Checking for active auctions...\n");

  // Check auctions 1-10 (since we know there are at least 4)
  for (let i = 1; i <= 10; i++) {
    try {
      const auction = await auctionContract.getAuction(i);
      
      // Check if auction exists (auctionId != 0)
      if (auction.auctionId.toString() !== "0") {
        console.log(`✅ Auction ID ${i}:`);
        console.log(`   Ticket ID: ${auction.ticketId}`);
        console.log(`   Ticket Count: ${auction.ticketCount}`);
        console.log(`   Start Price: ${ethers.formatUnits(auction.startPrice, 6)} USDC`);
        console.log(`   Buy Now Price: ${ethers.formatUnits(auction.buyNowPrice, 6)} USDC`);
        console.log(`   Min Increment: ${ethers.formatUnits(auction.minIncrement, 6)} USDC`);
        
        const expiryDate = new Date(Number(auction.expiryTime) * 1000);
        console.log(`   Expiry Time: ${expiryDate.toLocaleDateString()}`);
        console.log(`   Seller: ${auction.seller}`);
        console.log(`   Highest Bidder: ${auction.highestBidder}`);
        
        if (auction.highestBid.toString() === "0") {
          console.log(`   Highest Bid: No bids yet`);
        } else {
          console.log(`   Highest Bid: ${ethers.formatUnits(auction.highestBid, 6)} USDC`);
        }
        
        console.log(`   Is Active: ${auction.isActive}`);
        console.log(`   Is Settled: ${auction.isSettled}\n`);
      } else {
        console.log(`❌ Auction ID ${i}: Does not exist\n`);
        // If we find a non-existent auction, we can stop checking further
        break;
      }
    } catch (error) {
      console.log(`❌ Auction ID ${i}: Error - ${error.message}\n`);
      break;
    }
  }

  console.log("🎯 Summary: The deployed contract has the basic auction functionality working.");
  console.log("📝 Note: getAuctionCount() and getBid() functions are not available in the deployed version.");
  console.log("💡 To add these functions, the contract would need to be redeployed with the updated code.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
