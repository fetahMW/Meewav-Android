# Tremplin Android — reprise Web

Import du 16 septembre 2026, depuis `Meewav-Web`, commit
`32a5e5fea7f6eebb3867c22a27e8b62230bb8d21`. Le dépôt Web canonique n’est pas modifié.

## Contenu et adaptation

Le graphe de dépendances du Tremplin est conservé dans
`app/src/main/tremplin-source/vendor`. Il comprend l’accueil, la découverte,
les filtres, les fiches artistes, les explications, Mes artistes, la candidature,
le tableau de bord et les parcours de simulation de jetons. Portraits, covers,
sons et vidéos sont embarqués sans réduction de résolution. Les fichiers de
provenance enregistrent les sources de l’import avant adaptation.

L’enveloppe mobile reprend le bandeau translucide du Profil, ses matériaux et
ses CTA violet urbain. Profil et Tremplin utilisent le même composant
`shared-ui/FeatureDock.tsx` : trois destinations de chaque côté du globe central.
Le contenu défile sous les onglets, avec une réserve pour la navigation basse.
Mes artistes regroupe ses cinq rubriques dans un sélecteur déroulant.
Le lecteur audio reste au-dessus du dock ; les préécoutes s’arrêtent lorsque
l’activité quitte le premier plan.

`TremplinActivity` réutilise l’hôte local sécurisé, la session native et les
ponts médias de `MessagingActivity`. Le Tremplin est accessible depuis le
Profil et le globe. Messagerie, Profil et Globe sont raccordés ; les destinations
pas encore importées restent signalées comme indisponibles.

## Données et limites

Les fixtures investisseurs et les simulations du Web sont conservées.
Les achats/ventes de jetons restent des simulations (`demoMode`, sans API
transactionnelle). Cet import ne constitue pas une validation serveur de tous
les parcours Tremplin. Les appels existants passent par le runtime partagé avec
Profil ; les jetons de session ne sont pas persistés dans le stockage Web.

## Construction et livraison

- `node scripts/build-tremplin.mjs` construit le paquet local depuis les sources figées.
- `node scripts/build-profile.mjs` reconstruit le Profil après modification du dock partagé.
- `node scripts/build-full-globe.mjs` embarque la destination native Tremplin dans le globe.
- `./gradlew.bat :app:assembleDebug --console=plain` produit l’APK Android.

L’option `--import-web` réimporte les sources et peut écraser les adaptations
locales de `TremplinPage.tsx` : ne pas l’utiliser pour une simple compilation.
L’extra debug `com.meewav.android.OPEN_TREMPLIN=true` sur `MainActivity` ouvre
directement l’atelier Tremplin. La route de lancement habituelle reste inchangée.

Aucun test automatique ni contrôle visuel n’est effectué pour cette passe,
conformément aux consignes du projet. Le rendu sur appareil reste à apprécier
par l’utilisateur ; une compilation ne vaut pas validation des interactions.
