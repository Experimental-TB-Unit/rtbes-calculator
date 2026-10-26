# RTBES calculator release candidate

Version 1.0.0-rc3. Read START_HERE_CA.md for the clinician workflow.

This distribution contains a runnable offline HTML and a source folder.
Its lung diagram component and the indigo/teal activity–chronicity visual
language are retained. Forms support per-quadrant evolution and explicit
assessment.

## Doctors

Extract the ZIP and double-click RTBES.html. No installation, API key,
account, server or internet connection is needed. Do not enter direct
patient identifiers. Press **Save case on this device** to reopen a case in the
same browser. Browser storage is not guaranteed durable, so download a separate
full JSON backup.

The tool is implemented for the intended future use in care and research,
but this review build is not released for clinical use. Independent clinical
review, regulatory qualification/classification and release acceptance
remain outstanding. Open distribution or a disclaimer does not establish
regulatory or GDPR compliance. No central research data collection exists.

## Contributors

Use Node.js 24 and npm. In the source folder:

```sh
npm ci --ignore-scripts
npm test
npm run build
```

The build regenerates styles.css and type-checks the source. Vite produces
dist-web/ for static hosting. scripts/offline.mjs uses esbuild to produce
dist-offline/RTBES.html with classic bundled JavaScript, styles and chart
assets embedded. There are no external fonts, CDNs, module imports or API
calls in the offline distribution. Its CSP disallows network connections.
The web build has not been deployed.

The runtime depends on React, Chart.js and ExcelJS. Dependency versions and
transitive resolution are pinned in package-lock.json. uuid is overridden
to a patched compatible CommonJS-capable version for ExcelJS; workbook
tests cover writing and reading after that override. Licensing notices
are included separately. Do not add telemetry or remote error logging
containing observations or patient codes.

The scoring engine in services/engine.ts has no React, storage or LLM
dependency. model.ts owns the data schema; services/transfer.ts handles
strict JSON and workbook boundaries; services/storage.ts handles optional
transactional IndexedDB writes. App.tsx coordinates session state and UI.

## Optional browser acceptance tests

Install Playwright in a test environment and install its Chromium browser.
Then run `node tests/browser.mjs /absolute/path/to/RTBES.html`.
The test uses synthetic cases, offline mode and a file path with spaces.
No web-security disabling flag is required by the application or test.
Environment-specific executable/module overrides are supported by the test
script, not by the clinician app. Windows Edge/Chrome still need manual checks.

## Data and compatibility

There is no automatic server persistence or data transfer. Saving a case writes
it to this browser, not to a server. A full JSON backup contains schema, app and
scoring versions, timestamps, observations, visit order, historical score
snapshots and record count. The UI previews imports; duplicates default
to skip and require explicit selection to replace. Invalid imports do not
change session records. Excel import is for current observations only;
it does not restore snapshot history. Limits: 25 MB JSON/import file,
10 MB Excel compressed bytes, 100,000 workbook rows, 1,000 imported visits
per case and 2,000 saved snapshots. These are defensive technical limits,
not clinical limits or a three-follow-up restriction.

RTBES provides two separate scores: an activity score and a chronic findings
score. New exports contain both results.
Backups before 0.1.5 are not imported automatically. They represented pleural
thickening and calcification in one combined field, which cannot be separated
reliably without rereading the source assessment. A clinician-reviewed
migration would be needed. The app does not silently transform an ambiguous
combined observation or an unknown observation into a negative finding.

No encryption or authentication is implemented. Export only to approved
protected storage. Code fields and demographic restrictions reduce direct
identifier entry, but cannot guarantee anonymity or prevent an operator
from misusing a code field. There is no upload of patient images or
automatic radiological interpretation. Hosting access logs, governance,
security review and any future research repository require separate design.

## Publication checkpoint

IGTP is the institutional owner. The definitive software licence still requires
institutional confirmation, so no open-source licence is asserted by this
release candidate. The current access and commercial-use notice is recorded in
TERMS_OF_USE.md. The paper's licence is separate. No supplied
paper/SOP figure, table, patient record or unpublished source document is
included in this package. The controlled SOP is internal and deliberately not
distributed with the web package. See SCORING_SPEC.md, VERIFICATION.md and
docs/SOURCE_RULE_AUDIT.md.
