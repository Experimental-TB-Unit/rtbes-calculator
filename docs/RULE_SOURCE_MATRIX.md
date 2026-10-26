# RTBES rule-to-source matrix

Date: 22 October 2026  
Calculator scoring version: RTBES-SOP-1.0-2026-10-22

This matrix distinguishes transcription of the definitive SOP from later
clarifications. The primary structural source is the supplied definitive
anonymised RTBES SOP (DOCX/PDF last modified 7 March 2025). It has no visible
internal version number or effective date. A later clarification changes only
the rule named in its row; it does not silently replace the rest of the SOP.

| Rule or finding | Definitive SOP | Later clarification or decision | Calculator implementation and regression check |
| --- | --- | --- | --- |
| Lung division | Horizontal division from the middle of the right hilum, applied to both lungs | Radiologist repeats the same instruction | Four independent quadrants: RS, RI, LS, LI; baseline and FU tested per quadrant |
| Scoring unit | Score each affected area and each lung | Radiologist explicitly confirms “per each affected area” and “per each lung” | Every parenchymal sign has four independent fields; right/left pleural fields are independent |
| Cavities | 2 per affected quadrant | Worked example: upper right 2 + upper left 2 = 4 | Active policy; baseline, new, unchanged, improvement /2, worsening ×2 and resolution 0 tested |
| Infiltrates | 2 per affected quadrant | Worked example: three quadrants = 6 | Same active policy, independently tested |
| Bronchogenic dissemination | 2 per affected quadrant | Radiologist distinguishes lobar dissemination from diffuse miliary disease | Same active policy, independently tested |
| Miliary TB | Global present/new value 16; FU table gives unchanged, improvement /2 and resolution 0 | Owner confirms worsening after prior improvement = preceding score ×2, capped at 16; no value above 16 | One global field; new 16, 16→8→0 and 16→8→16 tested; worsening unavailable at 16 |
| Active mediastinal lymph nodes | SOP assessment material distinguishes mediastinal and hilar locations; baseline extent 0/2/4 | Owner explicitly requires separate mediastinal and hilar items | Separate 0/2/4 fields; each active transition tested |
| Active hilar lymph nodes | As above | As above | Separate 0/2/4 field; not merged with mediastinal nodes |
| Pleural effusion | Per lung: 0 absent, 1 blunting, 2 fissural/lateral/subpulmonic, 3 massive; active FU rule | Radiologist confirms left/right per-lung scoring and explains subpulmonic appearance | Independent right/left fields; all baseline types, bilateral addition and FU transitions tested |
| Cicatricial lesions | Chronic parenchyma: 2 per quadrant; FU unchanged or worsening ×2 | Owner confirms new affected quadrant uses baseline value 2 | Chronic policy; no improvement/resolution; all five chronic items tested |
| Calcified granulomas | Same chronic-parenchyma rule | No later change | Same chronic policy and tests |
| Atelectasis | Included in chronic parenchyma at 2 per quadrant | Radiologist explicitly removes obsolete standalone 16-point atelectasis and states chronic atelectasis does not improve | Only chronic policy exists; obsolete field/rule absent; restriction tested |
| Bronchiectasis | Same chronic-parenchyma rule | No later change | Same chronic policy and tests |
| Destructive pattern | Same chronic-parenchyma rule | Radiologist clarifies emphysematous destruction; architectural distortion already counted as cicatricial lesion is not duplicated | Calculator provides the item; image interpretation remains clinician responsibility |
| Mediastinal LN calcification | 0/2/4; FU unchanged, improvement /2 or worsening ×2 | Owner requires separation from hilar calcification | Separate calcified-LN policy; improvement/worsening and unsupported resolution tested |
| Hilar LN calcification | As above | As above | Separate calcified-LN field and tests |
| Pleural thickening | SOP table compresses “thickening, calcification”; assessment form and study export keep separate rows/columns; baseline is 0/2 per lung | Owner explicitly confirms two distinct findings; supplied chronic-pleural FU clarification gives unchanged, improvement /2 and worsening ×2 | Separate right/left fields; new 2, unchanged, improvement and worsening tested independently; no unsupported resolution |
| Pleural calcification | As above | As above | Separate right/left field with the same chronic-pleural transitions |
| Activity/non-activity reporting | SOP calculates both subscores and also contains a combined-total instruction | Radiologist explicitly states there are two scores and they are not added | Only activity and non-activity results are returned/exported; absence of combined total tested |
| FU comparator | SOP describes evolution at follow-up but is not explicit enough to settle basal versus preceding visit | Owner explicitly chooses the immediately preceding visit | Sequential scores use the previous valid scored visit; repeated improvement and invalid predecessor tested |
| Pending versus absent | SOP requires assessment of each item | Owner requires pending to remain distinct from absent | Unreviewed fields block the score; explicit absent gives 0; tested |
| Eligibility | SOP/radiologist material requires an erect CXR for relevant assessment; project workflow requires quality review | Owner requires explicit technical-quality and standing checks | Either unchecked condition blocks the score; tested |
| Number of follow-ups | No scientific rule imposing three visits | Owner permits as many as needed | UI and engine support unlimited clinical FU; imported cases have only a defensive 1,000-visit technical limit; more than three FU tested |

## Explicit non-rules

- Historical SMA-TB scores are validation material, not a source from which a
  formula may be inferred.
- The radiologist's worked cases resolve the findings discussed in those cases;
  they are not an exhaustive specification of every calculator item.
- The 7 March 2025 date comes from document metadata. Because the definitive SOP
  does not print an internal version/date, it must not be cited as “SOP v5” or
  as an approved effective date.
- The calculator does not interpret radiographs, diagnose tuberculosis, set
  treatment thresholds or decide whether a visual pattern is present.
