# Liste maîtresse du câblage — Android / Web / iOS

Établie le 21 septembre 2026 dans Meewav-Android, modifications de travail incluses.

Ce document est la liste de suivi de référence. Les audits précédents restent des preuves historiques, pas une liste actualisée des manques. Cette consolidation recoupe ces audits, les livraisons ultérieures et des contrôles ciblés du code ; ce n'est pas une nouvelle recette exhaustive de chaque écran ou de chaque compte réel.

## Règle de clôture

Un bouton visible, un SDK installé, une RPC présente ou une compilation réussie ne suffisent pas. Chaque ligne reste ouverte tant que son critère de fin n'est pas établi. Statuts : **M** = raccordement manquant identifié ; **P** = raccordement partiel ; **V** = raccordement présent ou supposé présent, vérification encore nécessaire. V ne veut pas dire manquant. Aucune ligne ci-dessous n'est déclarée terminée.

Pour fermer une ligne : indiquer les fichiers/contrats modifiés, la migration déployée si nécessaire, les tests techniques et leur résultat, puis distinguer la recette réelle restant à l'utilisateur. Ne jamais présenter un simple état local comme une confirmation serveur. Une dépendance externe bloque seulement les lignes qui en ont besoin, pas tout le chantier.

Contraintes permanentes : préserver la démo investisseur, séparer démo et données réelles, conserver les contrats iOS existants et documenter leurs extensions pour le Web/iOS. Ne pas recréer un backend Android parallèle. Aucun test visuel ni envoi à des utilisateurs réels sans demande ; l'utilisateur réalise sa recette réelle. Ne pas réintroduire le carnet de cours à pages éditables supprimé du périmètre.

## 1. Socle, compte, notifications et compatibilité

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| SOC-01 | V | Authentification réelle : inscription, connexion, Google, retour de mail, récupération, déconnexion. | Chaque entrée aboutit au bon compte ; erreurs visibles ; aucun utilisateur précédent conservé. Bypass démo maintenu séparément. |
| SOC-02 | V | Renouvellement/révocation de session, reprise réseau et compte changé dans les surfaces hybrides. | Jetons renouvelés sans seconde session concurrente ; abonnements et caches du compte précédent supprimés. |
| SOC-03 | P | Unifier les identifiants profil/conversation/room/média dans tous les bridges natifs et Web. | Tous les CTA réels transmettent l'UUID canonique ; aucun identifiant mock dans une mutation réelle. |
| SOC-04 | M | Notifications système : enregistrement/révocation du token appareil, routage serveur et permissions Android. | Notification reçue et ouverte sur le bon objet, app au premier plan, en arrière-plan et fermée ; refus de permission géré. Dépendance E1. |
| SOC-05 | M | Appels entrants hors application : notification d'appel, accepter/refuser, expiration et navigation. | Aucun appel fantôme ou double réponse ; le signalement et la session média restent cohérents. Dépend de SOC-04. |
| SOC-06 | P | Liens publics et App Links pour profils, vidéos et rooms. | Lien partageable hors WebView, ouvrant le bon contenu dans l'app ou le Web ; aucune URL appassets partagée. Dépendance E2. |
| SOC-07 | V | Modes démo/réel et reprise après échec sur toutes les features. | Une panne réelle affiche erreur/réessai, jamais une fixture présentée comme donnée réelle ; démo toujours accessible. |
| SOC-08 | P | Contrats communs versionnés, migrations et guide de branchement iOS. | Documenter requêtes/réponses, erreurs, droits, événements et compatibilité ; vérifier les divergences Web/iOS avant chaque adaptation. |

## 2. Globe et profils

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| GLO-01 | P | Population réelle du Globe et recherche géographique. | Profils/localisation serveur alimentent le rendu ; pagination et visibilité respectées ; population démo conservée. |
| GLO-02 | M | Top 10/classements réels. | Classement issu d'une règle serveur explicite, filtres cohérents ; aucun ordre éditorial démo en réel. |
| GLO-03 | P | Pré-profils du Globe, suivi, contact, collaboration et profil complet. | Chaque portrait réel résout le bon profil et chacun de ses CTA atteint le bon service ; callbacks déjà réparés à conserver. |
| PRO-01 | V | Lecture/édition complète du profil, photo, médias, grade, compteurs et visibilité. | Relecture après reconnexion et changement de compte ; les données privées ne sont pas exposées par un profil public. |
| PRO-02 | P | Inventaire et certification dans toutes les vues du profil. | Lire les contrats désormais déployés ; stock, critères de certification et historique cohérents après attribution/retrait autorisé. |
| PRO-03 | V | Pré-profil commun depuis chaque feature : profil, suivre, contact, collab, cadeau. | Même composant et identité réelle partout ; parcours du cadeau selon rôle résolu par CAD-02. |
| PRO-04 | P | Éléments privés/financiers du profil. | Distinguer les véritables données des démonstrations ; raccorder chaque solde/historique à son registre lorsque son service existe. Dépendances financières éventuelles E3/E4. |

## 3. Messagerie, collaborations, groupes et projets

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| MSG-01 | V | Conversations, messages, pièces jointes, vocaux, pagination, lus/non-lus et actions de message. | Envoi confirmé, réception, relecture et droits testés ; reprise d'upload et absence de doublon. Ne pas réécrire le noyau déjà raccordé. |
| MSG-02 | V | Appels audio/vidéo BytePlus en premier plan. | Appel entrant/sortant, accepter/refuser/raccrocher, expiration, permissions, interruption et renouvellement du jeton ; serveur de jetons existant conservé. |
| MSG-03 | V | Collaborations : envoyer, recevoir, répondre, annuler et suivre l'état. | Tous les points d'entrée utilisent la même demande durable ; autorisations et changements d'état cohérents. |
| MSG-04 | P | Planning des groupes : création/consultation/annulation existantes, modification raccordée et testée. | Recette utilisateur ; vérifier pagination et annulation dans le parcours complet. La suppression est une annulation durable avec historique. Voir journal ci-dessous. |
| MSG-05 | V | Décisions/votes des groupes : panneau réel retrouvé, contrats testés. | Choix modifiable compté une seule fois, clôture et droits validés en SQL ; recette du parcours utilisateur restante. |
| MSG-06 | V | Liens groupe/projet et thème raccordés ; recette utilisateur restante. | Liens et réglages restaurés après réouverture ; contrôle propriétaire/admin. |
| MSG-07 | M | Pièces jointes, audio et vocaux dans les projets. | Réutiliser le pipeline média avec les droits du projet ; téléchargement privé et reprise après erreur. |
| MSG-08 | M | Studio projets : stems, takes, versions, mix et retours. | Upload privé, versions durables, écoute, commentaires/retours, suppression et accès membres ; aucune sauvegarde fictive. |
| MSG-09 | V | Contacts, invitations/membres/admins de groupes et projets, blocage et départ. | Toutes les mutations visibles ont un service et une relecture ; utilisateur retiré sans accès résiduel. |

## 4. Socle commun des six rooms — host ET viewer

Chaque ligne doit être contrôlée pour Wave, Cage, Classe, Scène, Loge et Place. La Classe garde ses règles de parole privée ; ne pas lui appliquer aveuglément les règles de publication Wave.

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| ROM-01 | P | Création, lancement configuré, entrée, présence, sortie et fin. | Parcours complet par type avec UUID réel ; configuration du séquenceur enregistrée ; fin répercutée aux viewers. Catalogue/création de base déjà raccordés. |
| ROM-02 | P | Publication audio/vidéo native et réception viewer BytePlus. | Vrais flux host/invités, caméra/micro et reconnexion ; pas de vidéo démo en réel. Audio natif Wave existant à conserver, extensions hors Wave à réaliser. |
| ROM-03 | P | Partage d'écran : capture, publication, arrêt et retour caméra. | Viewers reçoivent la bonne source ; arrêt/permission/reprise correctement gérés. |
| ROM-04 | P | Régie vidéo, solo/ensemble/mise en avant et miniature host. | État de réalisation partagé, flux corrects, miniature pertinente ; plein écran conserve événements et commandes. |
| ROM-05 | P | Chat natif host ↔ viewers, historique et modération. | Envoi/réception réels, identités, ordre, pagination, suppression/modération et reconnexion ; même chat dans les six rooms. |
| ROM-06 | P | Épinglage et sondages du chat. | Création, votes, clôture et message épinglé identiques pour host/viewers ; droits et unicité côté serveur. |
| ROM-07 | P | Invités : demandes ouvertes/fermées, candidatures, invitations et Green House. | Chaque état réel découle du serveur et du consentement ; recherche de vrais comptes ; filtres ne simulent pas une admission. |
| ROM-08 | P | Coulisses, scène, drag-and-drop, retrait et jury à six. | Mutations confirmées puis reflétées sur tous les clients ; préparation respectée ; limite jury appliquée au serveur. Classe déjà partiellement adaptée. |
| ROM-09 | P | Sélection de l'invité, volume/mute, micro host et monitoring. | Le bon flux est contrôlé ; mute forcé distinct du consentement ; gains persistés si prévu et appliqués réellement. |
| ROM-10 | P | Lecteur principal, pads, chrono, Countdown, autotune/réverbération vers la sortie publique. | Audio traité reçu par le viewer, pas seulement entendu localement ; timing/mix/niveaux cohérents ; volume lecteur Wave indépendant. |
| ROM-11 | P | Messages depuis portraits/invités et messages rapides Classe. | Contact réel ouvre la bonne conversation ; message rapide Classe reste professeur ↔ élève et ne crée pas un chat générique. |
| ROM-12 | P | Switch Room de toute la communauté. | Transition serveur, consentements/rôles et reprise RTC ; fermeture/annulation/erreur sans perdre les participants. |
| ROM-13 | P | Likes, compteurs, notifications et engagement viewer. | Valeurs réelles, mutations autorisées et mises à jour partagées ; pas de compteur mock en session réelle. |
| ROM-14 | P | Cagnottes, contributions, billetterie et reçus. | Service de paiement/registre cohérent, attribution et remboursement/reprise définis ; aucun faux débit. Dépendance E3. |
| ROM-15 | P | Persistance et reprise après reconnexion, changement d'onglet ou rotation. | État autoritaire retrouvé ; aucun double abonnement, double action, média noir ou action perdue silencieusement. |

## 5. Wave

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| WAV-01 | M | Adapter les états métier Web/Android au serveur iOS existant. | Remplacer les appels incompatibles dont snapshot v6 sans créer un second registre de boucles/sessions. |
| WAV-02 | P | Upload référence et propositions : fichiers, traitement, BPM/gamme et waveform. | Stockage autorisé, état de traitement/reprise, métadonnées et asset lisible partagés avec les clients. |
| WAV-03 | P | Ouverture/fermeture des types de boucles et recherche locale. | Admission serveur refuse les catégories fermées ; filtre de consultation reste distinct. |
| WAV-04 | P | Vote public, duel de remplacement, validation, retrait et clôture. | Vote unique, cible validée, résultats calculés au serveur et cohérents après reconnexion. |
| WAV-05 | P | Composition : ordre, mute/solo, niveaux, épinglage, suppression et mix rendu. | Modifications autorisées persistées ; la sortie audio et les clients reflètent la même composition. |
| WAV-06 | P | Tester/soumettre une boucle côté viewer ; télécharger base/export ; contacter auteur. | Une seule boucle test synchronisée, bon fichier autorisé, soumission reçue et contact réel correct. |

## 6. Cage

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| CAG-01 | M | Adapter lancement/état/commandes au moteur iOS Cage canonique. | Éliminer les dépendances aux RPC Web absentes sans doubler le tournoi serveur. |
| CAG-02 | P | Programmes et participants : créer, enregistrer, charger, ordre et admissions. | Programme durable du profil, vrais participants, prêt en coulisses et duo monté confirmés. |
| CAG-03 | P | Tournoi, championnat, Open Mic et Open Mic Battle pilotés par CTA. | Transitions serveur, durées réelles hors simulation, micro alterné et avancement idempotent. |
| CAG-04 | P | Votes public/jury, verdict, bracket, classement/podium et publication. | Résultat autoritaire, affichage actualisé et aucun vote après clôture. |
| CAG-05 | P | Régie host/gagnant/challenger et événements plein écran. | Host revient au bon moment ; vrais flux/son ; pop-ups disponibles dans chaque disposition. |

## 7. Classe

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| CLA-01 | P | Compléter sièges, roster autorisé, portraits distants, invitations, refus et bannissement. | Identités réelles et capacités serveur ; aucune invitation traitée comme admission ; transitions host/viewer cohérentes. |
| CLA-02 | P | Prise de parole réellement transportée et révoquée. | Consentement, attribution et fin pilotent BytePlus, sans monter l'élève sur scène ; droits privés/publics respectés. |
| CLA-03 | P | Questions, soutien, résolution et sondage de compréhension. | Questions déjà adaptées ; compléter compréhension et synchroniser les résultats, sans réponses locales fictives. |
| CLA-04 | M | Ressources : ajout, stockage, affichage, téléchargement et suppression. | Fichiers accessibles aux personnes autorisées, après reconnexion ; pas de carnet éditable ajouté. |
| CLA-05 | M | Achat de siège libre. | Paiement confirmé avant admission, capacité atomique, annulation/remboursement définis. Dépendance E3. |
| CLA-06 | V | Messages privés professeur ↔ élève. | Les deux sens reçus par le bon destinataire ; historique/isolement/reconnexion ; correctif host_id conservé. |

## 8. Scène — room live, distincte de la feature vidéo

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| SRO-01 | P | Programme : passages, groupes, artistes, ordre et durée. | Programme partagé durable ; compte réel et coulisses après Green House ; messages reliés. |
| SRO-02 | P | Lancement/fin de prestation et régie. | Artistes concernés montent réellement puis descendent ; transition audio/vidéo et chrono synchronisés. |
| SRO-03 | P | Activation évaluation, vote public et résultats. | Politique host enregistrée, vote à la fin seulement si activé, résultats serveur. |
| SRO-04 | V | Prompteur et cagnotte. | Déterminer et tester la persistance nécessaire du prompteur ; cagnotte via ROM-14, sans second système financier. |

## 9. Loge

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| LOG-01 | P | VIP : demande, invitation, acceptation, passage et fin. | Les RPC déployées servent tous les CTA, le média/parole et les deux clients ; consentement conservé. |
| LOG-02 | P | Questions privées des invités. | Visibilité et destinataires corrects, sélection/réponse partagées ; aucune confusion avec le chat public. |
| LOG-03 | P | Invitations/expériences offertes aux fans. | Réception, accepter/refuser/annuler/terminer, historique et notification ; pas de doublon avec la file VIP. |
| LOG-04 | P | Dédicaces et médias audio/vidéo. | Enregistrement/upload privé, destinataire et historique durables ; URLs protégées et erreurs gérées. |

## 10. Place

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| PLA-01 | P | Tour de parole, file, chronomètre et commandes host. | État canonique partagé, droits micro effectifs, avance/fin cohérentes. |
| PLA-02 | P | Clash, invitations et défis. | Proposition/acceptation/déroulement/résultat persistés, consentement et interlocuteurs exacts. |
| PLA-03 | M | Appel d'un contact depuis le live et mise à l'antenne. | Invitation privée réelle, préécoute, consentement, publication distincte puis révocation média ; contrats Web à comparer à iOS. |

## 11. Cadeaux — commun profil, pré-profils et rooms

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| CAD-01 | P | Finir la recette de la chaîne host déjà raccordée. | Stock/débit/crédit/historique et idempotence ; attribution programmée et tirage vus des clients ; aucune fuite de gagnant avant révélation. |
| CAD-02 | M | Offrir depuis le viewer/pré-profil. | Le contrat actuel host-only ne convient pas à ce rôle : définir une extension autorisée avec débit réel, destinataire, quotas et réception, sans ouvrir les droits host. |
| CAD-03 | M | Cadeaux liés à une ronde et annulation des livraisons différées. | Transition serveur explicite, réservation/libération du stock exactement une fois ; pas de bouton simulant une annulation réelle. |
| CAD-04 | V | Certification, conditions de grade, acquisition et notifications. | Éligibilité serveur, source légitime du stock, compteur/profil rafraîchis ; notification via SOC-04. Acquisition payante seulement avec E3. |

## 12. La Scène — feature vidéo / « notre YouTube »

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| VID-01 | V | Régression du catalogue, recherche, profil, publication et métadonnées déjà raccordés. | Relecture complète, erreurs/réessai, bon propriétaire, séparation démo/réel. |
| VID-02 | P | Reprise/nettoyage des uploads interrompus, notamment multicam. | Aucun média incomplet publié ; fichiers abandonnés nettoyés et reprise sûre. |
| VID-03 | P | Pagination commentaires et recette des interactions/Studio. | Dépasser la limite actuelle de 1000, conserver réponses/ordre, droits auteur/propriétaire et absence de doublons. |
| VID-04 | M | Console/traitement de modération des signalements. | Les dossiers déjà enregistrés sont traitables par les rôles autorisés, avec décision durable. |
| VID-05 | P | Playlists, À regarder plus tard, historique, reprise et préférences entre appareils. | Repositories locaux actuels synchronisés au compte ; suppression/masquage/recommandations cohérents. |
| VID-06 | M | Programmation et diffusion TV. | Vraie grille et statut de diffusion, changements/replays/fin partagés ; pas de planning fixture en réel. |
| VID-07 | M | Crédits, droits, demandes d'accord et autorisations de replay. | Déclarations stockées distinctes des consentements reçus ; transitions publication/refus vérifiables. |
| VID-08 | M | Transcription/sous-titres : génération, progression, édition et publication. | Tâche exécutée, fichier produit et utilisé par le lecteur ; erreurs/reprise. Dépendance E5 à qualifier. |
| VID-09 | P | Statistiques créateur au-delà des agrégats existants. | Chaque métrique affichée a une source et une définition ; pas de rétention/temps de visionnage inventés. |
| VID-10 | P | Partage public d'une vidéo. | SOC-06 appliqué au média publié et aux droits d'accès ; ouverture Web/app testable. |

## 13. Marketplace

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| MAR-01 | P | Recette des fondations récemment déployées : catalogue/filtres, favoris, panier et vendeur. | Tous les écrans utilisent réellement ces contrats ; relecture/pagination/isolement ; corriger les fixtures des anciennes suites SQL incompatibles. |
| MAR-02 | P | Cycle complet d'annonce : brouillon, photos, édition, publication, retrait et disponibilité. | Chaque CTA vérifié ; droits vendeur et cohérence catalogue, pas seulement existence des RPC brouillon. |
| MAR-03 | P | Location, services et collectifs : demandes et changements d'état. | Client/vendeur voient la même intention ; annulation et autorisations vérifiées. Les contrats actuels sont non financiers. |
| MAR-04 | M | Commande/paiement, stock ou créneau, confirmation, reçu et historique. | Paiement serveur idempotent, disponibilité atomique et statuts cohérents. Dépendance E3. |
| MAR-05 | M | Annulation, remboursement, litige et versement vendeur selon les parcours disponibles. | Chaque opération réellement offerte a un service et une trace financière ; aucun succès local. Dépendance E3. |

## 14. Tremplin

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| TRE-01 | M | Catalogue/dossiers de projets ou émissions et espace privé. | Création/édition/consultation des vrais dossiers, médias et droits du propriétaire. |
| TRE-02 | M | Suivi, rappels, événements et notifications. | Préférences persistées, déclenchement réel et annulation ; dépend de SOC-04 pour le push. |
| TRE-03 | M | Statistiques et classements. | Agrégats réels et périodes, absence de chiffres mock dans le mode connecté. |
| TRE-04 | M | Portefeuille, opérations de jetons, transactions et reçus. | Modèle métier et registre autoritaire définis, opérations idempotentes ; pas de déblocage d'une transaction fictive. Dépendance E4. |

## 15. Vérification finale transversale

| ID | État | Travail restant | Critère de fin |
|---|---|---|---|
| FIN-01 | V | Inventaire des CTA atteignables dans chaque onglet host/viewer et feature. | Relier chaque action à une ligne ci-dessus ; rechercher les handlers vides, notifications « bientôt », succès locaux et boutons désactivés en réel. Ajouter les découvertes, ne pas les masquer. |
| FIN-02 | V | Contrats réellement déployés : signatures, RLS, buckets, tâches planifiées et événements. | Tests positifs/négatifs avec fixtures annulées ; pas seulement une comparaison de noms RPC. |
| FIN-03 | V | Erreurs réseau, doubles clics, reprise et accès interdit. | Pas de doublon, crédit/débit erroné, faux succès, données privées exposées ou restauration du mauvais compte. |
| FIN-04 | V | Non-régression démo, compilation, bundles et installation. | Démo conservée ; bundles issus des bonnes sources ; tests appropriés réussis et APK identifié. |
| FIN-05 | V | Recette réelle de l'utilisateur et compatibilité future iOS. | Préparer des scénarios courts host/viewer ; résultats techniques et résultats utilisateur suivis séparément ; documentation prête pour branchement iOS. |

## Dépendances externes à résoudre, sans immobiliser le reste

| ID | Dépendance | Ce qui est connu / ce qui manque |
|---|---|---|
| E1 | Push Android | Configuration Firebase/transport push Android non trouvée dans les vérifications précédentes. Retrouver le projet/configuration existants avant d'en créer un autre. Les appels en premier plan restent testables sans cette configuration. |
| E2 | Liens publics | Domaine public canonique et association App Links à confirmer/repérer dans les projets existants ; ne pas utiliser appassets comme domaine public. |
| E3 | Paiements | Vérifier fournisseur, environnement de test, webhooks, registre, reversements et règles d'annulation existants avant de conclure à une absence. Aucun paiement réel pour tester. |
| E4 | Tremplin économique | Contrats d'émission/jetons/portefeuille et règles opérationnelles à retrouver ou définir ; identité seule ne suffit pas. |
| E5 | Transcription | Service/worker, stockage des sous-titres et configuration opérationnelle à identifier ; UI seule ne lance rien. |

## Ordre d'exécution

1. Socle d'identité et inventaire des actions ; préserver démo et contrats iOS.
2. Socle rooms : médias, chat, invités, mixeur et reprise.
3. Wave, Cage, Classe, Scène room, Loge et Place ; traiter chaque chaîne host/viewer complète.
4. Cadeaux, profil, Globe, messagerie/groupes/projets et Scène vidéo.
5. Finaliser Marketplace et Tremplin, en avançant sur le non-financier pendant la résolution des dépendances externes.
6. Repasser FIN-01 à FIN-05, documenter chaque fermeture et chaque blocage restant. Aucun bilan « tout terminé » avec une ligne ouverte non explicitement retirée du périmètre par l'utilisateur.

## Acquis à conserver — ne pas recommencer les lots livrés

- Identité canonique, édition/visibilité du profil et séparation de session.
- Scène vidéo : catalogue réel, métadonnées de publication, commentaires et modération auteur, likes/Golden Likes, signalements enregistrés, miniatures et statistiques de base. Quota iOS Golden Likes sur 24 h conservé.
- Catalogue/création/entrée live des rooms et fermeture host ; adaptations Classe questions/parole/messages et certains déplacements.
- API Loge privées, fondations Marketplace et filtres, inventaire/certification/cadeaux host, scheduler cadeaux corrigé et observé en exécution.
- Audio Wave natif BytePlus/Superpowered : ne pas le confondre avec les outils métier Wave encore incomplets.
- Dernier lot : 18 tests Kotlin Loge/audio, 6 tests adaptateur Classe, 9 tests SQL Loge, 8 Market, 9 cadeaux et 2 scheduler réussis ; compilation et installation Samsung réussies. Ces tests ciblés ne ferment pas automatiquement les lignes fonctionnelles ci-dessus.

## Sources de traçabilité

### Avancement du traitement des 95 points — session du 21 septembre

Ce journal ne clôture pas les 95 lignes : les sous-parcours restants demeurent explicites.

- **ROM-05/06** : `RoomChatRemote.kt` relie le chat natif host au chat serveur commun, avec identités UUID, lecture périodique, envoi idempotent, suppression, épinglage, création/arrêt de sondage. Migrations `20260923090000` et `20260923093000` déployées ; 7 tests chat et 4 tests compatibilité sondage réussis après déploiement. Le contrat iOS à quatre arguments demeure ; le Web à cinq arguments fonctionne aussi, avec `show_results`. Restent historique au-delà de 80 messages, résultats détaillés côté natif, durées Web 15 s/épinglages courts, recette host/viewer.
- **ROM-07/08/09** : `RoomGuestsRemote.kt` lit les files/invitations/mixeurs canoniques. Commandes groupées atomiques invitation depuis la file, montée/descente, retrait/refus et ouverture/fermeture ; mute forcé distinct du mute consenti. Migration `20260923100000` déployée, 9 tests SQL avant/après réussis. La Classe garde ses RPC ; refus de candidature et admissions désormais raccordés. Restent invitation de compte hors file/recherche, jury, présence RTC réelle et réglage de gain audio : une lecture serveur ne prouve pas le transport média.
- **CLA-01 / PRO-03** : portraits HTTPS distants bornés en taille et mis en cache via `WaveGuestPortrait.kt`, partagés par les cartes natives. Restent recette des pré-profils et vérification complète des entrées.
- **SOC-07** : suppression du repli de `SupabaseRoomToolsRepository` vers les fixtures et de l'initialisation d'une room réelle avec un état démo. `WaveGuestState(live=true)` démarre vide et n'accepte pas les ajouts de portraits démo. Les commandes non raccordées ne simulent plus un déplacement local. Le mode investisseur reste conservé. Les autres états métier natifs restent à examiner.
- **LOG-01** : séparation de `remotePeople` VIP et du roster de `RoomGuestsRemote` : le rafraîchissement VIP ne renvoie plus tous les invités dans les demandes.
- **MSG-04/05** : le panneau actif `GroupToolsLive.tsx` avait déjà création/planning/votes/annulation/clôture ; les anciens handlers étaient hors parcours réel. Ajout de la modification de session, protection contre écrasement d'une modification concurrente et remise à zéro des confirmations si date/lieu changent. Migration `20260923110000` déployée. 14 tests SQL réussis avec fixtures annulées : édition, retry, droits, conflit, présence, unicité du vote et clôture.
- **FIN-04** : compilation Kotlin et bundles Rooms/Messagerie réussis ; tests Kotlin ciblés invités/Loge/audio réussis. APK de ces derniers changements pas encore installé. Aucun contrôle visuel effectué.

### Contrats ajoutés, réutilisables par iOS et Web

### Point de sauvegarde demandé avant épuisement du quota

- **Les 95 points ne sont pas terminés.** Ce commit sauvegarde les raccordements vérifiés et leurs limites ; reprendre les lignes ouvertes, sans les considérer acquises.
- **VID-03** : migration `20260923120000_scene_comments_pagination.sql` déployée : lecture par curseur `(created_at,id)` au-delà de 1000, envoi idempotent. 9 tests SQL avant/après déploiement, 4 tests client pagination/annulation réussis ; bundle Scène reconstruit. Le client charge encore toutes les pages avant l'affichage complet ; chargement progressif à améliorer.
- **MSG-06** : ébauches NON raccordées et NON déployées conservées dans `Docs/drafts/group-connections/*.pending`. Ne pas les appliquer sans tests de droits, intégration UI et vérification. Elles proposent liens groupe/projet sans octroi implicite d'accès et thème persistant.
- **CAG-01 / WAV-01** : inspection reprise, aucun adaptateur métier complet livré. Référence iOS : `Meewav/Features/Rooms/Services/SupabaseRoomsRepository.swift`, `Models/CageModels.swift`. Cage utilise `rooms_cage_state_v1`, `rooms_cage_start_tournament_v3`, `rooms_cage_advance_combat_v2`, votes/incident/tick canoniques. Wave utilise `wave_acts_v1`, `wave_tracks_v1`, `wave_contributions_v1` et `wave_decide_contribution_v1`. Les RPC normalisées Web v5/v6 ne sont pas ces contrats : ne pas déclarer ces lignes terminées ni déployer un registre concurrent.
- **Validation supplémentaire** : 4 tests d'isolation réel/démo Rooms réussis ; 5 tests Kotlin invités ajoutés. Aucun test visuel. Pas d'envoi à des utilisateurs réels. Pas de nouvelle installation Samsung de ce point de sauvegarde.

Tous exigent une session authentifiée ; aucun secret client privilégié. Les contrats iOS existants ne sont pas renommés.

- `rooms_send_message_idempotent_v1(p_room_id, p_content, p_client_request_id)` : UUID d'essai stable pendant une reprise ; conflit si même UUID avec autre contenu ; délègue au contrat Classe pour une Classe.
- `rooms_create_poll_v2(p_room_id, p_question, p_options, p_duration_seconds, p_show_results)` : surcharge du contrat à quatre arguments, stockage du choix d'affichage. Les durées admises restent celles du serveur iOS.
- `rooms_set_queue_open_v3(p_room_id, p_open)` : host, room non terminée ; Classe exclue au profit de sa configuration dédiée.
- `rooms_guest_command_v1(p_room_id, p_user_ids, p_action)` : host, sélection 1–64, actions `invite/backstage/stage/remove/refuse` ; verrou room et transaction atomique ; readiness conservée. Classe exclue. Pas de second registre d'invitations.
- `edit_artist_group_session_v1(p_group_id,p_item_id,p_expected,p_title,p_starts_at,p_place)` : créateur/admin/propriétaire actif ; `p_expected={title,startsAt,place}` ; erreur `40001/session_changed` si édition obsolète. Réponse exacte rejouée sans effet supplémentaire. Une nouvelle date ou un nouveau lieu invalide les anciennes confirmations de présence.

- [Audit détaillé initial](AUDIT_CABLAGE_ANDROID_2026-09-21.md) : entrées et fichiers par parcours, statuts historiques.
- [Audit transversal](AUDIT_GLOBAL_CABLAGE_ACTUEL_2026-09-21.md) : périmètre et divergences serveur constatées avant les derniers lots.
- [Livraison Scène/profil](CABLAGE_SCENE_PROFIL_IDENTITE_2026-09-21.md) : correctifs et limites du lot, certains manques depuis résolus.
- [Livraisons rooms/market/cadeaux](CONTRATS_PARTAGES_ROOMS_MARKET_2026-09-21.md) : contrats et validations les plus récents.
- Code recoupé pour cette liste : `WaveMixerScreen.kt`, `WaveGuestState.kt`, `ClasseToolsState.kt`, `LogeToolsState.kt`, `RoomGiftRemote.kt`, `liveRooms.ts`, `classroomIosAdapter.ts`, `roomTools.supabase.ts`, `ArtistGroupsWorkspace.tsx`, `ProjectsWorkspace.tsx` et services Scène/profil des lots documentés.

### Reprise après le checkpoint e544dc4

- **MSG-06** : `GroupConnectionsLive.tsx` et migration `20260923130000_group_project_links.sql` raccordés et déployés. Liens/déliens et thème persistants, réservés aux administrateurs. Aucun octroi implicite de droits au projet, aucun titre privé exposé aux membres non autorisés. 12 tests SQL réussis avant/après déploiement ; bundle Messagerie reconstruit. Les copies `.pending` restent historiques.
- **ROM-07** : recherche native `search_messageable_profiles_v1` et invitations hors file `rooms_invite_profile_v1`, migration `20260923140000` déployée. 8 tests SQL réussis avant/après : droits host, profil privé, reprise sans doublon, absence d'entrée implicite, refus conservé. Classe conserve son contrat. Simulation masquée et neutralisée en mode réel. Réception/acceptation et notifications restent à vérifier ; ligne non close.
- **ROM-06** : compteurs natifs lus depuis `rooms_poll_state_v1`, aucun zéro factice ; textes démo réservés à la démo. L'éditeur de nouveau sondage résiste au rafraîchissement du précédent.
- Aucun contrôle visuel, aucun envoi à des utilisateurs réels. Les 95 points ne sont pas tous clos : moteurs Wave/Cage, RTC hors Wave, médias des projets et dépendances externes restent notamment ouverts.

Contrats réutilisables par iOS/Web :
- `artist_group_connections_v1(p_group_id,p_action='read',p_project_id=null,p_theme=null)` : `read/link/unlink/theme`, réponse `projects/candidates/canManage/theme`, thèmes `violet/blue/emerald`. Membre actif en lecture, owner/admin en mutation ; lier exige également d'administrer le projet.
- `rooms_invite_profile_v1(p_room_id,p_profile_id)` : host hors Classe, profil public non fantôme/non bloqué/non banni ; invitation pending persistante, retry renvoie l'invitation active. `55000/invitation_already_ended` après refus/retrait. Acceptation canonique `rooms_accept_invitation_v2`, sans présence ou montée forcée. Limite de 100 invitations/h.

### Vérification Android du 23 septembre — entrée et audio Rooms

- Choix explicite `Mode démo` / `Application réelle` dès la page de connexion debug. Le mode démo continue les étapes sans compte, le mode réel réutilise la session Supabase ou ouvre la connexion, et le retour au choix vide l'état présenté. La déconnexion revient au choix. Le test avec deux comptes réels reste une recette physique à faire.
- Wave : `WaveMicrophone` passe les échantillons dans `Superpowered::AutomaticVocalPitchCorrection` puis `Superpowered::Reverb`, et `RoomsAudioSession` publie le bus résultant via BytePlus. iOS utilise également `Superpowered::AutomaticVocalPitchCorrection` avec le mode simple à 98 % : plage large, vitesse extrême, clamp désactivé et même calcul gamme majeure/mineure. Le sender Android ne s'interrompt plus au bout d'une seconde de silence ; seuls les échecs SDK répétés l'arrêtent. Écoute et droits de publication restent soumis au contrat partagé `byteplus-token`. Les deux plateformes utilisent encore la clé Superpowered d'exemple, à remplacer avant la production.
- Audio des autres Rooms : la restriction Android `type=wave` a été retirée pour Cage, Scène, Loge et Place ; host en micro natif traité par le même DSP Wave (avec bus autonome sans piste Wave) et viewers en écoute native. La Classe reste sur sa politique de parole RTC privée. Ceci ne prouve pas encore la vidéo ni le raccordement du volume des invités dans chaque format ; ROM-02/09/15 restent partiels.
- Compilation Kotlin, tests ciblés `RoomsAudioPolicyTest` et `WavePerformanceBusTest`, bundle Rooms et APK debug réussis. Aucun flux réel à deux comptes ni contrôle visuel réalisé.

### Passe Scène, Market, Tremplin et Profil du 23 septembre

Cette passe vérifie les chemins Android effectivement chargés depuis les sources figées des quatre surfaces. Elle ne clôt pas les lignes du tableau : la démo investisseur est conservée sous le mode démo ; le compte réel ne doit pas recevoir ses chiffres ou transactions fictifs.

| Surface | Raccordements confirmés et corrigés | À réaliser pour déclarer la surface complète |
| --- | --- | --- |
| La Scène (`VID-01` à `VID-10`) | Le catalogue publié Supabase, la fiche, le suivi et les interactions restent reliés. Le catalogue charge les pages suivantes de 48 médias à la demande ou au défilement ; une vidéo ouverte par lien est chargée séparément. Les murs, recommandations, notifications, dates et libellés de publication ne puisent plus dans les vidéos figées en mode réel. Les pays filtrables viennent du catalogue reçu. La TV, fondée aujourd'hui sur une grille de démonstration, est réservée à la démo. | Recherche serveur sur tout le catalogue (les filtres actuels opèrent sur les pages déjà chargées), reprise/entretien des uploads et URL signées, modération, synchronisation inter-appareils des listes/historique, vraie programmation TV, droits/replays, sous-titres, analytics et partage public. `VID-02`, `VID-04` à `VID-10` restent ouverts. |
| Market (`MAR-01` à `MAR-05`) | Catalogue, filtres, favoris, panier, brouillons vendeur et intentions non financières utilisent déjà les RPC serveur en mode réel. Le catalogue public ne rebascule plus sur des annonces fictives lorsque la session est absente ; seules les actions privées exigent le compte. Le calendrier de location démarre à la date courante. | Recette complète du cycle d'annonce et des deux côtés d'une demande ; commande, paiement, reçu, remboursement et versement attendent le contrat financier E3. Pas de faux paiement activé en réel. |
| Tremplin (`TRE-01` à `TRE-04`) | Le mode démo garde ses artistes/jetons pour la présentation. En compte réel, les suivis ne se déclarent plus réussis pour des profils fictifs ; les reçus fictifs et la simulation d'achat/revente sont écartés. La surface signale que les profils présentés sont des exemples. | Il n'existe pas encore de catalogue canonique des projets/artistes dans ces sources (les artistes de démo n'ont pas d'UUID de profil) ni de registre des jetons. Créer les contrats de dossier, suivi/notifications, statistiques et portefeuille avant d'ouvrir ces fonctions à un compte réel ; E4 reste indispensable pour les opérations. |
| Profil (`PRO-01` à `PRO-04`) | Lecture/édition du compte, médias et grade proviennent des services existants ; l'onglet Badges réel affiche le grade et les validations du backend plutôt que les compteurs statiques. Les programmes Cage et setlists fictifs ne sont plus initialisés pour un compte réel ; ils restent en démo. Les programmes Cage natifs sont isolés par ID de profil. | Recette du pré-profil depuis toutes les entrées, inventaire/certification après attribution/retrait, synchronisation des setlists et programmes entre appareils, historique financier réel lorsqu'un registre E3/E4 existe. Les données locales déjà semées par d'anciennes versions demandent une migration prudente, sans effacer les brouillons de l'utilisateur. |

La liste des 95 points demeure la référence ; « bundle construit » ou « écran non fictif » ne signifie pas qu'un service de phase 2 ou 3 a été livré. Les contrats futurs doivent être partagés avec Web et iOS et éviter une table parallèle aux registres existants.

Validation de cette passe : bundles Android Market, Scène, Profil et Tremplin reconstruits, puis `:app:assembleDebug` réussi. Aucun contrôle visuel ni test avec deux comptes réels effectué.
