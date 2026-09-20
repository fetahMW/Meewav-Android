# La Scène — référence web uniquement

Sources consultées : roomTools.types.ts, roomTools.service.ts, roomTools.fixtures.ts, RoomToolsShell.tsx, SceneProgramPanel.tsx, ScenePrompterPanel.tsx, SceneEvaluationPanel.tsx, SceneFundraiserPanel.tsx, scene-tools.css et roomPresentation.tsx, sous src/features/rooms dans Meewav-Web. Aucune source iOS utilisée.

Programme : types Morceau/Freestyle/Danse/DJ set/Beatbox/Instrumental/Présentation/Collaboration/Autre ; durée 1–180 min, horaire optionnel, décalage 0–180 min, intervenant, description, texte associé, évaluation. Un seul passage live, enchaîner termine le précédent et ouvre ses avis. Historique, reprogrammation, ordre modifiable, suppression interdite pendant le direct. La gestion des entrées/sorties reste dans Invités, comme le site.

Prompteur : textes assignés, import txt/md, édition, modèles, repères de ligne ; lecture locale privée, décompte 0/3/5/10 s, vitesse 10–100 avec intervalle max(420,2900−24×vitesse), police 20–54, alignement, interligne, miroir, pilotage artiste/régie. Aucun texte à afficher sur le flux public.

Évaluation : après prestation terminée, note sur 5, réactions Énergie/Présence/Originalité/Maîtrise, un avis par identifiant, seuil de publication 1–100, résultats privés/publics. Jeux de données de démonstration clairement séparés des votes réels.

Cagnotte : titre, bénéficiaire, cible jusqu’à 1 M€, description, illustration, date limite ; brouillon/direct/clôturée, visibilité, mise en avant ; simulation de contribution uniquement, aucun paiement réel.

Adaptation : quatre sous-onglets à la hauteur commune, cartes noires compactes, CTA violet urbain Android, formulaires en bottom sheets. Les portraits du programme proviennent des fichiers locaux du web. Le programme initial reprend ses six prestations, la première prête à lancer au lieu de démarrer une scène automatiquement.

Périmètre transport : écran hôte natif de démonstration, état enregistré localement par programme ; aucune session RTC/Supabase de room n’est fournie à cette Activity. Les publications, votes publics, permissions distantes, affectation du prompteur à un autre appareil et contributions réelles restent à raccorder à ce transport. Le portage ne prétend pas les effectuer.
