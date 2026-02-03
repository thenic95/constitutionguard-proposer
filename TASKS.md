# Implementation Tasks

**Repository:** https://github.com/thenic95/constitutionguard-proposer  
**Goal:** MVP ready for Sokosumi deployment

---

## Task Overview

| Task | Component | Priority | Status | Assignee |
|------|-----------|----------|--------|----------|
| 1 | Governance Intake Tool | P0 | 🔵 Ready | Sub-agent |
| 2 | Constitution Check Tool | P0 | 🔵 Ready | Sub-agent |
| 3 | CIP-108 Generator Tool | P0 | 🔵 Ready | Sub-agent |
| 4 | CIP-108 Validator Tool | P0 | 🔵 Ready | Sub-agent |
| 5 | Integration & Testing | P0 | ⏳ Blocked | Awaiting Tasks 1-4 |
| 6 | Masumi Packaging | P1 | ⏳ Blocked | Awaiting Task 5 |

---

## Task 1: Governance Intake Tool

**File:** `src/tools/governance-intake.ts`

**Requirements:**
- Conduct structured interview to gather proposal details
- Ask about: action type, title, abstract, motivation, rationale
- For TreasuryWithdrawals: amount, recipient, purpose, timeline
- Return structured ProposalData object
- Use Zod for input validation
- Clear error messages for missing fields

**Acceptance Criteria:**
- [ ] Handles both free-text and structured input
- [ ] Validates all required fields
- [ ] Asks clarifying questions for missing fields
- [ ] Returns valid ProposalData object
- [ ] TypeScript compiles without errors

**Test Case:**
```typescript
const result = await governanceIntake(
  "I want to request 500,000 ADA from the treasury for a DeFi liquidity program"
);
// Should ask for: action type, purpose, timeline, recipient
// Should return: ProposalData with actionType='TreasuryWithdrawal', amount='500000'
```

---

## Task 2: Constitution Check Tool

**File:** `src/tools/constitution-check.ts`

**Requirements:**
- Load Cardano Constitution from `data/constitution.md`
- Analyze proposal against relevant articles
- Identify specific constitutional requirements that apply
- Flag potential conflicts with citations
- Return ComplianceReport

**Acceptance Criteria:**
- [ ] Efficiently loads constitution (~100KB file)
- [ ] Identifies relevant articles for proposal type
- [ ] Cites specific article numbers/sections
- [ ] Flags conflicts with severity levels
- [ ] Returns actionable recommendations

**Test Case:**
```typescript
const proposal = {
  actionType: 'TreasuryWithdrawal',
  amount: '500000',
  purpose: 'DeFi liquidity'
};
const report = await constitutionCheck(proposal);
// Should identify: Article II Section 7 (Treasury requirements)
// Should flag if: Missing audit allocation, admin designation
```

---

## Task 3: CIP-108 Generator Tool

**File:** `src/tools/cip108-generate.ts`

**Requirements:**
- Convert ProposalData to CIP-108 JSON-LD format
- Apply character limits (title: 80, abstract: 2500)
- Generate proper @context and @type fields
- Include motivation, rationale with markdown support

**Acceptance Criteria:**
- [ ] Strict adherence to CIP-108 schema
- [ ] Truncates with warnings if limits exceeded
- [ ] Proper JSON-LD structure
- [ ] Includes correct @context from CIP-108

**Test Case:**
```typescript
const metadata = await cip108Generate(proposal);
// metadata['@context'] should be correct
// metadata.title.length <= 80
// metadata.abstract.length <= 2500
```

---

## Task 4: CIP-108 Validator Tool

**File:** `src/tools/cip108-validate.ts`

**Requirements:**
- Load schema from `data/cip108-schema.json`
- Validate metadata against schema using AJV
- Return detailed validation errors
- Check field completeness

**Acceptance Criteria:**
- [ ] Uses AJV for schema validation
- [ ] Clear error messages with paths
- [ ] Checks both schema compliance and business rules
- [ ] Fast fail on critical errors

**Test Case:**
```typescript
const result = await cip108Validate(metadata);
// result.valid should be true for valid metadata
// result.errors should contain path and message for invalid metadata
```

---

## Task 5: Integration & Testing

**Blocked by:** Tasks 1-4

**Requirements:**
- Wire all tools together in main flow
- Create integration tests
- Add example test cases

**Acceptance Criteria:**
- [ ] End-to-end flow works: Intake → Check → Generate → Validate
- [ ] All tests pass
- [ ] Example governance action produces valid output

---

## Task 6: Masumi Packaging

**Blocked by:** Task 5

**Requirements:**
- Create Masumi payment service integration
- Package for Sokosumi marketplace
- Set pricing (25 credits)

**Acceptance Criteria:**
- [ ] Skill deploys to Masumi
- [ ] Pricing configured correctly
- [ ] Ready for Sokosumi listing

---

## Development Standards (Senior Engineer Checklist)

Each task must:
- [ ] Follow TypeScript best practices
- [ ] Include proper error handling
- [ ] Have clear function signatures
- [ ] Be testable
- [ ] Handle edge cases gracefully
- [ ] Include inline documentation
- [ ] Pass `npm run build` without errors
- [ ] Follow existing code style

---

## Notes

- All tasks should work with the existing scaffold
- Do not change file structure without discussion
- Test against the provided test cases
- Commit to the same repository
