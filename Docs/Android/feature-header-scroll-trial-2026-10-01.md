# Essai de repli des bandeaux Android

## Périmètre

Messagerie, Rooms, Marketplace, Tremplin, Profil et La Scène. La Scène replie aussi son rail de chips. Les modifications sont dans les sources et bundles Android uniquement.

| Surface | Défilement observé | Bandeaux repliés |
| --- | --- | --- |
| Messagerie, listes | Liste des conversations ou mur de collabs | En-tête externe et onglets |
| Messagerie, détails | Détecteur du chat déjà présent | Comportement existant conservé |
| Rooms, toutes catégories | Mur des rooms | Onglets et recherche/formats |
| Marketplace, tous onglets | Catalogue | Les deux rangées de navigation |
| Tremplin, tous onglets | Contenu Tremplin | Les deux rangées, sous la zone système |
| Profil | Contenu du profil | Les deux rangées de navigation |
| Profil public en page | Page du profil public | Barre de navigation existante |
| La Scène | Mur principal | Outils, onglets et chips de catégories |

## Comportement

Le détecteur partagé avec le chat masque après 24 px de mouvement continu vers le bas du contenu, au-delà de scrollTop 64. Il révèle après 12 px en sens inverse. Une liste courte, le bord supérieur, un changement de route ou de taille, le clavier et les menus maintiennent ou rétablissent les commandes visibles. Un déplacement programmatique seul ne déclenche pas le repli.

Les scrollports occupent une surface constante. Leur padding initial réserve l'espace du bandeau ; les animations utilisent uniquement une translation. Les bandeaux cachés deviennent `inert`. Le hook commun laisse les attributs ARIA sous le contrôle de React, notamment lors du passage de la liste au chat. Aucun timer ni boucle de rendu permanente n'est ajouté. La préférence de réduction des animations est respectée.

## Validation

- Six bundles compilés et APK debug assemblé.
- 4 851 assets et 193 imports de bundles vérifiés : aucun manquant, aucune taille incohérente.
- Treize assertions du détecteur : direction, seuils, absence de scintillement, déplacement programmatique, redimensionnement, focus et listes courtes.
- Harnais DOM isolé : sept layouts, montage différé, repli et retour, scroll programmatique, resize, nettoyage et conservation de l'ARIA React ; repli/retour des chips de La Scène. Ces gestes synthétiques ne remplacent pas une mesure sur téléphone.
- Revue des scrollers, montage différé, nettoyage des listeners et isolation des détails de chat.
- Les preuves d'installation et de vérification physique sont conservées dans `.local/android-feature-gpu-audit-20261001/all-feature-header-scroll*`. Une compilation ou une installation ne confirme pas à elle seule les gestes sur un téléphone.

## Annulation

Le début de l'essai est `c6ac04c4208c92e0e0430ef9fea29cc48ea6c06c`, suivi de sa correction de montage `0b3c29fc8509ecbb33a9bd8958c43515de910b3c` et du commit qui étend cet essai aux autres features. Les annuler par `git revert` en ordre inverse, reconstruire les six bundles sans `--import-web`, vérifier les assets, assembler puis réinstaller le même APK sur les appareils.

Conserver le commit `40b87d8f19490cb1c6815e8cce86e81a38910bbe` qui ajoute Tout / Shorts / Vidéos et les catégories. Conserver aussi les matières validées des bandeaux, la navbar inférieure et toutes les corrections GPU. Le registre local de rollback dans `C:/Users/linkw/.codex/rollback/android-scene-header-scroll-20261001/trial.json` contient les hashes exacts de l'ensemble de l'essai.
