/**
 * Governance Intake Tool
 * Conducts structured interview to gather proposal details
 */

import { z } from 'zod';

export const ProposalDataSchema = z.object({
  actionType: z.enum([
    'TreasuryWithdrawal',
    'ParameterUpdate', 
    'HardForkInitiation',
    'NoConfidence',
    'UpdateCommittee',
    'NewConstitution',
    'InfoAction'
  ]),
  title: z.string().max(80),
  abstract: z.string().max(2500),
  motivation: z.string(),
  rationale: z.string(),
  // Treasury-specific fields
  amount: z.string().optional(),
  recipient: z.string().optional(),
  purpose: z.string().optional(),
  timeline: z.string().optional(),
  // Parameter update fields
  parameters: z.record(z.string()).optional()
});

export type ProposalData = z.infer<typeof ProposalDataSchema>;

export interface IntakeResult {
  status: 'complete' | 'incomplete';
  data?: ProposalData;
  missingFields?: string[];
  questions?: string[];
}

/**
 * Parse free-text input to extract proposal information
 */
function parseInput(input: string): Partial<ProposalData> {
  const parsed: Partial<ProposalData> = {};
  const lowerInput = input.toLowerCase();
  
  // Detect action type
  if (lowerInput.includes('treasury') || lowerInput.includes('withdraw') || lowerInput.includes('fund')) {
    parsed.actionType = 'TreasuryWithdrawal';
  } else if (lowerInput.includes('parameter') || lowerInput.includes('protocol')) {
    parsed.actionType = 'ParameterUpdate';
  } else if (lowerInput.includes('hard fork') || lowerInput.includes('upgrade')) {
    parsed.actionType = 'HardForkInitiation';
  } else if (lowerInput.includes('no confidence')) {
    parsed.actionType = 'NoConfidence';
  } else if (lowerInput.includes('committee')) {
    parsed.actionType = 'UpdateCommittee';
  } else if (lowerInput.includes('constitution')) {
    parsed.actionType = 'NewConstitution';
  } else if (lowerInput.includes('info')) {
    parsed.actionType = 'InfoAction';
  }
  
  // Extract amount (look for patterns like "500,000 ADA", "1000000", "1M ADA")
  const amountMatch = input.match(/(\d{1,3}(?:,\d{3})*|\d+)(?:\s*(?:M|million|k|thousand))?\s*(?:ADA|ada)?/);
  if (amountMatch) {
    parsed.amount = amountMatch[1].replace(/,/g, '');
  }
  
  // Extract purpose/topic
  const purposeIndicators = ['for', 'to', 'purpose', 'goal'];
  for (const indicator of purposeIndicators) {
    const idx = lowerInput.indexOf(indicator);
    if (idx !== -1) {
      const after = input.slice(idx + indicator.length).trim();
      const endIdx = after.search(/[.!?]|\n|(?:for|and|but)/i);
      parsed.purpose = endIdx !== -1 ? after.slice(0, endIdx).trim() : after;
      break;
    }
  }
  
  return parsed;
}

/**
 * Get required fields for a given action type
 */
function getRequiredFields(actionType: string): string[] {
  const baseFields = ['actionType', 'title', 'abstract', 'motivation', 'rationale'];
  
  switch (actionType) {
    case 'TreasuryWithdrawal':
      return [...baseFields, 'amount', 'recipient', 'purpose', 'timeline'];
    case 'ParameterUpdate':
      return [...baseFields, 'parameters'];
    default:
      return baseFields;
  }
}

/**
 * Generate questions for missing fields
 */
function generateQuestions(data: Partial<ProposalData>): string[] {
  const questions: string[] = [];
  
  if (!data.title) {
    questions.push('What is the title of your governance action? (max 80 characters)');
  }
  
  if (!data.abstract) {
    questions.push('Please provide a brief abstract summarizing your proposal. (max 2500 characters)');
  }
  
  if (!data.motivation) {
    questions.push('What is the motivation behind this proposal? What problem are you solving?');
  }
  
  if (!data.rationale) {
    questions.push('What is the rationale? How does this proposal address the problem?');
  }
  
  if (data.actionType === 'TreasuryWithdrawal') {
    if (!data.amount) {
      questions.push('How much ADA are you requesting from the treasury?');
    }
    if (!data.recipient) {
      questions.push('Who is the recipient of these funds? (address or entity)');
    }
    if (!data.purpose) {
      questions.push('What is the specific purpose of this withdrawal?');
    }
    if (!data.timeline) {
      questions.push('What is the timeline for delivery of the proposed activities?');
    }
  }
  
  return questions;
}

/**
 * Conduct structured interview to gather proposal details
 */
export async function governanceIntake(userInput: string): Promise<IntakeResult> {
  // Parse the initial input
  const parsed = parseInput(userInput);
  
  // If action type not detected, we can't proceed
  if (!parsed.actionType) {
    return {
      status: 'incomplete',
      questions: [
        'What type of governance action is this?',
        'Options: TreasuryWithdrawal, ParameterUpdate, HardForkInitiation, NoConfidence, UpdateCommittee, NewConstitution, InfoAction'
      ]
    };
  }
  
  // Get required fields for this action type
  const requiredFields = getRequiredFields(parsed.actionType);
  
  // Check which fields are missing
  const missingFields: string[] = [];
  for (const field of requiredFields) {
    const value = parsed[field as keyof ProposalData];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    }
  }
  
  // If we have all required fields, validate and return
  if (missingFields.length === 0) {
    const validationResult = ProposalDataSchema.safeParse(parsed);
    
    if (validationResult.success) {
      return {
        status: 'complete',
        data: validationResult.data
      };
    } else {
      // Validation failed - extract readable errors
      const errors = validationResult.error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      );
      return {
        status: 'incomplete',
        missingFields: [],
        questions: ['Validation errors:', ...errors]
      };
    }
  }
  
  // Return questions for missing fields
  const questions = generateQuestions(parsed);
  
  return {
    status: 'incomplete',
    missingFields,
    questions
  };
}

/**
 * Merge additional input with existing partial data
 */
export function mergeIntake(
  existingData: Partial<ProposalData>, 
  additionalInput: string
): Partial<ProposalData> {
  const parsed = parseInput(additionalInput);
  
  // Merge fields, preferring new input for specific fields
  return {
    ...existingData,
    ...parsed,
    // If new input has specific field content, use it
    title: additionalInput.length < 100 && !additionalInput.includes('\n') 
      ? additionalInput 
      : existingData.title || parsed.title,
  };
}
