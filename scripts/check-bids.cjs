const { ethers } = require("hardhat");

async function main() {
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Checking bids for account:", deployer.address);

  // Get provider for Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  
  // Auction contract address and ABI
  const auctionContractAddress = "0x6E1A041298615362580065019E6Eab566dBC66a0";
  const auctionABI = [
    "function getAuction(uint256 auctionId) view returns (tuple(uint256 auctionId, uint256 ticketId, uint256 ticketCount, uint256 startPrice, uint256 buyNowPrice, uint256 minIncrement, uint256 expiryTime, address seller, address highestBidder, uint256 highestBid, bool isActive, bool isSettled) auction)",
    "function getBid(uint256 auctionId, address bidder) view returns (uint256)"
  ];
  
  const auctionContract = new ethers.Contract(auctionContractAddress, auctionABI, provider);
  
  // Check bids for the first 4 auctions (we know these exist)
  for (let i = 1; i <= 4; i++) {
    try {
      console.log(`\n--- Auction ${i} ---`);
      
      const auction = await auctionContract.getAuction(i);
      
      if (auction && auction.auctionId.toString() !== "0") {
        console.log(`Ticket ID: ${auction.ticketId}`);
        console.log(`Start Price: ${ethers.formatUnits(auction.startPrice, 6)} USDC`);
        console.log(`Buy Now Price: ${ethers.formatUnits(auction.buyNowPrice, 6)} USDC`);
        console.log(`Min Increment: ${ethers.formatUnits(auction.minIncrement, 6)} USDC`);
        console.log(`Seller: ${auction.seller}`);
        console.log(`Highest Bidder: ${auction.highestBidder}`);
        console.log(`Highest Bid: ${ethers.formatUnits(auction.highestBid, 6)} USDC`);
        console.log(`Is Active: ${auction.isActive}`);
        console.log(`Is Settled: ${auction.isSettled}`);
        
        // Check if you have a bid on this auction
        try {
          const yourBid = await auctionContract.getBid(i, deployer.address);
          if (yourBid.toString() !== "0") {
            console.log(`🎯 Your Bid: ${ethers.formatUnits(yourBid, 6)} USDC`);
          } else {
            console.log(`❌ No bid from you`);
          }
        } catch (error) {
          console.log(`Could not check your bid: ${error.message}`);
        }
        
      } else {
        console.log(`Auction ${i} does not exist`);
      }
      
    } catch (error) {
      console.log(`Error checking auction ${i}: ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
