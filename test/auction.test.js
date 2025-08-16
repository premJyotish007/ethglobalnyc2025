import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("TicketAuction", function () {
  let ticketToken;
  let auctionContract;
  let usdcToken;
  let owner;
  let seller;
  let bidder1;
  let bidder2;
  let coordinator;

  // Test parameters
  const ticketId = 1;
  const ticketCount = 2;
  const startPrice = ethers.parseUnits("10", 6); // 10 USDC
  const buyNowPrice = ethers.parseUnits("50", 6); // 50 USDC
  const minIncrement = ethers.parseUnits("1", 6); // 1 USDC
  let expiryTime; // Will be set in beforeEach

  beforeEach(async function () {
    // Get signers
    [owner, seller, bidder1, bidder2, coordinator] = await ethers.getSigners();

    // Set expiry time to 1 hour from now
    expiryTime = Math.floor(Date.now() / 1000) + 3600;

    console.log("\n=== Test Setup ===");
    console.log("Owner:", owner.address);
    console.log("Seller:", seller.address);
    console.log("Bidder1:", bidder1.address);
    console.log("Bidder2:", bidder2.address);
    console.log("Coordinator:", coordinator.address);

    // Deploy mock USDC token
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdcToken = await MockUSDC.deploy();
    await usdcToken.waitForDeployment();

    // Deploy TicketToken
    const TicketToken = await ethers.getContractFactory("TicketToken");
    ticketToken = await TicketToken.deploy("https://api.example.com/tickets/", owner.address);
    await ticketToken.waitForDeployment();

    // Deploy Auction contract
    const TicketAuction = await ethers.getContractFactory("TicketAuction");
    auctionContract = await TicketAuction.deploy(
      await usdcToken.getAddress(),
      await ticketToken.getAddress(),
      coordinator.address,
      owner.address
    );
    await auctionContract.waitForDeployment();

    console.log("Mock USDC deployed to:", await usdcToken.getAddress());
    console.log("TicketToken deployed to:", await ticketToken.getAddress());
    console.log("Auction contract deployed to:", await auctionContract.getAddress());

    // Setup: Create tickets for seller
    await ticketToken.connect(owner).createTickets(
      seller.address,
      ticketCount,
      "Test Event",
      "Section A",
      "Row 1",
      "Seats 1-2",
      expiryTime + 86400, // Event tomorrow
      ethers.parseUnits("20", 6) // 20 USDC per ticket
    );

    // Setup: Mint USDC for bidders
    await usdcToken.mint(bidder1.address, ethers.parseUnits("1000", 6));
    await usdcToken.mint(bidder2.address, ethers.parseUnits("1000", 6));

    // Setup: Approve auction contract to spend USDC
    await usdcToken.connect(bidder1).approve(await auctionContract.getAddress(), ethers.parseUnits("1000", 6));
    await usdcToken.connect(bidder2).approve(await auctionContract.getAddress(), ethers.parseUnits("1000", 6));

    console.log("Setup completed - tickets and USDC distributed");
  });

  describe("Auction Creation", function () {
    it("Should allow seller to create auction and transfer tickets to contract", async function () {
      console.log("\n=== Test: Auction Creation ===");
      
      const sellerBalanceBefore = await ticketToken.balanceOf(seller.address, ticketId);
      const contractBalanceBefore = await ticketToken.balanceOf(await auctionContract.getAddress(), ticketId);
      
      console.log("Seller balance before:", sellerBalanceBefore.toString());
      console.log("Contract balance before:", contractBalanceBefore.toString());

      // Parameters for createAuction
      console.log("\n📋 createAuction Parameters:");
      console.log("- ticketId:", ticketId);
      console.log("- ticketCount:", ticketCount);
      console.log("- startPrice:", ethers.formatUnits(startPrice, 6), "USDC");
      console.log("- buyNowPrice:", ethers.formatUnits(buyNowPrice, 6), "USDC");
      console.log("- minIncrement:", ethers.formatUnits(minIncrement, 6), "USDC");
      console.log("- expiryTime:", new Date(expiryTime * 1000).toISOString());

      // Approve auction contract to transfer tickets
      await ticketToken.connect(seller).setApprovalForAll(await auctionContract.getAddress(), true);

      // Create auction
      const tx = await auctionContract.connect(seller).createAuction(
        ticketId,
        ticketCount,
        startPrice,
        buyNowPrice,
        minIncrement,
        expiryTime
      );

      const receipt = await tx.wait();
      const auctionCreatedEvent = receipt.logs.find(log => 
        log.fragment && log.fragment.name === 'AuctionCreated'
      );

      const auctionId = auctionCreatedEvent.args.auctionId;
      console.log("✅ Auction created with ID:", auctionId.toString());

      // Check balances after auction creation
      const sellerBalanceAfter = await ticketToken.balanceOf(seller.address, ticketId);
      const contractBalanceAfter = await ticketToken.balanceOf(await auctionContract.getAddress(), ticketId);

      console.log("Seller balance after:", sellerBalanceAfter.toString());
      console.log("Contract balance after:", contractBalanceAfter.toString());

      // Verify tickets were transferred
      expect(sellerBalanceAfter).to.equal(sellerBalanceBefore - BigInt(ticketCount));
      expect(contractBalanceAfter).to.equal(contractBalanceBefore + BigInt(ticketCount));

      // Verify auction details
      const auction = await auctionContract.getAuction(auctionId);
      console.log("\n📋 Auction Details:");
      console.log("- auctionId:", auction.auctionId.toString());
      console.log("- ticketId:", auction.ticketId.toString());
      console.log("- ticketCount:", auction.ticketCount.toString());
      console.log("- startPrice:", ethers.formatUnits(auction.startPrice, 6), "USDC");
      console.log("- buyNowPrice:", ethers.formatUnits(auction.buyNowPrice, 6), "USDC");
      console.log("- seller:", auction.seller);
      console.log("- isActive:", auction.isActive);

      expect(auction.ticketId).to.equal(BigInt(ticketId));
      expect(auction.ticketCount).to.equal(BigInt(ticketCount));
      expect(auction.startPrice).to.equal(startPrice);
      expect(auction.buyNowPrice).to.equal(buyNowPrice);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.isActive).to.be.true;
    });
  });

  describe("Bidding", function () {
    let auctionId;

    beforeEach(async function () {
      // Create auction for bidding tests
      await ticketToken.connect(seller).setApprovalForAll(await auctionContract.getAddress(), true);
      const tx = await auctionContract.connect(seller).createAuction(
        ticketId,
        ticketCount,
        startPrice,
        buyNowPrice,
        minIncrement,
        expiryTime
      );
      const receipt = await tx.wait();
      const auctionCreatedEvent = receipt.logs.find(log => 
        log.fragment && log.fragment.name === 'AuctionCreated'
      );
      auctionId = auctionCreatedEvent.args.auctionId;
    });

    it("Should allow bidding and refund previous bids", async function () {
      console.log("\n=== Test: Bidding and Refunding ===");
      console.log("Auction ID:", auctionId.toString());

      const bidder1BalanceBefore = await usdcToken.balanceOf(bidder1.address);
      const bidder2BalanceBefore = await usdcToken.balanceOf(bidder2.address);
      const contractBalanceBefore = await usdcToken.balanceOf(await auctionContract.getAddress());

      console.log("Bidder1 balance before:", ethers.formatUnits(bidder1BalanceBefore, 6), "USDC");
      console.log("Bidder2 balance before:", ethers.formatUnits(bidder2BalanceBefore, 6), "USDC");
      console.log("Contract balance before:", ethers.formatUnits(contractBalanceBefore, 6), "USDC");

      // First bid
      const firstBid = startPrice;
      console.log("\n📋 First Bid Parameters:");
      console.log("- auctionId:", auctionId.toString());
      console.log("- bidPrice:", ethers.formatUnits(firstBid, 6), "USDC");

      await auctionContract.connect(bidder1).bid(auctionId, firstBid);

      // Check auction state after first bid
      let auction = await auctionContract.getAuction(auctionId);
      console.log("✅ First bid placed:");
      console.log("- highestBidder:", auction.highestBidder);
      console.log("- highestBid:", ethers.formatUnits(auction.highestBid, 6), "USDC");

      expect(auction.highestBidder).to.equal(bidder1.address);
      expect(auction.highestBid).to.equal(firstBid);

      // Second bid (higher)
      const secondBid = startPrice + minIncrement;
      console.log("\n📋 Second Bid Parameters:");
      console.log("- auctionId:", auctionId.toString());
      console.log("- bidPrice:", ethers.formatUnits(secondBid, 6), "USDC");

      await auctionContract.connect(bidder2).bid(auctionId, secondBid);

      // Check balances after second bid
      const bidder1BalanceAfter = await usdcToken.balanceOf(bidder1.address);
      const bidder2BalanceAfter = await usdcToken.balanceOf(bidder2.address);
      const contractBalanceAfter = await usdcToken.balanceOf(await auctionContract.getAddress());

      console.log("Bidder1 balance after:", ethers.formatUnits(bidder1BalanceAfter, 6), "USDC");
      console.log("Bidder2 balance after:", ethers.formatUnits(bidder2BalanceAfter, 6), "USDC");
      console.log("Contract balance after:", ethers.formatUnits(contractBalanceAfter, 6), "USDC");

      // Verify bidder1 was refunded
      expect(bidder1BalanceAfter).to.equal(bidder1BalanceBefore);
      console.log("✅ Bidder1 was refunded their first bid");

      // Verify bidder2's bid was accepted
      expect(bidder2BalanceAfter).to.equal(bidder2BalanceBefore - secondBid);
      console.log("✅ Bidder2's bid was accepted");

      // Check final auction state
      auction = await auctionContract.getAuction(auctionId);
      console.log("✅ Final auction state:");
      console.log("- highestBidder:", auction.highestBidder);
      console.log("- highestBid:", ethers.formatUnits(auction.highestBid, 6), "USDC");

      expect(auction.highestBidder).to.equal(bidder2.address);
      expect(auction.highestBid).to.equal(secondBid);
    });
  });

  describe("Auction Settlement", function () {
    let auctionId;

    beforeEach(async function () {
      // Create auction and place a bid
      await ticketToken.connect(seller).setApprovalForAll(await auctionContract.getAddress(), true);
      const tx = await auctionContract.connect(seller).createAuction(
        ticketId,
        ticketCount,
        startPrice,
        buyNowPrice,
        minIncrement,
        expiryTime
      );
      const receipt = await tx.wait();
      const auctionCreatedEvent = receipt.logs.find(log => 
        log.fragment && log.fragment.name === 'AuctionCreated'
      );
      auctionId = auctionCreatedEvent.args.auctionId;

      // Place a bid
      await auctionContract.connect(bidder1).bid(auctionId, startPrice);
    });

    it("Should transfer tickets to winner and USDC to seller when settled", async function () {
      console.log("\n=== Test: Auction Settlement ===");
      console.log("Auction ID:", auctionId.toString());

      // Fast forward time to make auction expired
      await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
      await ethers.provider.send("evm_mine");

      const winnerBalanceBefore = await ticketToken.balanceOf(bidder1.address, ticketId);
      const sellerBalanceBefore = await usdcToken.balanceOf(seller.address);
      const contractBalanceBefore = await usdcToken.balanceOf(await auctionContract.getAddress());

      console.log("Winner balance before:", winnerBalanceBefore.toString());
      console.log("Seller USDC balance before:", ethers.formatUnits(sellerBalanceBefore, 6), "USDC");
      console.log("Contract USDC balance before:", ethers.formatUnits(contractBalanceBefore, 6), "USDC");

      // Parameters for settle
      console.log("\n📋 settle Parameters:");
      console.log("- auctionId:", auctionId.toString());

      // Settle auction
      await auctionContract.connect(coordinator).settle(auctionId);

      // Check balances after settlement
      const winnerBalanceAfter = await ticketToken.balanceOf(bidder1.address, ticketId);
      const sellerBalanceAfter = await usdcToken.balanceOf(seller.address);
      const contractBalanceAfter = await usdcToken.balanceOf(await auctionContract.getAddress());

      console.log("Winner balance after:", winnerBalanceAfter.toString());
      console.log("Seller USDC balance after:", ethers.formatUnits(sellerBalanceAfter, 6), "USDC");
      console.log("Contract USDC balance after:", ethers.formatUnits(contractBalanceAfter, 6), "USDC");

      // Verify tickets transferred to winner
      expect(winnerBalanceAfter).to.equal(winnerBalanceBefore + BigInt(ticketCount));
      console.log("✅ Tickets transferred to winner");

      // Verify USDC transferred to seller
      expect(sellerBalanceAfter).to.equal(sellerBalanceBefore + startPrice);
      console.log("✅ USDC transferred to seller");

      // Verify auction is no longer active
      const auction = await auctionContract.getAuction(auctionId);
      console.log("✅ Auction state after settlement:");
      console.log("- isActive:", auction.isActive);
      console.log("- isSettled:", auction.isSettled);

      expect(auction.isActive).to.be.false;
      expect(auction.isSettled).to.be.true;
    });
  });

  describe("Seller Refund", function () {
    let auctionId;

    beforeEach(async function () {
      // Create auction without any bids
      await ticketToken.connect(seller).setApprovalForAll(await auctionContract.getAddress(), true);
      
      // Set expiry time to 2 hours from now for this test
      const testExpiryTime = Math.floor(Date.now() / 1000) + 7200;
      
      const tx = await auctionContract.connect(seller).createAuction(
        ticketId,
        ticketCount,
        startPrice,
        buyNowPrice,
        minIncrement,
        testExpiryTime
      );
      const receipt = await tx.wait();
      const auctionCreatedEvent = receipt.logs.find(log => 
        log.fragment && log.fragment.name === 'AuctionCreated'
      );
      auctionId = auctionCreatedEvent.args.auctionId;
    });

    it("Should return tickets to seller when refund is called", async function () {
      console.log("\n=== Test: Seller Refund ===");
      console.log("Auction ID:", auctionId.toString());

      const sellerBalanceBefore = await ticketToken.balanceOf(seller.address, ticketId);
      const contractBalanceBefore = await ticketToken.balanceOf(await auctionContract.getAddress(), ticketId);

      console.log("Seller balance before:", sellerBalanceBefore.toString());
      console.log("Contract balance before:", contractBalanceBefore.toString());

      // Parameters for refund
      console.log("\n📋 refund Parameters:");
      console.log("- ticketId:", ticketId);

      // Call refund
      await auctionContract.connect(seller).refund(ticketId);

      // Check balances after refund
      const sellerBalanceAfter = await ticketToken.balanceOf(seller.address, ticketId);
      const contractBalanceAfter = await ticketToken.balanceOf(await auctionContract.getAddress(), ticketId);

      console.log("Seller balance after:", sellerBalanceAfter.toString());
      console.log("Contract balance after:", contractBalanceAfter.toString());

      // Verify tickets returned to seller
      expect(sellerBalanceAfter).to.equal(sellerBalanceBefore + BigInt(ticketCount));
      console.log("✅ Tickets returned to seller");

      // Verify auction is no longer active
      const auction = await auctionContract.getAuction(auctionId);
      console.log("✅ Auction state after refund:");
      console.log("- isActive:", auction.isActive);
      console.log("- isSettled:", auction.isSettled);

      expect(auction.isActive).to.be.false;
      expect(auction.isSettled).to.be.true;
    });
  });


});

// Mock USDC contract for testing
describe("MockUSDC", function () {
  it("Should deploy successfully", async function () {
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    
    expect(await mockUSDC.getAddress()).to.be.a('string');
  });
});
