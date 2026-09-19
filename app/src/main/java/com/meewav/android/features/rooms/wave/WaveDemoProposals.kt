package com.meewav.android.features.rooms.wave

/** WaveHostLegacyDemoPack.swift: same recordings, already bundled in Android. */
internal fun waveDemoProposals(): List<WaveCompositionClip> {
    val people = listOf("NAYA K.", "KÉO", "AZUR", "SOLEN", "NOAM A.", "LINA V.", "LUMA")
    val items = listOf(
        Triple("valse-romantique", "Valse romantique", "Accords"),
        Triple("pad-et-flute", "Pad et flûte", "Nappe"),
        Triple("pad-glitch", "Pad glitch", "Nappe"),
        Triple("stomper-love", "Stomper love", "Basse"),
        Triple("pulse-cyber", "Pulse cyber", "Mélodie"),
        Triple("celtic-viking", "Celtic viking", "Mélodie"),
        Triple("riff-taiga", "Riff taïga", "Mélodie"),
        Triple("excuse", "Excuse", "FX"),
        Triple("i-just-do-me", "I just do me", "Acapella"),
        Triple("i-dont-know", "I don’t know", "Acapella"),
        Triple("in-the-game", "In the game", "Acapella"),
        Triple("sati-drums-808", "Sati drums 808", "Drums"),
        Triple("monzder-drums", "Monzder drums", "Drums"),
        Triple("top-loops-iii", "Top loops III", "Drums"),
        Triple("trap-hip-hop", "Trap hip-hop", "Drums"),
        Triple("haytr-drums", "Haytr drums", "Drums"),
        Triple("percussion", "Percussion", "Drums"),
        Triple("champion-drums", "Champion drums", "Drums"),
        Triple("chillpop-beat", "Chillpop beat", "Drums"),
    )
    return items.mapIndexed { index, (file, title, category) ->
        WaveCompositionClip("ios-inbox-$file", title, people[index % people.size],
            "asset:rooms/audio/wave/inbox/$file.${if (file == "i-just-do-me") "mp3" else "m4a"}",
            category, kind = if (category == "Acapella") WaveClipKind.LONG else WaveClipKind.LOOP,
            repeats = if (category == "Acapella") 1 else -1, musical = "120 BPM · A MIN")
    }
}
