package com.meewav.android.core.design

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.BlurredEdgeTreatment
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.unit.dp

/** Profile Médias reference: one tapered hairline, with a separate restrained glow. */
@Composable
internal fun NavigationIndicator(active: Boolean, modifier: Modifier = Modifier) {
    Box(modifier.widthIn(max = 56.dp).fillMaxWidth().height(5.dp)
        .alpha(if (active) 1f else 0f).clearAndSetSemantics { }) {
        Box(Modifier.fillMaxSize().blur(3.dp, BlurredEdgeTreatment.Unbounded).alpha(.4f)
            .background(Brush.horizontalGradient(
                0f to Color.Transparent, .24f to Color(0xFF8060CC),
                .5f to Color(0xFFB39AEF), .76f to Color(0xFF8060CC), 1f to Color.Transparent,
            ), RoundedCornerShape(100.dp)))
        Box(Modifier.align(Alignment.Center).fillMaxWidth().height(1.dp)
            .background(Brush.horizontalGradient(
                0f to Color.Transparent, .18f to Color(0xFF9274D8),
                .5f to Color(0xFFD7C6FF), .82f to Color(0xFF9274D8), 1f to Color.Transparent,
            ), RoundedCornerShape(100.dp)))
    }
}

/** Keep the label-to-core gap at 6 dp, regardless of the tab's touch target. */
@Composable
internal fun NavigationTabContent(active: Boolean, label: @Composable () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        label()
        Spacer(Modifier.height(4.dp))
        NavigationIndicator(active)
    }
}
