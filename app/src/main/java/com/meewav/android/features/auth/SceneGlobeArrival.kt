package com.meewav.android.features.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R
import com.meewav.android.core.design.Muted

@Composable
internal fun SceneGlobeArrival(state: AuthUiState, onBack: () -> Unit, onEnter: () -> Unit) {
    val interactive = state.page == AuthPage.Globe
    Column(Modifier.fillMaxSize().safeDrawingPadding().padding(horizontal = 22.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally) {
        Box(Modifier.fillMaxWidth().height(48.dp), contentAlignment = Alignment.Center) {
            IconButton(onClick = onBack, modifier = Modifier.align(Alignment.CenterStart)) {
                Icon(Icons.Outlined.ChevronLeft, "Retour", tint = Color.White)
            }
            Image(painterResource(R.drawable.meewav_logo), "Meewav", Modifier.height(40.dp).padding(horizontal = 48.dp),
                contentScale = ContentScale.Fit)
        }
        if (!interactive) Spacer(Modifier.weight(1f)) else Spacer(Modifier.height(24.dp))
        Text(if (interactive) "Mon Globe" else "Ta scène est prête", color = Color.White,
            fontSize = 23.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text(listOfNotNull(state.profile.musicScene?.label, state.profile.city.takeIf { it.isNotBlank() }).distinct().joinToString(" · "),
            color = Muted, fontSize = 13.sp, textAlign = TextAlign.Center)
        Spacer(Modifier.height(16.dp))
        AuthCompletionGlobe(modifier = if (interactive) Modifier.fillMaxWidth().weight(1f) else Modifier.fillMaxWidth(),
            interactive = interactive, onClick = onEnter)
        if (!interactive) {
            Text("Touche le globe pour entrer", color = Color.White, fontSize = 14.sp)
            Spacer(Modifier.weight(1f))
        }
    }
}
