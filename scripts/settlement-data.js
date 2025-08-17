// scripts/settlement-data.js
import fs from 'fs/promises';
import path from 'path';

export class SettlementDataManager {
    constructor(dataDir = './settlement-data') {
        this.dataDir = dataDir;
        this.auctionsFile = path.join(dataDir, 'auctions.json');
        this.settlementQueueFile = path.join(dataDir, 'settlement-queue.json');
        this.configFile = path.join(dataDir, 'config.json');
        this.logFile = path.join(dataDir, 'settlement-log.json');
    }

    async init() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Initialize files if they don't exist
            await this.ensureFileExists(this.auctionsFile, {});
            await this.ensureFileExists(this.settlementQueueFile, []);
            await this.ensureFileExists(this.configFile, {
                lastProcessedBlock: 0,
                settlementIntervalMs: 60000, // 1 minute
                maxSettlementAttempts: 5,
                coordinatorAddress: process.env.COORDINATOR_ADDRESS || '0x1a624E2B6DB9dE48Ff3937E8CEAafaaCA9618AD2',
                contractAddress: process.env.CONTRACT_ADDRESS || '0x506D3f0e7C238555196C971b87Fc6C8Fdf8838bB',
                rpcUrl: process.env.BASE_SEPOLIA_RPC,
                settlementEnabled: true
            });
            await this.ensureFileExists(this.logFile, []);
            
            console.log('Settlement data manager initialized');
        } catch (error) {
            console.error('Error initializing settlement data manager:', error);
            throw error;
        }
    }

    async ensureFileExists(filePath, defaultData) {
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
        }
    }

    async readJSON(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error);
            return null;
        }
    }

    async writeJSON(filePath, data) {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Error writing ${filePath}:`, error);
            throw error;
        }
    }

    // Auction management
    async addAuction(auctionData) {
        const auctions = await this.readJSON(this.auctionsFile) || {};
        auctions[auctionData.id] = {
            ...auctionData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await this.writeJSON(this.auctionsFile, auctions);
        console.log(`Added auction ${auctionData.id} to data store`);
    }

    async updateAuction(auctionId, updates) {
        const auctions = await this.readJSON(this.auctionsFile) || {};
        if (auctions[auctionId]) {
            auctions[auctionId] = {
                ...auctions[auctionId],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            await this.writeJSON(this.auctionsFile, auctions);
            console.log(`Updated auction ${auctionId}`);
        }
    }

    async getExpiredAuctions() {
        const auctions = await this.readJSON(this.auctionsFile) || {};
        const currentTime = Math.floor(Date.now() / 1000);
        
        return Object.values(auctions).filter(auction => 
            auction.expiryTime <= currentTime &&
            auction.isActive &&
            !auction.isSettled
        );
    }

    async getAuction(auctionId) {
        const auctions = await this.readJSON(this.auctionsFile) || {};
        return auctions[auctionId] || null;
    }

    async getAllAuctions() {
        return await this.readJSON(this.auctionsFile) || {};
    }

    // Settlement queue management
    async addToSettlementQueue(auctionId) {
        const queue = await this.readJSON(this.settlementQueueFile) || [];
        
        // Check if already in queue
        const existing = queue.find(item => item.auctionId === auctionId);
        if (existing) {
            console.log(`Auction ${auctionId} already in settlement queue`);
            return;
        }

        queue.push({
            auctionId,
            status: 'pending',
            attemptCount: 0,
            createdAt: new Date().toISOString(),
            nextAttemptAt: new Date().toISOString()
        });

        await this.writeJSON(this.settlementQueueFile, queue);
        console.log(`Added auction ${auctionId} to settlement queue`);
    }

    async updateSettlementQueue(auctionId, updates) {
        const queue = await this.readJSON(this.settlementQueueFile) || [];
        const index = queue.findIndex(item => item.auctionId === auctionId);
        
        if (index !== -1) {
            queue[index] = {
                ...queue[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            await this.writeJSON(this.settlementQueueFile, queue);
        }
    }

    async getPendingSettlements() {
        const queue = await this.readJSON(this.settlementQueueFile) || [];
        const now = new Date().toISOString();
        
        return queue.filter(item => 
            item.status === 'pending' &&
            item.nextAttemptAt <= now &&
            item.attemptCount < 5
        );
    }

    async removeFromSettlementQueue(auctionId) {
        const queue = await this.readJSON(this.settlementQueueFile) || [];
        const filtered = queue.filter(item => item.auctionId !== auctionId);
        await this.writeJSON(this.settlementQueueFile, filtered);
    }

    // Logging
    async log(level, message, data = {}) {
        const logs = await this.readJSON(this.logFile) || [];
        logs.push({
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        });

        // Keep only last 1000 log entries
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }

        await this.writeJSON(this.logFile, logs);
        console.log(`[${level.toUpperCase()}] ${message}`, data);
    }

    // Config management
    async getConfig() {
        return await this.readJSON(this.configFile);
    }

    async updateConfig(updates) {
        const config = await this.readJSON(this.configFile) || {};
        const newConfig = { ...config, ...updates };
        await this.writeJSON(this.configFile, newConfig);
        return newConfig;
    }
}