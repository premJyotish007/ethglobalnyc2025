// scripts/settlement-cli.js
import { SettlementDataManager } from './settlement-data.js';
import { SettlementScheduler } from './settlement-scheduler.js';

class SettlementCLI {
    constructor() {
        this.dataManager = new SettlementDataManager();
    }

    async init() {
        await this.dataManager.init();
    }

    async showStatus() {
        const auctions = await this.dataManager.getAllAuctions();
        const queue = await this.dataManager.readJSON(this.dataManager.settlementQueueFile) || [];
        const config = await this.dataManager.getConfig();

        console.log('\n📊 Settlement System Status');
        console.log('═══════════════════════════');
        
        console.log(`\n🔧 Configuration:`);
        console.log(`  Settlement Enabled: ${config.settlementEnabled}`);
        console.log(`  Check Interval: ${config.settlementIntervalMs / 1000}s`);
        console.log(`  Contract: ${config.contractAddress}`);
        console.log(`  Coordinator: ${config.coordinatorAddress}`);

        const auctionList = Object.values(auctions);
        const activeAuctions = auctionList.filter(a => a.isActive && !a.isSettled);
        const settledAuctions = auctionList.filter(a => a.isSettled);
        const expiredAuctions = auctionList.filter(a => 
            a.expiryTime <= Math.floor(Date.now() / 1000) && 
            a.isActive && 
            !a.isSettled
        );

        console.log(`\n📈 Auction Statistics:`);
        console.log(`  Total Auctions: ${auctionList.length}`);
        console.log(`  Active Auctions: ${activeAuctions.length}`);
        console.log(`  Expired (Pending Settlement): ${expiredAuctions.length}`);
        console.log(`  Settled Auctions: ${settledAuctions.length}`);

        console.log(`\n⏰ Settlement Queue:`);
        console.log(`  Pending: ${queue.filter(q => q.status === 'pending').length}`);
        console.log(`  Processing: ${queue.filter(q => q.status === 'processing').length}`);
        console.log(`  Failed: ${queue.filter(q => q.status === 'failed').length}`);

        if (expiredAuctions.length > 0) {
            console.log(`\n🚨 Expired Auctions Needing Settlement:`);
            expiredAuctions.forEach(auction => {
                const timeExpired = Math.floor(Date.now() / 1000) - auction.expiryTime;
                console.log(`  Auction ${auction.id}: Expired ${Math.floor(timeExpired / 60)} minutes ago`);
            });
        }
    }

    async listAuctions() {
        const auctions = await this.dataManager.getAllAuctions();
        const auctionList = Object.values(auctions);

        console.log('\n📋 All Auctions');
        console.log('═══════════════');

        if (auctionList.length === 0) {
            console.log('No auctions found.');
            return;
        }

        auctionList.forEach(auction => {
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = auction.expiryTime - now;
            const status = auction.isSettled ? '✅ Settled' : 
                          timeLeft <= 0 ? '⏰ Expired' : 
                          '🟢 Active';

            console.log(`\nAuction ${auction.id}:`);
            console.log(`  Status: ${status}`);
            console.log(`  Ticket ID: ${auction.ticketId}`);
            console.log(`  Count: ${auction.ticketCount}`);
            console.log(`  Start Price: ${auction.startPrice} USDC`);
            console.log(`  Buy Now: ${auction.buyNowPrice} USDC`);
            console.log(`  Highest Bid: ${auction.highestBid} USDC`);
            console.log(`  Seller: ${auction.seller}`);
            if (auction.highestBidder) {
                console.log(`  Highest Bidder: ${auction.highestBidder}`);
            }
            if (timeLeft > 0) {
                console.log(`  Time Left: ${Math.floor(timeLeft / 60)} minutes`);
            } else {
                console.log(`  Expired: ${Math.floor(-timeLeft / 60)} minutes ago`);
            }
        });
    }

    async showLogs(count = 20) {
        const logs = await this.dataManager.readJSON(this.dataManager.logFile) || [];
        const recentLogs = logs.slice(-count);

        console.log(`\n📝 Recent Logs (last ${count})`);
        console.log('═══════════════════════');

        recentLogs.forEach(log => {
            const timestamp = new Date(log.timestamp).toLocaleString();
            const levelEmoji = {
                info: 'ℹ️',
                warn: '⚠️',
                error: '❌'
            }[log.level] || '📝';

            console.log(`${levelEmoji} [${timestamp}] ${log.message}`);
            if (Object.keys(log.data).length > 0) {
                console.log(`   ${JSON.stringify(log.data)}`);
            }
        });
    }

    async settleSingle(auctionId) {
        console.log(`\n🔧 Manually settling auction ${auctionId}...`);
        
        const scheduler = new SettlementScheduler();
        await scheduler.init();
        
        const auction = await this.dataManager.getAuction(auctionId);
        if (!auction) {
            console.log(`❌ Auction ${auctionId} not found`);
            return;
        }

        if (auction.isSettled) {
            console.log(`✅ Auction ${auctionId} is already settled`);
            return;
        }

        await this.dataManager.addToSettlementQueue(auctionId);
        
        const settlement = {
            auctionId,
            status: 'pending',
            attemptCount: 0
        };

        await scheduler.settleSingleAuction(settlement);
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up old data...');
        
        const auctions = await this.dataManager.getAllAuctions();
        const queue = await this.dataManager.readJSON(this.dataManager.settlementQueueFile) || [];
        
        // Remove completed settlements from queue
        const activeQueue = queue.filter(q => q.status !== 'completed');
        await this.dataManager.writeJSON(this.dataManager.settlementQueueFile, activeQueue);
        
        console.log(`Removed ${queue.length - activeQueue.length} completed settlements from queue`);
        
        // Archive old logs (keep last 500)
        const logs = await this.dataManager.readJSON(this.dataManager.logFile) || [];
        if (logs.length > 500) {
            const recentLogs = logs.slice(-500);
            await this.dataManager.writeJSON(this.dataManager.logFile, recentLogs);
            console.log(`Archived ${logs.length - 500} old log entries`);
        }
        
        console.log('✅ Cleanup completed');
    }
}

// CLI interface
async function main() {
    const cli = new SettlementCLI();
    await cli.init();

    const command = process.argv[2];
    const arg = process.argv[3];

    switch (command) {
        case 'status':
            await cli.showStatus();
            break;
        case 'list':
            await cli.listAuctions();
            break;
        case 'logs':
            await cli.showLogs(arg ? parseInt(arg) : 20);
            break;
        case 'settle':
            if (!arg) {
                console.log('Usage: node settlement-cli.js settle <auctionId>');
                process.exit(1);
            }
            await cli.settleSingle(arg);
            break;
        case 'cleanup':
            await cli.cleanup();
            break;
        default:
            console.log('Settlement System CLI');
            console.log('═══════════════════════');
            console.log('Usage: node settlement-cli.js <command>');
            console.log('');
            console.log('Commands:');
            console.log('  status                 - Show system status');
            console.log('  list                   - List all auctions');
            console.log('  logs [count]           - Show recent logs');
            console.log('  settle <auctionId>     - Manually settle an auction');
            console.log('  cleanup                - Clean up old data');
            console.log('');
            console.log('Examples:');
            console.log('  node settlement-cli.js status');
            console.log('  node settlement-cli.js settle 1');
            console.log('  node settlement-cli.js logs 50');
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}