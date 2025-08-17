const { ethers } = require("hardhat");

async function main() {
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Creating auction with account:", deployer.address);

  // Get the TicketAuction contract
  const TicketAuction = await ethers.getContractFactory("TicketAuction");
  
  // Use the newly deployed contract address on Base Sepolia
  const auctionAddress = "0x6E1A041298615362580065019E6Eab566dBC66a0";
  const auction = TicketAuction.attach(auctionAddress);

  // Auction parameters
  const ticketId = 1; // The token ID we just created
  const ticketCount = 1; // Number of tickets to auction
  const startPrice = ethers.parseUnits("50", 6); // 50 USDC starting price
  const buyNowPrice = ethers.parseUnits("200", 6); // 200 USDC buy now price
  const minIncrement = ethers.parseUnits("5", 6); // 5 USDC minimum bid increment
  const expiryTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now

  console.log("Creating auction...");
  console.log("Ticket ID:", ticketId);
  console.log("Ticket Count:", ticketCount);
  console.log("Start Price:", ethers.formatUnits(startPrice, 6), "USDC");
  console.log("Buy Now Price:", ethers.formatUnits(buyNowPrice, 6), "USDC");
  console.log("Min Increment:", ethers.formatUnits(minIncrement, 6), "USDC");
  console.log("Expiry Time:", new Date(expiryTime * 1000).toLocaleDateString());

  // First, approve the auction contract to transfer tickets
  const TicketToken = await ethers.getContractFactory("TicketToken");
  const ticketTokenAddress = await auction.ticketToken();
  const ticketToken = TicketToken.attach(ticketTokenAddress);

  console.log("Approving ticket transfer...");
  const approveTx = await ticketToken.setApprovalForAll(auctionAddress, true);
  await approveTx.wait();
  console.log("Approval successful!");

  // Create the auction
  const tx = await auction.createAuction(
    ticketId,
    ticketCount,
    startPrice,
    buyNowPrice,
    minIncrement,
    expiryTime
  );

  console.log("Transaction hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Auction created successfully!");

  // Get the auction ID from the event
  const event = receipt.logs.find(log => {
    try {
      return auction.interface.parseLog(log);
    } catch {
      return false;
    }
  });

  if (event) {
    const parsedEvent = auction.interface.parseLog(event);
    const auctionId = parsedEvent.args.auctionId;
    console.log("Auction ID created:", auctionId.toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
