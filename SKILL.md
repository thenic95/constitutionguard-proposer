# ConstitutionGuard Proposer Skill

OpenClaw skill for preparing Cardano governance actions with constitution compliance checking.

## Overview

This skill helps governance action proposers:
1. Structure their proposal through guided intake
2. Validate compliance with the Cardano Constitution
3. Generate CIP-108 compliant metadata
4. Output ready-to-submit governance action documents

## Tools

### `governance_intake`
Conducts structured interview to gather:
- Governance action type (TreasuryWithdrawal, ParameterUpdate, etc.)
- Title and abstract
- Motivation and rationale
- Financial details (for treasury withdrawals)
- Timeline and deliverables

### `constitution_check`
Analyzes proposal against the Cardano Constitution:
- Identifies relevant articles and guardrails
- Flags potential conflicts
- Provides compliance assessment

### `cip108_generate`
Generates CIP-108 compliant JSON-LD metadata:
- Validates character limits (title: 80, abstract: 2500)
- Structures motivation and rationale fields
- Includes proper @context and schema

### `cip108_validate`
Validates generated metadata:
- Schema validation against CIP-108
- Field completeness checks
- Returns validation errors if any

## Configuration

```json
{
  "BLOCKFROST_API_KEY": "your-blockfrost-api-key",
  "CARDANO_NETWORK": "mainnet"
}
```

## Data Files

- `data/constitution.md` - Full Cardano Constitution text
- `data/cip108-schema.json` - CIP-108 JSON schema for validation
- `data/treasury-requirements.txt` - Treasury withdrawal requirements guide

## Usage Flow

1. **Intake** → Gather proposal details via structured questions
2. **Validation** → Check completeness and refine
3. **Constitution Analysis** → Identify relevant articles and flag conflicts
4. **Revision** → User can revise once based on feedback
5. **Metadata Generation** → Create CIP-108 compliant output
6. **Final Validation** → Validate before delivery

## Development

```bash
npm install
npm run build
npm run dev  # Watch mode
```

## Masumi Integration

This skill is designed to be deployed on the Sokosumi marketplace:
- **Single tier pricing:** 25 credits
- **Includes:** Constitution check + CIP-108 metadata generation
- **Output:** Validated governance action metadata ready for submission
