/**
 * Tests for Constitution Check Tool
 */

import { constitutionCheck } from '../tools/constitution-check';
import { ProposalData } from '../tools/governance-intake';

describe('constitutionCheck', () => {
  describe('Treasury Withdrawal Compliance', () => {
    it('should identify Article II Section 7 for treasury withdrawals', async () => {
      const proposal: ProposalData = {
        actionType: 'TreasuryWithdrawal',
        title: 'Test Treasury Request',
        abstract: 'Requesting funds for project',
        motivation: 'We need funding',
        rationale: 'This will help',
        amount: '500000',
        recipient: 'addr123',
        purpose: 'Project funding',
        timeline: '6 months'
      };
      
      const result = await constitutionCheck(proposal);
      
      const articleII = result.relevantArticles.find(
        a => a.article === 'Article II' && a.section === 'Section 7'
      );
      expect(articleII).toBeDefined();
    });

    it('should flag missing purpose as critical', async () => {
      const proposal: ProposalData = {
        actionType: 'TreasuryWithdrawal',
        title: 'Test',
        abstract: 'Requesting funds',
        motivation: 'We need it',
        rationale: 'Good idea',
        amount: '500000',
        recipient: 'addr123',
        timeline: '6 months'
        // purpose is missing
      };
      
      const result = await constitutionCheck(proposal);
      
      const conflict = result.potentialConflicts.find(
        c => c.article.includes('7.1') && c.issue.includes('Purpose')
      );
      expect(conflict?.severity).toBe('critical');
    });

    it('should flag missing timeline as critical', async () => {
      const proposal: ProposalData = {
        actionType: 'TreasuryWithdrawal',
        title: 'Test',
        abstract: 'Requesting funds',
        motivation: 'We need it',
        rationale: 'Good idea',
        amount: '500000',
        recipient: 'addr123',
        purpose: 'Project'
        // timeline is missing
      };
      
      const result = await constitutionCheck(proposal);
      
      const conflict = result.potentialConflicts.find(
        c => c.article.includes('7.1') && c.issue.includes('timeline')
      );
      expect(conflict?.severity).toBe('critical');
    });

    it('should warn about missing audit mention', async () => {
      const proposal: ProposalData = {
        actionType: 'TreasuryWithdrawal',
        title: 'Test',
        abstract: 'Requesting funds',
        motivation: 'We need it',
        rationale: 'Good idea without independent review mention',
        amount: '500000',
        recipient: 'addr123',
        purpose: 'Project',
        timeline: '6 months'
      };
      
      const result = await constitutionCheck(proposal);
      
      const conflict = result.potentialConflicts.find(
        c => c.article.includes('7.4')
      );
      expect(conflict?.severity).toBe('warning');
    });

    it('should warn about missing administrator mention', async () => {
      const proposal: ProposalData = {
        actionType: 'TreasuryWithdrawal',
        title: 'Test',
        abstract: 'Requesting funds',
        motivation: 'We need it',
        rationale: 'Good idea',
        amount: '500000',
        recipient: 'addr123',
        purpose: 'Project',
        timeline: '6 months'
      };
      
      const result = await constitutionCheck(proposal);
      
      const conflict = result.potentialConflicts.find(
        c => c.article.includes('7.5')
      );
      expect(conflict?.severity).toBe('warning');
    });
  });

  describe('Parameter Update Compliance', () => {
    it('should identify Appendix I Section 2 for parameter updates', async () => {
      const proposal: ProposalData = {
        actionType: 'ParameterUpdate',
        title: 'Update block size',
        abstract: 'Increase max block body size',
        motivation: 'Improve throughput',
        rationale: 'Network can handle it',
        parameters: { maxBlockBodySize: '100000' }
      };
      
      const result = await constitutionCheck(proposal);
      
      const appendix = result.relevantArticles.find(
        a => a.article === 'Appendix I' && a.section === 'Section 2'
      );
      expect(appendix).toBeDefined();
    });

    it('should warn about missing technical review', async () => {
      const proposal: ProposalData = {
        actionType: 'ParameterUpdate',
        title: 'Update param',
        abstract: 'Change parameter',
        motivation: 'Need change',
        rationale: 'Good reason',
        parameters: { maxBlockBodySize: '100000' }
      };
      
      const result = await constitutionCheck(proposal);
      
      const conflict = result.potentialConflicts.find(
        c => c.article.includes('6.3')
      );
      expect(conflict?.severity).toBe('warning');
    });
  });

  describe('General Requirements', () => {
    it('should identify Article II Section 6 for all proposals', async () => {
      const proposal: ProposalData = {
        actionType: 'InfoAction',
        title: 'Information',
        abstract: 'Just info',
        motivation: 'Sharing info',
        rationale: 'Good to know'
      };
      
      const result = await constitutionCheck(proposal);
      
      const articleII = result.relevantArticles.find(
        a => a.article === 'Article II' && a.section === 'Section 6'
      );
      expect(articleII).toBeDefined();
    });

    it('should warn about short title', async () => {
      const proposal: ProposalData = {
        actionType: 'InfoAction',
        title: 'Hi',
        abstract: 'Information',
        motivation: 'Sharing',
        rationale: 'Good'
      };
      
      const result = await constitutionCheck(proposal);
      
      const conflict = result.potentialConflicts.find(
        c => c.issue.includes('short')
      );
      expect(conflict).toBeDefined();
    });

    it('should warn about short abstract', async () => {
      const proposal: ProposalData = {
        actionType: 'InfoAction',
        title: 'Test Title Here',
        abstract: 'Hi',
        motivation: 'Sharing',
        rationale: 'Good'
      };
      
      const result = await constitutionCheck(proposal);
      
      const conflict = result.potentialConflicts.find(
        c => c.issue.includes('Abstract') && c.issue.includes('short')
      );
      expect(conflict).toBeDefined();
    });
  });

  describe('Recommendations', () => {
    it('should provide general recommendations for all proposals', async () => {
      const proposal: ProposalData = {
        actionType: 'InfoAction',
        title: 'Test Proposal',
        abstract: 'This is a test',
        motivation: 'Testing',
        rationale: 'Good'
      };
      
      const result = await constitutionCheck(proposal);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('IPFS'))).toBe(true);
    });

    it('should provide treasury-specific recommendations', async () => {
      const proposal: ProposalData = {
        actionType: 'TreasuryWithdrawal',
        title: 'Test Treasury',
        abstract: 'Requesting funds',
        motivation: 'Need it',
        rationale: 'Good',
        amount: '500000',
        recipient: 'addr',
        purpose: 'Project',
        timeline: '6 months'
      };
      
      const result = await constitutionCheck(proposal);
      
      expect(result.recommendations.some(r => r.includes('audit'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('24 months'))).toBe(true);
    });
  });
});
