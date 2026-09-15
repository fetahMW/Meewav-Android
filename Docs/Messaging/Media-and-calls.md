# Vocaux et appels vidéo Android — 15 septembre 2026

## Origine et correction

Le premier accès au micro perdait sa demande lors du dialogue de permission
Android : `onPause` suspendait le JavaScript avant le retour de l’autorisation.
La suspension attend maintenant la fin de cette demande ; `onStop` libère
toujours les captures lorsqu’on quitte réellement l’application.

Sources lues dans `sipiyou39/Meewav`, iOS `main`, commit
`aea7251a60a2b61d775901fcf39a62036fd108c4` : `SupabaseMessagingRepository.swift`,
enregistreur AAC natif, migrations de messagerie et fonction `byteplus-token`.
L’écran iOS `MessagingAudioCallView` consulté simule une connexion après un délai :
il ne fournit pas de mécanique d’appel direct vidéo réutilisable. Le fournisseur
RTC BytePlus et son générateur de jetons servent en revanche déjà aux Rooms iOS.

Le serveur Meewav Dev utilise les conversations directes iOS
`messaging_direct_conversations_v1`, leurs participants et `messaging_messages_v1`.
Les tables attendues par l’import Web ne sont pas déployées sur ce serveur.
`iosDirectMessaging.ts` adapte ce contrat au contrôleur et à l’interface existants,
sans modifier le dépôt Web canonique ni remplacer les écrans démo.

## Notes vocales

- Capture native mono AAC, 48 kHz, 128 kbit/s, conteneur M4A ; arrêt avant 15 minutes.
- Permission au premier tap, minuterie, arrêt, écoute du brouillon, annulation et envoi.
- Capture interrompue lors d’un changement de conversation, d’un appel ou d’un
  passage en arrière-plan ; fichiers temporaires supprimés après récupération.
- En session réelle : bucket privé `messaging-voice`, chemin
  `<conversationId>/<userId>/<clientMessageId>.m4a`, métadonnées du contrat iOS et
  RPC `messaging_send_voice_message_v1`. Lecture par URL signée d’une heure.
- Une tentative répétée conserve le même objet et le même identifiant de message.
  Un résultat serveur incertain ne déclenche jamais la suppression du fichier reçu.
  L’interface conserve le brouillon après un échec et bloque les doubles envois.
- Les changements de messages sont reçus par Realtime ; un rattrapage au premier
  plan couvre les interruptions de la souscription.

## Appels directs

L’icône vidéo est intégrée au bandeau translucide, à côté de la recherche et des
informations. L’écran d’appel conserve les matériaux noir/gris et le violet des
CTA de messagerie. Il comporte aperçu local, appel entrant, accepter/refuser,
micro, caméra, changement de caméra et raccrocher. Le compteur démarre à la
présence RTC confirmée du contact (même si ses périphériques sont coupés), jamais
après un délai simulé. Une connexion sans aboutissement expire après 30 secondes.

Le SDK Web BytePlus `4.68.5` est empaqueté localement avec sa licence. La cible
vidéo est 720p/30 fps, adaptée par le fournisseur RTC ; aucun asset de globe,
portrait ou profil n’est rééchantillonné par ce lot. Android gère la sonnerie,
le focus audio et la sortie de communication (casque connecté ou haut-parleur).
Une interruption système met fin à l’appel et libère les périphériques.

Backend déployé sur Meewav Dev `dqabekaqpznjsagoxzwc` :

- Migration `20260915193000_messaging_video_calls_v1.sql` : table d’appels isolée,
  RPC authentifiée, contrôle des deux participants, gestion occupé/rate limit,
  expiration et invalidation Realtime privée sur `messaging:calls:<userId>`.
- Fonction `messaging-call-token` : valide le JWT et l’appel accepté avant de
  délivrer un jeton BytePlus de 60 secondes, renouvelé pendant l’appel.
  Les clés privées existantes restent sur le serveur, jamais dans l’APK.
- Les messages et conversations existants ne sont pas migrés ni réécrits.

Le script de déploiement lit la connexion déjà configurée localement, en mémoire,
et vérifie TLS avec le [certificat CA Supabase officiel](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt).
La migration a déjà été appliquée : ne pas rejouer `--apply` sur cet environnement.

## Portée et état de livraison

Compilation du bundle et de l’APK effectuée. Aucun test, appel à une personne,
envoi de message réel, capture écran ou QA automatique n’a été exécuté :
l’utilisateur effectue les vérifications sur ses appareils.

Le mode « Aperçu sans compte » conserve des contacts fictifs : enregistrement et
lecture locale des vocaux, aperçu réel de la caméra, aucun appel envoyé.
Un appel réel nécessite deux comptes authentifiés, une conversation directe et
deux clients Android équipés de ce contrat, avec la messagerie au premier plan.
Les appels de groupe, les notifications d’appel en arrière-plan (FCM/service de
premier plan) et la réception vidéo dans le client iOS ne sont pas implémentés par
ce lot. Les vocaux utilisent déjà son contrat serveur et son format audio.
La qualité d’une communication entre deux appareils reste à constater par
l’utilisateur ; une compilation réussie ne constitue pas une validation de RTC.

L’entrée habituelle de l’atelier DEBUG reste le profil. L’extra Android
`com.meewav.android.OPEN_MESSAGES=true` ouvre directement la messagerie de démo
pour cette intervention, sans modifier les routes de production.
