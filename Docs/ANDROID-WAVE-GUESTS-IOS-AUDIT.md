# Audit et adaptation du module Invités iOS — 19 septembre 2026

## Sources consultées (référence iOS, lecture seule)

- `Meewav/Features/Rooms/Components/Place/PlaceHostToolComponents.swift`, `PlaceGuestPanelView` : Scène / Coulisses / Invitations, aperçu, sélection, commandes caméra/micro et transitions.
- `Meewav/Features/Rooms/Components/Classe/ClasseCoulissesPanel.swift` : prise directe d'un portrait, aperçu au tap, sélection à l'appui long, détection de la zone vidéo, vibration à l'entrée, dépôt ou annulation.
- `Meewav/Features/Rooms/Components/Classe/ClasseStageView.swift` : dépôt vers la scène et retour vers les coulisses, host + trois invités maximum, géométrie duo/trio/quatre.
- `Meewav/Features/Rooms/ViewModels/PlaceHostViewModel.swift` : contrôle de capacité et transitions des invitations.
- `Meewav/Features/Rooms/Services/SupabaseRoomsRepository.swift` : RPC `rooms_move_invitation_to_backstage_v2`, `rooms_move_invitation_to_stage_v2`, `rooms_move_invitation_to_invitations_v2`, `rooms_cancel_invitation_v2`, `rooms_kick_invitation_v2`.

## Constat Android avant adaptation

L'activité native Wave avait une vidéo locale, un chat de démonstration et un mixeur. L'onglet Invités affichait un placeholder ; aucune liste d'invitations native, session de room distante ou piste caméra invitée n'était attachée à cet écran. Réutiliser des RPC avec les identifiants des mocks aurait été incorrect.

## Adaptation native livrée

- `WaveGuestState.kt` : états candidature / invitation / coulisses / scène, identité stable, trois places de scène, transitions contrôlées, retour en préparation, retrait et réinvitation. État conservé au changement d'onglet.
- `WaveGuestsPanel.kt` : trois sous-onglets, tuiles compactes avec portraits existants, aperçu au tap, sélection à l'appui long, actions individuelles/groupées, invitation, contrôle local caméra/micro.
- Glisser vers la vidéo pour monter ; glisser une tuile de scène vers la zone inférieure pour redescendre. Position calculée dans le même repère racine, copie flottante hors du panneau, cible indiquée et vibration. Dépôt hors cible annulé ; quatrième invité refusé sans évincer les autres.
- Géométrie iOS de la scène : host seul, duo côte à côte, host avec deux invités empilés, puis 2×2. Le host reste à la même position de composition pour éviter de recréer sa vidéo à chaque changement. La hauteur du retour vidéo et le reste du mixeur restent identiques.
- Les images d'invités sont explicitement des aperçus de démonstration. Aucun flux RTC ni succès Supabase n'est simulé.

## Limites et validation

Le parcours fonctionne sur l'état local de cette room de démonstration. Les transitions et commandes caméra/micro devront être reliées à une véritable session de room et ses pistes RTC pour une diffusion multi-utilisateur ; cet écran n'en dispose pas actuellement. BytePlus reste différé conformément au choix utilisateur précédent.

Compilation APK de livraison uniquement. Aucun test, capture ni QA automatique lancé, conformément aux consignes du projet. L'appréciation tactile/visuelle sur Samsung reste à l'utilisateur.