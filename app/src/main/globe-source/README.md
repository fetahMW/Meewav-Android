# Globe d’authentification Android

La miniature décrite ci-dessous est désormais limitée à **Ta scène est prête**, en paysage dès Terminer. Le vrai globe utilise son propre bundle, issu de la scène complète du Web : voir [l’audit et l’intégration Android](../../../../Docs/Globe/README.md).

La scène reprend `Meewav-Web/src/components/auth/HolographicOrbCTA.tsx` à la référence Web `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21` du 14 septembre 2026. La caméra carrée, les deux vitesses de rotation, la carte gris/noir, le halo violet et les reflets solidaires du vinyle sont conservés. Les fichiers sous `vendor/globe-vinyle` et `vendor/meewav-vinyl` sont copiés sans transformation depuis cette référence. `earth_specular.jpg` vient de `vendor/globe-vinyle/assets/ui/images/earth_specular.jpg` ; la provenance existante n’est pas une nouvelle attribution d’auteur ni une licence publique Meewav.

Le bundle embarque Three.js 0.184.0 et son OrbitControls. Leur licence MIT intégrale est dans `../assets/auth-globe/THREE-LICENSE.txt`. La copie locale du contrôle reste dans `vendor/three/OrbitControls.js`.

Reconstruction : `node scripts/build-auth-globe.mjs`, depuis le dépôt Android. Le chemin du dépôt Web peut être donné en argument. Le script utilise uniquement son Rolldown déjà installé et la version précise de Three ; il ne modifie pas le Web. Le JavaScript compilé est déjà dans les assets Android : aucune chaîne Node n’est requise sur le téléphone ni lors d’un build Gradle habituel.

La WebView charge `https://appassets.androidplatform.net/assets/auth-globe/index.html` par `loadUrl`. Son `WebViewClient` sert les quatre fichiers autorisés directement depuis l’APK : HTML, CSS, bundle JavaScript et carte de la Terre. Les autres requêtes sont refusées et le réseau reste désactivé. La CSP autorise uniquement le script, le style et l’image de cette origine locale ; aucune URL `data:` n’est nécessaire. Cette intégration reprend le principe du [chargement de contenu local Android](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), avec un intercepteur limité à ces quatre fichiers et sans dépendance Webkit supplémentaire.

Le chargement précédent combinait `loadDataWithBaseURL` et un filtre qui refusait les URL `data:`. Ce filtre interceptait aussi le document généré par WebView et sa texture inline : la capture utilisateur affichait `ERR_HTTP_RESPONSE_CODE_FAILURE`. La page n’utilise plus ce chemin. La WebView reste transparente jusqu’à la première image rendue avec la carte de la Terre ; un indicateur natif accompagne le chargement, puis le clic est activé. En cas d’échec, le message natif propose de réessayer et masque la page d’erreur du navigateur. Le délai d’attente de la texture après chargement du document est borné à huit secondes.

Aucune session, aucun bridge JavaScript natif, aucun stockage Web ni accès général aux fichiers n’est donné à la scène. Compose porte le clic et l’accessibilité. Le parent peut activer le mode interactif pour le même globe local (glisser, pincer, actions d’accessibilité) ; ce mode n’ajoute aucune ville, donnée de profil, Room ou service du vrai globe produit.

La référence iOS `sipiyou39/Meewav`, `main` à `aea7251a60a2b61d775901fcf39a62036fd108c4`, a aussi été consultée : `Meewav/GlobeView.swift` dessine une projection orthographique dans un Canvas SwiftUI animé. Elle ne contient pas le vinyle et les matériaux Three.js du Web. Android conserve donc la scène Three.js finale, adaptée aux gestes, à la taille et au cycle de vie du téléphone, au lieu de porter ce dessin simplifié.

Le renderer exige WebGL 2 dans la WebView système. La mise en pause suit la visibilité et le cycle de vie ; le départ de la composition détruit la WebView et libère sa scène.

## Vérification autorisée sur S22 Ultra — 14 septembre 2026

Le diagnostic du lecteur vide a mesuré un canvas de 340 × 0 pixels CSS, malgré une WebView native de 956 × 956 pixels et un statut JavaScript « ready ». La hauteur relative du document se repliait sur son contenu. La WebView reçoit désormais des `LayoutParams.MATCH_PARENT` explicites ; le canvas est ancré au viewport et le moteur refuse d’annoncer une première image avec une dimension nulle. Le comportement des hauteurs relatives en mode `WRAP_CONTENT` est décrit dans [le contrat Android WebView, section Layout size](https://android.googlesource.com/platform/frameworks/base/+/867d10944d7d2bcf38609629edfc7e75d68a0e34/core/java/android/webkit/WebView.java).

Après reconstruction et installation, le parcours sans saisie a atteint la miniature visible : canvas 340 × 340, buffer 680 × 680. Le clic natif a ouvert le paysage : canvas 797 × 384, buffer 1594 × 768. Carte, vinyle et reflets apparaissent dans les captures du téléphone ; des appels de rendu continus et aucune erreur WebGL ont été relevés. Le glisser natif modifie la caméra. Le contrôle de pincement via DevTools n’a pas abouti et ne constitue pas une validation du geste physique. Les captures de diagnostic sont conservées localement dans `app/build/reports/globe-check/`, hors sources.

Ces contrôles portent sur le visualiseur issu de la miniature d’inscription. Le retour utilisateur suivant demande la scène complète du site : skybox, cadrage, animation et navigation du véritable globe restent à reprendre depuis `vendor/globe-vinyle`, et ne sont pas validés par ce correctif d’affichage.
