# Provenance des ressources

## Identité Meewav

Les ressources suivantes proviennent de la version Web validée par l’utilisateur, au commit `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21` :

| Ressource Android | Source Web | Transformation |
| --- | --- | --- |
| `app/src/main/res/drawable-nodpi/auth_acoustic_background.png` | `public/images/auth-acoustic-background-trial.png` | Copie sans modification de l’image |
| `app/src/main/res/drawable/meewav_logo.xml` | `public/assets/meewav-logo.svg` | Conversion des tracés SVG en VectorDrawable, couleurs et géométrie conservées |
| `app/src/main/res/drawable/auth_web_signature.xml` | Signature SVG de `src/pages/AuthPage.tsx` | Tracé et couleur conservés en VectorDrawable |

Sur demande de l’utilisateur, la fenêtre Android reprend maintenant le tracé SVG, les dégradés et les couches de contour de `src/components/auth/AuthPanelChrome.tsx`, dans `AuthWindowPanel.kt`. Les effets sont dessinés et mis en cache à la résolution d’affichage. Les styles du bouton et des séparateurs viennent de `src/styles/auth.css` et `src/components/auth/auth-panel.css`. La largeur est adaptée au téléphone ; la hauteur reste identique entre les étapes et les contenus longs défilent à l’intérieur. Les champs et actions restent des composants Android.

Le fond correspond au choix graphique transmis par l’utilisateur le 13 septembre 2026. La réutilisation dans son application Android est autorisée par la mission. Cette provenance ne constitue pas une nouvelle attribution d’auteur ni une licence publique du logo ou du fond.

L’icône de lancement est un tracé natif provisoire de l’onde Meewav. Elle doit faire l’objet d’une validation graphique avant diffusion publique.

Adaptation mobile du contour demandée le 14 septembre : sommet abaissé (relief réduit de moitié) et arc inférieur continu de profondeur 18 au lieu de 50 dans le repère SVG. Le bas reste courbe sur toute sa largeur. Les dégradés et les couches lumineuses conservent la palette de la référence Web.

## Police

Inter variable est copiée depuis le dépôt officiel [Google Fonts / Inter](https://github.com/google/fonts/tree/main/ofl/inter). La notice SIL Open Font License est conservée intégralement dans [Inter-OFL.txt](Licences/Inter-OFL.txt). Aucune modification de la police.

## Bibliothèques

Jetpack Compose et les Material Icons sont des dépendances AndroidX, sous Apache 2.0. Le SDK communautaire Supabase Kotlin est sous MIT ; Kotlin, kotlinx et Ktor suivent leurs licences distribuées. Les bibliothèques restent récupérées par Gradle. L’inventaire juridique de la distribution finale devra être généré avec les dépendances effectivement embarquées avant publication.

Aucune licence générale du produit Meewav n’est créée par ce premier lot.

## Ressources du parcours iOS

Le fond actif de l’authentification est désormais `app/src/main/res/drawable-nodpi/auth_ios_background.png`, copie sans transformation de `Meewav/Assets.xcassets/AuthBackground.imageset/auth_background.png` au commit iOS ci-dessous. Le fond Web du premier essai est conservé dans les ressources mais n’est plus utilisé par cet écran.

La fenêtre iOS et son socle ont été essayés puis retirés à la demande de l’utilisateur, au profit de la fenêtre du site Web décrite ci-dessus. Le fond et le parcours d’inscription restent issus de la référence iOS.

Source : dépôt `sipiyou39/Meewav`, commit `aea7251a60a2b61d775901fcf39a62036fd108c4`. Les 28 avatars PNG sont copiés sans modification depuis les imagesets ci-dessous ; libellés, descriptions et ordre viennent de `Meewav/Features/Auth/Models/AvatarProfile.swift`. La réutilisation dans Android est demandée par l’utilisateur. Cette copie ne vaut pas attribution d’auteur ni nouvelle licence publique.

| Ressource Android dans `drawable-nodpi/` | Source iOS |
| --- | --- |
| `avatar_user_f.png` | `Meewav/Assets.xcassets/UserFIcon.imageset/UserFIcon@3x.png` |
| `avatar_accordeon.png` | `Meewav/Assets.xcassets/AccordeonIcon.imageset/AccordeonIcon@3x.png` |
| `avatar_micro.png` | `Meewav/Assets.xcassets/MicroIcon.imageset/MicroIcon@3x.png` |
| `avatar_inge_son.png` | `Meewav/Assets.xcassets/IngeSonIcon.imageset/IngeSonIcon@3x.png` |
| `avatar_bassiste.png` | `Meewav/Assets.xcassets/BassisteIcon.imageset/BassisteIcon@3x.png` |
| `avatar_beatboxer.png` | `Meewav/Assets.xcassets/BeatboxerIcon.imageset/BeatboxerIcon@3x.png` |
| `avatar_beatmaker.png` | `Meewav/Assets.xcassets/BeatmakerIcon.imageset/BeatmakerIcon@3x.png` |
| `avatar_instr_cuivre.png` | `Meewav/Assets.xcassets/InstrCuivreIcon.imageset/InstrCuivreIcon@3x.png` |
| `avatar_compositeur.png` | `Meewav/Assets.xcassets/CompositeurIcon.imageset/CompositeurIcon@3x.png` |
| `avatar_dansseur.png` | `Meewav/Assets.xcassets/DansseurIcon.imageset/DansseurIcon@3x.png` |
| `avatar_dansseuse2.png` | `Meewav/Assets.xcassets/Dansseuse2Icon.imageset/Dansseuse2Icon@3x.png` |
| `avatar_dj.png` | `Meewav/Assets.xcassets/DjIcon.imageset/DjIcon@3x.png` |
| `avatar_batteur.png` | `Meewav/Assets.xcassets/BatteurIcon.imageset/BatteurIcon@3x.png` |
| `avatar_guitare_elec.png` | `Meewav/Assets.xcassets/GuitareElecIcon.imageset/GuitareElecIcon@3x.png` |
| `avatar_orga_event.png` | `Meewav/Assets.xcassets/OrgaEventIcon.imageset/OrgaEventIcon@3x.png` |
| `avatar_guitare.png` | `Meewav/Assets.xcassets/GuitareIcon.imageset/GuitareIcon@3x.png` |
| `avatar_manager.png` | `Meewav/Assets.xcassets/ManagerIcon.imageset/ManagerIcon@3x.png` |
| `avatar_user.png` | `Meewav/Assets.xcassets/UserIcon.imageset/UserIcon@3x.png` |
| `avatar_percussion.png` | `Meewav/Assets.xcassets/PercussionIcon.imageset/PercussionIcon@3x.png` |
| `avatar_pianiste.png` | `Meewav/Assets.xcassets/PianisteIcon.imageset/PianisteIcon@3x.png` |
| `avatar_label.png` | `Meewav/Assets.xcassets/LabelIcon.imageset/LabelIcon@3x.png` |
| `avatar_studio.png` | `Meewav/Assets.xcassets/StudioIcon.imageset/StudioIcon@3x.png` |
| `avatar_instr_cordes.png` | `Meewav/Assets.xcassets/InstrCordesIcon.imageset/InstrCordesIcon@3x.png` |
| `avatar_synthetiseur.png` | `Meewav/Assets.xcassets/SynthetiseurIcon.imageset/SynthetiseurIcon@3x.png` |
| `avatar_proffesseur.png` | `Meewav/Assets.xcassets/ProffesseurIcon.imageset/ProffesseurIcon@3x.png` |
| `avatar_violon.png` | `Meewav/Assets.xcassets/ViolonIcon.imageset/ViolonIcon@3x.png` |
| `avatar_clippeur.png` | `Meewav/Assets.xcassets/ClippeurIcon.imageset/ClippeurIcon@3x.png` |
| `avatar_instr_vent.png` | `Meewav/Assets.xcassets/InstrVentIcon.imageset/InstrVentIcon@3x.png` |

`PreviewTerms.kt` reprend intégralement `TermsDetailsView.demoTerms`, identifié comme texte de démonstration dans le code iOS. Il est présenté comme tel et ne vaut pas validation juridique des conditions publiques.

## Avatars en résolution source — 14 septembre 2026

Les 28 miniatures iOS de 179–180 pixels ont été remplacées par les PNG correspondants de `Meewav-Web/public/images/avatar/`, référence Web `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21`. Copies sans transformation ; aucune génération ni accentuation artificielle. Les identifiants iOS, l’ordre du catalogue et les fichiers de provenance historiques ci-dessus sont conservés. Les sources font 466 à 1478 pixels de haut (la majorité dépasse 1000 pixels) ; le piano et la guitare acoustique restent moins définis que les autres.

| Ressource Android dans `drawable-nodpi/` | Nouvelle source dans `public/images/avatar/` |
| --- | --- |
| `avatar_accordeon.png` | `ACCORDEON.png` |
| `avatar_bassiste.png` | `BASSISTE.png` |
| `avatar_batteur.png` | `BATTEUR.png` |
| `avatar_beatboxer.png` | `BEATBOXER.png` |
| `avatar_beatmaker.png` | `BEATMAKER.png` |
| `avatar_clippeur.png` | `CLIPPEUR.png` |
| `avatar_compositeur.png` | `COMPOSITEUR.png` |
| `avatar_dansseur.png` | `DANSSEUR.png` |
| `avatar_dansseuse2.png` | `DANSSEUSE (2).png` |
| `avatar_dj.png` | `DJ.png` |
| `avatar_guitare_elec.png` | `GUITARE ELECTRIQUE.png` |
| `avatar_guitare.png` | `guitare.png` |
| `avatar_inge_son.png` | `INGE SON.png` |
| `avatar_instr_cordes.png` | `INSTRUMENT A CORDE.png` |
| `avatar_instr_cuivre.png` | `INSTRUMENT CUIVRE.png` |
| `avatar_instr_vent.png` | `INSTRUMENT A VENT.png` |
| `avatar_label.png` | `LABEL.png` |
| `avatar_manager.png` | `MANAGER.png` |
| `avatar_micro.png` | `MICRO.png` |
| `avatar_orga_event.png` | `ORGANISATEUR D'ÉVÉNEMENTS.png` |
| `avatar_percussion.png` | `PERCUSSION.png` |
| `avatar_pianiste.png` | `PIANO.png` |
| `avatar_proffesseur.png` | `PROFFESSEUR.png` |
| `avatar_studio.png` | `STUDIO ENREGISTREMENT.png` |
| `avatar_synthetiseur.png` | `SYNTHETISEUR.png` |
| `avatar_user.png` | `UTILISATEUR LAMBDA.png` |
| `avatar_user_f.png` | `UTILISATRICE LAMBDA.png` |
| `avatar_violon.png` | `VIOLON.png` |

## Plateau et fenêtre de sélection iOS — 14 septembre 2026

`IosAvatarStage.kt` adapte les tracés et la disposition de `Meewav/Features/Auth/Components/StagePlatformRenderer.swift`, `AvatarStageOverlayView.swift`, `SaturnCarouselLayout.swift`, `SaturnCarouselView.swift` et `LoginWindowChromeView.swift` du dépôt `sipiyou39/Meewav`, `main`, commit `aea7251a60a2b61d775901fcf39a62036fd108c4`. La récupération de `main` pour ce lot confirme cette même révision. Le portage est réalisé en Kotlin/Compose et Canvas Android ; aucune nouvelle image ni ressource externe n’est générée. Les avatars HD et leur provenance restent ceux du tableau précédent. Cette référence de code ne constitue pas une attribution à un auteur distinct ni une nouvelle licence.

Sur retour utilisateur, la palette du CTA et de la vitre est adaptée du poteau de navigation Web : `Meewav-Web/src/features/globe/components/MeewavPrimaryNav.tsx`, gradient `meewav-l-chassis-fill-gradient`, variante Rooms (`#2B1B5C`, `#4E349F`, `#5137A1`, `#372574`). Le code Web n’est pas modifié. Le plateau reste noir avec des reflets discrets.

## Boutons de connexion sociale — 14 septembre 2026

- `auth_google_round.png` : copie sans transformation de `Android + Web/PNG @4x/Dark/Theme=Dark, Show text=No, Shape=Pill, Platform=Android+Web@4x.png` dans [le paquet officiel Google](https://developers.google.com/static/identity/images/signin-assets.zip), distribué depuis les [consignes de marque Google Identity](https://developers.google.com/identity/branding-guidelines). Le bouton complet est affiché proportionnellement ; la marque n’est pas recolorée.
- `auth_apple.xml` : transcription en VectorDrawable du chemin du symbole Apple déjà utilisé par `Meewav-Web/src/pages/AuthPage.tsx`, sous forme blanche. Cette provenance ne transfère aucun droit sur les marques Google ou Apple et n’atteste pas une validation de publication par ces fournisseurs.

- `auth_google.xml` : silhouette G extraite du chemin de masque du SVG officiel `Android + Web/SVG/Dark/Theme=Dark, Show text=No, Shape=Square, Platform=Android+Web.svg` du même paquet Google. Transcription vectorielle monochrome blanche, sans fond ni contour de bouton, cadrée sur le G ; ce n’est pas une reproduction inchangée du bouton officiel. L’ancien PNG reste conservé.

- `auth_google_color.png` : copie sans retouche du [G multicolore officiel Google](https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png), PNG de 48 × 48 pixels. Affiché à 18 dp dans Compte, sans fond circulaire ni recoloration. Il remplace visuellement le G monochrome ; les ressources précédentes restent conservées.

## Catalogue des scènes musicales — 14 septembre 2026

Le catalogue Android est dérivé du dépôt canonique `Meewav-Web`, référence Web de ce lot `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21`. Il conserve le format de géographie `vinyl-v1` et utilise un schéma d’export Android `version: 1`. Les fichiers produits et leur provenance structurée se trouvent dans [app/src/main/assets/music-scenes](../app/src/main/assets/music-scenes/) ; [provenance.json](../app/src/main/assets/music-scenes/provenance.json) conserve les chemins sources, la méthode de transformation et les comptages de cet export.

| Ressource Android | Source Web | Transformation |
| --- | --- | --- |
| `music-scenes/catalog.json` | `vendor/globe-vinyle/data/cities.json`, enrichi par `public/search/france-communes-index.json` | Noms, identifiants, départements, population et centres du globe ; codes postaux et alias ajoutés par le chargeur Web ; emprises communales conservées pour la recherche locale |
| `music-scenes/scenes/<département>.json` | `vendor/globe-vinyle/data/quarters/index.json` et les GeoJSON qu’il référence ; quartiers parisiens de `sectors.geojson` ; contours `communes/<département>.geojson` pour les communes sans subdivision | Regroupement par département et code communal, avec les identifiants et libellés de scène, centres intérieurs, emprises, provenance technique et géométries d’origine |
| `music-scenes/SOURCES.md` | `vendor/globe-vinyle/data/SOURCES.md` | Copie intégrale de la notice source, sans réécriture de ses historiques |

La reconstruction hors ligne utilise [scripts/export-music-scenes.mjs](../scripts/export-music-scenes.mjs), avec Node 24 : `node scripts/export-music-scenes.mjs --web-root <dépôt Meewav-Web canonique>`. Le script lit les fichiers locaux et exécute directement `parseSceneCollection` de `src/features/auth/musicSceneSelection.ts`, `findInteriorVisualCenter` de `musicSceneVisualCenter.ts` et les enrichissements de `loadFranceCommunesIndex.ts`. Les imports TypeScript sont transformés avec l’outil intégré de Node ; aucune dépendance npm supplémentaire ni requête réseau n’est nécessaire. Le dépôt Web reste inchangé.

Les géométries `Polygon` et `MultiPolygon`, y compris leurs anneaux intérieurs, sont conservées sans simplification. Les coordonnées suivent WGS84, dans l’ordre `[longitude, latitude]`. Un centre de scène est un point cartographique calculé à l’intérieur de son territoire ; il ne correspond pas à la position GPS d’un membre. Les codes conservent leurs zéros initiaux. Le champ technique Web `source: "iris"` est conservé, y compris pour les quartiers administratifs parisiens : il ne réattribue pas ces derniers à l’IGN ou à l’INSEE.

L’export de ce lot contient 34 969 communes ou identités territoriales, 46 906 scènes et 109 fichiers départementaux. Son catalogue représente 12 572 084 octets et ses fichiers de scènes 103 434 391 octets avant compression de distribution. Ces nombres décrivent la préparation des assets ; ils ne remplacent ni les comptages historiques de la notice source ni une validation fonctionnelle.

Les attributions et licences détaillées restent accessibles dans [SOURCES.md](../app/src/main/assets/music-scenes/SOURCES.md). Les contours administratifs nationaux et les identités communales relèvent de « Contours administratifs — data.gouv.fr / IGN ADMIN EXPRESS et sources des collectivités d’outre-mer », sous ODbL 1.0 ; les sources ultramarines ne doivent pas être réduites à IGN. Paris conserve l’attribution « Quartiers administratifs — Ville de Paris, disponibles sous ODbL 1.0 ». Les quartiers issus des Contours IRIS IGN/INSEE 2026 via la Géoplateforme sont sous Licence Ouverte / Open Licence 2.0 ; les compléments municipaux conservent leurs provenances respectives, notamment les conseils consultatifs de quartier d’Angers. Le détail des couches de quartier est documenté dans le catalogue Web `vendor/globe-vinyle/data/quarters/sources.json` et ses notices d’origine. L’export ne crée aucune nouvelle licence générale du produit Meewav.

## Globe d’authentification — 14 septembre 2026

Le globe livré dans ce lot reprend `Meewav-Web/src/components/auth/HolographicOrbCTA.tsx` à la référence `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21`. Sa provenance et sa reconstruction sont décrites dans [app/src/main/globe-source/README.md](../app/src/main/globe-source/README.md). La caméra carrée, les vitesses de rotation, la carte grise et noire, le halo violet et les reflets solidaires du vinyle viennent de cette référence.

Les modules sous `app/src/main/globe-source/vendor/globe-vinyle` et `vendor/meewav-vinyl` sont copiés sans transformation depuis le Web. La texture `earth_specular.jpg` provient de `vendor/globe-vinyle/assets/ui/images/earth_specular.jpg`. Ces chemins identifient les ressources du projet ; ils ne constituent ni une nouvelle attribution d’auteur ni une licence publique des éléments Meewav.

Le bundle embarque Three.js **0.184.0** et son `OrbitControls`. La licence MIT intégrale est conservée dans [THREE-LICENSE.txt](../app/src/main/assets/auth-globe/THREE-LICENSE.txt) ; le code du contrôle est conservé dans `app/src/main/globe-source/vendor/three/OrbitControls.js`.

La reconstruction se fait avec [scripts/build-auth-globe.mjs](../scripts/build-auth-globe.mjs), qui utilise le Rolldown déjà installé du dépôt Web et la version précise de Three, sans modifier le Web. Le résultat HTML, CSS, JavaScript et texture est embarqué dans `app/src/main/assets/auth-globe/`. Une WebView Android affiche cette scène locale ; Compose porte l’action et l’accessibilité. Le mode interactif réutilise le même globe d’authentification et ses gestes ; il n’ajoute pas les villes, profils, Rooms ou services du globe produit. Le téléphone et un build Gradle habituel utilisent directement les fichiers compilés.

Aucun test ni contrôle visuel automatique n’a été réalisé pour l’export du catalogue ou ce portage du globe. La présence des assets et de leurs notices ne constitue pas une validation du rendu, des gestes ou des parcours sur Android.
