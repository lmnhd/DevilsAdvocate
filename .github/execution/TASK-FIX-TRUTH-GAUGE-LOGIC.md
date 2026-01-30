# Execution Task: Fix Truth Gauge Logic

## Problem

The Truth Gauge shows **contradictory information**:
- **Verdict**: "Claim Unsupported" 
- **Confidence**: 85%
- **Gauge Label**: "True"

**User's confusion**: Does "85% True" mean the claim is 85% likely to be true, or that the Judge is 85% confident in their "Unsupported" verdict?

## Root Cause

The TruthGauge component (`src/components/DebateViewer/TruthGauge.tsx` lines 16-23) incorrectly treats **confidence** as **truth value**:

```typescript
if (clampedConfidence <= 33) {
  category = 'False';        // ❌ Wrong: Low confidence ≠ False claim
} else if (clampedConfidence >= 67) {
  category = 'True';         // ❌ Wrong: High confidence ≠ True claim
}
```

**The actual meaning of confidence** (from Judge prompt):
```
CONFIDENCE SCORE: [0-100] - How certain are you?
- 0-20: Highly uncertain, evidence contradicts or inconclusive
- 21-40: Lean toward skeptic but substantial uncertainty
- 41-60: Genuinely conflicted, moderate evidence both ways
- 61-80: Lean toward believer, reasonable evidence
- 81-100: High confidence in claim validity
```

So **85% confidence DOES mean** the Judge leans toward the Believer (claim is likely true), but the **Verdict parsing is broken**.

## Two Issues to Fix

### Issue 1: Verdict Parsing Failing

The streaming route (`app/api/debate/stream/route.ts` line 202) tries to extract the verdict:

```typescript
let verdictMatch = verdictText.match(/\*\*VERDICT\*\*:?\s*(.+?)(?:\n|\*\*)/i);
```

**Debug Step**: Add console.log to see what the Judge ACTUALLY outputs:

```typescript
console.log(`[JUDGE] 🔍 Full judge response:\n${verdictText}`);
console.log(`[JUDGE] 🔍 Extracted verdict: "${verdictMatch?.[1] || 'PARSE_FAILED'}"`);
```

**Hypothesis**: The Judge's actual output format doesn't match the regex, causing it to default to "Claim Unsupported" instead of "Claim Supported".

### Issue 2: Truth Gauge Label Should Match Verdict

The gauge should show:
- **"Supported"** when verdict is "Claim Supported" or "Claim Partially Supported"
- **"Unsupported"** when verdict is "Claim Unsupported"
- **"Contested"** when verdict is "Claim Unproven" or confidence is 40-60%

## Task 1: Debug Verdict Parsing (10 minutes)

**File**: `app/api/debate/stream/route.ts`

**Add logging** at line 201 (before verdict parsing):

```typescript
// Extract verdict details from judge response
const verdictText = event.data.content;

// 🔍 DEBUG: Log full response
console.log(`[STREAM] 🔍 ========== JUDGE RAW OUTPUT ==========`);
console.log(verdictText);
console.log(`[STREAM] 🔍 ========================================`);

// Try multiple verdict patterns
let verdictMatch = verdictText.match(/\*\*VERDICT\*\*:?\s*(.+?)(?:\n|\*\*)/i);
console.log(`[STREAM] 🔍 Pattern 1 match: "${verdictMatch?.[1] || 'NO MATCH'}"`);

if (!verdictMatch) {
  verdictMatch = verdictText.match(/^(.+?)(?:\n|\*\*CONFIDENCE)/im);
  console.log(`[STREAM] 🔍 Pattern 2 match: "${verdictMatch?.[1] || 'NO MATCH'}"`);
}
```

**Success Criteria**: You'll see the actual Judge output format and know why parsing fails.

---

## Task 2: Fix TruthGauge Component (20 minutes)

**File**: `src/components/DebateViewer/TruthGauge.tsx`

**Current Code** (lines 8-24):
```typescript
interface TruthGaugeProps {
  confidence: number; // 0-100
  isAnimating: boolean;
}

export function TruthGauge({ confidence, isAnimating }: TruthGaugeProps) {
  // Clamp confidence between 0 and 100
  const clampedConfidence = Math.max(0, Math.min(100, confidence));

  // Determine verdict category and color
  let category = 'Contested';
  let categoryColor = '#FBBF24';

  if (clampedConfidence <= 33) {
    category = 'False';
    categoryColor = '#EF4444';
  } else if (clampedConfidence >= 67) {
    category = 'True';
    categoryColor = '#10B981';
  }
```

**New Code** (pass verdict from parent):
```typescript
interface TruthGaugeProps {
  confidence: number; // 0-100
  verdict: string; // Judge's actual verdict text
  isAnimating: boolean;
}

export function TruthGauge({ confidence, verdict, isAnimating }: TruthGaugeProps) {
  // Clamp confidence between 0 and 100
  const clampedConfidence = Math.max(0, Math.min(100, confidence));

  // Determine category based on VERDICT, not just confidence
  let category = 'Contested';
  let categoryColor = '#FBBF24';

  // Map verdict to gauge display
  if (verdict.includes('Supported') || verdict.includes('Proven')) {
    if (clampedConfidence >= 75) {
      category = 'Supported';
      categoryColor = '#10B981'; // Green
    } else if (clampedConfidence >= 50) {
      category = 'Likely';
      categoryColor = '#3B82F6'; // Blue
    } else {
      category = 'Weak Support';
      categoryColor = '#FBBF24'; // Yellow
    }
  } else if (verdict.includes('Unsupported') || verdict.includes('False')) {
    if (clampedConfidence >= 75) {
      category = 'Unsupported';
      categoryColor = '#EF4444'; // Red
    } else if (clampedConfidence >= 50) {
      category = 'Unlikely';
      categoryColor = '#F97316'; // Orange
    } else {
      category = 'Weak Rejection';
      categoryColor = '#FBBF24'; // Yellow
    }
  } else {
    // Unproven or contested
    category = 'Contested';
    categoryColor = '#FBBF24'; // Yellow
  }
```

**Then update the parent component** (`app/page.tsx`) to pass verdict:

Find where `<TruthGauge>` is rendered (search for "TruthGauge") and update:

```typescript
<TruthGauge 
  confidence={debateState.judge.confidence}
  verdict={debateState.judge.verdict}  // Add this prop
  isAnimating={debateState.isStreaming}
/>
```

---

## Task 3: Restructure Verdict UI for Clarity (45 minutes)

**Problem**: The current UI is too terse and confusing. Users can't understand the relationship between verdict, confidence, and gauge.

**Goal**: Make the verdict section VERBOSE and SELF-EXPLANATORY so users immediately understand what the Judge decided.

### Redesign the Verdict Card Layout

**File**: `src/components/DebateViewer/JudgeVerdict.tsx` (or create if doesn't exist, or modify in `app/page.tsx` if inline)

**Current Layout** (terse and confusing):
```
⚖️ Judge Verdict
Verdict: Claim Unsupported
Confidence: 85% True
Risk: Medium
```

**New Layout** (verbose and clear):
```
⚖️ Judge's Final Verdict

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 VERDICT
The judge has determined this claim is:
  
  🔴 UNSUPPORTED BY EVIDENCE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 JUDGE'S CONFIDENCE IN THIS ASSESSMENT
  
  ████████████████░░░░  85%
  
  The judge is 85% confident that the claim
  lacks sufficient supporting evidence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ ARGUMENT STRENGTHS
  
  ✓ Believer's Case: Strong
  ✗ Skeptic's Case: Very Strong
  
  The Skeptic presented more compelling
  evidence and stronger logical reasoning.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ RISK ANALYSIS
  
  If we accept this claim despite lack of evidence:
  • Potential Harm: Medium
  
  If we reject this claim but it's actually true:
  • Missed Opportunity: Medium

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Implementation Details

**Create or Update** `src/components/DebateViewer/JudgeVerdict.tsx`:

```typescript
'use client';

interface JudgeVerdictProps {
  verdict: string; // e.g., "Claim Supported", "Claim Unsupported"
  confidence: number; // 0-100
  believerStrength: string; // e.g., "Strong"
  skepticStrength: string; // e.g., "Very Strong"
  riskAssessment: string; // e.g., "Medium Risk"
  harmIfWrong?: string;
  opportunityIfWrong?: string;
}

export function JudgeVerdict({
  verdict,
  confidence,
  believerStrength,
  skepticStrength,
  riskAssessment,
  harmIfWrong,
  opportunityIfWrong,
}: JudgeVerdictProps) {
  // Determine verdict styling and explanatory text
  const getVerdictDisplay = () => {
    if (verdict.includes('Supported') && !verdict.includes('Unsupported')) {
      return {
        icon: '🟢',
        label: 'SUPPORTED BY EVIDENCE',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        explanation: `The judge determined that the evidence presented 
                      favors the claim's validity.`,
      };
    } else if (verdict.includes('Unsupported')) {
      return {
        icon: '🔴',
        label: 'UNSUPPORTED BY EVIDENCE',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        explanation: `The judge determined that the evidence does NOT 
                      adequately support this claim.`,
      };
    } else if (verdict.includes('Partially')) {
      return {
        icon: '🟡',
        label: 'PARTIALLY SUPPORTED',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        explanation: `The judge found some supporting evidence, but 
                      significant gaps or counterevidence remain.`,
      };
    } else {
      return {
        icon: '⚪',
        label: 'UNPROVEN / INSUFFICIENT EVIDENCE',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        explanation: `The judge could not determine validity due to 
                      insufficient or contradictory evidence.`,
      };
    }
  };

  const verdictDisplay = getVerdictDisplay();

  // Generate confidence explanation
  const getConfidenceExplanation = () => {
    const verdictType = verdict.includes('Unsupported') ? 'lacks sufficient supporting evidence' :
                        verdict.includes('Supported') ? 'is supported by the evidence' :
                        'has insufficient evidence to determine validity';
    
    if (confidence >= 80) {
      return `The judge is highly confident (${confidence}%) that the claim ${verdictType}.`;
    } else if (confidence >= 60) {
      return `The judge is moderately confident (${confidence}%) that the claim ${verdictType}.`;
    } else if (confidence >= 40) {
      return `The judge is somewhat uncertain (${confidence}% confidence) about whether the claim ${verdictType}.`;
    } else {
      return `The judge has low confidence (${confidence}%) in this assessment due to contradictory or insufficient evidence.`;
    }
  };

  // Confidence bar segments
  const confidenceSegments = Math.round(confidence / 5); // 20 segments total

  return (
    <div className="w-full bg-background-secondary border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          Judge's Final Verdict
        </h2>
      </div>

      {/* Verdict Section */}
      <div className="px-6 py-6 space-y-6">
        <div className={`p-4 rounded-lg border ${verdictDisplay.bgColor} ${verdictDisplay.borderColor}`}>
          <p className="text-xs font-semibold text-foreground-muted mb-2 uppercase tracking-wider">
            📋 Verdict
          </p>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{verdictDisplay.icon}</span>
            <span className={`text-xl font-bold ${verdictDisplay.color}`}>
              {verdictDisplay.label}
            </span>
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed">
            {verdictDisplay.explanation}
          </p>
        </div>

        {/* Confidence Section */}
        <div>
          <p className="text-xs font-semibold text-foreground-muted mb-3 uppercase tracking-wider">
            🎯 Judge's Confidence in This Assessment
          </p>
          <div className="space-y-3">
            {/* Confidence Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-background-tertiary rounded-full overflow-hidden flex">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${
                      i < confidenceSegments
                        ? confidence >= 67
                          ? 'bg-green-500'
                          : confidence >= 33
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-foreground min-w-[3rem] text-right">
                {confidence}%
              </span>
            </div>
            {/* Confidence Explanation */}
            <p className="text-sm text-foreground-muted leading-relaxed">
              {getConfidenceExplanation()}
            </p>
          </div>
        </div>

        {/* Argument Strengths */}
        <div>
          <p className="text-xs font-semibold text-foreground-muted mb-3 uppercase tracking-wider">
            ⚖️ Argument Strengths
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-believer-bg/30 border border-believer-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-believer-accent">✓</span>
                <span className="text-xs font-semibold text-foreground-muted">Believer</span>
              </div>
              <p className="text-sm font-bold text-foreground">{believerStrength}</p>
            </div>
            <div className="p-3 bg-skeptic-bg/30 border border-skeptic-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-skeptic-accent">✗</span>
                <span className="text-xs font-semibold text-foreground-muted">Skeptic</span>
              </div>
              <p className="text-sm font-bold text-foreground">{skepticStrength}</p>
            </div>
          </div>
          <p className="text-xs text-foreground-muted mt-2 leading-relaxed">
            {believerStrength === skepticStrength
              ? 'Both sides presented equally compelling arguments.'
              : (believerStrength > skepticStrength
                  ? 'The Believer presented more compelling evidence.'
                  : 'The Skeptic presented more compelling evidence and stronger reasoning.')}
          </p>
        </div>

        {/* Risk Analysis */}
        {(harmIfWrong || opportunityIfWrong) && (
          <div>
            <p className="text-xs font-semibold text-foreground-muted mb-3 uppercase tracking-wider">
              ⚠️ Risk Analysis
            </p>
            <div className="space-y-3">
              {harmIfWrong && (
                <div className="p-3 bg-background-tertiary rounded-lg">
                  <p className="text-xs text-foreground-muted mb-1">
                    If we accept this claim and it's wrong:
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    • Potential Harm: {riskAssessment}
                  </p>
                </div>
              )}
              {opportunityIfWrong && (
                <div className="p-3 bg-background-tertiary rounded-lg">
                  <p className="text-xs text-foreground-muted mb-1">
                    If we reject this claim but it's true:
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    • Missed Opportunity: {riskAssessment}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Update Parent Component

**File**: `app/page.tsx`

Find where the verdict UI is rendered (search for "Judge Verdict" or similar) and replace with:

```typescript
import { JudgeVerdict } from '@/components/DebateViewer/JudgeVerdict';

// Inside the component, replace existing verdict display with:
{debateState.judge.verdict && (
  <JudgeVerdict
    verdict={debateState.judge.verdict}
    confidence={debateState.judge.confidence}
    believerStrength={debateState.judge.believerStrength || 'Moderate'}
    skepticStrength={debateState.judge.skepticStrength || 'Moderate'}
    riskAssessment={debateState.judge.riskAssessment || 'Medium Risk'}
    harmIfWrong={debateState.judge.harmIfWrong}
    opportunityIfWrong={debateState.judge.opportunityIfWrong}
  />
)}
```

### Remove or Simplify Truth Gauge

**Option A**: Remove TruthGauge entirely (it's redundant with the new verbose verdict display)

**Option B**: Keep it but make it simpler and move it to a less prominent position

If keeping, update to match new logic but make it a compact visual indicator rather than the main information display.

---

## Task 4: Verify Restructured UI (5 minutes)

Run a debate and confirm:
- [ ] Console logs show the Judge's actual verdict text
- [ ] Verdict card clearly explains what the Judge decided
- [ ] Confidence explanation makes sense in context ("85% confident claim is UNSUPPORTED")
- [ ] Argument strengths show which side was more convincing
- [ ] Risk analysis displays harm/opportunity tradeoffs
- [ ] No conflicting information visible (old "True/False" labels removed)

---

## Expected Outcome

**Before Fix**:
```
Verdict: Claim Unsupported
Confidence: 85% True ❌ CONFUSING
Risk: Medium
```

**After Fix**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 VERDICT
The judge has determined this claim is:
  🔴 UNSUPPORTED BY EVIDENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 JUDGE'S CONFIDENCE
  ████████████████░░░░  85%
  The judge is highly confident (85%) that
  the claim lacks sufficient supporting evidence.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ ARGUMENT STRENGTHS
  ✓ Believer: Strong
  ✗ Skeptic: Very Strong
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

✅ **CLEAR AND UNAMBIGUOUS**

---

## Notes

The confusion comes from the Judge prompt's confidence scale (lines 30-36 in `judge.ts`):
```
- 21-40: Lean toward skeptic but substantial uncertainty
- 61-80: Lean toward believer, reasonable evidence
- 81-100: High confidence in claim validity
```

This means:
- **85% confidence** = Judge believes the claim IS valid
- **But verdict says "Claim Unsupported"** = Parsing failure

So EITHER the verdict parsing is broken (most likely) OR the Judge is outputting contradictory information (less likely, but check Task 1 logs to confirm).

**Time Estimate**: 80 minutes total (10 min debug + 20 min gauge fix + 45 min UI restructure + 5 min verification)
