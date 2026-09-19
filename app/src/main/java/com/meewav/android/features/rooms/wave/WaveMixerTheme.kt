package com.meewav.android.features.rooms.wave

import android.graphics.Bitmap
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import com.meewav.android.core.design.MeewavFont

/** Palette « hardware dark » du mixeur Wave — valeurs exactes du code iOS
 *  (`ClasseWebMixerTheme`, `ClasseTheme`, `RoomsStudioTheme`). */
object WaveMixerTheme {
    val pearl = Color(0xFFF8F6FA)
    val secondary = Color(0xFFD6D4DD).copy(alpha = 0.78f)
    val muted = Color(0xFFC2C0C9).copy(alpha = 0.62f)
    val violet = Color(0xFFA65CFF)
    val violetSoft = Color(0xFFC27AFF)
    /** Remplissage des faders / slider — violet simple adouci (moins flashy). */
    val faderViolet = Color(0xFF8A7FD2)
    /** Accent des capsules RoomsStudio (Simple/Pro, halo caméra, état actif). */
    val capsuleAccent = Color(0xFF7E44E3)
    /** Violet urbain des CTA principaux, identique au bouton Se connecter. */
    val primaryCta = Color(0xFF5137A1)
    /** Variante claire de `capsuleAccent` pour les liserés lumineux. */
    val capsuleAccentSoft = Color(0xFFA98EF0)
    val red = Color(0xFFFF2E3B)
    val blue = Color(0xFF4F83F4)
    val amber = Color(0xFFFFAB00)
    val cyan = Color(0xFF00E5FF)

    // Fonds empilés du fond de mixeur.
    val bg0 = Color(0xFF141517)
    val bg1 = Color(0xFF0E0F11)
    val bg2 = Color(0xFF0A0B0D)
    val bg3 = Color(0xFF070809)

    // Variante « gris foncé » du fond de la zone mixeur (demande utilisateur).
    // Dégradé moderne : gris foncé en haut-gauche fondant vers le noir en bas-droite.
    val bodyBg0 = Color(0xFF1F2126)
    val bodyBg1 = Color(0xFF181A1F)
    val bodyBg2 = Color(0xFF101216)
    val bodyBg3 = Color(0xFF08090C)

    // Stops du vu-mètre « webMixer » (`PlaceChannelStrip.studioMeterStops`).
    // Bleu de la graduation décibel du fader — réutilisé pour les LED d'état.
    val ledBlue = Color(0xFF4F83F4)
    /** Violet « on » des cartes FX (icône + power) — variante claire de capsuleAccent. */
    val fxAccent = Color(0xFFA98EF0)

    // Vu-mètre : bleu au repos (bas) → violet → rose au sommet (volume fort).
    val meterStops = arrayOf(
        0.00f to ledBlue,
        0.42f to Color(0xFF7A5FF0),
        0.72f to Color(0xFFBE5CE0),
        0.92f to Color(0xFFFF5CA8),
        1.00f to Color(0xFFFF6FA0),
    )

    // Stops du dégradé « signal » partagé (`ClasseWebMixerTheme.signalStops`).
    val signalStops = arrayOf(
        0.00f to Color(0xFFAD5CF5),
        0.34f to Color(0xFF8F60F4),
        0.61f to Color(0xFF596FF3),
        1.00f to Color(0xFF2F8DF5),
    )

    val fontFamily = MeewavFont
}

/** Tuile de bruit 128×128 — même PRNG splitmix64 que
 *  `ClasseStudioSheetDither` (seed 0x9E3779B97F4A7C15), niveaux de gris. */
object WaveMixerNoise {
    val tile: ImageBitmap by lazy { makeTile(128) }

    private fun makeTile(d: Int): ImageBitmap {
        val px = IntArray(d * d)
        var state = 0x9E3779B97F4A7C15uL.toLong()
        for (i in px.indices) {
            state += 0x9E3779B97F4A7C15uL.toLong()
            val mixed = (state xor (state ushr 30)) * 0xBF58476D1CE4E5B9uL.toLong()
            val v = ((mixed ushr 56) and 0xFFL).toInt()
            px[i] = (0xFF shl 24) or (v shl 16) or (v shl 8) or v
        }
        val bmp = Bitmap.createBitmap(px, d, d, Bitmap.Config.ARGB_8888)
        return bmp.asImageBitmap()
    }
}
