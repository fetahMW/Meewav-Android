package com.meewav.android.features.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R
import com.meewav.android.core.design.Muted

@Composable
internal fun SceneGlobeArrival(state: AuthUiState, onBack: () -> Unit, onEnter: () -> Unit) {
    val interactive = state.page == AuthPage.Globe
    val sceneLabel = listOfNotNull(state.profile.musicScene?.label, state.profile.city.takeIf { it.isNotBlank() })
        .distinct().joinToString(" · ")
    if (interactive) {
        Box(Modifier.fillMaxSize().safeDrawingPadding()) {
            AuthCompletionGlobe(Modifier.fillMaxSize(), interactive = true, onClick = onEnter)
            Row(Modifier.align(Alignment.TopCenter).padding(horizontal = 12.dp, vertical = 8.dp)
                .fillMaxWidth().height(48.dp).background(Color(0x66080710), RoundedCornerShape(16.dp)),
                verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.Outlined.ChevronLeft, "Retour", tint = Color.White) }
                Column(Modifier.weight(1f)) {
                    Text("Mon Globe", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    if (sceneLabel.isNotBlank()) Text(sceneLabel, color = Muted, fontSize = 11.sp,
                        maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Image(painterResource(R.drawable.meewav_logo), "Meewav",
                    Modifier.padding(horizontal = 14.dp).width(96.dp).height(26.dp), contentScale = ContentScale.Fit)
            }
        }
        return
    }
    Column(Modifier.fillMaxSize().safeDrawingPadding().padding(horizontal = 22.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally) {
        Box(Modifier.fillMaxWidth().height(48.dp), contentAlignment = Alignment.Center) {
            IconButton(onClick = onBack, modifier = Modifier.align(Alignment.CenterStart)) {
                Icon(Icons.Outlined.ChevronLeft, "Retour", tint = Color.White)
            }
            Image(painterResource(R.drawable.meewav_logo), "Meewav", Modifier.height(40.dp).padding(horizontal = 48.dp),
                contentScale = ContentScale.Fit)
        }
        Spacer(Modifier.weight(1f))
        Text("Ta scène est prête", color = Color.White,
            fontSize = 23.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text(sceneLabel,
            color = Muted, fontSize = 13.sp, textAlign = TextAlign.Center)
        Spacer(Modifier.height(16.dp))
        AuthCompletionGlobe(modifier = Modifier.fillMaxWidth(), onClick = onEnter)
        Text("Touche le globe pour entrer", color = Color.White, fontSize = 14.sp)
        Spacer(Modifier.weight(1f))
    }
}
