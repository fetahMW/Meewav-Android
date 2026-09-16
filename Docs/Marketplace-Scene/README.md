# Marketplace et La Scène — import Android

Branche : `codex/marketplace-scene`. Référence : dépôt canonique Meewav-Web,
état exact enregistré dans les deux `web-provenance.json`. Le site n’est pas modifié.

## Reprise et câblage

Les graphes de dépendances de MarketPage et ShortsPage sont copiés dans des sources
Android figées, avec médias locaux dans leur résolution d’origine et notices des
bibliothèques. Le build courant utilise exclusivement ces copies. Les services
Supabase du site restent présents : catalogue, favoris, panier, demandes et
brouillons Market ; catalogue publié, interactions, commentaires, profils et
publication Scène. Le runtime partage la session native déjà employée par Profil
et Tremplin. Aucun nouveau compte, clé ou refresh token n’est stocké dans le WebView.

Le mode aperçu est transmis par Android et conserve les fixtures investisseurs.
Le mode connecté utilise le serveur configuré ; ce portage ne crée aucun backend
supplémentaire. En particulier le paiement réel du panier reste « Non activé »,
comme dans le composant Web source. Une compilation ne valide pas les transactions,
les permissions serveur, la publication ni les appels réels.

## Adaptation mobile

- Bandeau 44 px et onglets 56 px, glass du Profil ; mêmes navbar basse, globe,
  violet urbain et matériaux noirs/graphite. Les images ne sont pas compressées.
- Marketplace : recherche sur sa propre ligne, favoris/notifications/panier/Market
  Center conservés ; annonces principales avec photo et pied compact, miniatures
  tactiles et catalogue deux colonnes. Fiche produit en panneau vertical défilable,
  filtres et panier au-dessus de la navigation, dépôt en étapes et aperçu mobile.
- Scène : accueil vidéo en une colonne 16:9, rail de Shorts, recherche et filtres
  séparés des onglets. Lecteur suivi de l’identité, des actions, commentaires et
  recommandations. Playlists, abonnements, historique, studio et publications sont
  conservés, ainsi que l’état de disponibilité de la TV défini par le site.
- Les détails et panneaux sont défilables ; les entrées média utilisent le sélecteur
  Android existant. Le lecteur plein écran prend le paysage et restaure le portrait
  en quittant ce mode. Le cycle de vie suspend les médias à la sortie.
- La restauration du scroll de la Scène cible son conteneur mobile et conserve le
  retour vers la carte sélectionnée. Les contrôles purement desktop du lecteur
  (cinéma, PiP navigateur, curseur volume) sont masqués ; volume du téléphone,
  mute, lecture, suivant, réglages, mini-lecteur et plein écran restent disponibles.

Navigation native : les deux nouvelles activités sont accessibles depuis le globe,
Profil, Tremplin et l’une depuis l’autre. Les routes vers un profil/vendeur ou une
conversation conservent leurs paramètres. Rooms reste signalé comme non intégré.

## Livraison

```
node scripts/build-feature.mjs market
node scripts/build-feature.mjs scene
node scripts/build-profile.mjs
node scripts/build-tremplin.mjs
node scripts/build-full-globe.mjs
./gradlew.bat :app:assembleDebug --console=plain
```

`--import-web` est uniquement l’import initial : ne pas le relancer sur les sources
adaptées. `--sync-assets` recopie les ressources publiques, sans écraser les TSX.
Les provenances distinguent l’original du site et les adaptations versionnées.

Pas de tests ni de contrôle visuel automatique pour cette passe, conformément à la
consigne du projet. La revue visuelle et les essais sur le Samsung appartiennent à
l’utilisateur. Les modifications Gradle préexistantes sont laissées hors commit.

## Reprise des proportions Android — 16 septembre 2026

À la demande de l’utilisateur, le Marketplace affiche quatre onglets de même
largeur à la fois ; les deux suivants se découvrent par glissement horizontal.
Le bandeau reste fixe, l’onglet sélectionné reste visible et le trait effilé est
conservé. Les autres piliers ne sont pas affectés par ce réglage.

L’accueil utilise des offres vedettes horizontales (photo 40 %, résumé 60 %,
hauteur intrinsèque à partir de 184 px), puis des rails de deux petites cartes.
Le catalogue garde deux colonnes sur téléphone, avec visuels 3:2, titres sur deux
lignes maximum, vendeur et prix lisibles. Aucun pied de carte n’a de hauteur fixe ;
les informations spécifiques aux services et achats groupés restent présentes.
Les descriptions complètes sont dans les fiches. Les photos restent intactes.
Le titre de rubrique et les outils partagent une ligne ; recherche et action
Vendre partagent la suivante, sans grand slogan supplémentaire.

Matière commune : noir hi-fi / graphite sombre, léger relief inférieur, contours
fins. Actions principales : jeton existant `--mobile-violet-cta`. Catégories et
badges ne reprennent plus les multiples accents orange/cyan/rose du site.
Fiches, demandes, brouillons et panier conservent leurs handlers et leur scroll.
Compilation de livraison uniquement ; pas de tests ou revue visuelle automatiques.

### Barre intelligente et géométrie — correction suivante

Occasion décale le rail d’un onglet, Location de deux : les destinations suivantes
apparaissent sans devoir atteindre le bord. Le rail seul défile, sans scrollIntoView
sur les ancêtres. Les redimensionnements repositionnent la sélection.
L’indicateur appartient à son bouton, avec une géométrie complète centrée à 50 %
et un halo violet effilé ; suppression du cumul des offsets Profil / Feature.
Recherche en capsule de 48 px, ajout dans un carré arrondi de 48 × 48 px.
Les images de catalogue et des petits rails sont positionnées dans leur cadre 3:2,
pour que leurs dimensions intrinsèques ne puissent plus étirer les cartes.
