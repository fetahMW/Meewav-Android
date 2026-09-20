package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material.icons.filled.ThumbDown
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

/** Local demo state, like the current native Wave chat; no simulated audience votes. */
internal data class WaveChatPoll(val question: String, val choices: List<String>, val endsAt: Long)

/** Adapted from iOS ClasseHostToolsPalette / ClasseHostPollToolEditor. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaveChatToolsSheet(
    giftContent:(@Composable ()->Unit)?=null,
    poll: WaveChatPoll?,
    onDismiss: () -> Unit,
    onLaunch: (String, List<String>, Int) -> Unit,
    onStop: () -> Unit,
    onNewPoll: () -> Unit,
    hostMessages: List<WaveChatMessage>,
    pinnedMessage: WaveChatMessage?,
    onPin: (WaveChatMessage?) -> Unit,
    onOpenRoomPoll: (() -> Unit)? = null,
) {
    var gifts by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf(false) }
    var highlighting by remember { mutableStateOf(false) }
    var question by remember { mutableStateOf("") }
    var format by remember { mutableIntStateOf(0) }
    var duration by remember { mutableIntStateOf(30) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(poll?.endsAt) {
        now = System.currentTimeMillis()
        while (poll != null && now < poll.endsAt) { delay(500); now = System.currentTimeMillis() }
    }
    val answers = when (format) {
        0 -> listOf("Oui", "Non")
        1 -> listOf("Pour", "Contre")
        else -> listOf("Pouce vers le haut", "Pouce vers le bas")
    }
    val valid = question.isNotBlank() && answers.all { it.isNotBlank() } &&
        answers.distinctBy { it.lowercase() }.size == answers.size

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF101114),
        contentColor = Color(0xFFF1F0F5),
        dragHandle = { BottomSheetDefaults.DragHandle(color = Color.White.copy(alpha = .22f)) },
    ) {
        Column(Modifier.fillMaxWidth().fillMaxHeight(.85f).padding(horizontal = 18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(WaveIcons.Tools, null, tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(20.dp))
                if (editing || highlighting || gifts) IconButton(onClick = { editing = false; highlighting = false; gifts=false }) {
                    Icon(WaveIcons.ChevronLeft, "Retour aux outils")
                }
                Text(if(gifts) "Cadeaux" else if (highlighting) "Mise en avant" else if (editing) "Sondage" else "Outils du live", fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f).padding(start = 10.dp))
                IconButton(onClick = onDismiss) { Icon(WaveIcons.Close, "Fermer les outils") }
            }
            if(gifts && giftContent!=null) Box(Modifier.weight(1f).fillMaxWidth().padding(bottom=12.dp)){giftContent()}
            else Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(bottom = 20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)) {
                if (highlighting) {
                    Text("Choisis un message du host. Il restera en haut du chat jusqu’à son retrait.",
                        color = Color.White.copy(alpha = .6f), fontSize = 13.sp)
                    if (pinnedMessage != null) {
                        ToolLabel("Actuellement épinglé")
                        val (text, images) = chatAnnotatedText(pinnedMessage.content)
                        Text(text, inlineContent = images, color = Color.White)
                        TextButton(onClick = { onPin(null) }) { Text("Retirer la mise en avant", color = WaveMixerTheme.capsuleAccentSoft) }
                    }
                    if (hostMessages.isEmpty()) Text("Envoie d’abord un message dans le chat pour le mettre en avant.", fontSize = 13.sp)
                    hostMessages.asReversed().forEach { message ->
                        Column(Modifier.fillMaxWidth().hifiBlackSurface(14.dp)
                            .clickable { onPin(message); onDismiss() }.padding(16.dp)) {
                            Text(message.userName, color = WaveMixerTheme.capsuleAccentSoft, fontSize = 12.sp)
                            val (text, images) = chatAnnotatedText(message.content)
                            Text(text, inlineContent = images, color = Color.White, fontSize = 14.sp)
                            Text(if (pinnedMessage?.id == message.id) "Épinglé" else "Mettre en avant",
                                color = Color.White.copy(alpha = .5f), fontSize = 11.sp)
                        }
                    }
                } else if (!editing) {
                    if(giftContent!=null) Row(Modifier.fillMaxWidth().hifiBlackSurface(16.dp).clickable{gifts=true}.padding(18.dp),verticalAlignment=Alignment.CenterVertically) {
                        Icon(Icons.Default.CardGiftcard,null,tint=WaveMixerTheme.capsuleAccentSoft,modifier=Modifier.size(24.dp))
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("Cadeaux",fontSize=16.sp,fontWeight=FontWeight.SemiBold)
                            Text("Offrir, organiser un tirage et retrouver l’historique",color=Color.White.copy(alpha=.55f),fontSize=12.sp)
                        }
                    }
                    Column(Modifier.fillMaxWidth().hifiBlackSurface(16.dp)
                        .clickable { if (onOpenRoomPoll != null) onOpenRoomPoll() else editing = true }.padding(18.dp)) {
                        Text("Sondage", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        Text(if (poll == null) "Demander l’avis du public" else "Voir le sondage et ses résultats",
                            color = Color.White.copy(alpha = .55f), fontSize = 12.sp)
                    }
                    Column(Modifier.fillMaxWidth().hifiBlackSurface(16.dp)
                        .clickable { highlighting = true }.padding(18.dp)) {
                        Text("Mise en avant", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        Text("Épingler un message du host en haut du chat", color = Color.White.copy(alpha = .55f), fontSize = 12.sp)
                    }
                } else if (poll != null) {
                    Text(poll.question, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                    val active = now < poll.endsAt
                    Text(if (active) "En cours · ${((poll.endsAt - now + 999) / 1000).coerceAtLeast(0)} s" else "Sondage terminé",
                        color = WaveMixerTheme.capsuleAccentSoft)
                    poll.choices.forEach { choice ->
                        Row(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(14.dp)) {
                            PollAnswerLabel(choice, Modifier.weight(1f))
                            Text("0 vote", color = Color.White.copy(alpha = .5f))
                        }
                    }
                    Text("Aperçu local · aucun vote du public connecté", fontSize = 12.sp, color = Color.White.copy(alpha = .5f))
                    ToolPrimaryButton(if (active) "Terminer le sondage" else "Nouveau sondage", true,
                        if (active) onStop else onNewPoll)
                } else {
                    ToolTextField("Question", question, "Pose ta question…") { question = it.take(200) }
                    ToolLabel("Format")
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("Oui / Non", "Pour / Contre", "Pouces").forEachIndexed { index, label ->
                            ToolChoice(label, format == index, Modifier.weight(1f)) { format = index }
                        }
                    }
                    ToolLabel("Durée")
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(30, 60, 120).forEach { value -> ToolChoice("$value s", duration == value, Modifier.weight(1f)) { duration = value } }
                    }
                    Text("Aperçu local du live", fontSize = 12.sp, color = Color.White.copy(alpha = .5f))
                    ToolPrimaryButton("Lancer le sondage", valid) { onLaunch(question.trim(), answers, duration) }
                }
            }
        }
    }
}

@Composable
private fun ToolLabel(label: String) { Text(label, color = Color.White.copy(alpha = .65f), fontSize = 12.sp) }

@Composable
private fun ToolChoice(label: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Box(modifier.heightIn(min = 44.dp).background(if (selected) Color(0xFF292038) else Color(0xFF1A1B20), RoundedCornerShape(12.dp))
        .border(.7.dp, if (selected) WaveMixerTheme.capsuleAccentSoft.copy(alpha = .6f) else Color.White.copy(alpha = .08f), RoundedCornerShape(12.dp))
        .clickable(onClick = onClick).padding(8.dp), contentAlignment = Alignment.Center) {
        if (label == "Pouces") Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(Icons.Filled.ThumbUp, "Pouce vers le haut", tint = Color(0xFF579DFA), modifier = Modifier.size(20.dp))
            Icon(Icons.Filled.ThumbDown, "Pouce vers le bas", tint = Color(0xFF579DFA), modifier = Modifier.size(20.dp))
        } else Text(label, fontSize = 12.sp, color = Color.White.copy(alpha = if (selected) 1f else .6f))
    }
}

@Composable
private fun PollAnswerLabel(answer: String, modifier: Modifier = Modifier) {
    Row(modifier, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        if (answer.startsWith("Pouce vers le ")) Icon(
            if (answer.endsWith("haut")) Icons.Filled.ThumbUp else Icons.Filled.ThumbDown,
            null, tint = Color(0xFF579DFA), modifier = Modifier.size(20.dp))
        Text(answer, fontSize = 14.sp)
    }
}

@Composable
private fun ToolTextField(label: String, value: String, placeholder: String, onChange: (String) -> Unit) {
    OutlinedTextField(value = value, onValueChange = onChange, modifier = Modifier.fillMaxWidth(),
        label = { Text(label) }, placeholder = { Text(placeholder) }, maxLines = 3, shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White,
            focusedBorderColor = WaveMixerTheme.capsuleAccentSoft, unfocusedBorderColor = Color.White.copy(alpha = .16f),
            focusedLabelColor = WaveMixerTheme.capsuleAccentSoft, unfocusedLabelColor = Color.White.copy(alpha = .6f),
            cursorColor = WaveMixerTheme.capsuleAccentSoft))
}

@Composable
private fun ToolPrimaryButton(label: String, enabled: Boolean, onClick: () -> Unit) {
    Button(onClick = onClick, enabled = enabled, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
        shape = RoundedCornerShape(14.dp), colors = ButtonDefaults.buttonColors(
            containerColor = WaveMixerTheme.capsuleAccent, contentColor = Color.White,
            disabledContainerColor = Color(0xFF29252F), disabledContentColor = Color.White.copy(alpha = .4f))) { Text(label) }
}
