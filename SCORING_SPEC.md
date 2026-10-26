# RTBES scoring specification for review

Version: RTBES-SOP-1.0-2026-10-22. This is a digital implementation for
review, not a claim of clinical validation. The primary structural source is
the supplied definitive anonymised RTBES SOP, whose DOCX/PDF file metadata
records final modification on 7 March 2025. That document contains no visible
internal version number or effective date, so the metadata date is provenance,
not an asserted SOP version. Specific later radiologist clarifications and
project-owner decisions supplied on 14, 19 and 22 October 2026 supersede only
the points they explicitly resolve. No source figures or tables are reproduced
in the distribution. The definitive SOP's Annex 1 contains its heading only;
the actual assessment form is absent from that attachment.

Reference: *RTBES Radiological Index for Quantitative Assessment of
Tuberculosis Evolution: Development and Validation*, supplied preprint,
doi:10.1101/2025.02.14.25322286. The paper's validation of an index is not
validation of this implementation. No clinical risk thresholds are used.

## Baseline

| Finding | Scoring unit | Score |
| --- | --- | --- |
| Cavities, infiltrates, bronchogenic dissemination | Each affected quadrant independently | 2 |
| Miliary TB | Global, both lungs together | 16 |
| Mediastinal LN | Separate item | 0 absent, 2 unilateral, 4 bilateral |
| Hilar LN | Separate item | 0 absent, 2 unilateral, 4 bilateral |
| Effusion | Each lung independently | 0 absent, 1 blunting, 2 fissural/lateral/subpulmonic, 3 massive |
| Scars, calcified granulomas, atelectasis, bronchiectasis, destructive pattern | Each affected quadrant independently | 2 |
| Mediastinal LN calcification | Separate item | 0 absent, 2 unilateral, 4 bilateral |
| Hilar LN calcification | Separate item | 0 absent, 2 unilateral, 4 bilateral |
| Pleural thickening | Each lung independently | 0 absent, 2 present |
| Pleural calcification | Each lung independently | 0 absent, 2 present |

Two independent results are reported: the activity score and the
non-activity score. They are **not added**. This follows the radiologist's
explicit clarification of 19 October 2026 and supersedes the combined-total
line in the supplied assessment table.

An effusion with different severities on the two sides is represented by
one observation per lung, following the radiologist's per-lung instruction.
Uniform bilateral effusions therefore equal twice the unilateral score.

## Follow-up

The reference is always the immediately preceding chronological visit.
The previous **scored** value is used, not a reconstructed baseline-like
value. Values are not rounded in the engine. Example: 2 → 1 → 0.5.

Parenchymal items are calculated independently for each quadrant. A new
affected quadrant contributes 2 even when another quadrant was previously
affected. Different quadrants can have different evolution statuses.

- Active parenchyma, active LN and effusion: unchanged = previous score;
  improved = previous / 2; worsened = previous × 2; resolved = 0.
  Previously absent findings can remain absent or appear newly, using
  their item's baseline value. LN and effusion keep their specific
  extent/type weighting rather than a universal 2 for every item.
- Miliary is a global item capped at 16: newly present = 16; unchanged keeps
  the preceding score; improved = preceding score / 2; resolved = 0. If a
  previously improved miliary pattern worsens, the preceding score is
  multiplied by 2 up to the global maximum of 16. Worsening is not offered
  when the preceding score is already 16. The new-presentation rule, cap and
  post-improvement worsening rule were confirmed by the project owner on
  19 October 2026.
- Chronic parenchyma: unchanged or worsened ×2 when previously present;
  absent or new 2 when previously absent. No improvement or resolution.
  Atelectasis belongs only to this group. The duplicate standalone
  atelectasis row (baseline 16, improvement /2) was explicitly withdrawn.
- Calcified LN: the specific Table 2 rule permits unchanged, improved /2
  or worsened ×2. Resolution is not added. This is distinct from the
  confirmed restriction for chronic **parenchymal** findings.
- Pleural thickening and pleural calcification are separate items, assessed
  independently in each lung. At follow-up, unchanged keeps the preceding
  score, improvement divides it by 2 and worsening multiplies it by 2. A new
  side uses the baseline value 2. The source clarification does not define a
  separate resolution category for these chronic pleural findings.

## Agreement and clarifications

Per-quadrant weighting, previous-visit reference, separate mediastinal/hilar
scoring and separate pleural thickening/calcification were explicitly
confirmed by the owner. These alter the
original implementation and must not silently recalculate legacy records.
No automatic import of legacy IndexedDB data is provided.

The supplied worked radiology correspondence answered selected doubtful
findings; it is not treated as an exhaustive golden case for every item.
The later correspondence confirms both the two-score reporting rule and the
withdrawal of the duplicate standalone atelectasis row.

No completed score is returned for unassessed fields, invalid quality,
non-standing CXRs, unconfirmed assessments, inconsistent dates, absent
predecessor scores, incompatible statuses or unsupported scenarios.

The rule-to-source mapping, including every explicit departure from the
definitive SOP wording, is recorded in `docs/RULE_SOURCE_MATRIX.md`.

## Revisions

The live series recalculates after input changes. Later visits lose their
review confirmation when a prior visit changes or is removed. Saving a
changed record creates a snapshot with source observations, exact results,
time and scoring version. JSON preserves snapshots. These snapshots are
not cryptographic signatures and are not a tamper-proof clinical audit log.
Backups from versions before 0.1.5 are rejected because their one combined
pleural field cannot be divided reliably into thickening and calcification.
No automatic migration assigns an ambiguous old value to either new item.
