package com.meewav.android.features.auth

import androidx.annotation.DrawableRes
import com.meewav.android.R

data class AvatarProfile(val icon: String, val name: String, val description: String, @get:DrawableRes val image: Int)

/** Stable iOS identifiers are backend data: never derive them from translated labels. */
object AvatarCatalog {
    val profiles = listOf(
        AvatarProfile("UserFIcon", "Utilisatrice", "Communauté, Collab, Support\nÉvénements, Retours, Mentoring\nDécouverte, Réseau, Croissance", R.drawable.avatar_user_f),
        AvatarProfile("AccordeonIcon", "Accordéoniste", "Chromatique, Diatonique, MIDI\nSolo, Ensemble, Théâtre\nStudio, Sessions, Distanciel", R.drawable.avatar_accordeon),
        AvatarProfile("MicroIcon", "Artiste", "Chanteurs, Rappeurs, Vocalistes\nLead, Backing, Topline\nHooks, Studio, Distanciel", R.drawable.avatar_micro),
        AvatarProfile("IngeSonIcon", "Ingénieur du Son", "Enregistrement, Mixage, Mastering\nStéréo, Dolby, Immersif\nStudio, Live, Distanciel", R.drawable.avatar_inge_son),
        AvatarProfile("BassisteIcon", "Bassiste", "Électrique, Fretless, Contrebasse\nGroove, Pocket, Slap\nStudio, Tournée, Distanciel", R.drawable.avatar_bassiste),
        AvatarProfile("BeatboxerIcon", "Beatboxer", "Rythme, Percussion, FX\nBattles, Collabs, Loops\nLive, Studio, Distanciel", R.drawable.avatar_beatboxer),
        AvatarProfile("BeatmakerIcon", "Beatmaker", "Hip-Hop, Trap, Drill\nAfrobeats, R&B, Pop\nLoops, Stems, Licences", R.drawable.avatar_beatmaker),
        AvatarProfile("InstrCuivreIcon", "Cuivres", "Trompette, Trombone, Tuba\nSections Cuivres, Solo\nStudio, Tournée, Parade", R.drawable.avatar_instr_cuivre),
        AvatarProfile("CompositeurIcon", "Compositeur", "Auteurs, Scénaristes, Arrangeurs\nOrchestre, Chambre, Hybride\nFilm, Jeu Vidéo, Briefs Artistes", R.drawable.avatar_compositeur),
        AvatarProfile("DansseurIcon", "Danseur", "Chorégraphie, Performance, Freestyle\nTournées, Vidéos, Scènes\nCommercial, Créatif, Viral", R.drawable.avatar_dansseur),
        AvatarProfile("Dansseuse2Icon", "Danseuse", "Chorégraphie, Performance, Freestyle\nTournées, Vidéos, Scènes\nCommercial, Créatif, Viral", R.drawable.avatar_dansseuse2),
        AvatarProfile("DjIcon", "DJ", "Club, Festival, Radio\nScratch, Blend, Hybride\nLive, Streaming, Distanciel", R.drawable.avatar_dj),
        AvatarProfile("BatteurIcon", "Batteur", "Acoustique, Hybride, Électronique\nRock, Jazz, Gospel\nStudio, Tournée, Distanciel", R.drawable.avatar_batteur),
        AvatarProfile("GuitareElecIcon", "Guitariste Électrique", "Lead, Rythmique, Textures\nRock, Funk, Pop\nStudio, Tournée, Distanciel", R.drawable.avatar_guitare_elec),
        AvatarProfile("OrgaEventIcon", "Organisateur d'Événements", "Concerts, Tournées, Showcases\nLogistique, Équipe, Budgets\nSalles, Festivals, Pop-ups", R.drawable.avatar_orga_event),
        AvatarProfile("GuitareIcon", "Guitariste", "Acoustique, Classique, Nylon\nSolo, Duo, Ensemble\nCérémonie, Session, Distanciel", R.drawable.avatar_guitare),
        AvatarProfile("ManagerIcon", "Manager", "Talent, Carrière, Stratégie\nContrats, Deals, Droits\nTournées, Planning, Croissance", R.drawable.avatar_manager),
        AvatarProfile("UserIcon", "Utilisateur", "Communauté, Collab, Support\nÉvénements, Retours, Mentoring\nDécouverte, Réseau, Croissance", R.drawable.avatar_user),
        AvatarProfile("PercussionIcon", "Percussionniste", "Main, Baguettes, Hybride\nLatin, World, Orchestral\nStudio, Scène, Distanciel", R.drawable.avatar_percussion),
        AvatarProfile("PianisteIcon", "Pianiste", "Accompagnateurs, Solistes, MDs\nJazz, Pop, Classique\nStudio, Scène, Distanciel", R.drawable.avatar_pianiste),
        AvatarProfile("LabelIcon", "Label de Musique", "A&R, Scouting, Signature\nCampagnes, Marketing, Sync\nCatalogue, Sorties, Royalties", R.drawable.avatar_label),
        AvatarProfile("StudioIcon", "Studio d'Enregistrement", "Enregistrement, Mixage, Mastering\nContrôle, Live, Cabines\nAnalogique, Numérique, Hybride", R.drawable.avatar_studio),
        AvatarProfile("InstrCordesIcon", "Cordiste", "Violon, Alto, Violoncelle, Harpe\nQuatuors, Sections, Solo\nStudio, Tournée, Distanciel", R.drawable.avatar_instr_cordes),
        AvatarProfile("SynthetiseurIcon", "Synthétiseur", "Analogique, Numérique, Modulaire\nSound Design, Patch Craft\nLive, Studio, Distanciel", R.drawable.avatar_synthetiseur),
        AvatarProfile("ProffesseurIcon", "Professeur", "Instrument, Vocal, Théorie\nWorkshops, Cliniques, Masterclass\nDébutant, Intermédiaire, Pro", R.drawable.avatar_proffesseur),
        AvatarProfile("ViolonIcon", "Violoniste", "Solo, Section, Chambre\nClassique, Pop, Folk\nStudio, Scène, Distanciel", R.drawable.avatar_violon),
        AvatarProfile("ClippeurIcon", "Réalisateur Vidéo", "Réalisateurs, DOP, Monteurs\nStoryboard, Tournage, Post-prod\nLive, Promo, Social", R.drawable.avatar_clippeur),
        AvatarProfile("InstrVentIcon", "Flûtiste", "Flûte Traversière, à Bec, de Pan\nClassique, Jazz, Musique du monde\nSolo, Orchestre, Distanciel", R.drawable.avatar_instr_vent),
    )
    fun find(icon: String): AvatarProfile = profiles.first { it.icon == icon }
}
