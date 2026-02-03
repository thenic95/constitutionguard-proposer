/**
 * ConstitutionGuard Proposer Skill
 * Main entry point for OpenClaw integration
 */

import { governanceIntake, IntakeResult, ProposalData, ProposalDataSchema } from './tools/governance-intake';
import { constitutionCheck, ComplianceReport } from './tools/constitution-check';
import { cip108Generate, CIP108Metadata, GenerationResult } from './tools/cip108-generate';
import { cip108Validate, ValidationResult } from './tools/cip108-validate';

// Export types
export type {
  ProposalData,
  IntakeResult,
  ComplianceReport,
  CIP108Metadata,
  GenerationResult,
  ValidationResult
};

// Export tools
export {
  governanceIntake,
  constitutionCheck,
  cip108Generate,
  cip108Validate
};

/**
 * Main workflow: Complete governance action preparation
 * 
 * Flow: Intake → Constitution Check → Generate → Validate
 */
export async function prepareGovernanceAction(
  userInput: string
): Promise<{
  success: boolean;
  intake?: IntakeResult;
  compliance?: ComplianceReport;
  generation?: GenerationResult;
  validation?: ValidationResult;
  error?: string;
}> {
  try {
    // Step 1: Intake
    const intake = await governanceIntake(userInput);

    if (intake.status === 'incomplete' || !intake.data) {
      return {
        success: false,
        intake,
        error: 'Intake incomplete - missing required fields'
      };
    }

    // Validate that intake data is complete
    const validatedData = ProposalDataSchema.safeParse(intake.data);
    if (!validatedData.success) {
      return {
        success: false,
        intake,
        error: 'Intake incomplete - missing required fields'
      };
    }

    // Step 2: Constitution Check
    const compliance = await constitutionCheck(validatedData.data);
    
    // Step 3: Generate CIP-108 Metadata
    const generation = await cip108Generate(validatedData.data);
    
    // Step 4: Validate
    const validation = await cip108Validate(generation.metadata);
    
    return {
      success: validation.valid,
      intake,
      compliance,
      generation,
      validation
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Skill initialization
export function init() {
  console.log('ConstitutionGuard Proposer skill initialized');
}
