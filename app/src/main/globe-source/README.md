# Globe d’authentification Android

La scène reprend `Meewav-Web/src/components/auth/HolographicOrbCTA.tsx` à la référence Web `32a5e5fea7f6eebb3867c22a27e8b62230bb8d21` du 14 septembre 2026. La caméra carrée, les deux vitesses de rotation, la carte gris/noir, le halo violet et les reflets solidaires du vinyle sont conservés. Les fichiers sous `vendor/globe-vinyle` et `vendor/meewav-vinyl` sont copiés sans transformation depuis cette référence. `earth_specular.jpg` vient de `vendor/globe-vinyle/assets/ui/images/earth_specular.jpg` ; la provenance existante n’est pas une nouvelle attribution d’auteur ni une licence publique Meewav.

Le bundle embarque Three.js 0.184.0 et son OrbitControls. Leur licence MIT intégrale est dans `../assets/auth-globe/THREE-LICENSE.txt`. La copie locale du contrôle reste dans `vendor/three/OrbitControls.js`.

Reconstruction : `node scripts/build-auth-globe.mjs`, depuis le dépôt Android. Le chemin du dépôt Web peut être donné en argument. Le script utilise uniquement son Rolldown déjà installé et la version précise de Three ; il ne modifie pas le Web. Le JavaScript compilé est déjà dans les assets Android : aucune chaîne Node n’est requise sur le téléphone ni lors d’un build Gradle habituel.

La WebView charge uniquement quatre ressources autorisées de son origine HTTPS fictive, entièrement servies depuis l’APK : HTML, CSS, bundle et texture. Elle ne reçoit aucune session, aucun bridge JavaScript natif, aucun stockage Web ni accès général aux fichiers. Compose porte le clic et l’accessibilité. Le parent peut activer le mode interactif pour le même globe local (glisser, pincer, actions d’accessibilité) ; ce mode n’ajoute aucune ville, donnée de profil, Room ou service du vrai globe produit.

Le renderer exige WebGL 2 dans la WebView système. La mise en pause suit la visibilité et le cycle de vie ; le départ de la composition détruit la WebView et libère sa scène. Aucun essai automatique ni vérification visuelle n’a été réalisé pour ce portage. Le rendu réel, les gestes et la fluidité restent à apprécier sur la cible Android désignée.
