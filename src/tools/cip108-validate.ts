/**
 * CIP-108 Schema Validator
 * Validates metadata against CIP-108 schema using AJV
 */

import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import { CIP108Metadata } from './cip108-generate';
import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
  warnings: string[];
}

// Cache compiled validator
let validator: ValidateFunction | null = null;

/**
 * Load and compile CIP-108 schema
 */
function getValidator(): ValidateFunction {
  if (validator) {
    return validator;
  }
  
  const ajv = new Ajv({ strict: false, allErrors: true });
  const schemaPath = path.join(__dirname, '../../data/cip108-schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  
  validator = ajv.compile(schema);
  return validator;
}

/**
 * Check business rules beyond schema validation
 */
function checkBusinessRules(metadata: CIP108Metadata): string[] {
  const warnings: string[] = [];
  
  // Check title length (CIP-108: max 80 chars)
  if (metadata.body.title.length > 80) {
    warnings.push('Title exceeds 80 characters');
  }
  
  // Check abstract length (CIP-108: max 2500 chars)
  if (metadata.body.abstract.length > 2500) {
    warnings.push('Abstract exceeds 2500 characters');
  }
  
  // Check title doesn't contain markdown (should not per CIP-108)
  const markdownPattern = /[*_\[\]`#]/;
  if (markdownPattern.test(metadata.body.title)) {
    warnings.push('Title contains markdown formatting (not recommended per CIP-108)');
  }
  
  // Check for sufficient content
  if (metadata.body.title.length < 10) {
    warnings.push('Title is very short (less than 10 characters)');
  }
  
  if (metadata.body.abstract.length < 50) {
    warnings.push('Abstract is very short (less than 50 characters)');
  }
  
  if (metadata.body.motivation.length < 100) {
    warnings.push('Motivation is very short (less than 100 characters)');
  }
  
  if (metadata.body.rationale.length < 100) {
    warnings.push('Rationale is very short (less than 100 characters)');
  }
  
  // Check for required fields presence
  if (!metadata.body.title || metadata.body.title.trim() === '') {
    warnings.push('Title is empty');
  }
  
  if (!metadata.body.abstract || metadata.body.abstract.trim() === '') {
    warnings.push('Abstract is empty');
  }
  
  if (!metadata.body.motivation || metadata.body.motivation.trim() === '') {
    warnings.push('Motivation is empty');
  }
  
  if (!metadata.body.rationale || metadata.body.rationale.trim() === '') {
    warnings.push('Rationale is empty');
  }
  
  // Check hash algorithm
  if (metadata.hashAlgorithm !== 'blake2b-256') {
    warnings.push('Hash algorithm should be blake2b-256 per CIP-100');
  }
  
  return warnings;
}

/**
 * Format AJV errors into readable format
 */
function formatErrors(ajvErrors: ErrorObject[]): Array<{path: string; message: string}> {
  return ajvErrors.map(error => {
    const path = error.instancePath || 'root';
    let message = error.message || 'Unknown error';
    
    // Enhance error messages
    if (error.keyword === 'required') {
      message = `Missing required field: ${error.params.missingProperty}`;
    } else if (error.keyword === 'maxLength') {
      message = `Too long: maximum ${error.params.limit} characters allowed`;
    } else if (error.keyword === 'enum') {
      message = `Invalid value: must be one of [${error.params.allowedValues?.join(', ')}]`;
    }
    
    return {
      path: path.replace(/\//g, '.') || 'root',
      message
    };
  });
}

/**
 * Validate CIP-108 metadata against schema
 */
export async function cip108Validate(metadata: CIP108Metadata): Promise<ValidationResult> {
  try {
    const validate = getValidator();
    const valid = validate(metadata);
    
    let errors: Array<{path: string; message: string}> = [];
    
    if (!valid && validate.errors) {
      errors = formatErrors(validate.errors);
    }
    
    // Always check business rules
    const warnings = checkBusinessRules(metadata);
    
    return {
      valid: valid && errors.length === 0,
      errors,
      warnings
    };
    
  } catch (error) {
    return {
      valid: false,
      errors: [{
        path: 'validator',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      warnings: []
    };
  }
}

/**
 * Quick validation check (returns boolean only)
 */
export function isValidCIP108(metadata: CIP108Metadata): boolean {
  try {
    const validate = getValidator();
    return validate(metadata) === true;
  } catch {
    return false;
  }
}
