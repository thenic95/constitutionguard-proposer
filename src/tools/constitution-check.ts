/**
 * Constitution Check Tool
 * Analyzes proposals against the Cardano Constitution
 */

import { ProposalData } from './governance-intake';
import * as fs from 'fs';
import * as path from 'path';

export interface ComplianceReport {
  relevantArticles: Array<{
    article: string;
    section: string;
    relevance: string;
  }>;
  potentialConflicts: Array<{
    article: string;
    issue: string;
    severity: 'warning' | 'critical';
  }>;
  recommendations: string[];
}

// Cache constitution content
let constitutionCache: string | null = null;

/**
 * Load the Cardano Constitution from file
 */
function loadConstitution(): string {
  if (constitutionCache) {
    return constitutionCache;
  }
  
  const constitutionPath = path.join(__dirname, '../../data/constitution.md');
  constitutionCache = fs.readFileSync(constitutionPath, 'utf-8');
  return constitutionCache;
}

/**
 * Get relevant articles based on action type
 */
function getRelevantArticles(actionType: string): Array<{article: string; section: string; relevance: string}> {
  const articles: Array<{article: string; section: string; relevance: string}> = [];
  
  // All governance actions must comply with Article II Section 6
  articles.push({
    article: 'Article II',
    section: 'Section 6',
    relevance: 'Governance Action Standards - applies to ALL governance actions'
  });
  
  switch (actionType) {
    case 'TreasuryWithdrawal':
      articles.push({
        article: 'Article II',
        section: 'Section 7',
        relevance: 'Treasury Withdrawals Action Standards - specific requirements for treasury withdrawals'
      });
      articles.push({
        article: 'Appendix I',
        section: 'Section 3',
        relevance: 'TREASURY guardrails - limits and requirements'
      });
      break;
      
    case 'ParameterUpdate':
      articles.push({
        article: 'Appendix I',
        section: 'Section 2',
        relevance: 'Parameter Update guardrails - technical and security limits'
      });
      break;
      
    case 'HardForkInitiation':
      articles.push({
        article: 'Appendix I',
        section: 'Section 4',
        relevance: 'Hard Fork guardrails - upgrade requirements'
      });
      break;
      
    case 'UpdateCommittee':
      articles.push({
        article: 'Article III',
        section: 'All',
        relevance: 'Constitutional Committee provisions'
      });
      articles.push({
        article: 'Appendix I',
        section: 'Section 5',
        relevance: 'Update Committee guardrails'
      });
      break;
      
    case 'NewConstitution':
      articles.push({
        article: 'Article IV',
        section: 'Section 1',
        relevance: 'Amendment Process - requires 65% approval'
      });
      articles.push({
        article: 'Appendix I',
        section: 'Section 6',
        relevance: 'New Constitution guardrails'
      });
      break;
  }
  
  // All actions must be reviewed by CC per Article III
  articles.push({
    article: 'Article III',
    section: 'Section 1',
    relevance: 'Constitutional Committee review required'
  });
  
  return articles;
}

/**
 * Check Treasury Withdrawal specific requirements
 */
function checkTreasuryWithdrawal(proposal: ProposalData): Array<{article: string; issue: string; severity: 'warning' | 'critical'}> {
  const conflicts: Array<{article: string; issue: string; severity: 'warning' | 'critical'}> = [];
  
  // Article II Section 7.1: Must specify terms of withdrawal
  if (!proposal.purpose) {
    conflicts.push({
      article: 'Article II Section 7.1',
      issue: 'Missing: Purpose of the withdrawal',
      severity: 'critical'
    });
  }
  
  if (!proposal.timeline) {
    conflicts.push({
      article: 'Article II Section 7.1',
      issue: 'Missing: Period for delivery of proposed activities',
      severity: 'critical'
    });
  }
  
  // Article II Section 7.4: Must include audit allocation
  // Note: This would need to be checked in the rationale/motivation
  if (!proposal.rationale?.toLowerCase().includes('audit')) {
    conflicts.push({
      article: 'Article II Section 7.4',
      issue: 'Warning: No explicit mention of audit allocation in rationale',
      severity: 'warning'
    });
  }
  
  // Article II Section 7.5: Must designate administrator
  if (!proposal.rationale?.toLowerCase().includes('administrator') && 
      !proposal.motivation?.toLowerCase().includes('administrator')) {
    conflicts.push({
      article: 'Article II Section 7.5',
      issue: 'Warning: No explicit mention of fund administrator',
      severity: 'warning'
    });
  }
  
  // TREASURY-03a: Must be denominated in ADA
  // (This is implicit since we're working with ADA amounts)
  
  return conflicts;
}

/**
 * Check Parameter Update specific requirements
 */
function checkParameterUpdate(proposal: ProposalData): Array<{article: string; issue: string; severity: 'warning' | 'critical'}> {
  const conflicts: Array<{article: string; issue: string; severity: 'warning' | 'critical'}> = [];
  
  // Article II Section 6.3: Must undergo sufficient technical review
  if (!proposal.rationale?.toLowerCase().includes('technical') &&
      !proposal.rationale?.toLowerCase().includes('benchmark')) {
    conflicts.push({
      article: 'Article II Section 6.3',
      issue: 'Warning: Technical review or benchmarking not explicitly mentioned',
      severity: 'warning'
    });
  }
  
  // PARAM-01: Only explicitly named parameters can be changed
  if (proposal.parameters) {
    const validParams = [
      'maxBlockBodySize', 'maxTxSize', 'maxBlockHeaderSize', 'maxValueSize',
      'maxBlockExecutionUnits', 'txFeePerByte', 'txFeeFixed', 'minFeeRefScriptCoinsPerByte',
      'utxoCostPerByte', 'govDeposit', 'stakeAddressDeposit', 'stakePoolDeposit',
      'minPoolCost', 'dRepDeposit', 'committeeMinSize', 'committeeMaxTermLength',
      'monetaryExpansion', 'treasuryCut', 'executionUnitPrices', 'stakePoolTargetNum',
      'poolPledgeInfluence', 'poolRetireMaxEpoch', 'collateralPercentage',
      'maxCollateralInputs', 'costModels', 'dRepVotingThresholds', 'poolVotingThresholds',
      'govActionLifetime', 'dRepActivity'
    ];
    
    for (const param of Object.keys(proposal.parameters)) {
      if (!validParams.some(vp => param.startsWith(vp))) {
        conflicts.push({
          article: 'Appendix I PARAM-01',
          issue: `Critical: Parameter "${param}" is not explicitly named in the guardrails`,
          severity: 'critical'
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Generate recommendations based on proposal
 */
function generateRecommendations(proposal: ProposalData): string[] {
  const recommendations: string[] = [];
  
  // General recommendations for all proposals
  recommendations.push(
    'Ensure your metadata is hosted on an immutable storage (IPFS recommended)',
    'Include a hash of your metadata document for verification',
    'Make sure the on-chain action content matches the off-chain version exactly'
  );
  
  // Type-specific recommendations
  switch (proposal.actionType) {
    case 'TreasuryWithdrawal':
      recommendations.push(
        'Disclose any prior treasury funding received in the last 24 months',
        'Confirm the requested amount does not exceed the Net Change Limit',
        'Designate specific administrators with multisig requirements',
        'Include allocation for independent audits',
        'Specify refund circumstances if deliverables are not met'
      );
      break;
      
    case 'ParameterUpdate':
      recommendations.push(
        'Provide benchmarking results or technical analysis',
        'Consider the 90-day review period for critical parameters',
        'Include a reversion plan in case of adverse effects',
        'Monitor network performance for at least 2 epochs after implementation'
      );
      break;
      
    case 'HardForkInitiation':
      recommendations.push(
        'Ensure at least 85% of SPOs have upgraded to compatible node versions',
        'Coordinate with major exchanges and infrastructure providers',
        'Provide clear timeline for the hard fork'
      );
      break;
  }
  
  return recommendations;
}

/**
 * Analyze proposal against the Cardano Constitution
 */
export async function constitutionCheck(
  proposal: ProposalData
): Promise<ComplianceReport> {
  // Load constitution (for potential future use in LLM analysis)
  const constitution = loadConstitution();
  
  // Get relevant articles
  const relevantArticles = getRelevantArticles(proposal.actionType);
  
  // Check for conflicts based on action type
  let potentialConflicts: Array<{article: string; issue: string; severity: 'warning' | 'critical'}> = [];
  
  switch (proposal.actionType) {
    case 'TreasuryWithdrawal':
      potentialConflicts = checkTreasuryWithdrawal(proposal);
      break;
      
    case 'ParameterUpdate':
      potentialConflicts = checkParameterUpdate(proposal);
      break;
      
    // Additional action types can be added here
  }
  
  // General checks for all proposals
  if (!proposal.title || proposal.title.length < 10) {
    potentialConflicts.push({
      article: 'Article II Section 6.2',
      issue: 'Title should be descriptive (at least 10 characters)',
      severity: 'warning'
    });
  }
  
  if (!proposal.abstract || proposal.abstract.length < 50) {
    potentialConflicts.push({
      article: 'Article II Section 6.2',
      issue: 'Abstract should provide sufficient context (at least 50 characters)',
      severity: 'warning'
    });
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(proposal);
  
  return {
    relevantArticles,
    potentialConflicts,
    recommendations
  };
}
