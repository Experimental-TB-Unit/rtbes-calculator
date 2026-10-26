# Changes in 1.0.0 release candidate 4

- Makes the lung diagram and the four controls use the same visible medical
  English abbreviations: RU, LU, RL and LL.
- Aligns the control grid with the diagram: RU/LU on the upper row and RL/LL
  on the lower row, in chest-radiograph viewing orientation.
- Uses “upper/lower” consistently in all visible zone labels and keeps the
  legacy RS/RI/LS/LI identifiers only inside the data schema for compatibility.
- Corrects “Diffused” to “Diffuse” and consistently labels the second output
  as “Chronic findings” throughout the interface.
- Extends the 44-pixel touch-target treatment to disclosure controls, import
  replacement checkboxes, notices and follow-up creation.
- Retains the release-candidate 3 technical changes for touch targets, import
  feedback, explicit bulk completion and patient-side orientation. No scoring
  formula changes in this release candidate.

## Changes in 1.0.0 release candidate 3

- Corrects the saved-state indicator so a new case is labelled as an unsaved
  draft until it has actually been written to browser storage.
- Adds a concise About RTBES section with the expanded name, separate-score
  statement, scientific reference, software citation, rights notice and issue
  link.
- Enlarges critical touch targets and form controls for mobile use.
- Uses visible English zone abbreviations RU/RL/LU/LL while preserving the
  stable internal/exported field identifiers RS/RI/LS/LI.
- Adds explicit patient-right/patient-left orientation and explains the
  baseline diagram's completion of unselected zones as absent.
- Simplifies the privacy notice and distinguishes clinical case content from
  ordinary technical hosting logs.
- Reports exactly how many imported cases were applied or skipped, and replaces
  raw JSON syntax messages with a human-readable error.
- Renames the bulk-completion action to “Mark all remaining findings as absent”.

## Changes in 1.0.0 release candidate 2

- Uses consistent clinical terminology for the four lung zones: right/left
  upper and lower lung zone.
- Presents activity first at full width and non-activity below it, instead of
  placing both forms side by side.
- Adds an activity-rule explanation parallel to the non-activity explanation.
- Makes the pleural-effusion follow-up interface explicit: type is selected at
  baseline or de novo presentation; a previously present effusion is scored
  from evolution relative to the preceding visit (same, /2, ×2 or 0),
  independently of a newly described appearance class.
- “Save case on this device” now writes the complete longitudinal case to
  browser storage, and saved cases are reloaded when the same site is reopened.
  JSON remains the portable backup between devices and browsers.

## Changes in 1.0.0 release candidate 1

- Consolidated the controlled internal SOP from the January 2025 v4 source,
  the March 2025 definitive supplement and the later radiologist
  clarifications supplied by the study team.
- Corrected pleural follow-up: pleural thickening and pleural calcification
  remain separate right/left findings; when previously present they may be
  unchanged, improved (/2) or worsened (×2). Resolution is not offered as a
  separate category.
- Preserved miliary TB as one global item: baseline/new = 16, unchanged =
  preceding score, improved = /2, resolved = 0 and worsening = ×2 up to 16.
- Confirmed that activity and non-activity are reported separately and are
  never added.
- The internal SOP is deliberately excluded from the public web package.
- Expanded responsive acceptance targets to phone, tablet and desktop widths.

## Changes in 0.1.6 review

- Corrected source precedence: the definitive anonymised SOP last modified on
  7 March 2025 is the primary structural source; SOP v4 of 8 January 2025 is
  recorded as its immediate version-numbered predecessor.
- Added a rule-to-source matrix identifying each SOP rule, every later explicit
  clarification and its calculator/test implementation.
- Expanded deterministic regression coverage from 28 to 36 tests, explicitly
  exercising every scoring item and major boundary. All pass.
- No scoring formula changed in that review build; its scoring version was
  `RTBES-2026-10-22-review.5`.

## Changes in 0.1.5 review

- Pleural thickening and pleural calcification are separate non-activity
  findings, each scored independently as 0 absent or 2 per affected lung.
- That review build treated chronic pleural findings as current state at every
  visit. This was superseded in 1.0.0-rc1 after the later clarification was
  reconciled with the controlled SOP.
- The data schema is version 2. Backups from earlier review builds are rejected
  rather than ambiguously converting their single combined pleural field.
- Documentation and regression tests reflect the resolved pleural rule.

## Changes in 0.1.4 review

- Mediastinal and hilar lymph-node controls are aligned as a paired row.
- Right and left pleural-effusion controls are aligned as a paired row.
- Calcified lymph-node and chronic right/left pleural controls use the same
  paired layout to avoid visual association errors.
- Clicking a baseline parenchymal diagram now completes all four quadrants for
  that finding: selected quadrants are present and unselected quadrants are
  explicitly absent.

## Changes in 0.1.3 review

- A previously improved miliary pattern can worsen by x2 up to the global
  maximum of 16. Worsening remains unavailable when the preceding score is
  already 16.

## Changes in 0.1.2 review

- Newly appearing miliary TB scores 16. A present miliary finding remains
  capped at 16, improves to 8 and resolves to 0; no ×2/32 option is offered.
- Review.1 and review.2 JSON backups remain importable.

## Changes in 0.1.1 review

- Activity and non-activity are reported as two independent scores; the UI,
  chart and new Excel exports no longer calculate or show a combined total.
- Review.1 JSON backups remain importable. Their old combined values are
  preserved only inside historical snapshots and are not used or displayed.
- Atelectasis is confirmed as chronic parenchyma: 2 per affected quadrant,
  unchanged or ×2 if worsening, with no improvement/resolution. The duplicate
  standalone 0/16 atelectasis rule is excluded.
- Worked correspondence is treated as clarification of disputed findings,
  not as a complete golden case.

## Changes in 0.1.0 review

- Separate 2-point contributions for every affected sign and quadrant.
- Independent mediastinal and hilar LN scoring and bilateral weighting.
- Effusion scored per lung, including bilateral weighting.
- Sequential follow-up scores, using the preceding scored visit.
- Per-quadrant follow-up evolution, with chronic parenchymal restrictions.
- Chronic pleura was then scored from current presence; 1.0.0-rc1 supersedes
  that interpretation with unchanged, /2 and ×2 follow-up transitions.
- Explicit unassessed and completion states, standing/quality checks,
  elapsed-day chronology and invalid-input blocking.
- Unlimited UI follow-ups; imported cases have a defensive 1,000-visit limit.
- Versioned snapshots, JSON backup and conservative import preview.
- Excel template, current-observation import and results export.
- No automatic patient persistence. Optional browser copy is an explicit
  action with transaction-completion confirmation and visible errors.
- Generated case codes and optional non-identifying demographics;
  no hospital ID, patient name, birth date, institution or clinician name fields.
- Bundled offline HTML and conventional static web build from one source.
- No LLM, API key, external fonts or CDN dependencies.
- Keyboard controls for quadrants and visible score breakdown.
- Deterministic synthetic tests and optional browser acceptance script.

This is not a clinically validated release. See the verification gaps in
the accompanying documentation.
