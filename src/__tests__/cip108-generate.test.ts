/**
 * Tests for CIP-108 Generator Tool
 */

import { cip108Generate, addAuthor, addReference, metadataToJson } from '../tools/cip108-generate';
import { ProposalData } from '../tools/governance-intake';

const baseProposal: ProposalData = {
  actionType: 'TreasuryWithdrawal',
  title: 'Cardano DeFi Liquidity Budget - Withdrawal 1',
  abstract: 'This proposal requests 500,000 ADA from the treasury for establishing legal framework and smart contract infrastructure.',
  motivation: 'The Cardano DeFi ecosystem needs liquidity support to compete with other chains.',
  rationale: 'By providing 500K ADA liquidity, we can bootstrap DeFi protocols and attract developers.',
  amount: '500000',
  recipient: 'addr1q9...',
  purpose: 'DeFi liquidity provision',
  timeline: '6 months'
};

describe('cip108Generate', () => {
  it('should generate valid CIP-108 structure', async () => {
    const result = await cip108Generate(baseProposal);
    
    expect(result.metadata['@context']).toBeDefined();
    expect(result.metadata['@type']).toBe('GovernanceAction');
    expect(result.metadata.hashAlgorithm).toBe('blake2b-256');
    expect(result.metadata.authors).toEqual([]);
  });

  it('should include all required body fields', async () => {
    const result = await cip108Generate(baseProposal);
    
    expect(result.metadata.body.title).toBe(baseProposal.title);
    expect(result.metadata.body.abstract).toBe(baseProposal.abstract);
    expect(result.metadata.body.motivation).toBe(baseProposal.motivation);
    expect(result.metadata.body.rationale).toBe(baseProposal.rationale);
  });

  it('should truncate title over 80 characters', async () => {
    const longTitle = 'A'.repeat(100);
    const proposal = { ...baseProposal, title: longTitle };
    
    const result = await cip108Generate(proposal);
    
    expect(result.metadata.body.title.length).toBeLessThanOrEqual(80);
    expect(result.truncated).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should truncate abstract over 2500 characters', async () => {
    const longAbstract = 'B'.repeat(3000);
    const proposal = { ...baseProposal, abstract: longAbstract };
    
    const result = await cip108Generate(proposal);
    
    expect(result.metadata.body.abstract.length).toBeLessThanOrEqual(2500);
    expect(result.truncated).toBe(true);
  });

  it('should not truncate when under limits', async () => {
    const result = await cip108Generate(baseProposal);
    
    expect(result.truncated).toBe(false);
    expect(result.warnings.length).toBe(0);
  });

  it('should have correct CIP-108 context structure', async () => {
    const result = await cip108Generate(baseProposal);
    const context = result.metadata['@context'];
    
    expect(context['@language']).toBe('en-us');
    expect(context.CIP100).toContain('CIP-0100');
    expect(context.CIP108).toContain('CIP-0108');
    expect(context.body['@id']).toBe('CIP108:body');
  });
});

describe('addAuthor', () => {
  it('should add author without witness', async () => {
    const { metadata } = await cip108Generate(baseProposal);
    const updated = addAuthor(metadata, 'John Doe');
    
    expect(updated.authors).toHaveLength(1);
    expect(updated.authors[0].name).toBe('John Doe');
    expect(updated.authors[0].witness).toBeUndefined();
  });

  it('should add author with witness', async () => {
    const { metadata } = await cip108Generate(baseProposal);
    const updated = addAuthor(metadata, 'Jane Doe', {
      witnessAlgorithm: 'ed25519',
      publicKey: 'abc123',
      signature: 'sig456'
    });
    
    expect(updated.authors[0].name).toBe('Jane Doe');
    expect(updated.authors[0].witness.witnessAlgorithm).toBe('ed25519');
  });

  it('should preserve existing authors', async () => {
    let { metadata } = await cip108Generate(baseProposal);
    metadata = addAuthor(metadata, 'First Author');
    metadata = addAuthor(metadata, 'Second Author');
    
    expect(metadata.authors).toHaveLength(2);
  });
});

describe('addReference', () => {
  it('should add reference without hash', async () => {
    const { metadata } = await cip108Generate(baseProposal);
    const updated = addReference(metadata, 'Other', 'Documentation', 'https://example.com/docs');
    
    expect(updated.body.references).toHaveLength(1);
    expect(updated.body.references![0].label).toBe('Documentation');
    expect(updated.body.references![0].referenceHash).toBeUndefined();
  });

  it('should add reference with hash', async () => {
    const { metadata } = await cip108Generate(baseProposal);
    const updated = addReference(
      metadata, 
      'GovernanceMetadata', 
      'Previous Action', 
      'https://govtool.com/action/123',
      'hashabc123'
    );
    
    expect(updated.body.references![0].referenceHash?.hashDigest).toBe('hashabc123');
    expect(updated.body.references![0].referenceHash?.hashAlgorithm).toBe('blake2b-256');
  });
});

describe('metadataToJson', () => {
  it('should produce valid JSON', async () => {
    const { metadata } = await cip108Generate(baseProposal);
    const json = metadataToJson(metadata);
    
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
