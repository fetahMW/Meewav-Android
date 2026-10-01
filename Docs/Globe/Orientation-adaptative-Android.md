# Globe Android : portrait et paysage

## Disposition

Le globe interactif suit les quatre orientations du téléphone avec
`SCREEN_ORIENTATION_FULL_SENSOR`. L'authentification reste en portrait et
l'aperçu d'arrivée reste en paysage. Le changement de configuration conserve
la WebView, le moteur et la caméra ; le moteur existant adapte son viewport.

En portrait, la navigation est placée en bas. Elle utilise
`shared-ui/FeatureDock`, avec les mêmes destinations, icônes, globe et
matière de CTA violet poli que les autres features Android.
En paysage, la navbar historique `GlobeNavigationPole` est conservée,
avec son ordre, ses dimensions, ses espacements et sa matière d'origine.
Son breakpoint compact reste limité aux paysages de 600 pixels de hauteur
au maximum, comme avant cette adaptation.
Les marges système et les découpes du téléphone sont déjà réservées par
`safeDrawingPadding()` dans le conteneur natif.

La recherche est transparente en haut, avec son filtre intégré. Les trois
raccourcis Ville, Pays et Ma position sont des carrés de 44 pixels en bas à droite,
avec des icônes et des noms accessibles. Aucun chip indépendant ni bouton
visuel +, − ou 3D n'est affiché. Les gestes tactiles et les actions natives
d'accessibilité sont conservés. Le Top 10 est limité à 236 pixels de large
et le bouton d'exploration à 212 pixels. La croix native conserve sa cible
tactile sans fond visible, sur le même axe que les trois raccourcis.

## Adaptation sans réinitialisation

- `globe-layout.ts` utilise `screen.orientation.type`, avec un repli sur les
  dimensions si l'API est absente. L'ouverture du clavier ne change donc pas
  une navigation portrait en rail latéral.
- `full-globe-navigation.tsx` relie le dock aux callbacks de navigation déjà
  utilisés par le globe ; le routeur est local au dock portrait. Un abonnement
  à l'orientation remplace uniquement la navigation par le composant historique
  en paysage, sans remonter l'application ni son moteur.
- La compilation utilise une seule instance de React et ReactDOM, issue de
  la toolchain du globe, y compris pour le dock et le routeur.
- Les pré-profils portallés suivent le rectangle disponible dans les deux
  orientations. Le helper résout la géométrie responsive sans interpréter
  les premiers nombres de `calc()` ou `min()` comme des pixels.
- Un personnage sélectionné reste à sa position sur la carte lorsqu'il n'y
  a pas la place de l'agrandir à côté de son pré-profil. Le personnage et ses
  informations restent présents.
- Le dock détecte aussi les fenêtres portallées hors de `#root`. Son petit
  globe animé est suspendu lorsque la WebView native devient inactive.

## Vérification initiale

La compilation des sept bundles et `:app:assembleDebug` réussit. La
vérification des six features valide 4 852 assets et 193 imports. Le manifeste
du globe valide 2 135 assets et les imports de ses modules atteignables.

Les tests ciblés couvrent les quatre orientations, le clavier, le repli sans
ScreenOrientation API, le retrait des listeners et les limites des
pré-profils en portrait, paysage, écran étroit, navigation repliée et mode
artistes légendaires.

La vérification sur téléphone utilise le DOM et les états natifs sans capture
d'écran. Une émulation Chromium de taille de viewport prouve l'adaptation
de l'interface ; elle ne constitue pas une rotation physique du téléphone.

Lors de la vérification initiale sur le Redmi, le portrait réel mesure
406 × 863 pixels CSS. Les sept
destinations du dock, les trois contrôles de carte, la transparence de la
recherche, le Top 10 et son pré-profil actif sont vérifiés dans le DOM.
Les actions Pays, Ville, Ma position et le retour au globe déclenchent les
vues correspondantes. Le mode artistes légendaires conserve ses commandes
de lecture et de retour.

Le passage simulé à 863 × 406 pixels conserve le même objet moteur et les
coordonnées, le pitch et le bearing de la caméra. Seule la distance de la
vue d'ensemble s'ajuste pour cadrer le globe selon son nouvel aspect. Après
retrait de l'émulation, le portrait d'origine revient avec le moteur actif.
`FULL_SENSOR` est confirmé dans l'état natif du Redmi et du S22, sans changer
leurs réglages de rotation.

La version finale est installée par Wi-Fi sur le S22 et le Redmi, avec le
même SHA-256 que l'APK local. Ses dimensions sont confirmées en portrait
réel et paysage émulé : Top 10 de 236 pixels, CTA de 212 pixels, trois carrés
de 44 pixels en bas à droite. Le texte du CTA reste entier et le filtre
occupe exactement son conteneur dans les deux orientations. Les émulations
et les forwards ADB sont retirés après cette vérification.

## Vérification de la restauration de la navbar paysage

Le bundle du globe et `:app:assembleDebug` réussissent. Le test d'orientation
confirme que seuls les changements portrait/paysage notifient la navigation,
sans remplacement lors d'un simple resize ou de l'ouverture du clavier.

Sur le S22 au premier plan, le portrait de 384 × 796 pixels affiche le dock.
En paysage émulé à 796 × 384 pixels, la navbar historique mesure 52 × 364
pixels et se place à 10 pixels du haut et de la gauche. Ses boutons mesurent
42 × 36 pixels, dans l'ordre Globe, Messagerie, Rooms, La Scène, Marketplace,
Tremplin, Profil ; aucun `FeatureDock` n'est présent en paysage.
Le retour en portrait rétablit le dock avec le même canvas et le même objet
moteur. Longitude, latitude, pitch et bearing sont conservés ; la distance
s'ajuste au cadrage. Le bouton Messagerie ouvre bien `MessagingActivity`.

L'APK corrigé est installé sur les deux téléphones et leurs SHA-256
correspondent au fichier local. Sur le Redmi, le volet de notifications
masquait l'application et le globe chargeait encore : cette vérification
ne confirme donc pas l'interface de cette version sur cet appareil.
Aucune action n'a été forcée pour relever le volet. Les métriques de viewport
ont été rétablies et les forwards ADB retirés sur les deux appareils.

## Annulation

L'essai est isolé dans le commit d'adaptation et le commit de restauration
de la navbar paysage, avec leurs assets Android générés. Pour annuler tout
l'essai, revert d'abord la restauration puis l'adaptation, reconstruire
l'APK et réinstaller la version obtenue. Le point de départ est `4b12a51`.
La procédure et l'identifiant exact sont aussi enregistrés localement dans
le dossier d'annulation `android-globe-responsive-20261001-369df39`.
