# Calculadora RTBES versió de revisió

Descomprimeix tot el ZIP en una carpeta. Obre **RTBES.html** amb doble clic.
No cal instal·lar res, tenir un compte ni disposar de connexió a internet.
Si el navegador mostra el codi del fitxer en lloc de la calculadora, tria
«Obre amb» i selecciona un navegador.

És una versió candidata per a recerca, formació i avaluació independent.
No interpreta imatges, no diagnostica i no recomana tractaments. Una eventual
declaració d'ús assistencial requerirà una avaluació reguladora específica.

## Introduir una avaluació

1. L'eina genera un codi. No hi introdueixis noms, cognoms, números
   d'història clínica, dates de naixement ni imatges radiològiques.
2. L'edat en anys i el sexe biològic són opcionals i no modifiquen l'score.
3. Confirma qualitat tècnica adequada i radiografia en bipedestació.
4. Revisa cada signe. Pots seleccionar els quadrants al dibuix o amb els
   botons i selectors de teclat. RU/RL = zona pulmonar superior/inferior dreta;
   LU/LL = zona pulmonar superior/inferior esquerra. A la fila superior hi ha
   RU/LU i a la inferior, RL/LL. El dret del pacient apareix a l'esquerra del
   dibuix, segons la visualització habitual d'una CXR.
5. El botó «Mark all remaining findings as absent» només s'ha de
   prémer si has comprovat que els signes pendents són absents. No és una
   detecció automàtica. Als seguiments no esborra signes prèviament presents.
6. Confirma que has completat l'avaluació. Només llavors, si totes les
   comprovacions són vàlides, apareixen els dos scores independents:
   activitat i troballes cròniques.

## Seguiments

Pots afegir els seguiments necessaris. Introdueix els dies transcorreguts
des del basal, en ordre creixent. Cada seguiment es compara amb **l'anterior**,
no sempre amb el basal. Els canvis del parènquima es registren per quadrant.

«Copy preceding findings as unchanged» copia les observacions anteriors per
facilitar-ne la revisió. No confirma que hagis llegit la nova radiografia.
Els canvis crònics del parènquima, inclosa l'atelectàsia, no ofereixen
millora ni resolució. L'atelectàsia es valora aquí a 2 punts per quadrant;
no s'utilitza l'antiga fila separada amb valor 16.
La SOP interna conserva regles específiques per a ganglis calcificats i pleura;
no es generalitzen les regles del parènquima a tots els ítems.
L'engrossiment pleural i la calcificació pleural són dos ítems independents,
cadascun valorat separadament al pulmó dret i a l'esquerre. En seguiment,
sense canvis manté el valor anterior, millora divideix per 2 i empitjorament
multiplica per 2; la resolució no és una categoria disponible per aquests ítems.

Modificar una visita invalida la confirmació dels seguiments posteriors,
que s'han de tornar a revisar. Eliminar una visita canvia el comparador dels
seguiments posteriors i també els deixa pendents de revisió.

## Guardar i recuperar

«Save case on this device» guarda el cas al navegador actual perquè es pugui
tornar a obrir i continuar-ne els seguiments des de la mateixa adreça web.
La llista «Cases saved on this device» permet reobrir-lo. Aquesta còpia es pot
perdre si s'esborren les dades del navegador o es canvia de dispositiu,
navegador o adreça web. Per això cal descarregar també «Download full JSON
backup». El JSON conté observacions, visites,
versions i instantànies dels resultats guardats. Comprova que el navegador
ha desat realment el fitxer; l'aplicació només pot saber que ha demanat
la descàrrega. Generalment es desa a Descàrregues, segons la configuració
del navegador. No s'escriu automàticament al costat de l'HTML.

Per recuperar-lo, selecciona «Import JSON / Excel», revisa la previsualització
i aplica la importació. Els codis duplicats s'ometen per defecte; substituir
un registre requereix marcar-lo explícitament. Un JSON incompatible no
es converteix silenciosament. Els backups de versions anteriors no s'importen
automàticament perquè les regles o l'esquema pleural no són compatibles. Cal
revisar-los clínicament i tornar a introduir els ítems en aquesta versió.

El guardat al navegador no és un backup garantit. Eliminar una còpia del
navegador no elimina els fitxers descarregats, ni al revés.

Els fitxers **no estan xifrats**. Guarda'ls en emmagatzematge institucional
aprovat i protegit. Els codis no garanteixen anonimat. La clau que relacioni
un codi amb una persona ha de quedar exclusivament al centre assistencial.
No hi ha funció d'enviar dades per a recerca ni de recollida central.

## Excel

Descarrega «Excel template». Llegeix la pestanya Instructions i els codis de
Field rules. Cada fila correspon a un ítem i regió d'una visita. No eliminis
files obligatòries ni afegeixis columnes identificatives. No s'accepten fórmules.
La plantilla conté una avaluació **sintètica i incompleta**, no dades de pacients.

«Export Excel» descarrega les observacions i els resultats. L'Excel no
preserva l'historial complet; per això no substitueix el backup JSON.

La TB miliar és un signe global: absent = 0 i nova = 16. Sense canvis
manté el valor anterior; millora = valor anterior / 2; resolució = 0.
Si havia millorat i després empitjora, el valor anterior es multiplica
per 2 fins a un màxim de 16. Si ja és 16, no pot augmentar.

No s'hi han incorporat llindars de risc ni recomanacions de tractament.
