/**
 * Blockfrost API client with Koios fallback
 * 
 * Requirements:
 * 1. Primary: Blockfrost API for Cardano data
 * 2. Fallback: Koios API if Blockfrost rate limited/down
 * 3. Rate limit monitoring and notifications
 * 4. Exponential backoff on 429 errors
 */

import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || '';
const CARDANO_NETWORK = process.env.CARDANO_NETWORK || 'mainnet';

// Track API usage for notifications
let requestCount = 0;
const DAILY_LIMIT = 50000;
const WARNING_THRESHOLD = 0.8; // Warn at 80%

class CardanoDataClient {
  private blockfrost: BlockFrostAPI;
  private useFallback: boolean = false;

  constructor() {
    this.blockfrost = new BlockFrostAPI({
      projectId: BLOCKFROST_API_KEY,
      network: CARDANO_NETWORK as any
    });
  }

  async getGovernanceActions() {
    this.trackRequest();
    // TODO: Implement with fallback
    throw new Error('Not implemented');
  }

  async getGovernanceAction(actionId: string) {
    this.trackRequest();
    // TODO: Implement with fallback
    throw new Error('Not implemented');
  }

  private trackRequest() {
    requestCount++;
    if (requestCount > DAILY_LIMIT * WARNING_THRESHOLD) {
      console.warn(`[WARNING] Blockfrost usage: ${requestCount}/${DAILY_LIMIT} (${(requestCount/DAILY_LIMIT*100).toFixed(1)}%)`);
      // TODO: Send notification to user
    }
  }
}

export const cardanoClient = new CardanoDataClient();
