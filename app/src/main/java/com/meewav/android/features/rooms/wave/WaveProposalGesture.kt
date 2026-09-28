package com.meewav.android.features.rooms.wave

import kotlin.math.abs

internal enum class WaveProposalGesture { NONE, DELETE, VOTE }

/** Distances are dp and velocity is dp/s, independent of the phone density. */
internal fun resolveWaveProposalGesture(distance: Float, velocity: Float): WaveProposalGesture {
    if (!distance.isFinite() || !velocity.isFinite()) return WaveProposalGesture.NONE
    val projected = distance + velocity * .12f
    val committed = abs(distance) >= 72f ||
        (abs(distance) >= 36f && abs(projected) >= 144f && distance * velocity > 0f)
    return if (!committed) WaveProposalGesture.NONE else if (distance > 0f) WaveProposalGesture.VOTE else WaveProposalGesture.DELETE
}
