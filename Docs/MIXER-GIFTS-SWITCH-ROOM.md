# Cadeaux et Switch Room — 20 septembre 2026

## État livré

La branche `main` a reçu les corrections Place / Classe jusqu'à `f1c4b5c` (donner la parole sans monter la vidéo). Les ajouts suivants sont sur `codex/mixer-gifts-switch`.

- Mixeur partagé : + d'import dans la zone des pistes, import piste et dossier/ZIP conservés ; boutons inférieurs Cadeau / Pads / Chronomètre.
- Six visuels cadeaux exportés du composant et du CSS canoniques, pas redessinés. `scripts/export-room-gifts.cjs` permet de refaire l'export depuis Meewav-Web.
- Offrir, tirage, planification, stock local, historique et animations utilisent le module cadeaux existant, partagé entre les rooms.
- Switch à côté de Fermer : choix des six expériences, préparation, confirmation, contrôle de version, délai de cinq secondes, blocage des activités en cours.
- La session conserve les invités, le mixeur, les réglages et les messages/brouillon/sondage du chat. Les outils déjà préparés restent en mémoire pour y revenir.
- La Classe sélectionne jusqu'à 24 personnes **déjà en coulisses** ; aucune activation de micro ou caméra au changement. Contrairement au web, la réservation de sièges depuis les demandes n'est pas encore portée.
- Nouveau titre par défaut de Place : « Autour du micro — avec Luma ».

## Références WEB

`src/features/profile/gifts/profileGiftCatalog.tsx`, `src/features/profile/profile.css`, `src/features/rooms/switch-room/{SwitchRoom.tsx,SwitchRoomPreparation.tsx,switchRoom.domain.ts,switchRoom.service.ts,useSwitchRoom.ts}`, `src/features/rooms/launch/roomLaunch.ts`.

## Limites explicites

Cette entrée Android est la démo host locale. Les cadeaux et le Switch ne sont pas reliés aux comptes distants. Le contrat serveur web à porter est `rooms_switch_experience_v1`, puis `rooms_accept_experience_v1` et l'abonnement `rooms_v2` ; chaque viewer accepte ou diffère son invitation. Aucun déplacement collectif réel ne doit être annoncé tant que ce branchement n'est pas réalisé.

Les métadonnées d'avant-première Loge et d'objectif de cours restent dans la configuration de Switch ; elles ne créent pas de nouvelle interface de diffusion. Le transport RTC et les droits d'accès distants ne sont pas modifiés.

Compilation Android effectuée. Pas de validation visuelle automatique de cette livraison : revue sur appareil par l'utilisateur.
