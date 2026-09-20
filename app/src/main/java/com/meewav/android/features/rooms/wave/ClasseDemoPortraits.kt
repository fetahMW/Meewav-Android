package com.meewav.android.features.rooms.wave

import com.meewav.android.R

/** Existing globe artists: one distinct portrait and identity per classroom seat. */
internal fun classeDemoPortraits(guests: List<WaveGuest>): List<WaveGuest> {
    val artists = listOf(
        Triple("AÏNA SOL", "DJ · Productrice", R.drawable.classe_artist_0),
        Triple("KENJI RAVEL", "Batteur", R.drawable.classe_artist_1),
        Triple("NAOKO SEREIN", "Compositrice", R.drawable.classe_artist_2),
        Triple("IDRISS NOOR", "Oudiste · Compositeur", R.drawable.classe_artist_3),
        Triple("SAMRA FLUX", "Rappeuse", R.drawable.classe_artist_4),
        Triple("NOAH BELAIR", "Chanteur", R.drawable.classe_artist_5),
        Triple("ANJALI VEYRA", "Danseuse · Chorégraphe", R.drawable.classe_artist_6),
        Triple("JONAS REEF", "Trompettiste", R.drawable.classe_artist_7),
        Triple("AÏCHA SOL", "Coach vocal", R.drawable.classe_artist_8),
        Triple("KAIRO GRID", "Beatmaker", R.drawable.classe_artist_9),
        Triple("ALBA ROCHE", "Autrice · Chanteuse", R.drawable.classe_artist_10),
        Triple("NASSIM HALIM", "Chanteur", R.drawable.classe_artist_11),
        Triple("CASSANDRE BLEU", "Harpiste", R.drawable.classe_artist_12),
        Triple("CLARA VOLT", "Sound designer", R.drawable.classe_artist_13),
        Triple("DARIO SILVA", "Chanteur", R.drawable.classe_artist_14),
        Triple("ELIO SERRA", "Ingénieur du son", R.drawable.classe_artist_15),
        Triple("ELIOTT MAREK", "Producteur", R.drawable.classe_artist_16),
        Triple("GAËL FERRAN", "Guitariste", R.drawable.classe_artist_17),
        Triple("HUGO QUARTZ", "Chanteur", R.drawable.classe_artist_18),
        Triple("ILYNE K.", "Rappeuse", R.drawable.classe_artist_19),
        Triple("IMANI KADER", "Saxophoniste", R.drawable.classe_artist_20),
        Triple("INÈS RAKU", "Batteuse", R.drawable.classe_artist_21),
        Triple("KENZA LOBA", "DJ", R.drawable.classe_artist_22),
        Triple("MAÏA KURODA", "Violoniste", R.drawable.classe_artist_23)
    )
    var seat = 0
    return guests.map { guest ->
        if (guest.location == WaveGuestLocation.BACKSTAGE && seat < artists.size) {
            val (name, role, portrait) = artists[seat++]
            guest.copy(name = name, role = role, portrait = portrait,
                location = if (seat <= 22) WaveGuestLocation.BACKSTAGE else WaveGuestLocation.REQUESTED)
        } else guest
    }
}
