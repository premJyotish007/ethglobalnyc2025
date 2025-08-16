// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./token.sol";

contract TicketMarketplace is Ownable, ReentrancyGuard {
    // Reference to the ticket token contract
    TicketToken public immutable ticketToken;
    
    // USDC token address (Base Sepolia USDC)
    IERC20 public immutable usdcToken;
    
    // Marketplace fee percentage (0.5% = 50 basis points)
    uint256 public constant MARKETPLACE_FEE_BPS = 50;
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // Ticket listing structure
    struct TicketListing {
        address seller;
        uint256 price; // Price in USDC (6 decimals)
        uint256 amount; // Number of tickets being sold
        bool isActive;
        uint256 createdAt;
    }
    
    // Mapping from token ID to listing
    mapping(uint256 => TicketListing) public listings;
    
    // Events
    event TicketListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 amount
    );
    
    event TicketSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 amount
    );
    
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    
    event ListingUpdated(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 newPrice
    );
    
    constructor(
        address _ticketToken,
        address _usdcToken,
        address initialOwner
    ) Ownable(initialOwner) {
        ticketToken = TicketToken(_ticketToken);
        usdcToken = IERC20(_usdcToken);
    }
    
    /**
     * @dev List a ticket for sale
     * @param tokenId The token ID to list
     * @param price Price in USDC (6 decimals)
     * @param amount Number of tickets to sell
     */
    function listTicket(
        uint256 tokenId,
        uint256 price,
        uint256 amount
    ) external {
        require(price > 0, "Price must be greater than 0");
        require(amount > 0, "Amount must be greater than 0");
        require(
            ticketToken.balanceOf(msg.sender, tokenId) >= amount,
            "Insufficient ticket balance"
        );
        
        // Check if ticket is valid for transfer
        (TicketToken.TicketInfo memory ticketInfo, bool isUsed) = ticketToken.getTicketInfo(tokenId);
        require(ticketInfo.isActive, "Ticket is not active");
        require(!isUsed, "Ticket has already been used");
        require(
            block.timestamp <= ticketInfo.eventDate + 1 days,
            "Event has ended"
        );
        
        // Create or update listing
        listings[tokenId] = TicketListing({
            seller: msg.sender,
            price: price,
            amount: amount,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit TicketListed(tokenId, msg.sender, price, amount);
    }
    
    /**
     * @dev Buy a listed ticket
     * @param tokenId The token ID to buy
     * @param amount Number of tickets to buy
     */
    function buyTicket(
        uint256 tokenId,
        uint256 amount
    ) external nonReentrant {
        TicketListing storage listing = listings[tokenId];
        require(listing.isActive, "Listing is not active");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= listing.amount, "Insufficient tickets available");
        require(msg.sender != listing.seller, "Cannot buy your own ticket");
        
        uint256 totalCost = listing.price * amount;
        
        // Check if buyer has enough USDC
        require(
            usdcToken.balanceOf(msg.sender) >= totalCost,
            "Insufficient USDC balance"
        );
        
        // Check if buyer has approved enough USDC
        require(
            usdcToken.allowance(msg.sender, address(this)) >= totalCost,
            "Insufficient USDC allowance"
        );
        
        // Calculate marketplace fee
        uint256 marketplaceFee = (totalCost * MARKETPLACE_FEE_BPS) / BPS_DENOMINATOR;
        uint256 sellerAmount = totalCost - marketplaceFee;
        
        // Transfer USDC from buyer to seller and marketplace
        usdcToken.transferFrom(msg.sender, listing.seller, sellerAmount);
        usdcToken.transferFrom(msg.sender, owner(), marketplaceFee);
        
        // Transfer tickets from seller to buyer
        ticketToken.safeTransferFrom(
            listing.seller,
            msg.sender,
            tokenId,
            amount,
            ""
        );
        
        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.isActive = false;
        }
        
        emit TicketSold(tokenId, listing.seller, msg.sender, listing.price, amount);
    }
    
    /**
     * @dev Cancel a listing
     * @param tokenId The token ID to cancel
     */
    function cancelListing(uint256 tokenId) external {
        TicketListing storage listing = listings[tokenId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing is not active");
        
        listing.isActive = false;
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Update listing price
     * @param tokenId The token ID to update
     * @param newPrice New price in USDC
     */
    function updateListingPrice(uint256 tokenId, uint256 newPrice) external {
        require(newPrice > 0, "Price must be greater than 0");
        
        TicketListing storage listing = listings[tokenId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing is not active");
        
        listing.price = newPrice;
        
        emit ListingUpdated(tokenId, msg.sender, newPrice);
    }
    
    /**
     * @dev Get listing information
     * @param tokenId The token ID
     * @return listing The listing information
     */
    function getListing(uint256 tokenId) external view returns (TicketListing memory) {
        return listings[tokenId];
    }
    
    /**
     * @dev Check if a ticket is listed
     * @param tokenId The token ID
     * @return True if listed, false otherwise
     */
    function isTicketListed(uint256 tokenId) external view returns (bool) {
        return listings[tokenId].isActive;
    }
    
    /**
     * @dev Withdraw marketplace fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        
        usdcToken.transfer(owner(), balance);
    }
    
    /**
     * @dev Emergency function to pause marketplace (owner only)
     */
    function pauseMarketplace() external onlyOwner {
        // This would require implementing Pausable from OpenZeppelin
        // For now, we'll just emit an event
        emit ListingCancelled(0, address(0)); // Special event for pause
    }
}

