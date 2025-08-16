// scripts/settlement-scheduler.js
import { ethers } from 'ethers';
import { SettlementDataManager } from './settlement-data.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Read the contract ABI from JSON file
const contractABI = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'contracts', 'auctionDataABI.json'), 'utf8'));

export class SettlementScheduler {
    constructor() {
        this.dataManager = new SettlementDataManager();
        this.running = false;
        this.intervalId = null;
        this.eventPollingId = null;
        this.heartbeatId = null;
        this.lastProcessedBlock = 0;
    }

    async init() {
        await this.dataManager.init();
        
        const config = await this.dataManager.getConfig();
        this.lastProcessedBlock = config.lastProcessedBlock || 0;
        
        // Initialize blockchain connection
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.contract = new ethers.Contract(
            config.contractAddress,
            contractABI,
            this.wallet
        );

        await this.dataManager.log('info', 'Settlement scheduler initialized', {
            contractAddress: config.contractAddress,
            coordinatorAddress: config.coordinatorAddress,
            walletAddress: this.wallet.address,
            lastProcessedBlock: this.lastProcessedBlock
        });

        console.log('Settlement scheduler initialized');
        console.log('Contract Address:', config.contractAddress);
        console.log('Coordinator Address:', this.wallet.address);
        console.log('Last Processed Block:', this.lastProcessedBlock);
    }

    async start() {
        if (this.running) {
            console.log('Settlement scheduler is already running');
            return;
        }

        this.running = true;
        const config = await this.dataManager.getConfig();
        
        if (!config.settlementEnabled) {
            console.log('Settlement is disabled in config');
            return;
        }

        console.log(`Starting settlement scheduler - checking every ${config.settlementIntervalMs / 1000} seconds`);
        
        // Start event polling instead of persistent listeners
        this.startEventPolling();
        
        // Start settlement loop
        this.intervalId = setInterval(async () => {
            await this.processSettlements();
        }, config.settlementIntervalMs);

        // Start heartbeat with immediate first message
        const now = new Date().toLocaleTimeString();
        console.log(`[${now}] Settlement scheduler heartbeat - starting up...`);
        
        this.heartbeatId = setInterval(() => {
            const now = new Date().toLocaleTimeString();
            console.log(`[${now}] Settlement scheduler heartbeat - still running...`);
        }, 15000); // Every 15 seconds for more frequent updates

        // Run initial checks
        await this.processSettlements();
        await this.pollForEvents();

        await this.dataManager.log('info', 'Settlement scheduler started');
    }

    async stop() {
        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.eventPollingId) {
            clearInterval(this.eventPollingId);
            this.eventPollingId = null;
        }

        if (this.heartbeatId) {
            clearInterval(this.heartbeatId);
            this.heartbeatId = null;
        }
        
        await this.dataManager.log('info', 'Settlement scheduler stopped');
        console.log('Settlement scheduler stopped');
    }

    startEventPolling() {
        // Poll for events every 30 seconds instead of using persistent listeners
        this.eventPollingId = setInterval(async () => {
            await this.pollForEvents();
        }, 30000); // 30 seconds

        console.log('Event polling started (every 30 seconds)');
    }

    async pollForEvents() {
        try {
            const currentBlock = await this.provider.getBlockNumber();
            
            if (this.lastProcessedBlock === 0) {
                // First run - start from current block
                this.lastProcessedBlock = currentBlock - 1;
                await this.dataManager.updateConfig({ lastProcessedBlock: this.lastProcessedBlock });
                console.log(`Starting event polling from block ${this.lastProcessedBlock}`);
                return;
            }

            if (currentBlock <= this.lastProcessedBlock) {
                console.log(`No new blocks. Current: ${currentBlock}, Last processed: ${this.lastProcessedBlock}`);
                return; // No new blocks
            }

            console.log(`Polling events from block ${this.lastProcessedBlock + 1} to ${currentBlock}`);

            // Get events from the last processed block + 1 to current block
            const fromBlock = this.lastProcessedBlock + 1;
            const toBlock = currentBlock;

            // Poll for AuctionCreated events
            const auctionCreatedEvents = await this.contract.queryFilter('AuctionCreated', fromBlock, toBlock);
            for (const event of auctionCreatedEvents) {
                await this.handleAuctionCreated(event);
            }

            // Poll for BidPlaced events
            const bidPlacedEvents = await this.contract.queryFilter('BidPlaced', fromBlock, toBlock);
            for (const event of bidPlacedEvents) {
                await this.handleBidPlaced(event);
            }

            // Poll for AuctionSettled events
            const auctionSettledEvents = await this.contract.queryFilter('AuctionSettled', fromBlock, toBlock);
            for (const event of auctionSettledEvents) {
                await this.handleAuctionSettled(event);
            }

            // Update last processed block
            this.lastProcessedBlock = currentBlock;
            await this.dataManager.updateConfig({ lastProcessedBlock: this.lastProcessedBlock });

            if (auctionCreatedEvents.length > 0 || bidPlacedEvents.length > 0 || auctionSettledEvents.length > 0) {
                console.log(`Processed ${auctionCreatedEvents.length} auctions, ${bidPlacedEvents.length} bids, ${auctionSettledEvents.length} settlements`);
            } else {
                console.log('No new events found in this block range');
            }

        } catch (error) {
            console.error('Error polling for events:', error);
            await this.dataManager.log('error', 'Error polling for events', { error: error.message });
            
            // Don't update lastProcessedBlock on error to retry the same range
            // But add a small delay to prevent rapid retries
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    async handleAuctionCreated(event) {
        try {
            const [auctionId, ticketId, ticketCount, startPrice, buyNowPrice, minIncrement, expiryTime, seller] = event.args;
            
            const auctionData = {
                id: auctionId.toString(),
                ticketId: ticketId.toString(),
                ticketCount: ticketCount.toString(),
                startPrice: startPrice.toString(),
                buyNowPrice: buyNowPrice.toString(),
                minIncrement: minIncrement.toString(),
                expiryTime: Number(expiryTime),
                seller,
                highestBidder: null,
                highestBid: '0',
                isActive: true,
                isSettled: false,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber
            };

            await this.dataManager.addAuction(auctionData);
            await this.dataManager.log('info', 'New auction detected', auctionData);
            console.log(`New auction detected: ${auctionId.toString()}`);
        } catch (error) {
            console.error('Error handling AuctionCreated event:', error);
            await this.dataManager.log('error', 'Error handling AuctionCreated event', { error: error.message });
        }
    }

    async handleBidPlaced(event) {
        try {
            const [auctionId, bidder, bidAmount] = event.args;
            
            await this.dataManager.updateAuction(auctionId.toString(), {
                highestBidder: bidder,
                highestBid: bidAmount.toString()
            });
            
            await this.dataManager.log('info', 'Bid placed', {
                auctionId: auctionId.toString(),
                bidder,
                bidAmount: bidAmount.toString()
            });
            console.log(`Bid placed on auction ${auctionId.toString()}: ${bidAmount.toString()} by ${bidder}`);
        } catch (error) {
            console.error('Error handling BidPlaced event:', error);
            await this.dataManager.log('error', 'Error handling BidPlaced event', { error: error.message });
        }
    }

    async handleAuctionSettled(event) {
        try {
            const [auctionId, winner, winningBid] = event.args;
            
            await this.dataManager.updateAuction(auctionId.toString(), {
                isSettled: true,
                isActive: false,
                settlementTxHash: event.transactionHash,
                settledAt: new Date().toISOString()
            });

            await this.dataManager.removeFromSettlementQueue(auctionId.toString());
            
            await this.dataManager.log('info', 'Auction settled', {
                auctionId: auctionId.toString(),
                winner,
                winningBid: winningBid.toString(),
                txHash: event.transactionHash
            });
            console.log(`Auction ${auctionId.toString()} settled by ${winner} for ${winningBid.toString()}`);
        } catch (error) {
            console.error('Error handling AuctionSettled event:', error);
            await this.dataManager.log('error', 'Error handling AuctionSettled event', { error: error.message });
        }
    }

    async processSettlements() {
        try {
            // Find expired auctions and add to queue
            const expiredAuctions = await this.dataManager.getExpiredAuctions();
            
            for (const auction of expiredAuctions) {
                await this.dataManager.addToSettlementQueue(auction.id);
            }

            if (expiredAuctions.length > 0) {
                console.log(`Found ${expiredAuctions.length} expired auctions`);
            }

            // Process settlement queue
            const pendingSettlements = await this.dataManager.getPendingSettlements();
            
            for (const settlement of pendingSettlements.slice(0, 5)) { // Process max 5 at a time
                await this.settleSingleAuction(settlement);
            }

        } catch (error) {
            console.error('Error in processSettlements:', error);
            await this.dataManager.log('error', 'Error in processSettlements', { error: error.message });
        }
    }

    async settleSingleAuction(settlement) {
        try {
            console.log(`Attempting to settle auction ${settlement.auctionId} (attempt ${settlement.attemptCount + 1})`);
            
            // Mark as processing
            await this.dataManager.updateSettlementQueue(settlement.auctionId, {
                status: 'processing',
                attemptCount: settlement.attemptCount + 1
            });

            // Get current gas price
            const feeData = await this.provider.getFeeData();
            
            // Call settle function
            const tx = await this.contract.settle(settlement.auctionId, {
                gasLimit: 500000,
                gasPrice: feeData.gasPrice
            });

            console.log(`Settlement transaction sent: ${tx.hash}`);
            await this.dataManager.log('info', 'Settlement transaction sent', {
                auctionId: settlement.auctionId,
                txHash: tx.hash
            });

            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`Settlement confirmed: ${receipt.hash}`);

            // Update auction as settled
            await this.dataManager.updateAuction(settlement.auctionId, {
                isSettled: true,
                isActive: false,
                settlementTxHash: receipt.hash,
                settledAt: new Date().toISOString()
            });

            // Remove from settlement queue
            await this.dataManager.removeFromSettlementQueue(settlement.auctionId);

            await this.dataManager.log('info', 'Auction successfully settled', {
                auctionId: settlement.auctionId,
                txHash: receipt.hash,
                gasUsed: receipt.gasUsed.toString()
            });

        } catch (error) {
            console.error(`Settlement failed for auction ${settlement.auctionId}:`, error);

            // Calculate next retry time with exponential backoff
            const backoffMinutes = Math.min(60, Math.pow(2, settlement.attemptCount));
            const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

            if (settlement.attemptCount >= 4) {
                // Max attempts reached, mark as failed
                await this.dataManager.updateSettlementQueue(settlement.auctionId, {
                    status: 'failed',
                    errorMessage: error.message,
                    nextAttemptAt
                });
                
                await this.dataManager.log('error', 'Settlement failed - max attempts reached', {
                    auctionId: settlement.auctionId,
                    error: error.message,
                    attemptCount: settlement.attemptCount + 1
                });
            } else {
                // Schedule retry
                await this.dataManager.updateSettlementQueue(settlement.auctionId, {
                    status: 'pending',
                    errorMessage: error.message,
                    nextAttemptAt
                });

                await this.dataManager.log('warn', 'Settlement failed - will retry', {
                    auctionId: settlement.auctionId,
                    error: error.message,
                    nextAttemptAt,
                    attemptCount: settlement.attemptCount + 1
                });
            }
        }
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const scheduler = new SettlementScheduler();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down settlement scheduler...');
        await scheduler.stop();
        process.exit(0);
    });

    try {
        await scheduler.init();
        await scheduler.start();
        
        console.log('Settlement scheduler is running. Press Ctrl+C to stop.');
        
        // Keep the process alive
        setInterval(() => {
            // Just keep alive
        }, 1000);
        
    } catch (error) {
        console.error('Failed to start settlement scheduler:', error);
        process.exit(1);
    }
}