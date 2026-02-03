/**
 * Tests for Governance Intake Tool
 */

import { governanceIntake, mergeIntake, ProposalData } from '../tools/governance-intake';

describe('governanceIntake', () => {
  describe('Treasury Withdrawal Detection', () => {
    it('should detect treasury withdrawal from free text', async () => {
      const input = "I want to request 500,000 ADA from the treasury for a DeFi liquidity program";
      const result = await governanceIntake(input);
      
      expect(result.status).toBe('incomplete');
      expect(result.data?.actionType).toBe('TreasuryWithdrawal');
      expect(result.data?.amount).toBe('500000');
    });

    it('should extract action type from free text', async () => {
      const input = "Treasury withdrawal: 500,000 ADA for DeFi";
      const result = await governanceIntake(input);
      
      // Should detect action type even if incomplete
      expect(result.data?.actionType).toBe('TreasuryWithdrawal');
    });

    it('should detect amount with commas', async () => {
      const input = "Requesting 1,000,000 ADA for project funding";
      const result = await governanceIntake(input);
      
      expect(result.data?.amount).toBe('1000000');
    });

    it('should detect amount with M/million suffix', async () => {
      const input = "We need 2M ADA for the treasury";
      const result = await governanceIntake(input);
      
      expect(result.data?.amount).toBe('2');
    });
  });

  describe('Action Type Detection', () => {
    it('should detect ParameterUpdate', async () => {
      const input = "I want to update the block size parameter to improve throughput";
      const result = await governanceIntake(input);
      
      expect(result.data?.actionType).toBe('ParameterUpdate');
    });

    it('should detect HardForkInitiation', async () => {
      const input = "Proposal for hard fork to version 10";
      const result = await governanceIntake(input);
      
      expect(result.data?.actionType).toBe('HardForkInitiation');
    });

    it('should detect NoConfidence', async () => {
      const input = "Motion of no confidence in the current committee";
      const result = await governanceIntake(input);
      
      expect(result.data?.actionType).toBe('NoConfidence');
    });

    it('should ask for action type if not detected', async () => {
      const input = "I have an idea for Cardano";
      const result = await governanceIntake(input);
      
      expect(result.status).toBe('incomplete');
      expect(result.questions).toContain(expect.stringContaining('type of governance action'));
    });
  });

  describe('Missing Fields Detection', () => {
    it('should ask for all required fields for treasury withdrawal', async () => {
      const input = "Request 500000 ADA for DeFi";
      const result = await governanceIntake(input);
      
      expect(result.status).toBe('incomplete');
      expect(result.missingFields).toContain('title');
      expect(result.missingFields).toContain('abstract');
      expect(result.missingFields).toContain('motivation');
      expect(result.missingFields).toContain('rationale');
      expect(result.missingFields).toContain('recipient');
      expect(result.missingFields).toContain('timeline');
    });

    it('should generate appropriate questions', async () => {
      const input = "Treasury withdrawal for 100000 ADA";
      const result = await governanceIntake(input);
      
      expect(result.questions?.some(q => q.includes('title'))).toBe(true);
      expect(result.questions?.some(q => q.includes('abstract'))).toBe(true);
      expect(result.questions?.some(q => q.includes('motivation'))).toBe(true);
      expect(result.questions?.some(q => q.includes('recipient'))).toBe(true);
    });
  });

  describe('Purpose Extraction', () => {
    it('should extract purpose after "for"', async () => {
      const input = "Request 500000 ADA for building a DEX";
      const result = await governanceIntake(input);
      
      expect(result.data?.purpose).toContain('building a DEX');
    });
  });
});

describe('mergeIntake', () => {
  it('should merge new data with existing', () => {
    const existing: Partial<ProposalData> = {
      actionType: 'TreasuryWithdrawal',
      amount: '500000'
    };
    const additional = "For DeFi liquidity program";
    
    const result = mergeIntake(existing, additional);
    
    expect(result.actionType).toBe('TreasuryWithdrawal');
    expect(result.amount).toBe('500000');
    expect(result.purpose).toContain('DeFi liquidity');
  });
});
