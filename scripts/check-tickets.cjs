const { ethers } = require("hardhat");

async function main() {
  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Checking tickets for account:", deployer.address);

  // Get the TicketToken contract
  const TicketToken = await ethers.getContractFactory("TicketToken");
  const ticketTokenAddress = "0x4D4503B3aaf33d3dFc0388B26e14972ac62140ad";
  const ticketToken = TicketToken.attach(ticketTokenAddress);

  console.log("Checking for existing tickets...");
  
  // Check specific token IDs that we know should exist
  const tokenIdsToCheck = [0, 1, 2, 3, 4, 5]; // Check first few token IDs
  
  for (let i = 0; i < tokenIdsToCheck.length; i++) {
    try {
      const balance = await ticketToken.balanceOf(deployer.address, i);
      if (balance > 0) {
        console.log(`\n✅ Token ID ${i} - Balance: ${balance.toString()}`);
        
        // Try to get ticket info
        try {
          const ticketInfo = await ticketToken.ticketInfo(i);
          console.log("   Event:", ticketInfo.eventName);
          console.log("   Section:", ticketInfo.section);
          console.log("   Row:", ticketInfo.row);
          console.log("   Seat:", ticketInfo.seat);
          console.log("   Event Date:", new Date(Number(ticketInfo.eventDate) * 1000).toLocaleDateString());
          console.log("   Price:", ethers.formatUnits(ticketInfo.price, 6), "USDC");
          console.log("   Active:", ticketInfo.isActive);
        } catch (error) {
          console.log("   Could not get ticket info for token ID", i);
        }
      } else {
        console.log(`❌ Token ID ${i} - No balance`);
      }
    } catch (error) {
      console.log(`❌ Token ID ${i} - Error or doesn't exist`);
    }
  }
  
  console.log("\n--- End of ticket check ---");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
