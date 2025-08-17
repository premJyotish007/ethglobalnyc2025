const { ethers } = require("hardhat");

async function main() {
  console.log("Verifying deployed contracts on Base Sepolia...");
  
  // Contract addresses from deployment
  const mockUSDCAddress = "0x01d180E448AC87CeE5dcB2C961ceB227393a94E3";
  const ticketTokenAddress = "0x4D4503B3aaf33d3dFc0388B26e14972ac62140ad";
  const auctionAddress = "0x4f0ebF8e705ec90D29928E85CFc1666d3595768a";
  
  try {
    // Get provider for Base Sepolia
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    
    // Check if contracts exist by getting their code
    console.log("\n1. Checking MockUSDC contract...");
    const mockUSDCCode = await provider.getCode(mockUSDCAddress);
    if (mockUSDCCode === "0x") {
      console.log("❌ MockUSDC contract not found at:", mockUSDCAddress);
    } else {
      console.log("✅ MockUSDC contract found at:", mockUSDCAddress);
      console.log("   Code length:", mockUSDCCode.length, "bytes");
    }
    
    console.log("\n2. Checking TicketToken contract...");
    const ticketTokenCode = await provider.getCode(ticketTokenAddress);
    if (ticketTokenCode === "0x") {
      console.log("❌ TicketToken contract not found at:", ticketTokenAddress);
    } else {
      console.log("✅ TicketToken contract found at:", ticketTokenAddress);
      console.log("   Code length:", ticketTokenCode.length, "bytes");
    }
    
    console.log("\n3. Checking TicketAuction contract...");
    const auctionCode = await provider.getCode(auctionAddress);
    if (auctionCode === "0x") {
      console.log("❌ TicketAuction contract not found at:", auctionAddress);
    } else {
      console.log("✅ TicketAuction contract found at:", auctionAddress);
      console.log("   Code length:", auctionCode.length, "bytes");
    }
    
    // Try to interact with the auction contract
    if (auctionCode !== "0x") {
      console.log("\n4. Testing auction contract interaction...");
      try {
        // Basic ABI for testing
        const basicABI = [
          "function usdcToken() view returns (address)",
          "function ticketToken() view returns (address)",
          "function coordinator() view returns (address)"
        ];
        
        const auctionContract = new ethers.Contract(auctionAddress, basicABI, provider);
        
        const usdcToken = await auctionContract.usdcToken();
        const ticketToken = await auctionContract.ticketToken();
        const coordinator = await auctionContract.coordinator();
        
        console.log("✅ Auction contract is responsive:");
        console.log("   USDC Token:", usdcToken);
        console.log("   Ticket Token:", ticketToken);
        console.log("   Coordinator:", coordinator);
        
        // Verify these addresses match our deployment
        console.log("\n5. Verifying contract relationships...");
        if (usdcToken.toLowerCase() === mockUSDCAddress.toLowerCase()) {
          console.log("✅ USDC address matches deployment");
        } else {
          console.log("❌ USDC address mismatch. Expected:", mockUSDCAddress, "Got:", usdcToken);
        }
        
        if (ticketToken.toLowerCase() === ticketTokenAddress.toLowerCase()) {
          console.log("✅ Ticket token address matches deployment");
        } else {
          console.log("❌ Ticket token address mismatch. Expected:", ticketTokenAddress, "Got:", ticketToken);
        }
        
      } catch (error) {
        console.log("❌ Error interacting with auction contract:", error.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Error verifying contracts:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
