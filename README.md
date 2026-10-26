# RTBES Calculator

Responsive web calculator for the **RUTI-TB Evolution Score (RTBES)**. It can
score a single chest radiograph or an unlimited longitudinal series. It reports
two independent results—activity and non-activity—which are never added.

## Use the calculator

Open the published GitHub Pages site in a current browser. No account is
required. Calculations occur locally in the browser and no observations are
sent to a server by the calculator.

Use coded cases only. Do not enter names, medical-record numbers, dates of
birth, images or free-text patient information. Press **Save case on this
device** to reopen a case in the same browser for later follow-up. Download a
JSON backup to move or protect the case outside that browser.

This release candidate is intended for research, education and independent
evaluation. It does not interpret radiographs or provide diagnostic or
treatment recommendations.

## Attribution

**RTBES authors:** Jordi Bechini\*, Cristina Vilaplana\*, Patrícia Cuadras  
\*Jordi Bechini and Cristina Vilaplana contributed equally and led the
development of RTBES.

**Copyright and institutional owner:** Germans Trias i Pujol Research Institute
(IGTP).

Please cite RTBES when reporting results obtained with this calculator. See
[`CITATION.cff`](CITATION.cff).

## Access and reuse

The validated score is made available as an open-access resource. The hosted
calculator may be used without charge for clinical care, academic research,
education and independent validation. See [`TERMS_OF_USE.md`](TERMS_OF_USE.md)
for the current source-code and commercial-use notice.

## Technical verification

Version 1.0.0-rc2 passes 37 deterministic scoring and file-transfer tests. The
static build is responsive and contains no image upload, telemetry or central
patient database. See [`VERIFICATION.md`](VERIFICATION.md) for the exact scope
and outstanding release checks.

## Developers

Requires Node.js and npm:

```sh
npm ci --ignore-scripts
npm test
npm run build
```

`dist-web/` is the GitHub Pages build and `dist-offline/RTBES.html` is the
self-contained offline build.
