package com.meewav.android.features.rooms.wave

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

internal val classeBlue = Color(0xFF438FFF)
private val classeMuted = Color(0xFFA7A3B2)

@Composable
internal fun ClasseToolsPanel(state: ClasseToolsState) {
    var settings by remember { mutableStateOf(false) }
    var questions by remember { mutableStateOf(false) }
    var questionStudent by remember { mutableStateOf<String?>(null) }
    var removeId by remember { mutableStateOf<String?>(null) }
    var demo by remember { mutableStateOf(false) }
    val pagerState = rememberPagerState { ((state.students.size + 11) / 12).coerceAtLeast(1) }
    var tick by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(state.speakerId) { while (state.speakerId != null) { tick = System.currentTimeMillis(); delay(1000) } }
    LaunchedEffect(state.understandingActive) {
        if (state.understandingActive && com.meewav.android.BuildConfig.DEBUG) {
            // Same temporary showcase responses as the iOS classroom, never backend ballots.
            state.students.forEachIndexed { index, student ->
                delay(180)
                if (student.id !in state.understanding) state.respond(student.id, when (index % 7) {
                    3 -> ClasseUnderstanding.PARTIAL
                    6 -> ClasseUnderstanding.LOST
                    else -> ClasseUnderstanding.UNDERSTOOD
                })
            }
        }
    }
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().height(44.dp), verticalAlignment = Alignment.CenterVertically) {
            listOf("Élèves", "Ressources").forEachIndexed { index, text ->
                Box(Modifier.weight(1f).height(44.dp).clip(RoundedCornerShape(8.dp)).clickable { state.tab = index; state.selectedStudent = null; questions = false }, contentAlignment = Alignment.Center) {
                    Text(if (index == 0) "Élèves · ${state.students.size}/24" else text, color = if (state.tab == index && !questions) Color.White else classeMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    if (state.tab == index && !questions) Box(Modifier.align(Alignment.BottomCenter).padding(bottom = 5.dp).width(32.dp).height(2.dp)
                        .background(Brush.horizontalGradient(listOf(Color.Transparent, WaveMixerTheme.capsuleAccentSoft, Color.Transparent)), RoundedCornerShape(50)))
                }
            }
            IconButton(onClick = { settings = true }, modifier = Modifier.size(44.dp)) { Icon(WaveIcons.Tune, "Réglages de la classe", tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(20.dp)) }
        }
        state.notice?.let { message ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(message, color = WaveMixerTheme.capsuleAccentSoft, fontSize = 11.sp, modifier = Modifier.weight(1f))
                IconButton(onClick = { state.notice = null }, modifier = Modifier.size(32.dp)) { Icon(WaveIcons.Close, "Fermer l’information", modifier = Modifier.size(16.dp)) }
            }
        }
        if (questions) {
            ClasseQuestions(state, questionStudent, Modifier.weight(1f)) { questions = false; questionStudent = null }
        } else if (state.tab == 1) {
            ClasseResourcesPanel(state, Modifier.weight(1f))
        } else {
            if (state.understandingActive) Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                ClasseUnderstanding.entries.forEach { response -> Text("${state.understanding.values.count { it == response }} ${response.label}", fontSize = 10.sp, color = response.color()) }
            }
            Box(Modifier.weight(1f).fillMaxWidth()) {
                VerticalPager(state = pagerState, modifier = Modifier.fillMaxSize(), pageSpacing = 12.dp,
                    flingBehavior = PagerDefaults.flingBehavior(state = pagerState,
                        pagerSnapDistance = PagerSnapDistance.atMost(1), snapPositionalThreshold = .12f,
                        snapAnimationSpec = spring(dampingRatio = .9f, stiffness = Spring.StiffnessMediumLow))) { page ->
                    Column(Modifier.fillMaxSize().padding(top = 4.dp, bottom = 4.dp, end = 8.dp)) {
                        repeat(3) { row ->
                            Row(Modifier.weight(1f).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                repeat(4) { column ->
                                    val student = state.students.getOrNull(page * 12 + row * 4 + column)
                                    BoxWithConstraints(Modifier.weight(1f).fillMaxHeight(), contentAlignment = Alignment.Center) {
                                        if (student != null) key(student.id) {
                                            val portraitSize = minOf(64.dp, maxWidth - 4.dp, (maxHeight - 38.dp).coerceAtLeast(24.dp))
                    val selected = state.selectedStudent == student.id
                    val speaking = state.speakerId == student.id
                    val hand = state.hands.any { it.studentId == student.id } && !speaking
                    val response = state.understanding[student.id]
                    val size by animateFloatAsState(if (selected) 1.07f else 1f, label = "selected-student")
                    Column(Modifier.fillMaxSize().clickable { state.selectedStudent = if (selected) null else student.id }.padding(vertical = 3.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                        Box(Modifier.size(portraitSize).scale(size)) {
                            if (speaking) ClasseSpeakingHalo(Modifier.fillMaxSize())
                            Image(painterResource(student.portrait), "Sélectionner ${student.name}", Modifier.fillMaxSize().padding(if (speaking) 3.dp else 0.dp).clip(CircleShape).alpha(if (student.connected) 1f else .42f)
                                .border(if (selected || speaking || response != null) 2.dp else .5.dp, if (speaking) Color(0xFF7ABFA2) else response?.color() ?: if (selected) WaveMixerTheme.capsuleAccentSoft else Color.White.copy(alpha = .15f), CircleShape), contentScale = ContentScale.Crop)
                            if (!student.connected) Icon(Icons.Filled.WifiOff, "Connexion perdue",
                                tint = Color(0xFFE39199), modifier = Modifier.align(Alignment.Center).size(22.dp))
                            if (hand) Icon(Icons.Filled.BackHand, "Main levée", tint = WaveMixerTheme.capsuleAccentSoft,
                                modifier = Modifier.align(Alignment.TopStart).size(20.dp))
                            if (speaking || student.id in state.invitedToSpeak) Icon(if (speaking) WaveIcons.Mic else Icons.Filled.Schedule,
                                if (speaking) "A la parole" else "Invité à parler", tint = if (speaking) Color(0xFF7ABFA2) else WaveMixerTheme.capsuleAccentSoft,
                                modifier = Modifier.align(Alignment.BottomEnd).size(23.dp).background(Color(0xFF121017), CircleShape).padding(4.dp))
                            if (state.rankedQuestions.any { it.studentId == student.id }) {
                                ClasseQuestionBubble(Modifier.align(Alignment.TopEnd).size(20.dp))
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(student.name, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        if (speaking) Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                            ClasseVoiceBars()
                            Text("Parole · " + ((tick - state.speakingSince) / 1000).coerceAtLeast(0) + " s", color = Color(0xFF8DD1B2), fontSize = 8.sp, maxLines = 1)
                        } else {
                            val status = response?.label
                            status?.let { Text(it, color = response?.color() ?: classeMuted, fontSize = 9.sp, maxLines = 1) }
                        }
                    }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (pagerState.pageCount > 1) Column(Modifier.align(Alignment.CenterEnd), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    repeat(pagerState.pageCount) { index ->
                        Box(Modifier.width(3.dp).height(if (index == pagerState.settledPage) 13.dp else 5.dp)
                            .background(if (index == pagerState.settledPage) WaveMixerTheme.capsuleAccentSoft else Color.White.copy(alpha = .2f), CircleShape))
                    }
                }
                if (state.students.isEmpty()) Text("Aucun élève pour le moment", color = classeMuted, fontSize = 12.sp, modifier = Modifier.align(Alignment.Center))
            }
        }

        val selected = state.students.find { it.id == state.selectedStudent }
        Column(Modifier.fillMaxWidth().padding(vertical = 6.dp).hifiBlackSurface(14.dp).padding(6.dp)) {
            if (selected != null && !questions && state.tab == 0) {
                val hand = state.hands.firstOrNull { it.studentId == selected.id }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ClasseTool(if (state.speakerId == selected.id) "Couper" else if (hand != null) "Parole" else if (selected.id in state.invitedToSpeak) "Annuler" else "Inviter", if (state.speakerId == selected.id) WaveIcons.MicOff else WaveIcons.Mic, Modifier.weight(1f)) { if (state.speakerId == selected.id) state.releaseFloor() else state.grantFloor(selected.id) }
                    ClasseTool("Message", WaveIcons.Chat, Modifier.weight(1f)) { state.guests.messageRecipientIds = setOf(selected.id) }
                    ClasseTool("Profil", WaveIcons.Eye, Modifier.weight(1f)) { state.guests.previewId = null; state.guests.profilePreviewId = selected.id }
                    var menu by remember(selected.id) { mutableStateOf(false) }
                    Box(Modifier.weight(1f)) {
                        ClasseTool("Options", WaveIcons.More, Modifier.fillMaxWidth()) { menu = true }
                        DropdownMenu(menu, { menu = false }, containerColor = Color(0xFF15141B)) {
                            DropdownMenuItem(text = { Text("Voir ses questions", color = Color.White) }, onClick = { questionStudent = selected.id; questions = true; menu = false })
                            if (hand != null) DropdownMenuItem(text = { Text("Baisser la main", color = Color.White) }, onClick = { state.dismissHand(selected.id); menu = false })
                            DropdownMenuItem(text = { Text("Retirer de la classe", color = Color(0xFFE99A9E)) }, onClick = { removeId = selected.id; menu = false })
                        }
                    }
                    ClasseTool("Annuler", WaveIcons.Close, Modifier.weight(1f)) { state.selectedStudent = null }
                }
            } else Row {
                ClasseTool("Questions ${state.rankedQuestions.size}", Icons.Filled.QuestionAnswer, Modifier.weight(1f)) { questions = !questions; questionStudent = null }
                ClasseTool(if (state.understandingActive) "Terminer" else "Compréhension", Icons.Filled.Psychology, Modifier.weight(1f), active = state.understandingActive) { state.toggleUnderstanding(); if (state.understandingActive) { state.tab = 0; questions = false } }
                ClasseTool(if (state.handsOpen) "Mains ouvertes" else "Mains fermées", Icons.Filled.BackHand, Modifier.weight(1f), tint = if (state.handsOpen) WaveMixerTheme.capsuleAccentSoft else classeMuted) { state.handsOpen = !state.handsOpen }
            }
        }
    }
    if (removeId != null) AlertDialog(onDismissRequest = { removeId = null }, containerColor = Color(0xFF15141B), title = { Text("Retirer cet élève ?", color = Color.White) }, text = { Text("Il quittera la salle et retournera dans les demandes.", color = classeMuted) }, confirmButton = { TextButton(onClick = { state.removeStudent(removeId!!); removeId = null }) { Text("Retirer", color = Color(0xFFE99A9E)) } }, dismissButton = { TextButton(onClick = { removeId = null }) { Text("Annuler") } })
    if (settings) ClasseSheet("Réglages de la classe", { settings = false }) {
        ClasseSetting("Autoriser les mains levées", state.handsOpen) { state.handsOpen = it }
        ClasseSetting("Autoriser les questions", state.questionsOpen) { state.questionsOpen = it }
        TextButton(onClick = { state.lowerAllHands() }) { Text("Baisser toutes les mains en attente", color = WaveMixerTheme.capsuleAccentSoft) }
        if (state.speakerId != null) TextButton(onClick = { state.releaseFloor() }) { Text("Reprendre la parole", color = WaveMixerTheme.capsuleAccentSoft) }
        if (com.meewav.android.BuildConfig.DEBUG) TextButton(onClick = { settings = false; demo = true }) { Text("Simuler une intervention d’élève", color = classeMuted) }
    }
    if (demo) ClasseDemoSheet(state) { demo = false }
}

@Composable internal fun ClasseToggleChip(label: String, enabled: Boolean, action: () -> Unit) {
    Row(Modifier.height(36.dp).hifiBlackSurface(18.dp).clickable(onClick = action).padding(horizontal = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.size(5.dp).background(if (enabled) Color(0xFF79B69A) else Color(0xFFBD7885), CircleShape))
        Text("$label ${if (enabled) "ouvertes" else "fermées"}", color = Color(0xFFCAC5D4), fontSize = 10.sp)
    }
}
@Composable internal fun ClasseTool(label: String, icon: ImageVector, modifier: Modifier = Modifier, active: Boolean = false, tint: Color = if (active) Color(0xFF7ABFA2) else WaveMixerTheme.capsuleAccentSoft, onClick: () -> Unit) {
    Column(modifier.height(48.dp).clip(RoundedCornerShape(10.dp)).clickable(onClick = onClick).padding(vertical = 5.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Icon(icon, label, tint = tint, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(3.dp)); Text(label, fontSize = 9.sp, color = Color(0xFFCBC6D7), maxLines = 1)
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun ClasseSheet(title: String, onDismiss: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = Color(0xFF111115), contentColor = Color.White, dragHandle = null) {
        Column(Modifier.fillMaxWidth().heightIn(max = 560.dp).imePadding().padding(horizontal = 16.dp, vertical = 8.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) { Text(title, Modifier.weight(1f), fontSize = 16.sp, fontWeight = FontWeight.SemiBold); IconButton(onClick = onDismiss) { Icon(WaveIcons.Close, "Fermer", tint = WaveMixerTheme.capsuleAccentSoft) } }
            content()
        }
    }
}
@Composable private fun ClasseSetting(text: String, checked: Boolean, onCheck: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp).hifiBlackSurface(12.dp).padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) { Text(text, Modifier.weight(1f), fontSize = 12.sp); Switch(checked, onCheck, colors = SwitchDefaults.colors(checkedTrackColor = Color(0xFF453677))) }
}
private fun ClasseUnderstanding.color() = when (this) { ClasseUnderstanding.UNDERSTOOD -> Color(0xFF79C5A1); ClasseUnderstanding.PARTIAL -> Color(0xFFD4B477); ClasseUnderstanding.LOST -> Color(0xFFCC8792) }

@Composable private fun ClasseQuestions(state: ClasseToolsState, studentId: String?, modifier: Modifier, onClose: () -> Unit) {
    Column(modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onClose) { Icon(WaveIcons.ChevronLeft, "Revenir aux élèves", tint = WaveMixerTheme.capsuleAccentSoft) }
            Text("Questions", color = Color.White, modifier = Modifier.weight(1f), fontSize = 14.sp)
            ClasseToggleChip("Questions", state.questionsOpen) { state.questionsOpen = !state.questionsOpen }
        }
        val questions = state.rankedQuestions.filter { studentId == null || it.studentId == studentId }
        if (questions.isEmpty()) Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Aucune question en attente", color = classeMuted, fontSize = 12.sp) }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(bottom = 8.dp)) {
            items(questions, key = { it.id }) { question ->
                val student = state.guests.guests.find { it.id == question.studentId }
                Column(Modifier.fillMaxWidth().hifiBlackSurface(14.dp).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        student?.let { Image(painterResource(it.portrait), "Profil de ${it.name}", Modifier.size(32.dp).clip(CircleShape).clickable { state.guests.profilePreviewId = it.id }, contentScale = ContentScale.Crop) }
                        Text(student?.name ?: "Élève", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        TextButton(onClick = { state.likeQuestion(question.id) }) { Icon(WaveIcons.Heart, "Soutenir la question", modifier = Modifier.size(15.dp), tint = if (question.liked) WaveMixerTheme.capsuleAccentSoft else classeMuted); Text(" ${question.likes}", fontSize = 11.sp, color = classeMuted) }
                    }
                    Text(question.text, color = Color(0xFFDDD9E5), fontSize = 13.sp)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { state.resolveQuestion(question.id, true) }, modifier = Modifier.weight(1f).hifiBlackSurface(10.dp)) { Text("Répondue", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 11.sp) }
                        TextButton(onClick = { state.resolveQuestion(question.id, false) }, modifier = Modifier.weight(1f).hifiBlackSurface(10.dp)) { Text("Écarter", color = classeMuted, fontSize = 11.sp) }
                    }
                }
            }
        }
    }
}

@Composable private fun ClasseDemoSheet(state: ClasseToolsState, onDismiss: () -> Unit) {
    var studentId by remember { mutableStateOf(state.selectedStudent ?: state.students.firstOrNull()?.id) }
    var text by remember { mutableStateOf("Je voudrais essayer cet exercice.") }
    var menu by remember { mutableStateOf(false) }
    ClasseSheet("Intervention · démo locale", onDismiss) {
        Box {
            TextButton(onClick = { menu = true }) { Text((state.students.find { it.id == studentId }?.name ?: "Choisir un élève") + " ▾", color = WaveMixerTheme.capsuleAccentSoft) }
            DropdownMenu(menu, { menu = false }, containerColor = Color(0xFF17151D), modifier = Modifier.heightIn(max = 250.dp)) { state.students.forEach { student -> DropdownMenuItem(text = { Text(student.name, color = Color.White) }, onClick = { studentId = student.id; menu = false }) } }
        }
        OutlinedTextField(text, { text = it.take(1000) }, label = { Text("Message de l’élève") }, modifier = Modifier.fillMaxWidth(), colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = WaveMixerTheme.capsuleAccentSoft))
        Row {
            TextButton(onClick = { studentId?.let { state.requestFloor(it, text) }; onDismiss() }, enabled = state.handsOpen && studentId != null && text.isNotBlank()) { Text("Lever la main") }
            TextButton(onClick = { studentId?.let { state.submitQuestion(it, text) }; onDismiss() }, enabled = state.questionsOpen && studentId != null && text.isNotBlank() && state.rankedQuestions.none { it.studentId == studentId }) { Text("Poser la question") }
        }
        if (state.understandingActive) ClasseUnderstanding.entries.forEach { response -> TextButton(onClick = { studentId?.let { state.respond(it, response) }; onDismiss() }) { Text(response.label, color = response.color()) } }
    }
}

@Composable private fun ClasseSpeakingHalo(modifier: Modifier) {
    val transition = rememberInfiniteTransition(label = "speaking-halo")
    val strength by transition.animateFloat(.3f, .75f, infiniteRepeatable(tween(1100), RepeatMode.Reverse), label = "speaking-light")
    Box(modifier.background(Color(0xFF79C5A1).copy(alpha = strength * .12f), CircleShape)
        .border(1.dp, Color(0xFF79C5A1).copy(alpha = strength), CircleShape))
}

@Composable private fun ClasseVoiceBars() {
    val transition = rememberInfiniteTransition(label = "speaking-bars")
    val height by transition.animateFloat(.3f, 1f, infiniteRepeatable(tween(550), RepeatMode.Reverse), label = "voice-motion")
    Row(Modifier.height(10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(1.dp)) {
        listOf(height, 1.3f - height, height * .7f).forEach { value -> Box(Modifier.width(2.dp).height((value * 10).dp).background(Color(0xFF8DD1B2), CircleShape)) }
    }
}

@Composable private fun ClasseQuestionBubble(modifier: Modifier = Modifier) {
    Box(modifier.semantics { contentDescription = "Question en attente" }) {
    Canvas(Modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height
        val bubble = Path().apply {
            moveTo(w * .5f, h * .1f)
            cubicTo(w * .74f, h * .1f, w * .91f, h * .25f, w * .91f, h * .45f)
            cubicTo(w * .91f, h * .67f, w * .73f, h * .8f, w * .5f, h * .8f)
            cubicTo(w * .44f, h * .8f, w * .38f, h * .79f, w * .34f, h * .77f)
            quadraticTo(w * .23f, h * .88f, w * .12f, h * .9f)
            quadraticTo(w * .19f, h * .79f, w * .2f, h * .69f)
            cubicTo(w * .12f, h * .63f, w * .09f, h * .55f, w * .09f, h * .45f)
            cubicTo(w * .09f, h * .25f, w * .26f, h * .1f, w * .5f, h * .1f)
            close()
        }
        drawPath(bubble, Color(0xFF191B20))
        drawPath(bubble, Color(0xFF79B4FF), style = Stroke(width = 1.2.dp.toPx()))
    }
    Text("?", color = Color(0xFF79B4FF), fontSize = 10.sp, lineHeight = 11.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.align(Alignment.Center).offset(y = (-1).dp))
    }
}
