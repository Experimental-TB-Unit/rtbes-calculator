# Casos sintètics d'acceptació clínica RTBES

Versió de calculadora: 1.0.0-rc3  
Versió de scoring: RTBES-SOP-1.0-2026-10-22

Aquests casos no contenen dades de pacients. Serveixen perquè una persona del
grup comprovi que la interfície aplica les regles acordades. No substitueixen
una validació clínica independent.

## 1. Pendent no és absent

Obre un cas nou, confirma qualitat, bipedestació i revisió, però deixa almenys
un signe pendent. Resultat esperat: **cap score complet** i un avís del camp
pendent. Després marca explícitament tots els signes com absents. Resultat:
activitat **0**, no activitat **0**.

## 2. Quadrants i dos totals separats

Basal amb cavitats RS i LS, i lesió cicatricial RI. La resta absent. Resultat:
activitat **4**, no activitat **2**. No ha d'aparèixer cap suma total 6.

## 3. Exemple aritmètic de la correspondència

Basal amb cavitats RS+LS, infiltrats RS+LS+LI, miliar present i efusió esquerra
de tipus 2. La resta d'activitat absent. Resultat correcte: **28**
(4 + 6 + 16 + 2). El 26 escrit al correu és una discrepància aritmètica i no
s'ha de reproduir.

Per a no activitat: lesions cicatricials RS+LS, granulomes calcificats RS+LS,
bronquièctasis RS+LI i engrossiment pleural bilateral. Resultat correcte segons
les localitzacions escrites: **16** (4 + 4 + 4 + 4). El correu posa 6 a una
línia de bronquièctasis que només enumera 2+2, i per això acaba en 18.

## 4. Seguiment respecte de l'anterior

Basal: cavitat RS = 2. FU dia 10: millora = 1. FU dia 20: nova millora = 0,5.
Resultats d'activitat esperats: **2 → 1 → 0,5**.

## 5. Miliar

Basal absent. FU dia 10 nova miliar: **16**. FU dia 20 millora: **8**. FU dia
30 empitjora: **16**. Amb un valor anterior 16, l'opció d'empitjorament no ha
de permetre arribar a 32. Resolució: **0**.

## 6. Crònics i atelectàsia

Basal: atelectàsia RS = **2**. Al FU només s'han d'oferir sense canvis (**2**)
o empitjorament (**4**). No s'han d'oferir millora ni resolució. No ha d'existir
cap fila separada d'atelectàsia amb 16 punts.

## 7. Ganglis separats

Basal: ganglis mediastínics unilaterals = 2 i ganglis hilars bilaterals = 4.
Activitat esperada: **6**. Repeteix-ho amb calcificació ganglionar; no activitat
esperada: **6**. Els dos ítems han d'estar visualment alineats però separats.

## 8. Efusió per costat

Comprova a dreta i esquerra, separadament: blunting = 1, fissural/lateral/
subpulmonar = 2, massiva = 3. Massiva bilateral: activitat **6**.

## 9. Pleura crònica separada

Engrossiment bilateral = 4. Calcificació bilateral = 4. Si coexisteixen, no
activitat = **8**. Al FU es registra presència actual 0/2 per pulmó; no s'aplica
×2 al valor pleural anterior.

## 10. Elegibilitat i nombre de FU

Si qualitat o bipedestació no estan confirmades, no hi ha score. Afegeix quatre
o més seguiments amb dies creixents: l'eina els ha d'acceptar tots i sempre ha
de comparar cada visita amb l'anterior.
