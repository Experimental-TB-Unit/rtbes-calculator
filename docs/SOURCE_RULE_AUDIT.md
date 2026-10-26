# RTBES source and rule audit

Date of audit: 22 October 2026  
Purpose: establish which supplied material may define calculator behaviour.

## Source precedence used for the release candidate

1. Explicit decisions supplied by the project owner for the calculator.
2. Explicit radiologist clarifications resolving a stated doubt.
3. The definitive anonymised RTBES SOP, last modified on 7 March 2025,
   where it is not contradicted by 1 or 2.
4. Earlier SOP versions, annexes and manuscript material for provenance only.
5. Historical site-entered data as a consistency check, never as a source of
   scoring rules.

No historical record was used to invent or reverse-engineer a rule.

## Worked-correspondence arithmetic check

The supplied radiologist correspondence is authoritative for the specific
interpretive doubts it answers, but its written totals are not used as formula
definitions. Two internal arithmetic inconsistencies are present as written:

- Activity items are cavities 4 + infiltrates 6 + miliary 16 + effusion 2,
  with the other listed activity items at 0. These item values sum to **28**,
  although the message states 26.
- The non-activity bronchiectasis line names two affected quadrants at 2 points
  each, which sums to **4**, although that line states 6. Using the locations
  written in the message, the non-activity total is therefore 4 cicatricial +
  4 granulomas + 4 bronchiectasis + 4 pleural thickening = **16**, not 18.

These appear to be manual transcription/arithmetic discrepancies. They do not
contradict the same message's explicit rule of scoring every affected area and
every lung, and the calculator must not be altered to reproduce them.

## Documentary timeline

| Material | Relevant content | Status for calculator |
| --- | --- | --- |
| SOP v1, 28 January / 18 November 2021 | Contains the chronic parenchymal atelectasis item **and** a second standalone atelectasis rule scored 16 with improvement /2. | Superseded. The second atelectasis rule is a documented historical error. |
| SOP v1, 17 April 2023 | Standalone 16-point atelectasis row has been removed. Describes separate totals “for activity and for chronicity.” | Historical support for removal of duplicate atelectasis. |
| SOP v2, 9 October 2023 | Keeps corrected atelectasis table but explicitly introduces a combined sum of the two subscores. | Structural source only; combined total superseded by radiologist clarification. |
| SOP v3, 17 December 2024 | Separates the named parenchymal findings into individual table rows; scoring values otherwise unchanged. | Supports per-finding data entry. |
| SOP v4, 8 January 2025 | Explicitly describes four quadrants and per-area scoring; still retains the combined total. Internal revision history stops at v2 and dissemination remains marked confidential. | Immediate version-numbered predecessor; useful for provenance, but not the latest supplied SOP. Not publishable as-is. |
| Definitive anonymised RTBES SOP, modified 7 March 2025 | The three supplied PDF copies are byte-identical. The DOCX and PDF metadata record modification on 7 March 2025. It uses the corrected chronic atelectasis table, per-area/per-lung scoring and still retains a combined total. It has no visible internal version number or effective date. | **Primary structural source for the calculator.** The combined-total instruction and other specifically clarified points are superseded only as documented below. The date is a file-provenance date, not an invented SOP version. |
| 2025 preprint and supplementary material | Public manuscript-era description of the index and SOP. | Publication/provenance support; it does not override the later definitive supplied SOP or explicit clarifications. |
| Radiologist scoring clarification | States two scores, activity and non-activity, and explicitly says not to add them; confirms 2 points per affected area and per lung; gives worked quadrant and effusion examples. | Authoritative clarification for the release candidate. |
| Radiologist atelectasis clarification | Says to delete the standalone atelectasis box; chronic atelectasis does not improve; use the upper chronic-parenchyma box. | Authoritative clarification for the release candidate. |
| Project-owner decisions | Follow-up is against the preceding visit; signs are scored per sign and quadrant; mediastinal and hilar nodes are separate; new findings use their baseline value; resolved findings score 0; unlimited follow-ups; miliary re-worsening after improvement is ×2 capped at 16. | Authoritative calculator requirements. |

## Historical data audit

The supplied `SMA-TB Xray data.xlsx` contains 626 timepoint rows from 221
pseudonymous participants. All three arithmetic columns are internally
consistent: activity equals the sum of its item columns, non-activity equals
the sum of its item columns, and the historical combined score equals those
two historical totals added together.

The workbook is not a normative reference. It contains values produced under
older practice, including standalone atelectasis values of 16 and 32 and a
combined total. It also contains manual fractional and pleural values that
cannot be uniquely reconstructed without the original quadrant-level findings
and evolution classifications. These rows must not be used to change the
calculator formula.

The supplied “Scoring ranges” sheet is also historical. Its atelectasis range
of 0–64 follows the withdrawn standalone rule and therefore cannot define a
valid range for the current calculator.

## Previous calculator audit

The supplied `db-rtbes-calculator-v3-n25.zip` is not suitable as a scoring
reference. Its implementation:

- assigns only 2 points per parenchymal sign even if several quadrants are
  affected;
- combines mediastinal and hilar lymph nodes;
- does not apply bilateral pleural-effusion weighting;
- calculates a combined total;
- compares follow-up with baseline rather than the preceding visit; and
- cannot correctly score newly appearing active parenchymal findings.

The current release candidate replaces those behaviours and protects them
with deterministic tests. A field-by-field mapping is in
`docs/RULE_SOURCE_MATRIX.md`.

## Confirmed release-candidate rules

- Activity and non-activity are separate results and are never added.
- Each affected parenchymal sign contributes 2 in each affected quadrant.
- Miliary TB is a global finding: present/new = 16; improvement = previous /2;
  resolution = 0; re-worsening after improvement = previous ×2, capped at 16.
- Chronic atelectasis is scored only within chronic parenchyma: 2 per affected
  quadrant, unchanged or worsening ×2; no improvement/resolution option.
- Follow-up uses the immediately preceding valid chronological visit.
- Technical quality and standing position are mandatory eligibility checks.

## Resolved scientific clarification

**Chronic pleura:** the formal SOP table uses one compressed label,
“Thickening, calcification,” while the assessment form, historical export and
scoring-ranges sheet show pleural thickening and pleural calcification
separately. The project owner confirmed on 22 October 2026 that they are
distinct findings and supplied the chronic-pleural follow-up rule: no change
keeps the same score, improvement divides the previous score by 2 and
worsening multiplies it by 2. The calculator therefore provides separate
right/left fields for both findings and does not offer an unsupported
resolution category.

## Release and ownership constraint

The supplied formal SMA-TB SOP is marked confidential/consortium-only and
states that the score is Background subject to Consortium Agreement
conditions. A version of the SOP is already included in the public medRxiv
preprint under CC BY-NC-ND 4.0, but that licence does not permit distribution
of an adapted SOP. Public release of the corrected SOP and selection of a
software licence therefore still require authorization from the relevant
rights holder.
