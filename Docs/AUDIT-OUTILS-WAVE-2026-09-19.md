# Audit comparatif des outils Wave — 19 septembre 2026

## Périmètre et méthode

Audit statique du code des parcours accessibles, de leurs boutons, handlers et services. Aucune modification fonctionnelle, aucun test de live, aucun appel métier distant, aucune validation visuelle. « Branché dans le code » ne signifie pas « déployé et vérifié entre deux appareils ».

Sources locales : Android `Meewav-Android`, main `4667c3b` ; Web `Meewav-Web`, main `fd426f599` ; iOS `Meewav-iOS`, main `aea7251`. Les fichiers personnels non suivis du Web sont préservés. Le laboratoire MeewavGlobe n'est pas une référence active.

Le sujet est le troisième onglet Wave, et son parcours de contribution côté public. Chat, Mixeur et Invités restent le socle partagé déjà travaillé.

## 1. Android actuel

`app/src/main/java/com/meewav/android/features/rooms/wave/WaveMixerScreen.kt:309` envoie cet onglet vers `WaveTabPlaceholder` (déclaration ligne 1327). Il affiche uniquement une icône et le nom du module.

| Élément | État constaté |
|---|---|
| Bouton Wave dans la barre principale | Change réellement l'onglet sélectionné |
| Sous-onglets métier Wave | Absents |
| Réception des boucles / propositions | Absente de cet onglet |
| Écoute privée des propositions | Absente |
| Accepter, refuser, demander une correction | Absents |
| Vote public / verdict / remplacement | Absents |
| Composition collective multipiste | Absente de cet onglet |
| Services de données Wave du troisième onglet | Non raccordés |

Le Mixeur séparé dispose de l'import local, lecture MediaPlayer, waveform progressive et détection Superpowered BPM/tonalité. Cela ne constitue pas encore un moteur de composition collective synchronisé. La présence de sources Web copiées dans `rooms-source/vendor` ne prouve pas leur utilisation par l'écran natif.

## 2. Web : outils réellement montés

Entrée : `src/features/rooms/place/PlaceStudioPanel.tsx` → `tools/RoomToolsShell.tsx`. Configuration : `tools/roomTools.config.ts:17`.

Trois sous-onglets : **Boucle**, **Vote**, **Beat**.

### Boucle — Sas des boucles

Composant `tools/panels/WaveGatePanel.tsx`.

- Liste des propositions : artiste, portrait, grade, instrument/catégorie et état. Sélection d'une boucle et écoute via le transport partagé.
- Bouton **Règles** : BPM, mesures, tonalité et type ; enregistrement par `wave.rules.update`.
- Contrôle **Ouvert / Fermé / Filtré** : autorise ou coupe les soumissions et sélectionne les catégories acceptées. Catégories : basses, drums, mélodies, accords, nappes, acapella, ambiances/FX.
- **Valider** : envoie la proposition à l'état `analysis` ; ne doit pas être traduit dans Android par « intégrée au Beat ». L'analyse et la suite du cycle restent distinctes.
- **Refuser** : ouvre une saisie de motif/retour puis commande de changement d'état.
- **Télécharger**, **Message**, fiche artiste : actions contextuelles de la proposition sélectionnée.
- Gestion des versions et retours présente dans les handlers ; sa simple présence ne vaut pas visibilité de chaque commande dans la vue courante.
- Verrouillages selon rôle, opération en cours, état et confirmation des droits.

### Vote — validation collective

Le composant monté est `WaveVoteQueuePanel.tsx`, pas l'ancien `WaveSequencerPanel.tsx`.

- File des boucles prêtes pour le vote, sélection, écoute et niveau d'écoute.
- **Télécharger**, **Message**, **Retirer** : retire de la file vers `to-review`, sous conditions ; pas une suppression arbitraire de fichier.
- Sélecteur de durée : **2, 30, 45, 60 secondes** dans le code actuel. La valeur 2 secondes doit être traitée comme un choix à arbitrer pour le produit, pas copiée automatiquement.
- **Lancer le vote**, puis **Clôturer le vote** : commande `wave.vote.open`, avec durée et mode d'écoute. Retour du verdict et verrouillages contre les actions incompatibles.

### Beat — composition collective

Le composant actif s'appelle `WaveEmptyPanel.tsx`, mais contient bien des commandes : son nom est trompeur.

- Cartes des couches du Beat, base et contributions, catégories/crédits.
- **Mute**, **Solo**, **Volume** : commandes `wave.sequence.layer` ; le volume est préécouté puis enregistré avec regroupement des mises à jour.
- **Profil** de l'artiste sélectionné.
- **Duel de remplacement** : sélection d'une boucle candidate dans Vote, puis `wave.replacement.open` ; durée 30 secondes et écoute Beat dans ce dialogue.
- `WaveOrchestraPanel.tsx` et `WaveSequencerPanel.tsx` contiennent d'autres travaux, mais ne sont pas les composants montés dans ces deux cases du routeur actuel. Ne pas les réimporter comme s'ils étaient l'interface validée.

### Côté public Web

`wave-viewer/WaveViewerPanel.tsx` sépare explicitement démonstration et live. Il contient écoute de référence, import de fichier, catégorie, titre, confirmation des droits, soumission, reprise après échec, historique de contribution, Beat collectif et téléchargements autorisés. La vue live utilise `waveViewer.service.ts`, le dépôt normalisé et les services d'assets.

### Défaut majeur de raccordement host Web

Chaîne observée : `RoomToolsShell` → `useRoomTools` → `liveRoomToolsRepository` → `SupabaseRoomToolsRepository`.

Or `roomTools.supabase.ts:64` refuse une projection Wave réelle par `wave_normalized_repository_required`. La méthode d'exécution contient le même refus ligne 186. Le hook ne sélectionne pas automatiquement le dépôt normalisé pour Wave.

**Conséquence déduite du code : le parcours host étudié n'est pas utilisable tel quel en source live ; la démo peut fonctionner sans résoudre ce raccordement.** Le message d'indisponibilité affiché par le shell est prévu pour ce cas. Aucun contournement par de fausses données ne doit être introduit.

Un dépôt normalisé existe dans `wave-production/supabaseWaveProductionRepository.ts` : résolution de session, snapshot, initialisation, lancement, catégories, audition privée, ouverture/vote/finalisation, vote de clôture. `wave-infra/supabaseWaveInfra.ts` expose tickets d'upload, confirmation, traitement, programme audio et récupération. Leur déploiement et leur fonctionnement distant n'ont pas été vérifiés dans cet audit.

## 3. iOS : outils réellement montés

Entrée : `RoomsRootView` → `WaveLiveHostRoomView` → `WaveReferenceHostRoomView`, avec injection de `WaveHostLiveSetPanel` dans Wave.

Deux sections principales : **Composition** et **Propositions**.

### Propositions

- Sous-filtres **À écouter**, **Prises**, **Archives**, compteurs et sélection.
- Écoute privée d'une proposition complète ou d'un composant disponible.
- Détail en bottom sheet ; prendre/accepter la proposition, ajouter une proposition acceptée ou prendre un composant.
- Refus avec confirmation et gestion des erreurs de décision.
- Contrôles contre les doublons et l'ajout d'éléments indisponibles ; arrêt de l'écoute privée au changement de section.

### Composition

- Transport/horloge commune avec BPM, tonalité, mesure et temps.
- Lecture/arrêt par piste ; une piste peut être en chargement, prête, en attente de départ sur une mesure, en lecture ou indisponible.
- **Mute**, **Solo**, répétitions selon le type de clip, retrait de la composition.
- Départ quantifié sur la prochaine mesure : `WaveHostLiveSetController.queueLaunch`, ligne 800.
- Préchargement et décodage hors interface ; moteur AVAudioEngine persistant, boucles PCM et prises longues streamées. Capacité par défaut de 20 voix, budgets mémoire explicites dans `WaveLiveAudioEngine.swift`.
- L'interface indique **« Live set · non publié »** : une composition locale jouée n'est pas automatiquement une diffusion publique.

### Studio du participant iOS

- Écouter la référence du host ; enregistrer au micro après une mesure de décompte ou importer un bounce externe.
- Choisir le type/durée et les traitements locaux, écouter avant envoi, conserver la stem séparée et l'aperçu mixé.
- Abandonner la prise ou **Proposer au Host** ; historique des propositions privées.

### Limites de raccordement iOS

- Le repository contient des accès Supabase réels : `wave_acts_v1`, `wave_tracks_v1`, contributions et RPC `wave_decide_contribution_v1`, assets `wave-media`.
- Mais le nouveau studio participant appelle `inbox.submit` dans `WaveViewerStudioController.swift:704`, via une boîte **locale privée**. Le message « envoyée au Host » ne suffit pas à démontrer un envoi réseau vers un autre appareil.
- Le host traite séparément propositions locales et contributions distantes (`WaveLiveHostRoomView.swift:409–421`).
- Aucun équivalent du parcours Web complet de vote public et duel de remplacement n'a été identifié dans les sections host actives étudiées.
- Les contrats iOS `wave_*_v1` et le dépôt Web normalisé ne sont pas interchangeables par simple copie d'écran.

## 4. Comparaison et recommandation

| Besoin | Référence la plus utile |
|---|---|
| Navigation tactile compacte, détails en bottom sheet | iOS + matière Android déjà validée |
| Réception et classement des boucles, règles et catégories | Web |
| Écoute privée avant décision | Logique iOS ; contrats Web à raccorder |
| Vote public et duel de remplacement | Web |
| Construction musicale, départ sur mesure, préchargement | iOS pour les règles ; moteur à porter nativement Android |
| Enregistrement participant et comparaison avant proposition | iOS pour le parcours ; envoi distant à compléter |
| Données partagées et reprise après reconnexion | Choisir un contrat serveur unique avant réalisation |

Recommandation : **hybride**, sans importer aveuglément l'une des deux versions.

Proposition Android : conserver l'onglet Wave et lui donner trois destinations compactes **Propositions / Vote / Composition**. Reprendre la fluidité mobile iOS, les règles de vote et catégories Web, et les matériaux déjà validés Android. Préserver Chat/Mixeur/Invités partagés.

Ordre conseillé :

1. Choisir le contrat serveur canonique et établir la correspondance des états iOS/Web ; distinguer clairement mock local et session réelle.
2. Construire Propositions : liste, écoute privée, accepter/refuser, détail compact.
3. Construire Composition : pistes préparées en arrière-plan, démarrage musical quantifié, mute/solo/retrait. Un ensemble de MediaPlayer indépendants ne remplace pas cette synchronisation.
4. Ajouter Vote et duel de remplacement avec verdict faisant autorité côté serveur.
5. Raccorder le studio participant et valider le parcours entre deux appareils : soumettre → recevoir → écouter → décider/voter → entendre le résultat public, y compris reconnexion.

L'audit ne conclut donc ni « tout le Web est branché » ni « tout iOS est local ». Les deux contiennent des pièces solides et des limites distinctes. Aucune réécriture du socle Android validé n'est nécessaire pour ajouter ces outils.
