package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R

/** Demo activity matching the current native Wave room, not server notifications. */
internal data class WaveDemoNotification(val id: String, val name: String, val text: String, val portrait: Int)

internal val waveDemoNotifications = listOf(
    WaveDemoNotification("don-keo", "KÉO", "t’a envoyé un don de 10 € · Merci pour ce live !", R.drawable.wave_chat_artist_1),
    WaveDemoNotification("like-luca", "Luca Maris", "a aimé ton live", R.drawable.chat_av_luca),
    WaveDemoNotification("gold-mina", "Mina Lune", "t’a envoyé un Golden Like", R.drawable.chat_av_mina),
    WaveDemoNotification("join-naya", "NAYA K.", "a rejoint le live", R.drawable.wave_chat_artist_0),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaveNotificationsSheet(onDismiss: () -> Unit) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF101114), contentColor = Color(0xFFF1F0F5),
        dragHandle = { BottomSheetDefaults.DragHandle(color = Color.White.copy(alpha = .22f)) },
    ) {
        Column(Modifier.fillMaxWidth().heightIn(max = 440.dp).padding(horizontal = 18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(WaveIcons.Bell, null, tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(20.dp))
                Text("Notifications", modifier = Modifier.weight(1f).padding(start = 10.dp),
                    fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                IconButton(onClick = onDismiss) { Icon(WaveIcons.Close, "Fermer les notifications") }
            }
            Text("Activité du live · Démonstration", fontSize = 12.sp, color = Color.White.copy(alpha = .5f),
                modifier = Modifier.padding(bottom = 14.dp))
            LazyColumn(Modifier.weight(1f, fill = false),
                contentPadding = PaddingValues(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(waveDemoNotifications, key = { it.id }) { notification ->
                    Row(Modifier.fillMaxWidth().hifiBlackSurface(14.dp).padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Image(painterResource(notification.portrait), null,
                            modifier = Modifier.size(40.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(notification.name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                            Text(notification.text, fontSize = 13.sp, color = Color.White.copy(alpha = .65f))
                        }
                    }
                }
            }
        }
    }
}
