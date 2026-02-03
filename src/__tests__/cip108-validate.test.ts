/**
 * Tests for CIP-108 Validator Tool
 */

import { cip108Validate, isValidCIP108 } from '../tools/cip108-validate';
import { cip108Generate } from '../tools/cip108-generate';
import { ProposalData } from '../tools/governance-intake';

describe('cip108Validate', () => {
  const validProposal: ProposalData = {
    actionType: 'TreasuryWithdrawal',
    title: 'Cardano DeFi Liquidity Budget - Withdrawal 1',
    abstract: 'This proposal requests 500,000 ADA from the treasury for establishing legal framework and smart contract infrastructure for the Stablecoin DeFi Liquidity Budget.',
    motivation: 'The Cardano DeFi ecosystem needs liquidity support to compete with other Layer 1 blockchains. By providing initial liquidity, we can bootstrap protocols and attract developers.',
    rationale: 'This withdrawal covers three components: (1) Cayman Islands Foundation Company establishment, (2) smart contract development, and (3) security audit. All funds will be managed via multisig.',
    amount: '500000',
    recipient: 'addr1q9...',
    purpose: 'DeFi liquidity provision',
    timeline: '6 months'
  };

  describe('Valid Metadata', () => {
    it('should validate correct metadata', async () => {
      const { metadata } = await cip108Generate(validProposal);
      const result = await cip108Validate(metadata);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass isValidCIP108 helper', async () => {
      const { metadata } = await cip108Generate(validProposal);
      expect(isValidCIP108(metadata)).toBe(true);
    });
  });

  describe('Business Rule Warnings', () => {
    it('should warn about short title', async () => {
      const shortProposal = { ...validProposal, title: 'Hi' };
      const { metadata } = await cip108Generate(shortProposal);
      const result = await cip108Validate(metadata);
      
      expect(result.warnings.some(w => w.includes('short'))).toBe(true);
    });

    it('should warn about short abstract', async () => {
      const shortAbstract = { ...validProposal, abstract: 'Too short' };
      const { metadata } = await cip108Generate(shortAbstract);
      const result = await cip108Validate(metadata);
      
      expect(result.warnings.some(w => w.includes('Abstract') && w.includes('short'))).toBe(true);
    });

    it('should warn about short motivation', async () => {
      const shortMotivation = { ...validProposal, motivation: 'Need it.' };
      const { metadata } = await cip108Generate(shortMotivation);
      const result = await cip108Validate(metadata);
      
      expect(result.warnings.some(w => w.includes('Motivation') && w.includes('short'))).toBe(true);
    });

    it('should warn about short rationale', async () => {
      const shortRationale = { ...validProposal, rationale: 'Good idea.' };
      const { metadata } = await cip108Generate(shortRationale);
      const result = await cip108Validate(metadata);
      
      expect(result.warnings.some(w => w.includes('Rationale') && w.includes('short'))).toBe(true);
    });

    it('should warn about markdown in title', async () => {
      const markdownTitle = { ...validProposal, title: '**Bold** Title' };
      const { metadata } = await cip108Generate(markdownTitle);
      const result = await cip108Validate(metadata);
      
      expect(result.warnings.some(w => w.includes('markdown'))).toBe(true);
    });

    it('should warn about wrong hash algorithm', async () => {
      const { metadata } = await cip108Generate(validProposal);
      metadata.hashAlgorithm = 'sha256' as any;
      const result = await cip108Validate(metadata);
      
      expect(result.warnings.some(w => w.includes('blake2b-256'))).toBe(true);
    });
  });

  describe('Schema Validation Errors', () => {
    it('should fail validation with missing required field', async () => {
      const { metadata } = await cip108Generate(validProposal);
      delete (metadata.body as any).title;
      
      const result = await cip108Validate(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail with wrong hash algorithm enum', async () => {
      const { metadata } = await cip108Generate(validProposal);
      metadata.hashAlgorithm = 'invalid' as any;
      
      const result = await cip108Validate(metadata);
      expect(result.valid).toBe(false);
    });
  });

  describe('Error Formatting', () => {
    it('should include path in errors', async () => {
      const { metadata } = await cip108Generate(validProposal);
      delete (metadata.body as any).title;
      
      const result = await cip108Validate(metadata);
      expect(result.errors[0].path).toBeDefined();
    });

    it('should include readable message in errors', async () => {
      const { metadata } = await cip108Generate(validProposal);
      delete (metadata.body as any).title;
      
      const result = await cip108Validate(metadata);
      expect(result.errors[0].message).toBeDefined();
      expect(result.errors[0].message.length).toBeGreaterThan(0);
    });
  });
});
