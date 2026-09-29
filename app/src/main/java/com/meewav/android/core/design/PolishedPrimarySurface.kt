package com.meewav.android.core.design

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** Keep Material's interaction/ripple semantics without covering the painted surface. */
@Composable
internal fun polishedPrimaryButtonColors() = ButtonDefaults.buttonColors(
    containerColor = Color.Transparent, contentColor = Color.White,
    disabledContainerColor = Color.Transparent, disabledContentColor = Color.White,
)

/** Shared primary CTA finish. Source of truth: the active Pads console tab. */
internal fun Modifier.polishedPrimarySurface(cornerRadius: Dp = 100.dp, enabled: Boolean = true): Modifier =
    polishedControlSurface(selected = true, cornerRadius = cornerRadius, enabled = enabled)

/** Inactive Plugin/Pads graphite glass; the active state shares the primary finish. */
internal fun Modifier.polishedControlSurface(
    selected: Boolean = false, focused: Boolean = false,
    cornerRadius: Dp = 12.dp, enabled: Boolean = true,
): Modifier =
    alpha(if (enabled) 1f else .45f)
        .shadow(2.dp, RoundedCornerShape(cornerRadius), clip = false).drawWithCache {
            val r = cornerRadius.toPx().coerceAtMost(minOf(size.width, size.height) / 2f)
            val face = Brush.verticalGradient(if (selected)
                listOf(Color(0xFF2B2341), Color(0xFF1D1531), Color(0xFF5137A1))
            else listOf(Color(0xFF29292F), Color(0xFF151519), Color(0xFF09090C)))
            val reflection = Brush.linearGradient(0f to Color.White.copy(alpha = .16f),
                .26f to Color.White.copy(alpha = .03f), .48f to Color.Transparent,
                start = Offset.Zero, end = Offset(size.width, size.height))
            val rim = Brush.linearGradient(listOf(
                if (selected || focused) Color(0xFFD3C7F5).copy(alpha = .50f) else Color.White.copy(alpha = .20f),
                if (selected || focused) Color(0xFF8871C6).copy(alpha = .42f) else Color.White.copy(alpha = .06f),
                Color.Black.copy(alpha = .40f),
                if (selected || focused) Color(0xFFA98EF0).copy(alpha = .48f) else Color.White.copy(alpha = .07f),
            ), end = Offset(size.width, size.height))
            val lowerLight = Brush.verticalGradient(0f to Color.Transparent, .76f to Color.Transparent,
                1f to if (selected) Color(0xFFA98EF0).copy(alpha = .16f) else Color.White.copy(alpha = .025f))
            onDrawBehind {
                drawRoundRect(face, cornerRadius = CornerRadius(r))
                drawRoundRect(reflection, cornerRadius = CornerRadius(r))
                drawRoundRect(lowerLight, cornerRadius = CornerRadius(r))
                val inset = .5.dp.toPx()
                if (size.width > inset * 2 && size.height > inset * 2) drawRoundRect(rim,
                    topLeft = Offset(inset, inset), size = Size(size.width - inset * 2, size.height - inset * 2),
                    cornerRadius = CornerRadius((r - inset).coerceAtLeast(0f)), style = Stroke(.7.dp.toPx()))
            }
        }
