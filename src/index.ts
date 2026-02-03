/**
 * ConstitutionGuard Proposer Skill
 * Main entry point for OpenClaw integration
 */

import { governanceIntake } from './tools/governance-intake';
import { constitutionCheck } from './tools/constitution-check';
import { cip108Generate } from './tools/cip108-generate';
import { cip108Validate } from './tools/cip108-validate';

// Export tools for OpenClaw
export {
  governanceIntake,
  constitutionCheck,
  cip108Generate,
  cip108Validate
};

// Skill initialization
export function init() {
  console.log('ConstitutionGuard Proposer skill initialized');
}
