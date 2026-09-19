# Socle Rooms Android

Le socle validé Chat / Mixeur / Invités (Demandes, Coulisses, Scène, Jury)
est commun à Wave, Cage, Place, Classe, Loge et Scène. Ne pas copier ces écrans
par type de room : toute correction doit bénéficier aux six types.

Les cartes de l'accueil et le formulaire de création utilisent
`/native/room-session?type=…&title=…&id=…`. MessagingActivity, uniquement pour
la surface Rooms, vérifie le type puis ouvre WaveMixerActivity. Ce nom reste
historique : l'activité héberge désormais le socle commun WaveMixerScreen.
RoomModule fournit l'identité de la room et le libellé de son onglet d'outils.
Le retour ferme cette activité et retrouve l'accueil existant, sans le recréer.

Le troisième emplacement de la barre est réservé aux outils spécifiques
(Wave, Cage, Place, Classe, Loge, Scène). Ces outils restent à développer
room par room ; ils ne doivent pas dupliquer Chat, Mixeur ou Invités.

Chaque session possède son état local indépendant : invités, jury, sélection,
mixeur et messages. Partager les composants ne signifie pas partager ces données
entre deux sessions. Les sources vidéo et les participants restent ceux de la
démo validée. Ce raccordement ne crée pas de session serveur, de flux RTC,
de contrôle d'accès ou de logique de jugement supplémentaire.
