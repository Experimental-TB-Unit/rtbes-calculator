# Verification of RTBES 1.0.0-rc4

Date: 26 October 2026. All fixtures and screenshots use generated synthetic
cases. No patient record is included. These are software tests, not clinical
validation or regulatory conformity assessment.

## Automated checks

- TypeScript strict type checking: passed.
- Production static-web build and single-file classic-script offline build: passed.
- The packaged source is allowlisted and can be independently installed with
  npm ci, tested and rebuilt. The offline executable carries a SHA-256 manifest.
- 37 deterministic scoring/file-transfer tests plus one clinician-facing UI
  contract test: passed. Coverage includes every active and chronic
  parenchymal item in all quadrants, every pleural-effusion type on both sides,
  every active and calcified lymph-node item, both chronic pleural items,
  unassessed-state blocking, per-quadrant weighting,
  separate LN items, bilateral effusion, repeated prior-visit improvement,
  mixed per-quadrant evolution, new/resolved/reappearing active signs,
  chronic restrictions, specific SOP calcified-LN and chronic-pleura rules,
  new miliary scoring and the global cap, exclusions, chronology, more than 3 follow-ups,
  two non-summed scores, conservative legacy-schema rejection, JSON snapshots,
  duplicate policies, invalid-file rejection and pleural-effusion follow-up
  scoring from evolution rather than a newly selected appearance class.
- Excel round trip: exact current observations and calculated scores preserved.
  Formula cells, unknown columns, duplicate/missing rows and inconsistent
  metadata are rejected. Excel does not preserve historical snapshots.
- npm audit after compatible dependency remediation: zero reported findings
  at verification time, including development dependencies. This is not a
  comprehensive security assessment or guarantee against future advisories.

## Browser checks

An interactive Chromium smoke test on 26 October 2026 confirmed that the page
renders, a synthetic baseline with cavities in two zones returns activity 4
and chronic findings 0, and the footer correctly distinguishes unsaved changes,
saved cases and a new unsaved draft.

The browser acceptance script for 1.0.0-rc4 covers the capped miliary rule,
paired controls, separate pleural findings and responsive layouts. It targets
phone, tablet and desktop widths. It was not executed in this build container
because the Playwright package is present but its Chromium executable is not;
therefore the items below describe the scripted checks and the prior browser
baseline, not a completed 1.0.0-rc4 browser run.

Headless Chromium 133.0.6943.0 on Linux, loaded directly through file://,
offline context, in a copied folder whose name contains spaces. The actual
HTML uses no module loader or remote dependencies. Browser automation checks:

- Blank assessment does not show a completed zero.
- Keyboard activation of a lung quadrant and diagram click update inputs.
- Two cavity quadrants give baseline 4; successive improvements give 2, then 1.
- JSON download includes original observations and versioned score snapshots.
- Excel download and import work in the browser while offline.
- Import preview defaults to skipping duplicate codes; invalid JSON does not apply.
- Optional IndexedDB copy completes, then reads back to an import preview.
- Five follow-ups can be added.
- Editing baseline removes later review confirmations.
- Phone, tablet and desktop viewports (320, 390, 768, 1024 and 1440 px wide)
  have no horizontal document overflow.
- No page-level JavaScript errors or HTTP(S) requests during the acceptance run.
- JSON backup restores the same day-20 result in a fresh browser context after
  moving the HTML to a different folder; this does not depend on moving IndexedDB.

The app keeps browser web-security protections enabled; no clinician is
asked to disable security. The test runtime uses a container-compatible
headless executable, not installed Windows Chrome or Edge.

The interface's baseline, follow-up and responsive screenshots will be
generated when the browser acceptance script is run. A live-device check
remains a release gate.
The original UI was also rendered from the untouched source with locally
substituted dependencies/styles because its external assets were unsuitable
for an offline reference. This is a structural reference, not a pixel-perfect
comparison to the original CDN-served UI. It was captured after implementing
the separate working copy, not before. The lung diagrams and colour pairing
are inherited; the layout is recognisably related, not identical.

## SMA-TB consistency audit

The supplied SMA-TB workbook contains 626 radiograph rows from 221
participants. Of these, 608 rows contain all item and total values required
for arithmetic checking. In all 608 complete rows, the recorded activity and
non-activity totals equal the sums of their recorded component items: zero
arithmetic discrepancies.

The workbook cannot serve as a complete golden test of the current engine
because it stores aggregate finding scores rather than the quadrant/side and
evolution selections required by the calculator. Under the definitive rules,
169 participant-by-finding historical trajectories cannot be reconstructed.
Most involve chronic findings; 31 concern the corrected chronic pleural
follow-up rule. These are treated as historical reader/version differences,
not as expected outputs to copy into the engine. No patient data were altered.

## Release gates still open

1. Independent clinical verification of the complete engine and worked cases.
2. Review of historical dataset values that fall outside the confirmed rules,
   including baseline atelectasis 16; no source dataset was modified.
3. Regulatory assessment of the intended care use, and institutional data-protection
   review. Data minimisation and local processing alone do not certify compliance.
4. Definitive institutional software-licence confirmation. IGTP ownership and
   the RTBES author attribution are recorded in this release.
5. Windows Chrome/Edge and macOS Safari acceptance. Linux Chromium is not proof of these.
6. Production-scale and malicious workbook/resource-exhaustion testing; encryption
   and authentication are not implemented. Handle only trusted controlled inputs.
7. Interrupted-write, quota-exhaustion and concurrent-tab stress testing. Browser
   storage is optional and is not a guaranteed durable database.
8. No automatic migration of original records or earlier unsupported schemas.

## Short Windows acceptance procedure

1. Extract the complete release ZIP to a folder with spaces. Disconnect internet.
2. Double-click RTBES.html in Edge, then repeat in Chrome, without changing security.
3. Confirm that blank/incomplete assessments have no scores. Confirm eligibility,
   mark signs absent, select two cavity quadrants and one cicatricial-lesion
   quadrant, then finish review: activity = 4 and chronic findings = 2.
4. Add day-10 and day-20 follow-ups, copy preceding findings, mark both cavity
   quadrants improved and confirm each visit: activity = 2, then 1.
5. Export full JSON, close the app, reopen and import; open the restored case.
   Confirm observations, visit order and historical results.
6. Export Excel, import it separately and compare current results. Verify a
   malformed file produces an error without replacing existing records.
7. Copy/move the HTML to a different folder, restore using JSON and repeat.
8. Test optional browser storage separately; do not expect it to move with HTML.
9. Compare results and report any problem before any assistential deployment.

The calculator is distributed through the Experimental TB Unit GitHub
repository and GitHub Pages. This does not create a central clinical or
research database: the calculator processes case content locally in the
browser. The executable remains a release candidate for research, education
and independent evaluation, not a final assistential release.
