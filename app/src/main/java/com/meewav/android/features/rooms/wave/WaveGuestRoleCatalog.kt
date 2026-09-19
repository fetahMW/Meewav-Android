package com.meewav.android.features.rooms.wave

import com.meewav.android.R

internal data class WaveRoleOption(val id: String, val label: String, val image: Int)

// Canonical artist catalogue from Meewav-Web, excluding audience avatars.
internal val waveGuestRoles = listOf(
    WaveRoleOption("avatar_1", "Violoniste", R.drawable.wave_filter_avatar_1),
    WaveRoleOption("avatar_2", "Vidéaste clipper", R.drawable.wave_filter_avatar_2),
    WaveRoleOption("avatar_5", "Studio", R.drawable.wave_filter_avatar_5),
    WaveRoleOption("avatar_6", "Sound designer", R.drawable.wave_filter_avatar_6),
    WaveRoleOption("avatar_7", "Pianiste", R.drawable.wave_filter_avatar_7),
    WaveRoleOption("avatar_8", "Percussionniste", R.drawable.wave_filter_avatar_8),
    WaveRoleOption("avatar_9", "Organisation scénique", R.drawable.wave_filter_avatar_9),
    WaveRoleOption("avatar_10", "Management", R.drawable.wave_filter_avatar_10),
    WaveRoleOption("avatar_11", "Label", R.drawable.wave_filter_avatar_11),
    WaveRoleOption("avatar_12", "Cuivres", R.drawable.wave_filter_avatar_12),
    WaveRoleOption("avatar_13", "Instruments à vent", R.drawable.wave_filter_avatar_13),
    WaveRoleOption("avatar_14", "Ingénieur du son", R.drawable.wave_filter_avatar_14),
    WaveRoleOption("avatar_15", "Guitariste électrique", R.drawable.wave_filter_avatar_15),
    WaveRoleOption("avatar_16", "Guitariste acoustique", R.drawable.wave_filter_avatar_16),
    WaveRoleOption("avatar_17", "DJ", R.drawable.wave_filter_avatar_17),
    WaveRoleOption("avatar_18", "Direction artistique", R.drawable.wave_filter_avatar_18),
    WaveRoleOption("avatar_19", "Danseuse", R.drawable.wave_filter_avatar_19),
    WaveRoleOption("avatar_20", "Danseur", R.drawable.wave_filter_avatar_20),
    WaveRoleOption("avatar_21", "Compositeur", R.drawable.wave_filter_avatar_21),
    WaveRoleOption("avatar_22", "Coach vocal", R.drawable.wave_filter_avatar_22),
    WaveRoleOption("avatar_23", "Chanteuse / rappeuse", R.drawable.wave_filter_avatar_23),
    WaveRoleOption("avatar_24", "Chanteur / rappeur", R.drawable.wave_filter_avatar_24),
    WaveRoleOption("avatar_25", "Beatmaker", R.drawable.wave_filter_avatar_25),
    WaveRoleOption("avatar_26", "Beatboxer", R.drawable.wave_filter_avatar_26),
    WaveRoleOption("avatar_27", "Batteur / batteuse", R.drawable.wave_filter_avatar_27),
    WaveRoleOption("avatar_28", "Bassiste", R.drawable.wave_filter_avatar_28),
    WaveRoleOption("avatar_29", "Auteur / parolier", R.drawable.wave_filter_avatar_29),
    WaveRoleOption("avatar_30", "Accordéoniste", R.drawable.wave_filter_avatar_30),
)
