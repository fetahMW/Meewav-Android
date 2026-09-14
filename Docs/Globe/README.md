# Globe Android — audit Web et intégration

## Parcours

Dans l’aperçu DEBUG, **Terminer** quitte Localisation et ouvre **Ta scène est prête** directement en paysage, avec le fond acoustique, la miniature animée et **Touche le globe pour entrer**. Le clic ouvre la scène complète du globe, toujours en paysage, avec son décor spatial. Retour ramène à l’arrivée en paysage, puis à Localisation en portrait. Le bypass reste actif et ne crée aucun compte.

La miniature et le globe d’exploration sont deux documents locaux distincts. L’authentification et la navigation Android restent en Compose ; le site distant n’est pas chargé.

## Audit de la référence

Source : `Meewav-Web`, branche `main`, commit `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21`. Le dépôt Web n’est pas modifié.

| Élément | Source dans le Web | Reprise Android |
| --- | --- | --- |
| Miniature | `src/components/auth/HolographicOrbCTA.tsx` | Limitée à l’arrivée ; carte gris/noir et reflets solidaires du vinyle. |
| Vrai globe | `src/features/globe/VinylGlobe.tsx`, `vendor/globe-vinyle/shared/src/App.tsx` | Scène React/Three indépendante déjà intégrée par iframe dans le Web ; reprise complète locale. |
| Cadrage | `saturn-ring.mjs`, `navigation-presets.mjs`, `orbit-camera.mjs` | Alignement autour de Paris, bearing 15° et cadrage calculé selon le viewport ; aucun OrbitControls de miniature pour l’exploration. |
| Vinyle | `saturn-ring.mjs`, `vinyl-record-geometry.mjs`, `vinyl-record-material.mjs` | Géométrie, relief, éclairage et finition du Web. Disque et portraits tournent ensemble en 72 s ; arrêt durant l’exploration de l’anneau. |
| Couleurs | `globe-palette.mjs`, `three-engine.ts` | Océan gris, terres étrangères noires, palette territoriale et éclairages physiques du moteur complet. |
| Décor spatial (« skybox ») | `star-sky.mjs`, `style.css` | La scène active utilise 3 600 étoiles procédurales orientées avec la caméra sur un fond sombre dégradé ; elle ne charge pas une cubemap de six images. Aucun ancien essai spatial réactivé. |
| Gestes | `three-engine.ts`, `direct-drag.mjs`, `wheel-zoom.mjs`, `ring-navigation.mjs` | Gestes tactiles, zoom, vols et limites du moteur Web. |
| Géographie | `data/`, `border-worker.mjs`, `quarter-stream.mjs` | Pays, régions, communes, quartiers et workers embarqués. Chargement local à la demande des données fines. |
| Artistes et monuments | `ring-portraits.mjs`, `ground-avatars.mjs`, `eiffel-landmark.mjs`, `NationalTopTen.tsx` | Ressources, modèles et Draco locaux. Les profils et le classement de démonstration ne deviennent pas des données Supabase réelles. |
| Interface | `globe-interface.tsx`, `GlobeNavigationPole.tsx` | Recherche, filtres, modes, exploration et préprofils ; feuille Android pour leur encombrement en paysage. |
| Chargement | `vendor/meewav-vinyl/src/GlobeLoading.jsx`, `components/Vinyl.jsx` | Même animation du tourne-disque que sur le Web, affichée jusqu’à la première image du moteur. |

Les destinations Messagerie, Rooms, La Scène, Marketplace, Tremplin et Profil sont raccordées au parent de l’iframe dans le Web. Ce lot ne les raccorde pas à Android. Le dialogue existant annonce les destinations encore non reliées.

## Sources, construction et droits

Les sources copiées sont sous `app/src/main/globe-source/vendor/`. L’inventaire `app/src/main/globe-source/web-globe-provenance.json` conserve les chemins et SHA-256 des 2 166 fichiers repris. L’adaptation est séparée : `full-globe.tsx`, `full-globe-bridge.ts`, `full-globe-mobile.css`, `full-globe-nav-texture.tsx`. Ce dernier conserve le petit globe de navigation fixe, selon la demande utilisateur, sans modifier le moteur 3D. Le document et les ressources livrés sont dans `app/src/main/assets/globe-vinyle/`.

Le moteur complet est compilé sans substitution de rendu : ratio de pixels `Math.min(devicePixelRatio, 2)`, anticrénelage activé, sphère à 192 × 96 segments et géographie complète de `land.bin`. Le vinyle conserve le niveau `high` du Web, soit 1 024 segments angulaires, huit segments de biseau et les profils de matière à 8 192 échantillons. Les portraits gardent leurs images sources et l’atlas Web à 512 pixels par case, sans réduction Android supplémentaire.

Le 15 septembre 2026, à la demande de l’utilisateur, les essais de résolution réduite, de géométrie simplifiée, de modification des matériaux et de cache GPU intermédiaire ont été retirés. Le rendu utilise de nouveau directement le moteur Web. La miniature d’arrivée possédait déjà les réglages de sa référence Web et reste inchangée. Ce rétablissement ne constitue pas une validation de la fluidité ou des 60 images par seconde.

Reconstruction depuis Android : `node scripts/build-full-globe.mjs`. Le chemin Web peut être passé en premier argument. Le script utilise les dépendances déjà installées de `Meewav-Web/vendor/globe-vinyle`, en lecture seule : Three 0.185.1, React/ReactDOM 19.2.6 et esbuild 0.25.12. Il ne lance ni serveur ni installation. Les bundles livrés suffisent à Gradle et au téléphone.

Les données et médias sont embarqués pour cette reprise autonome ; le poids de l’APK de travail augmente en conséquence. La distribution différée des ressources n’est pas traitée ici. Les notices de données, la provenance des modèles et le manifeste de licence des médias accompagnent les copies sans modification. Les licences des 11 dépendances compilées sont dans `app/src/main/assets/globe-vinyle/THIRD_PARTY_NOTICES.txt`, en plus des en-têtes générés. Aucune licence publique Meewav ou nouvelle attribution d’auteur n’est créée.

## Chargement et cycle de vie

Le document `https://appassets.androidplatform.net/globe-vinyle/index.html` est servi depuis l’APK. Un manifeste limite l’intercepteur aux fichiers embarqués ; les autres origines, les requêtes non GET et les traversées de chemin sont refusées. La CSP permet les modules, styles, images, médias et workers locaux nécessaires, dont Draco/WASM. Les accès réseau, fichiers arbitraires, géolocalisation Web et permissions WebView restent désactivés.

Aucun secret, cookie Supabase, jeton ou pont JavaScript vers Android n’est exposé. L’adaptateur natif vers JavaScript transmet uniquement l’activité et des commandes fixes. Démonter React libère le moteur et ses workers. La WebView utilise `MATCH_PARENT` et le document une hauteur explicite pour éviter le canvas de hauteur nulle. Le statut prêt vient de `App.tsx` après `engine.firstFrame`.

## État des vérifications

Avant le rétablissement des réglages Web, le bundle avait été construit, `assembleDebug` avait réussi et l’APK avait été installé sur le S22 Ultra. L’arrivée paysage sur fond acoustique et le moteur complet avec étoiles, vinyle, portraits et palette territoriale avaient été observés sur le téléphone. Canvas 797 × 384 CSS ; aucune ressource distante ni erreur HTTP relevée, contexte WebGL actif sans erreur. Ces premières observations ne validaient pas la fluidité après restauration. L’inscription réelle, les services, les Rooms et les lives ne sont pas validés ici.

Au checkpoint de restauration `32333d0` : bundle reconstruit, `:app:assembleDebug` réussi, APK installé et application relancée sur le S22 Ultra, sans relevé FPS supplémentaire à ce stade.

À la demande suivante de l’utilisateur, l’[audit de performances du 15 septembre](Audit-performance-2026-09-15.md) a ensuite comparé les composants sur le téléphone. Il a identifié les peintures répétées du petit globe de navigation comme cause du ralentissement principal. L’adaptateur Android le dessine désormais une seule fois. La trace après correction ne présente plus les lectures de pixels répétées ; le moteur et les 2 166 ressources de provenance restent identiques. Les mesures vont d’environ 38 à 60 FPS selon les séquences, avec des fréquences GPU variables et une limitation thermique pendant les essais prolongés : ce résultat ne garantit pas 60 FPS constants. Le rapport distingue les mesures debug, optimisées et à chaud.
