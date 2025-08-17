// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./token.sol";

contract TicketAuction is Ownable, ReentrancyGuard, IERC1155Receiver {
    // USDC token interface
    IERC20 public immutable usdcToken;
    
    // TicketToken interface
    TicketToken public immutable ticketToken;
    
    // Coordinator address for settling auctions
    address public coordinator;
    
    // Auction counter
    uint256 private _auctionCounter;
    
    // Auction struct
    struct Auction {
        uint256 auctionId;
        uint256 ticketId;
        uint256 ticketCount;
        uint256 startPrice;
        uint256 buyNowPrice;
        uint256 minIncrement;
        uint256 expiryTime;
        address seller;
        address highestBidder;
        uint256 highestBid;
        bool isActive;
        bool isSettled;
    }
    
    // Mapping from auction ID to auction details
    mapping(uint256 => Auction) public auctions;
    
    // Mapping from ticket ID to active auction ID
    mapping(uint256 => uint256) public ticketToAuction;
    

    
    // Events
    event AuctionCreated(
        uint256 indexed auctionId,
        uint256 indexed ticketId,
        uint256 ticketCount,
        uint256 startPrice,
        uint256 buyNowPrice,
        uint256 minIncrement,
        uint256 expiryTime,
        address indexed seller
    );
    
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 bidAmount
    );
    
    event BuyNowExecuted(
        uint256 indexed auctionId,
        address indexed buyer,
        uint256 buyNowPrice
    );
    
    event AuctionSettled(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid
    );
    
    event AuctionRefunded(
        uint256 indexed auctionId,
        address indexed seller
    );
    
    event CoordinatorUpdated(address indexed oldCoordinator, address indexed newCoordinator);
    
    // Modifiers
    modifier onlyCoordinator() {
        require(msg.sender == coordinator, "Only coordinator can call this function");
        _;
    }
    
    modifier auctionExists(uint256 auctionId) {
        require(auctions[auctionId].auctionId != 0, "Auction does not exist");
        _;
    }
    
    modifier auctionActive(uint256 auctionId) {
        require(auctions[auctionId].isActive, "Auction is not active");
        _;
    }
    
    modifier auctionNotExpired(uint256 auctionId) {
        require(block.timestamp < auctions[auctionId].expiryTime, "Auction has expired");
        _;
    }
    
    modifier auctionExpired(uint256 auctionId) {
        require(block.timestamp >= auctions[auctionId].expiryTime, "Auction has not expired yet");
        _;
    }
    
    constructor(
        address _usdcToken,
        address _ticketToken,
        address _coordinator,
        address initialOwner
    ) Ownable(initialOwner) {
        usdcToken = IERC20(_usdcToken);
        ticketToken = TicketToken(_ticketToken);
        coordinator = _coordinator;
        _auctionCounter = 1;
    }
    
    /**
     * @dev Creates a new auction for tickets
     * @param ticketId The ID of the ticket to auction
     * @param ticketCount Number of tickets to auction
     * @param startPrice Starting price in USDC (with 6 decimals)
     * @param buyNowPrice Buy now price in USDC (with 6 decimals)
     * @param minIncrement Minimum bid increment in USDC (with 6 decimals)
     * @param expiryTime Auction expiry timestamp
     * @return auctionId The ID of the created auction
     */
    function createAuction(
        uint256 ticketId,
        uint256 ticketCount,
        uint256 startPrice,
        uint256 buyNowPrice,
        uint256 minIncrement,
        uint256 expiryTime
    ) external returns (uint256 auctionId) {
        require(ticketCount > 0, "Ticket count must be greater than 0");
        require(startPrice > 0, "Start price must be greater than 0");
        require(buyNowPrice >= startPrice, "Buy now price must be >= start price");
        require(minIncrement > 0, "Min increment must be greater than 0");
        require(expiryTime > block.timestamp, "Expiry time must be in the future");
        require(
            ticketToken.balanceOf(msg.sender, ticketId) >= ticketCount,
            "Insufficient ticket balance"
        );
        require(
            ticketToAuction[ticketId] == 0,
            "Ticket already has an active auction"
        );
        
        // Transfer tickets to auction contract
        ticketToken.safeTransferFrom(msg.sender, address(this), ticketId, ticketCount, "");
        
        auctionId = _auctionCounter++;
        
        auctions[auctionId] = Auction({
            auctionId: auctionId,
            ticketId: ticketId,
            ticketCount: ticketCount,
            startPrice: startPrice,
            buyNowPrice: buyNowPrice,
            minIncrement: minIncrement,
            expiryTime: expiryTime,
            seller: msg.sender,
            highestBidder: address(0),
            highestBid: 0,
            isActive: true,
            isSettled: false
        });
        
        ticketToAuction[ticketId] = auctionId;
        
        emit AuctionCreated(
            auctionId,
            ticketId,
            ticketCount,
            startPrice,
            buyNowPrice,
            minIncrement,
            expiryTime,
            msg.sender
        );
    }
    
    /**
     * @dev Places a bid on an auction
     * @param auctionId The ID of the auction to bid on
     * @param bidPrice The bid amount in USDC (with 6 decimals)
     */
    function bid(uint256 auctionId, uint256 bidPrice) 
        external 
        auctionExists(auctionId)
        auctionActive(auctionId)
        auctionNotExpired(auctionId)
        nonReentrant 
    {
        Auction storage auction = auctions[auctionId];
        
        require(bidPrice >= auction.startPrice, "Bid must be >= start price");
        require(
            bidPrice >= auction.highestBid + auction.minIncrement,
            "Bid must be >= highest bid + min increment"
        );
        require(msg.sender != auction.seller, "Seller cannot bid on their own auction");
        
        // Refund previous highest bidder if exists
        if (auction.highestBidder != address(0)) {
            uint256 previousBid = auction.highestBid;
            if (previousBid > 0) {
                usdcToken.transfer(auction.highestBidder, previousBid);
            }
        }
        
        // Transfer USDC from bidder
        require(
            usdcToken.transferFrom(msg.sender, address(this), bidPrice),
            "USDC transfer failed"
        );
        
        // Update auction state
        auction.highestBidder = msg.sender;
        auction.highestBid = bidPrice;
        
        emit BidPlaced(auctionId, msg.sender, bidPrice);
    }
    
    /**
     * @dev Executes buy now for an auction
     * @param auctionId The ID of the auction to buy now
     */
    function buyNow(uint256 auctionId) 
        external 
        auctionExists(auctionId)
        auctionActive(auctionId)
        auctionNotExpired(auctionId)
        nonReentrant 
    {
        Auction storage auction = auctions[auctionId];
        
        require(auction.buyNowPrice > 0, "Buy now not available");
        require(msg.sender != auction.seller, "Seller cannot buy their own auction");
        
        // Refund previous highest bidder if exists
        if (auction.highestBidder != address(0)) {
            uint256 previousBid = auction.highestBid;
            if (previousBid > 0) {
                usdcToken.transfer(auction.highestBidder, previousBid);
            }
        }
        
        // Transfer USDC from buyer
        require(
            usdcToken.transferFrom(msg.sender, address(this), auction.buyNowPrice),
            "USDC transfer failed"
        );
        
        // Transfer USDC to seller
        usdcToken.transfer(auction.seller, auction.buyNowPrice);
        
        // Transfer tickets to buyer
        ticketToken.safeTransferFrom(
            address(this),
            msg.sender,
            auction.ticketId,
            auction.ticketCount,
            ""
        );
        
        // Update auction state
        auction.isActive = false;
        auction.isSettled = true;
        auction.highestBidder = msg.sender;
        auction.highestBid = auction.buyNowPrice;
        
        // Clear ticket to auction mapping
        ticketToAuction[auction.ticketId] = 0;
        
        emit BuyNowExecuted(auctionId, msg.sender, auction.buyNowPrice);
    }
    
    /**
     * @dev Settles an expired auction (only coordinator can call)
     * @param auctionId The ID of the auction to settle
     */
    function settle(uint256 auctionId) 
        external 
        onlyCoordinator
        auctionExists(auctionId)
        auctionActive(auctionId)
        auctionExpired(auctionId)
        nonReentrant 
    {
        Auction storage auction = auctions[auctionId];
        
        auction.isActive = false;
        auction.isSettled = true;
        
        if (auction.highestBidder != address(0)) {
            // Transfer USDC to seller
            usdcToken.transfer(auction.seller, auction.highestBid);
            
            // Transfer tickets to highest bidder
            ticketToken.safeTransferFrom(
                address(this),
                auction.highestBidder,
                auction.ticketId,
                auction.ticketCount,
                ""
            );
            
            emit AuctionSettled(auctionId, auction.highestBidder, auction.highestBid);
        } else {
            // No bids, return tickets to seller
            ticketToken.safeTransferFrom(
                address(this),
                auction.seller,
                auction.ticketId,
                auction.ticketCount,
                ""
            );
            
            emit AuctionRefunded(auctionId, auction.seller);
        }
        
        // Clear ticket to auction mapping
        ticketToAuction[auction.ticketId] = 0;
    }
    
    /**
     * @dev Allows seller to refund their tickets (only if auction is active and not expired)
     * @param ticketId The ID of the ticket to refund
     */
    function refund(uint256 ticketId) 
        external 
        nonReentrant 
    {
        uint256 auctionId = ticketToAuction[ticketId];
        require(auctionId != 0, "No active auction for this ticket");
        
        Auction storage auction = auctions[auctionId];
        require(msg.sender == auction.seller, "Only seller can refund");
        require(auction.isActive, "Auction is not active");
        require(block.timestamp < auction.expiryTime, "Auction has expired");
        require(auction.highestBidder == address(0), "Cannot refund if there are bids");
        
        // Return tickets to seller
        ticketToken.safeTransferFrom(
            address(this),
            auction.seller,
            auction.ticketId,
            auction.ticketCount,
            ""
        );
        
        // Update auction state
        auction.isActive = false;
        auction.isSettled = true;
        
        // Clear ticket to auction mapping
        ticketToAuction[ticketId] = 0;
        
        emit AuctionRefunded(auctionId, auction.seller);
    }
    

    

    
    /**
     * @dev Updates the coordinator address
     * @param newCoordinator The new coordinator address
     */
    function setCoordinator(address newCoordinator) external onlyOwner {
        require(newCoordinator != address(0), "Invalid coordinator address");
        address oldCoordinator = coordinator;
        coordinator = newCoordinator;
        emit CoordinatorUpdated(oldCoordinator, newCoordinator);
    }
    
    /**
     * @dev Gets the total number of auctions created
     * @return The total number of auctions
     */
    function getAuctionCount() external view returns (uint256) {
        return _auctionCounter;
    }
    
    /**
     * @dev Gets auction details
     * @param auctionId The ID of the auction
     * @return auction The auction details
     */
    function getAuction(uint256 auctionId) external view returns (Auction memory auction) {
        auction = auctions[auctionId];
    }
    
    /**
     * @dev Gets the bid amount for a specific bidder on an auction
     * @param auctionId The ID of the auction
     * @param bidder The address of the bidder
     * @return The bid amount (0 if no bid)
     */
    function getBid(uint256 auctionId, address bidder) external view returns (uint256) {
        Auction storage auction = auctions[auctionId];
        if (auction.highestBidder == bidder) {
            return auction.highestBid;
        }
        return 0;
    }
    

    
    /**
     * @dev Gets the active auction ID for a ticket
     * @param ticketId The ID of the ticket
     * @return The auction ID (0 if no active auction)
     */
    function getActiveAuctionForTicket(uint256 ticketId) external view returns (uint256) {
        return ticketToAuction[ticketId];
    }
    
    /**
     * @dev Emergency function to withdraw stuck USDC (only owner)
     */
    function emergencyWithdrawUSDC(address to) external onlyOwner {
        uint256 balance = usdcToken.balanceOf(address(this));
        require(balance > 0, "No USDC to withdraw");
        usdcToken.transfer(to, balance);
    }
    
    /**
     * @dev Emergency function to withdraw stuck tickets (only owner)
     */
    function emergencyWithdrawTickets(
        uint256 ticketId,
        uint256 amount,
        address to
    ) external onlyOwner {
        ticketToken.safeTransferFrom(address(this), to, ticketId, amount, "");
    }

    /**
     * @dev Required function for IERC1155Receiver
     */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    /**
     * @dev Required function for IERC1155Receiver
     */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    /**
     * @dev Required function for IERC165
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }
}
