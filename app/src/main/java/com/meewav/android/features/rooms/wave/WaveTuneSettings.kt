package com.meewav.android.features.rooms.wave

/** The five controls already implemented by MeeWavPitchCorrection. */
internal data class WaveTuneSettings(
    val amount: Float = 1f,
    val speed: Float = 1f,
    val humanize: Float = 0f,
    val smooth: Float = 0f,
    val shift: Float = 0f,
) {
    fun bounded() = copy(
        amount = amount.finiteUnit(1f), speed = speed.finiteUnit(1f),
        humanize = humanize.finiteUnit(0f), smooth = smooth.finiteUnit(0f),
        shift = if (shift.isFinite()) shift.coerceIn(-12f, 12f) else 0f,
    )
}

private fun Float.finiteUnit(fallback: Float) = if (isFinite()) coerceIn(0f, 1f) else fallback

internal val waveTunePresets = linkedMapOf(
    "Naturel" to WaveTuneSettings(.7f, .35f, .6f, .35f),
    "Pop" to WaveTuneSettings(.9f, .65f, .25f, .15f),
    "Rap" to WaveTuneSettings(),
)
