const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verifying deployed contracts on Base Sepolia...");

  // Get provider for Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");

  // Contract addresses from deployment
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Real USDC
  const ticketTokenAddress = "0x4D4503B3aaf33d3dFc0388B26e14972ac62140ad";
  const ticketAuctionAddress = "0x4f0ebF8e705ec90D29928E85CFc1666d3595768a";

  console.log("\n1. Checking USDC contract...");
  const usdcCode = await provider.getCode(usdcAddress);
  if (usdcCode === "0x") {
    console.log("❌ USDC contract not found at:", usdcAddress);
  } else {
    console.log("✅ USDC contract found at:", usdcAddress);
    console.log("   Code length:", usdcCode.length, "bytes");
    
    // Check if it's a real USDC contract by calling decimals()
    try {
      const usdcABI = ["function decimals() view returns (uint8)"];
      const usdcContract = new ethers.Contract(usdcAddress, usdcABI, provider);
      const decimals = await usdcContract.decimals();
      console.log("   Decimals:", decimals);
      if (decimals === 6) {
        console.log("   ✅ Confirmed: This is a real USDC contract (6 decimals)");
      } else {
        console.log("   ⚠️  Warning: Unexpected decimals for USDC");
      }
    } catch (error) {
      console.log("   ❌ Could not verify USDC decimals:", error.message);
    }
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
  const ticketAuctionCode = await provider.getCode(ticketAuctionAddress);
  if (ticketAuctionCode === "0x") {
    console.log("❌ TicketAuction contract not found at:", ticketAuctionAddress);
  } else {
    console.log("✅ TicketAuction contract found at:", ticketAuctionAddress);
    console.log("   Code length:", ticketAuctionCode.length, "bytes");
    
    // Verify the USDC address in the auction contract
    try {
      const auctionABI = ["function usdcToken() view returns (address)"];
      const auctionContract = new ethers.Contract(ticketAuctionAddress, auctionABI, provider);
      const usdcToken = await auctionContract.usdcToken();
      console.log("   USDC token address in auction:", usdcToken);
      
      if (usdcToken.toLowerCase() === usdcAddress.toLowerCase()) {
        console.log("   ✅ USDC address matches expected address");
      } else {
        console.log("   ❌ USDC address mismatch. Expected:", usdcAddress, "Got:", usdcToken);
      }
    } catch (error) {
      console.log("   ❌ Could not verify USDC address in auction contract:", error.message);
    }
  }

  console.log("\n4. Checking contract interactions...");
  
  // Check if auction contract can receive ERC1155 tokens
  try {
    const erc1155ABI = ["function supportsInterface(bytes4) view returns (bool)"];
    const auctionContract = new ethers.Contract(ticketAuctionAddress, erc1155ABI, provider);
    
    // IERC1155Receiver interface ID
    const interfaceId = "0x4e2312e0";
    const supportsERC1155 = await auctionContract.supportsInterface(interfaceId);
    
    if (supportsERC1155) {
      console.log("✅ Auction contract supports ERC1155 receiver interface");
    } else {
      console.log("❌ Auction contract does not support ERC1155 receiver interface");
    }
  } catch (error) {
    console.log("❌ Could not verify ERC1155 support:", error.message);
  }

  console.log("\n=== Verification Summary ===");
  console.log("Network: Base Sepolia");
  console.log("USDC:", usdcAddress);
  console.log("TicketToken:", ticketTokenAddress);
  console.log("TicketAuction:", ticketAuctionAddress);
  
  console.log("\n🔗 Base Sepolia Explorer Links:");
  console.log("USDC:", `https://sepolia.basescan.org/address/${usdcAddress}`);
  console.log("TicketToken:", `https://sepolia.basescan.org/address/${ticketTokenAddress}`);
  console.log("TicketAuction:", `https://sepolia.basescan.org/address/${ticketAuctionAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
