/**
 * Integration Tests for ConstitutionGuard Proposer
 */

import { prepareGovernanceAction } from '../index';

describe('Integration: prepareGovernanceAction', () => {
  it('should process complete treasury withdrawal end-to-end', async () => {
    const input = `
      I want to request 500,000 ADA from the treasury 
      for the Cardano DeFi Liquidity Budget. 
      Title: Cardano DeFi Liquidity Budget - Withdrawal 1
      Abstract: This proposal requests 500,000 ADA from the Cardano Treasury to establish legal framework and smart contract infrastructure required for the Stablecoin DeFi Liquidity Budget.
      Motivation: The Cardano DeFi ecosystem needs liquidity support to compete with other Layer 1 blockchains and attract developers.
      Rationale: This withdrawal covers three critical components: (1) Cayman Islands Foundation Company establishment, (2) smart contract development, and (3) security audit.
      Recipient: addr1q9...
      Timeline: 6 months
    `;
    
    const result = await prepareGovernanceAction(input);
    
    expect(result.success).toBe(true);
    expect(result.intake).toBeDefined();
    expect(result.compliance).toBeDefined();
    expect(result.generation).toBeDefined();
    expect(result.validation).toBeDefined();
    
    // Check intake
    expect(result.intake?.data?.actionType).toBe('TreasuryWithdrawal');
    expect(result.intake?.data?.amount).toBe('500000');
    
    // Check compliance
    expect(result.compliance?.relevantArticles.length).toBeGreaterThan(0);
    
    // Check generation
    expect(result.generation?.metadata['@type']).toBe('GovernanceAction');
    expect(result.generation?.metadata.body.title).toContain('DeFi Liquidity');
    
    // Check validation
    expect(result.validation?.valid).toBe(true);
  });

  it('should handle incomplete intake', async () => {
    const input = "I want to request some ADA";
    
    const result = await prepareGovernanceAction(input);
    
    expect(result.success).toBe(false);
    expect(result.intake?.status).toBe('incomplete');
    expect(result.error).toContain('Intake incomplete');
  });

  it('should generate constitution warnings for treasury without audit', async () => {
    const input = `
      Treasury withdrawal for 100000 ADA
      Title: Test Withdrawal
      Abstract: This is a test abstract that is long enough to pass validation
      Motivation: This motivation section is long enough to satisfy the minimum length requirement for proper validation
      Rationale: This rationale section is also long enough to satisfy the minimum length requirement
      Recipient: addr123
      Purpose: Testing
      Timeline: 3 months
    `;
    
    const result = await prepareGovernanceAction(input);
    
    // Should still succeed but with compliance warnings
    expect(result.success).toBe(true);
    expect(result.compliance?.potentialConflicts.some(
      c => c.severity === 'warning' && c.article.includes('7.4')
    )).toBe(true);
  });

  it('should validate against real example governance action', async () => {
    // This would require loading the example file
    // For now, just verify the structure works
    const input = `
      Treasury withdrawal 500000 ADA
      Title: DeFi Budget Withdrawal 1
      Abstract: Requesting funds for DeFi infrastructure including legal setup, smart contracts, and audit
      Motivation: Cardano needs competitive DeFi infrastructure to attract users and developers from other chains
      Rationale: By funding legal structure, secure smart contracts, and audits, we establish foundation for sustainable DeFi growth
      Recipient: addr1q9v8f...
      Purpose: DeFi infrastructure
      Timeline: 6 months
    `;
    
    const result = await prepareGovernanceAction(input);
    
    expect(result.success).toBe(true);
    expect(result.validation?.valid).toBe(true);
  });
});
