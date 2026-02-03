/**
 * CIP-108 Metadata Generator
 * Converts ProposalData to CIP-108 compliant JSON-LD
 */

import { ProposalData } from './governance-intake';

export interface CIP108Metadata {
  '@context': {
    '@language': string;
    'CIP100': string;
    'CIP108': string;
    'hashAlgorithm': string;
    'body': {
      '@id': string;
      '@context': {
        'references': {
          '@id': string;
          '@container': string;
          '@context': {
            'GovernanceMetadata': string;
            'Other': string;
            'label': string;
            'uri': string;
            'referenceHash': {
              '@id': string;
              '@context': {
                'hashDigest': string;
                'hashAlgorithm': string;
              };
            };
          };
        };
        'title': string;
        'abstract': string;
        'motivation': string;
        'rationale': string;
      };
    };
    'authors': {
      '@id': string;
      '@container': string;
      '@context': {
        'name': string;
        'witness': {
          '@id': string;
          '@context': {
            'witnessAlgorithm': string;
            'publicKey': string;
            'signature': string;
          };
        };
      };
    };
  };
  '@type': 'GovernanceAction';
  authors: any[];
  hashAlgorithm: 'blake2b-256';
  body: {
    title: string;
    abstract: string;
    motivation: string;
    rationale: string;
    references?: Array<{
      '@type': 'GovernanceMetadata' | 'Other';
      label: string;
      uri: string;
      referenceHash?: {
        hashDigest: string;
        hashAlgorithm: 'blake2b-256';
      };
    }>;
  };
}

export interface GenerationResult {
  metadata: CIP108Metadata;
  warnings: string[];
  truncated: boolean;
}

/**
 * CIP-108 @context definition
 */
const CIP108_CONTEXT = {
  '@language': 'en-us',
  'CIP100': 'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#',
  'CIP108': 'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0108/README.md#',
  'hashAlgorithm': 'CIP100:hashAlgorithm',
  'body': {
    '@id': 'CIP108:body',
    '@context': {
      'references': {
        '@id': 'CIP108:references',
        '@container': '@set',
        '@context': {
          'GovernanceMetadata': 'CIP100:GovernanceMetadataReference',
          'Other': 'CIP100:OtherReference',
          'label': 'CIP100:reference-label',
          'uri': 'CIP100:reference-uri',
          'referenceHash': {
            '@id': 'CIP108:referenceHash',
            '@context': {
              'hashDigest': 'CIP108:hashDigest',
              'hashAlgorithm': 'CIP100:hashAlgorithm'
            }
          }
        }
      },
      'title': 'CIP108:title',
      'abstract': 'CIP108:abstract',
      'motivation': 'CIP108:motivation',
      'rationale': 'CIP108:rationale'
    }
  },
  'authors': {
    '@id': 'CIP100:authors',
    '@container': '@set',
    '@context': {
      'name': 'http://xmlns.com/foaf/0.1/name',
      'witness': {
        '@id': 'CIP100:witness',
        '@context': {
          'witnessAlgorithm': 'CIP100:witnessAlgorithm',
          'publicKey': 'CIP100:publicKey',
          'signature': 'CIP100:signature'
        }
      }
    }
  }
};

/**
 * Truncate text to max length with ellipsis
 */
function truncate(text: string, maxLength: number, fieldName: string): { text: string; warning?: string } {
  if (text.length <= maxLength) {
    return { text };
  }
  
  const truncated = text.slice(0, maxLength - 3) + '...';
  return {
    text: truncated,
    warning: `${fieldName} was truncated from ${text.length} to ${maxLength} characters`
  };
}

/**
 * Build references section if applicable
 */
function buildReferences(proposal: ProposalData): CIP108Metadata['body']['references'] | undefined {
  const references: CIP108Metadata['body']['references'] = [];
  
  // For treasury withdrawals, add references to supporting documents
  if (proposal.actionType === 'TreasuryWithdrawal') {
    // These would typically be provided by the user
    // For now, return undefined to keep it optional
    return undefined;
  }
  
  return references.length > 0 ? references : undefined;
}

/**
 * Generate CIP-108 compliant metadata
 */
export async function cip108Generate(proposal: ProposalData): Promise<GenerationResult> {
  const warnings: string[] = [];
  let truncated = false;
  
  // Process title (max 80 chars, no markdown)
  const titleResult = truncate(proposal.title, 80, 'Title');
  if (titleResult.warning) {
    warnings.push(titleResult.warning);
    truncated = true;
  }
  
  // Process abstract (max 2500 chars, markdown supported)
  const abstractResult = truncate(proposal.abstract, 2500, 'Abstract');
  if (abstractResult.warning) {
    warnings.push(abstractResult.warning);
    truncated = true;
  }
  
  // Build the metadata structure
  const metadata: CIP108Metadata = {
    '@context': CIP108_CONTEXT,
    '@type': 'GovernanceAction',
    authors: [], // Authors to be added when signing
    hashAlgorithm: 'blake2b-256',
    body: {
      title: titleResult.text,
      abstract: abstractResult.text,
      motivation: proposal.motivation,
      rationale: proposal.rationale,
      references: buildReferences(proposal)
    }
  };
  
  return {
    metadata,
    warnings,
    truncated
  };
}

/**
 * Convert metadata to JSON string (for hashing/storage)
 */
export function metadataToJson(metadata: CIP108Metadata): string {
  // Use canonical JSON format for consistent hashing
  return JSON.stringify(metadata, null, 2);
}

/**
 * Add author to metadata
 */
export function addAuthor(
  metadata: CIP108Metadata,
  name: string,
  witness?: {
    witnessAlgorithm: 'ed25519' | 'CIP-0008';
    publicKey: string;
    signature: string;
  }
): CIP108Metadata {
  const author: any = { name };
  if (witness) {
    author.witness = witness;
  }
  
  return {
    ...metadata,
    authors: [...metadata.authors, author]
  };
}

/**
 * Add reference to metadata
 */
export function addReference(
  metadata: CIP108Metadata,
  type: 'GovernanceMetadata' | 'Other',
  label: string,
  uri: string,
  hashDigest?: string
): CIP108Metadata {
  const reference: any = {
    '@type': type,
    label,
    uri
  };
  
  if (hashDigest) {
    reference.referenceHash = {
      hashDigest,
      hashAlgorithm: 'blake2b-256'
    };
  }
  
  const existingRefs = metadata.body.references || [];
  
  return {
    ...metadata,
    body: {
      ...metadata.body,
      references: [...existingRefs, reference]
    }
  };
}
