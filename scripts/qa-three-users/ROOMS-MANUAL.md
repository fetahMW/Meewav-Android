# Test coordonné Rooms — Samsung, Redmi et PC

Les sessions sont de vrais comptes sur le backend commun. Les téléphones utilisent
l'application debug existante. Le PC utilise Windows ou le site Web en viewer.
Les messages QA restent dans les conversations des trois testeurs ; aucune donnée
personnelle n'est effacée. Ne pas partager le fichier local des mots de passe.

## Préparation

1. Charger les deux téléphones, les connecter au même Wi-Fi et les garder déverrouillés.
2. Ouvrir **Application réelle** sur les téléphones ; se connecter avec les accès
   locaux de testeur1 sur Samsung, testeur2 sur Redmi, testeur3 sur le PC.
3. Vérifier le nom du profil. Autoriser micro/caméra seulement quand le test les utilise.
4. Mettre un casque sur chaque appareil pour éviter les boucles acoustiques.
5. Ouvrir Messagerie, puis une conversation entre chaque paire de testeurs.

## Trois passages

| Passage | Samsung | Redmi | PC | Hôte |
|---|---|---|---|---|
| A | testeur1 | testeur2 | testeur3 | Samsung |
| B | testeur2 | testeur3 | testeur1 | Windows |
| C | testeur3 | testeur1 | testeur2 | Redmi |

Refaire ensuite A avec le site Web à la place de Windows sur le PC. Le site reste
viewer : le bouton de création host n'y est pas attendu. Ne pas ouvrir simultanément
le même compte sur Windows et Web dans ce scénario à trois utilisateurs distincts.

## Scénario

1. L'hôte ouvre **Rooms → Créer une Room** (Windows : **Lancer une Room**), choisit
   La Place et un titre unique `QA_3_TESTEURS_<heure>`, puis termine la préparation.
2. Les deux autres ouvrent la Room depuis le catalogue réel. Vérifier le titre,
   l'hôte et les participants. Une carte de démonstration n'est pas un succès.
3. L'hôte invite un testeur depuis **Invités**. Le testeur accepte ; inviter le
   dernier, qui refuse une fois puis accepte une nouvelle invitation.
4. Chaque personne parle à tour de rôle : son reçu sur les deux autres appareils,
   micro coupé réellement silencieux, volume personnel indépendant des autres.
5. Activer puis désactiver l'effet vocal. Comparer la sonorité et le retard perçus
   entre Android et Windows ; cette appréciation n'est pas validée par un script.
6. Envoyer un message pendant la Room ; vérifier la réception sur son destinataire.
7. Un participant quitte puis rejoint. Vérifier la liste, son retour audio/vidéo et
   l'absence de doublon. Faire quitter l'autre, répéter.
8. Couper le Wi-Fi d'un participant dix secondes, puis le réactiver. Vérifier état
   de déconnexion, reconnexion, reprise du son et de la messagerie. Ne pas couper
   le réseau du PC qui exécute un test automatisé en cours.
9. Quitter tous les participants, terminer la Room depuis l'hôte. Confirmer qu'elle
   n'est plus live dans le catalogue et qu'aucun micro n'est encore diffusé.
10. Passer à la ligne suivante du tableau. Si le produit ne propose pas de
    déconnexion accessible, noter ce défaut ; ne pas vider les données de l'app.
    En debug Android, le lancement à froid et **Application réelle** permettent
    de revenir au formulaire normal avec une déconnexion locale.

## Fiche courte en cas de bug

```text
Scénario / passage :
Appareil / plateforme :
Compte :
Action :
Attendu :
Obtenu :
Heure :
Capture ou chemin du rapport :
```

Arrêter le scénario affecté à l'échec, conserver la preuve et continuer seulement
les scénarios indépendants. Aucun résultat manuel n'est déclaré validé sans essai.
