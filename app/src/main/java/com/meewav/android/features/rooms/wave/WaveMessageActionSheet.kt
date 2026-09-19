package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.PushPin
import androidx.compose.material.icons.outlined.Timer
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaveMessageActionSheet(
    message: WaveChatMessage,
    onDismiss: () -> Unit,
    onPin: () -> Unit,
    onDelete: () -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF0D0E11),
        contentColor = Color(0xFFF1F0F5),
        shape = RoundedCornerShape(topStart = 26.dp, topEnd = 26.dp),
        dragHandle = { BottomSheetDefaults.DragHandle(color = Color.White.copy(alpha = .20f)) },
    ) {
        Column(Modifier.fillMaxWidth().heightIn(max = 560.dp).padding(horizontal = 18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Actions du message", fontSize = 18.sp, fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f))
                IconButton(onClick = onDismiss) { Icon(WaveIcons.Close, "Fermer", tint = Color.White.copy(alpha = .6f)) }
            }
            Column(Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState()).padding(bottom = 22.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Column(Modifier.fillMaxWidth().hifiBlackSurface(16.dp).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Image(painterResource(message.avatarRes ?: waveDemoPortrait(message.userId)), null,
                            modifier = Modifier.size(36.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                        Text(message.userName, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        if (message.isHost) Text("HOST", fontSize = 9.sp, fontWeight = FontWeight.Bold,
                            color = WaveMixerTheme.capsuleAccentSoft,
                            modifier = Modifier.clip(RoundedCornerShape(6.dp))
                                .background(WaveMixerTheme.capsuleAccent.copy(alpha = .12f)).padding(horizontal = 7.dp, vertical = 4.dp))
                    }
                    val (text, images) = chatAnnotatedText(message.content)
                    Text(text, inlineContent = images, color = Color.White.copy(alpha = .8f), fontSize = 14.sp, lineHeight = 21.sp)
                }
                Column(Modifier.fillMaxWidth().hifiBlackSurface(16.dp).clip(RoundedCornerShape(16.dp))) {
                    if (message.isHost) {
                        MessageAction(Icons.Outlined.PushPin, "Mettre en avant", "Garder ce message en haut du chat", onPin)
                        MessageActionDivider()
                    }
                    MessageAction(Icons.Outlined.DeleteOutline, "Supprimer le message", "Retirer ce message du chat", onDelete,
                        tint = Color(0xFFE99A9E))
                }
                if (!message.isHost) {
                    Text("MODÉRATION", fontSize = 10.sp, letterSpacing = 1.sp, color = Color.White.copy(alpha = .4f),
                        modifier = Modifier.padding(start = 4.dp))
                    Column(Modifier.fillMaxWidth().hifiBlackSurface(16.dp).clip(RoundedCornerShape(16.dp))) {
                        MessageAction(Icons.Outlined.Timer, "Mode lent", "Limiter le rythme pendant 30 secondes", onDismiss)
                        MessageActionDivider()
                        MessageAction(Icons.AutoMirrored.Outlined.Logout, "Expulser", "Retirer ce participant du live", onDismiss)
                        MessageActionDivider()
                        MessageAction(Icons.Outlined.Block, "Bannir", "Bloquer l’accès de ce participant", onDismiss,
                            tint = Color(0xFFE99A9E))
                    }
                }
            }
        }
    }
}

@Composable
private fun MessageAction(icon: ImageVector, title: String, subtitle: String, onClick: () -> Unit,
    tint: Color = WaveMixerTheme.capsuleAccentSoft) {
    Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
        Icon(icon, null, tint = tint, modifier = Modifier.size(21.dp))
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color.White.copy(alpha = .92f))
            Text(subtitle, fontSize = 11.sp, color = Color.White.copy(alpha = .46f), lineHeight = 16.sp)
        }
    }
}

@Composable
private fun MessageActionDivider() {
    Box(Modifier.fillMaxWidth().padding(start = 51.dp, end = 16.dp).height(.5.dp).background(Color.White.copy(alpha = .06f)))
}
