// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract TicketToken is ERC1155, Ownable, ERC1155Supply {
    struct TicketInfo {
        string eventName;
        string section;
        string row;
        string seat;
        uint256 eventDate; // Unix timestamp
        uint256 price; // Price in wei
        bool isActive; // Whether ticket is still valid
    }

    // Mapping from token ID to ticket information
    mapping(uint256 => TicketInfo) public ticketInfo;

    // Mapping from token ID to whether it's been used
    mapping(uint256 => bool) public usedTickets;

    // Counter for token IDs
    uint256 private _currentTokenId;

    // Events
    event TicketCreated(
        uint256 indexed tokenId,
        string eventName,
        string section,
        string row,
        string seat,
        uint256 eventDate,
        uint256 price
    );

    event TicketUsed(uint256 indexed tokenId, address indexed user);
    event TicketDeactivated(uint256 indexed tokenId);

    constructor(
        string memory uri,
        address initialOwner
    ) ERC1155(uri) Ownable(initialOwner) {
        _currentTokenId = 1;
    }

    /**
     * @dev Creates new tickets for an event
     * @param to Address to mint tickets to
     * @param amount Number of tickets to create
     * @param eventName Name of the event
     * @param section Section of the venue
     * @param row Row in the section
     * @param seat Seat number(s) - can be range like "1-5"
     * @param eventDate Date of the event (Unix timestamp)
     * @param price Price per ticket in wei
     */
    function createTickets(
        address to,
        uint256 amount,
        string memory eventName,
        string memory section,
        string memory row,
        string memory seat,
        uint256 eventDate,
        uint256 price
    ) public onlyOwner {
        require(
            eventDate > block.timestamp,
            "Event date must be in the future"
        );
        require(bytes(eventName).length > 0, "Event name cannot be empty");
        require(bytes(section).length > 0, "Section cannot be empty");
        require(bytes(row).length > 0, "Row cannot be empty");
        require(bytes(seat).length > 0, "Seat cannot be empty");

        uint256 tokenId = _currentTokenId;

        // Store ticket information
        ticketInfo[tokenId] = TicketInfo({
            eventName: eventName,
            section: section,
            row: row,
            seat: seat,
            eventDate: eventDate,
            price: price,
            isActive: true
        });

        // Mint the tickets
        _mint(to, tokenId, amount, "");

        emit TicketCreated(
            tokenId,
            eventName,
            section,
            row,
            seat,
            eventDate,
            price
        );

        _currentTokenId++;
    }

    /**
     * @dev Batch create multiple different ticket types
     */
    function createBatchTickets(
        address to,
        uint256[] memory amounts,
        string[] memory eventNames,
        string[] memory sections,
        string[] memory rows,
        string[] memory seats,
        uint256[] memory eventDates,
        uint256[] memory prices
    ) public onlyOwner {
        require(amounts.length == eventNames.length, "Arrays length mismatch");
        require(amounts.length == sections.length, "Arrays length mismatch");
        require(amounts.length == rows.length, "Arrays length mismatch");
        require(amounts.length == seats.length, "Arrays length mismatch");
        require(amounts.length == eventDates.length, "Arrays length mismatch");
        require(amounts.length == prices.length, "Arrays length mismatch");

        uint256[] memory tokenIds = new uint256[](amounts.length);

        for (uint256 i = 0; i < amounts.length; i++) {
            require(
                eventDates[i] > block.timestamp,
                "Event date must be in the future"
            );
            require(
                bytes(eventNames[i]).length > 0,
                "Event name cannot be empty"
            );

            tokenIds[i] = _currentTokenId;

            ticketInfo[_currentTokenId] = TicketInfo({
                eventName: eventNames[i],
                section: sections[i],
                row: rows[i],
                seat: seats[i],
                eventDate: eventDates[i],
                price: prices[i],
                isActive: true
            });

            emit TicketCreated(
                _currentTokenId,
                eventNames[i],
                sections[i],
                rows[i],
                seats[i],
                eventDates[i],
                prices[i]
            );

            _currentTokenId++;
        }

        _mintBatch(to, tokenIds, amounts, "");
    }

    /**
     * @dev Mark a ticket as used (for event entry)
     */
    function useTicket(uint256 tokenId) public {
        require(
            balanceOf(msg.sender, tokenId) > 0,
            "You don't own this ticket"
        );
        require(!usedTickets[tokenId], "Ticket already used");
        require(ticketInfo[tokenId].isActive, "Ticket is not active");
        require(
            block.timestamp <= ticketInfo[tokenId].eventDate + 1 days,
            "Event has ended"
        );

        usedTickets[tokenId] = true;
        emit TicketUsed(tokenId, msg.sender);
    }

    /**
     * @dev Deactivate a ticket (in case of event cancellation)
     */
    function deactivateTicket(uint256 tokenId) public onlyOwner {
        ticketInfo[tokenId].isActive = false;
        emit TicketDeactivated(tokenId);
    }

    /**
     * @dev Get detailed ticket information
     */
    function getTicketInfo(uint256 tokenId) public view returns (TicketInfo memory ticket, bool isUsed) {
        ticket = ticketInfo[tokenId];
        isUsed = usedTickets[tokenId];
    }

    /**
     * @dev Check if a ticket is valid for use
     */
    function isTicketValid(uint256 tokenId) public view returns (bool) {
        TicketInfo memory ticket = ticketInfo[tokenId];
        return (ticket.isActive &&
            !usedTickets[tokenId] &&
            block.timestamp <= ticket.eventDate + 1 days);
    }

    /**
     * @dev Override transfer functions to add validation
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override {
        require(ticketInfo[id].isActive, "Cannot transfer inactive ticket");
        require(!usedTickets[id], "Cannot transfer used ticket");
        super.safeTransferFrom(from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override {
        for (uint256 i = 0; i < ids.length; i++) {
            require(
                ticketInfo[ids[i]].isActive,
                "Cannot transfer inactive ticket"
            );
            require(!usedTickets[ids[i]], "Cannot transfer used ticket");
        }
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    /**
     * @dev Set new URI for metadata
     */
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    /**
     * @dev Override _update function required by ERC1155Supply
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    /**
     * @dev Get current token ID counter
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _currentTokenId;
    }
}
