package com.meewav.android.features.rooms.wave

import android.content.Intent
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items as gridItems
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.InlineTextContent
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.appendInlineContent
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.material3.Icon
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.Placeholder
import androidx.compose.ui.text.PlaceholderVerticalAlign
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R

/* ------------------------------------------------------------------------- */
/* Chat Wave — audit fidèle du chat rooms du site web (React) :                */
/*  - portraits réels 28dp, @nom gris, texte blanc                             */
/*  - mur d'emoji maison (50 webp customs, tokens [[mw:name]])                 */
/*  - animation d'entrée place-chat-message-arrive (fade + montée 4dp, 230ms)  */
/*  - rail social iOS en vraie colonne (WaveChatSocialActionRail)              */
/*  - long-press -> sheet d'outils (PlaceMessageActionSheet)                   */
/* ------------------------------------------------------------------------- */

data class WaveChatMessage(
    val id: Long,
    val userId: String,
    val userName: String,
    val content: String,
    val createdAtMs: Long,
    val avatarRes: Int? = null,
    val isHost: Boolean = false,
    val isOwn: Boolean = false,
    val isSystem: Boolean = false,
)

private val chatAccent = Color(0xFFA98EF0)
private val chatNameGrey = Color(0xFF9AA1B4)
private val chatTextWhite = Color(0xFFF4F1F9).copy(alpha = 0.90f)
private val chatTimeGrey = Color.White.copy(alpha = 0.27f)

private fun white(a: Float) = Color.White.copy(alpha = a)

/* Mur d'emoji maison — 50 emoticons du site web (meewav-emojis v1). */
internal val mwEmojiMap: Map<String, Int> = mapOf(
    "ampoule-musicale" to R.drawable.mw_e_ampoule_musicale,
    "batterie" to R.drawable.mw_e_batterie,
    "beatpad-en-flamme" to R.drawable.mw_e_beatpad_en_flamme,
    "boite-a-rythmes-808" to R.drawable.mw_e_boite_a_rythmes_808,
    "boombox" to R.drawable.mw_e_boombox,
    "boule-disco-casque" to R.drawable.mw_e_boule_disco_casque,
    "casque-en-flamme" to R.drawable.mw_e_casque_en_flamme,
    "casque-studio" to R.drawable.mw_e_casque_studio,
    "cassette" to R.drawable.mw_e_cassette,
    "clavier-midi" to R.drawable.mw_e_clavier_midi,
    "coeur-casque" to R.drawable.mw_e_coeur_casque,
    "coeur-en-flamme" to R.drawable.mw_e_coeur_en_flamme,
    "coeur-musical" to R.drawable.mw_e_coeur_musical,
    "collaboration" to R.drawable.mw_e_collaboration,
    "couronne-mw" to R.drawable.mw_e_couronne_mw,
    "disque-or" to R.drawable.mw_e_disque_or,
    "disque-vinyle" to R.drawable.mw_e_disque_vinyle,
    "dj-cool" to R.drawable.mw_e_dj_cool,
    "egaliseur" to R.drawable.mw_e_egaliseur,
    "enceinte-studio" to R.drawable.mw_e_enceinte_studio,
    "etoile-casque" to R.drawable.mw_e_etoile_casque,
    "fusee-musicale" to R.drawable.mw_e_fusee_musicale,
    "globe-casque" to R.drawable.mw_e_globe_casque,
    "guitare-acoustique" to R.drawable.mw_e_guitare_acoustique,
    "guitare-electrique-flamme" to R.drawable.mw_e_guitare_electrique_flamme,
    "laptop-waveform" to R.drawable.mw_e_laptop_waveform,
    "micro-flamme" to R.drawable.mw_e_micro_flamme,
    "micro-pop-filter" to R.drawable.mw_e_micro_pop_filter,
    "micro-studio" to R.drawable.mw_e_micro_studio,
    "micro-vintage" to R.drawable.mw_e_micro_vintage,
    "note-en-flamme" to R.drawable.mw_e_note_en_flamme,
    "notes-couronne" to R.drawable.mw_e_notes_couronne,
    "notes-pop" to R.drawable.mw_e_notes_pop,
    "nuage-musical" to R.drawable.mw_e_nuage_musical,
    "onde-audio" to R.drawable.mw_e_onde_audio,
    "onde-neon" to R.drawable.mw_e_onde_neon,
    "pad-midi" to R.drawable.mw_e_pad_midi,
    "pad-tactile" to R.drawable.mw_e_pad_tactile,
    "partition-crayon" to R.drawable.mw_e_partition_crayon,
    "partition-notes" to R.drawable.mw_e_partition_notes,
    "planete-musicale" to R.drawable.mw_e_planete_musicale,
    "platine-vinyle" to R.drawable.mw_e_platine_vinyle,
    "saxophone" to R.drawable.mw_e_saxophone,
    "scratch-dj" to R.drawable.mw_e_scratch_dj,
    "signe-rock" to R.drawable.mw_e_signe_rock,
    "synthetiseur" to R.drawable.mw_e_synthetiseur,
    "table-mixage" to R.drawable.mw_e_table_mixage,
    "trompette" to R.drawable.mw_e_trompette,
    "vinyle-couronne" to R.drawable.mw_e_vinyle_couronne,
    "vinyle-notes" to R.drawable.mw_e_vinyle_notes,
)

private val emojiTokenRegex = Regex("\\[\\[mw:([a-z0-9-]+)\\]\\]")

/* Rend [[mw:name]] en image inline (MeeWavRichText web). */
@Composable
internal fun chatAnnotatedText(content: String): Pair<AnnotatedString, Map<String, InlineTextContent>> {
    val inline = mutableMapOf<String, InlineTextContent>()
    val text = buildAnnotatedString {
        var last = 0
        for (m in emojiTokenRegex.findAll(content)) {
            val name = m.groupValues[1]
            val res = mwEmojiMap[name]
            append(content.substring(last, m.range.first))
            if (res != null) {
                val id = "mw_$name"
                inline[id] = InlineTextContent(
                    Placeholder(17.sp, 17.sp, PlaceholderVerticalAlign.TextCenter)
                ) {
                    Image(painterResource(res), null, modifier = Modifier.fillMaxSize())
                }
                appendInlineContent(id, "[e]")
            } else {
                append(m.value)
            }
            last = m.range.last + 1
        }
        append(content.substring(last))
    }
    return text to inline
}

private fun messageClock(ms: Long): String =
    java.text.SimpleDateFormat("HH:mm", java.util.Locale.FRANCE).format(java.util.Date(ms))

@Composable
fun WaveChatPanel(
    modifier: Modifier = Modifier,
    pinnedMessage: WaveChatMessage? = null,
    onPinMessage: (WaveChatMessage?) -> Unit = {},
    notificationsRead: Boolean = false,
    onReadNotifications: () -> Unit = {},
    onEmojiPanelChange: (Boolean) -> Unit = {},
) {
    val now = remember { System.currentTimeMillis() }
    val mountedAt = remember { System.currentTimeMillis() }
    var nextId by remember { mutableLongStateOf(9L) }
    var messages by remember {
        mutableStateOf(
            listOf(
                WaveChatMessage(1, "sys", "", "La Wave est en direct — bienvenue dans le chat", now - 9 * 60_000, isSystem = true),
                WaveChatMessage(2, "u_luca", "luca.maris", "Cette base est lourde [[mw:coeur-en-flamme]]", now - 8 * 60_000, avatarRes = R.drawable.chat_av_luca),
                WaveChatMessage(3, "u_mina", "mina.lune", "J'ai envoyé une boucle au sas [[mw:micro-flamme]]", now - 6 * 60_000, avatarRes = R.drawable.chat_av_mina),
                WaveChatMessage(4, "u_mina", "mina.lune", "Vous en pensez quoi ?", now - 5 * 60_000, avatarRes = R.drawable.chat_av_mina),
                WaveChatMessage(5, "host", "Luma", "Je l'écoute tout de suite [[mw:casque-studio]]", now - 4 * 60_000, avatarRes = R.drawable.wave_artist_luma, isHost = true),
                WaveChatMessage(6, "u_riko", "riko.wav", "Le drop à 1:12 est fou [[mw:vinyle-notes]]", now - 2 * 60_000, avatarRes = R.drawable.chat_av_riko),
            )
        )
    }
    var toolsOpen by remember { mutableStateOf(false) }
    var notificationsOpen by remember { mutableStateOf(false) }
    var livePoll by remember { mutableStateOf<WaveChatPoll?>(null) }
    val emojiInput = remember { WaveEmojiInputController() }
    var draft by remember { mutableStateOf("") }
    var unreadCount by remember { mutableIntStateOf(0) }
    // Flux live animé — nouveaux messages qui défilent à la vraie vitesse d'un chat.
    val liveFeed = remember {
        listOf(
            Triple("u_zoe", "zoe.beats", "La basse me tue [[mw:coeur-en-flamme]]"),
            Triple("u_riko", "riko.wav", "Ce break [[mw:vinyle-notes]]"),
            Triple("u_kel", "kel.wav", "Qui a la ref du sample ?"),
            Triple("u_luca", "luca.maris", "Le drop arrive [[mw:note-en-flamme]]"),
            Triple("u_mina", "mina.lune", "Wouah [[mw:etoile-casque]]"),
            Triple("u_nova", "nova.live", "Set de malade [[mw:boule-disco-casque]]"),
            Triple("u_dio", "dio.mix", "Le sidechain pompe bien [[mw:table-mixage]]"),
            Triple("u_riko", "riko.wav", "Encore une [[mw:micro-flamme]]"),
            Triple("u_zoe", "zoe.beats", "C'est parti [[mw:fusee-musicale]]"),
            Triple("u_kel", "kel.wav", "La transition est propre [[mw:egaliseur]]"),
            Triple("artist_0", "NAYA K.", "Ce groove est incroyable"),
            Triple("artist_1", "KÉO", "La basse est parfaite ici"),
            Triple("artist_2", "SOLEN", "Bravo pour cette transition"),
            Triple("artist_3", "AZUR", "Le mix est propre"),
            Triple("artist_4", "LORNS", "On veut la suite !"),
            Triple("artist_5", "YUNA", "Ce refrain reste en tête"),
            Triple("artist_6", "MALIK NOX", "Quelle énergie ce soir"),
            Triple("artist_7", "ALYA FLOW", "Le son est chaud"),
            Triple("artist_8", "NOAM A.", "Les harmonies sont magnifiques"),
            Triple("artist_9", "LINA V.", "Un plaisir de vous écouter"),
        )
    }
    var liveIndex by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        val delays = longArrayOf(650, 900, 450, 1200, 550, 750, 400, 1000, 600, 800)
        var i = 0
        while (true) {
            delay(delays[i % delays.size]); i++
            val (uid, name, content) = liveFeed[liveIndex % liveFeed.size]
            liveIndex++
            messages = (messages + WaveChatMessage(
                id = nextId++, userId = uid, userName = name,
                content = content, createdAtMs = System.currentTimeMillis(),
                avatarRes = when (uid) {
                    "u_riko" -> R.drawable.chat_av_riko
                    "u_luca" -> R.drawable.chat_av_luca
                    "u_mina" -> R.drawable.chat_av_mina
                    else -> waveDemoPortrait(uid)
                }
            )).takeLast(60)
        }
    }
    var actionMessage by remember { mutableStateOf<WaveChatMessage?>(null) }
    var emojiWallOpen by remember { mutableStateOf(false) }
    LaunchedEffect(emojiWallOpen) { onEmojiPanelChange(emojiWallOpen) }
    androidx.compose.runtime.DisposableEffect(Unit) { onDispose { onEmojiPanelChange(false) } }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    var followingLive by remember { mutableStateOf(true) }
    val manualScroll = remember {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                if (source == NestedScrollSource.UserInput && available.y != 0f) {
                    followingLive = false
                }
                return Offset.Zero
            }
        }
    }
    var lastSeenMessageId by remember { mutableStateOf<Long?>(null) }
    LaunchedEffect(messages.lastOrNull()?.id, followingLive) {
        if (messages.isEmpty()) return@LaunchedEffect
        if (followingLive) {
            unreadCount = 0
            listState.scrollToItem(messages.lastIndex)
        } else if (lastSeenMessageId != messages.lastOrNull()?.id) {
            unreadCount++
        }
        lastSeenMessageId = messages.lastOrNull()?.id
    }
    BoxWithConstraints(modifier.fillMaxSize().padding(bottom = 6.dp)) {
        // This area already follows the Samsung IME insets from WaveMixerScreen.
        // Reserve the composer first; the grid uses the remaining height without a modal.
        val emojiHeight = (maxHeight - 100.dp - if (pinnedMessage != null) 86.dp else 0.dp)
            .coerceIn(80.dp, 260.dp)
        Column(Modifier.fillMaxSize()) {
            pinnedMessage?.let { pinned ->
                Row(
                    Modifier.fillMaxWidth().padding(top = 6.dp, bottom = 6.dp)
                        .hifiBlackSurface(12.dp).clip(RoundedCornerShape(12.dp))
                        .clickable { toolsOpen = true }.padding(start = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f).padding(vertical = 8.dp)) {
                        Text("Mise en avant · ${pinned.userName}", color = chatAccent, fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold)
                        val (text, images) = chatAnnotatedText(pinned.content)
                        Text(text, inlineContent = images, color = chatTextWhite, fontSize = 12.sp,
                            maxLines = 2, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                    }
                    Box(Modifier.size(44.dp).clickable { onPinMessage(null) }, contentAlignment = Alignment.Center) {
                        Icon(WaveIcons.Close, "Retirer la mise en avant", tint = white(.6f), modifier = Modifier.size(16.dp))
                    }
                }
            }
            Row(Modifier.weight(1f).fillMaxWidth()) {
                Box(Modifier.weight(1f).fillMaxSize()) {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize().nestedScroll(manualScroll),
                        verticalArrangement = Arrangement.spacedBy(0.dp),
                        contentPadding = PaddingValues(top = 4.dp, bottom = 4.dp)
                    ) {
                        items(messages, key = { it.id }) { msg ->
                            // is-live-entry : animation d'arrivée pour les messages postés après l'ouverture.
                            WaveChatRow(
                                message = msg,
                                animateEntry = msg.createdAtMs > mountedAt,
                                onLongPress = { actionMessage = msg }
                            )
                        }
                    }

                    // « Revenir au direct » — pill flottante quand on a scrollé vers le haut.
                    if (!followingLive) {
                        Row(
                            Modifier
                                .align(Alignment.BottomCenter)
                                .padding(bottom = 6.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFF1B1826))
                                .border(1.dp, chatAccent.copy(alpha = 0.45f), RoundedCornerShape(14.dp))
                                .clickable {
                                    unreadCount = 0
                                    followingLive = true
                                }
                                .padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(WaveIcons.ChevronDown, null, tint = chatAccent, modifier = Modifier.size(12.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(
                                if (unreadCount > 0) "Revenir au direct · $unreadCount" else "Revenir au direct",
                                color = Color.White, fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold, fontFamily = WaveMixerTheme.fontFamily
                            )
                        }
                    }
                }

                // Rail social iOS — vraie colonne chrome (outils + indicateurs).
                WaveChatSocialRail(
                    Modifier
                        .width(50.dp)
                        .fillMaxSize()
                        .padding(start = 6.dp, top = 6.dp, bottom = 6.dp),
                    onOpenTools = { toolsOpen = true },
                    notificationCount = if (notificationsRead) 0 else waveDemoNotifications.size,
                    onOpenNotifications = {
                        notificationsOpen = true
                        onReadNotifications()
                    },
                )
            }

            // Mur d'emoji maison — panneau au-dessus du composer.
            if (emojiWallOpen) {
                MwEmojiWall(
                    height = emojiHeight,
                    onSelect = { name -> emojiInput.insert(name) },
                    onClose = { emojiWallOpen = false },
                )
            }

            Spacer(Modifier.height(8.dp))
            WaveChatComposer(
                draft = draft,
                emojiInput = emojiInput,
                emojiOpen = emojiWallOpen,
                onDraftChange = { draft = it },
                onToggleEmoji = { emojiWallOpen = !emojiWallOpen },
                onSend = {
                    val text = draft.trim()
                    if (text.isNotEmpty()) {
                        messages = messages + WaveChatMessage(
                            id = nextId++, userId = "host", userName = "Luma",
                            content = text, createdAtMs = System.currentTimeMillis(),
                            avatarRes = R.drawable.wave_artist_luma,
                            isHost = true, isOwn = true
                        )
                        draft = ""
                    }
                }
            )
        }

        if (notificationsOpen) {
            WaveNotificationsSheet(onDismiss = { notificationsOpen = false })
        }
        if (toolsOpen) {
            WaveChatToolsSheet(
                poll = livePoll,
                onDismiss = { toolsOpen = false },
                onLaunch = { question, choices, duration ->
                    livePoll = WaveChatPoll(question, choices, System.currentTimeMillis() + duration * 1000L)
                    messages = messages + WaveChatMessage(
                        id = nextId++, userId = "sys", userName = "",
                        content = "Sondage · $question · ${choices.joinToString(" / ")}",
                        createdAtMs = System.currentTimeMillis(), isSystem = true,
                    )
                },
                onStop = { livePoll = livePoll?.copy(endsAt = System.currentTimeMillis()) },
                onNewPoll = { livePoll = null },
                hostMessages = messages.filter { it.isHost && !it.isSystem },
                pinnedMessage = pinnedMessage,
                onPin = onPinMessage,
            )
        }

        // Sheet d'outils message — long-press (PlaceMessageActionSheet iOS).
        actionMessage?.let { msg ->
            WaveMessageActionSheet(
                message = msg,
                onDismiss = { actionMessage = null },
                onPin = { if (msg.isHost) onPinMessage(msg); actionMessage = null },
                onDelete = {
                    if (pinnedMessage?.id == msg.id) onPinMessage(null)
                    messages = messages.filter { it.id != msg.id }
                    actionMessage = null
                }
            )
        }
    }
}

/* Message web : header (portrait + @nom gris + badges + heure) puis texte blanc. */
@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun WaveChatRow(
    message: WaveChatMessage,
    animateEntry: Boolean = false,
    onLongPress: () -> Unit = {},
) {
    // place-chat-message-arrive : opacity 0->1 + translateY(4dp)->0 en 230ms.
    var appeared by remember { mutableStateOf(!animateEntry) }
    LaunchedEffect(Unit) { appeared = true }
    val entryAlpha by animateFloatAsState(if (appeared) 1f else 0f, tween(230), label = "entry")
    val entryOffset by animateDpAsState(if (appeared) 0.dp else 4.dp, tween(230), label = "entry")

    if (message.isSystem) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(vertical = 10.dp, horizontal = 7.dp)
                .alpha(entryAlpha)
                .offset(y = entryOffset),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(WaveIcons.Reverb, null, tint = chatAccent, modifier = Modifier.size(12.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                message.content, color = chatAccent,
                fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
                fontStyle = FontStyle.Italic,
                fontFamily = WaveMixerTheme.fontFamily
            )
        }
        return
    }

    Column(
        Modifier
            .fillMaxWidth()
            .alpha(entryAlpha)
            .offset(y = entryOffset)
            .clip(RoundedCornerShape(8.dp))
            .combinedClickable(onClick = {}, onLongClick = onLongPress)
            .padding(vertical = 5.dp, horizontal = 4.dp)
    ) {
        Row(
            Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top
        ) {
            // Existing avatars retained; demo artists always have a stable portrait, never initials.
            Box(
                Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF162333)),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painterResource(message.avatarRes ?: waveDemoPortrait(message.userId)), null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                )
            }
            Spacer(Modifier.width(8.dp))
            Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "@${message.userName.removePrefix("@")}",
                color = chatNameGrey,
                fontSize = 11.sp, fontWeight = FontWeight.Medium,
                fontFamily = WaveMixerTheme.fontFamily, maxLines = 1
            )
            if (message.isOwn) {
                Spacer(Modifier.width(5.dp))
                Text(
                    "Vous", color = white(0.45f),
                    fontSize = 9.sp, fontWeight = FontWeight.Medium,
                    fontFamily = WaveMixerTheme.fontFamily
                )
            }
            if (message.isHost) {
                Spacer(Modifier.width(5.dp))
                Text(
                    "HOST",
                    color = Color(0xFFDBC0FF),
                    fontSize = 8.sp, fontWeight = FontWeight.Black, letterSpacing = 0.8.sp,
                    fontFamily = WaveMixerTheme.fontFamily,
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(Color(0xFF7E49CD).copy(alpha = 0.20f))
                        .border(0.5.dp, Color(0xFFC097FF).copy(alpha = 0.34f), RoundedCornerShape(50))
                        .padding(horizontal = 5.dp, vertical = 1.5.dp)
                )
            }
            Spacer(Modifier.weight(1f))
}
        Spacer(Modifier.height(1.dp))
        // Corps du message — blanc, tokens [[mw:name]] rendus en images inline.
        val (annotated, inline) = chatAnnotatedText(message.content)
        Text(
            annotated,
            inlineContent = inline,
            color = chatTextWhite,
            fontSize = 12.sp, fontWeight = FontWeight.Normal,
            fontFamily = WaveMixerTheme.fontFamily,
            lineHeight = 17.sp,
            modifier = Modifier.fillMaxWidth()
        )
            }
        }
    }
}

/* Mur d'emoji maison — grille des 50 emoticons customs (mw-emoticon-wall web). */
@Composable
private fun MwEmojiWall(height: Dp, onSelect: (String) -> Unit, onClose: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .padding(top = 8.dp)
            .height(height)
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFF0D0B16).copy(alpha = 0.96f))
            .border(1.dp, Color(0xFFBE9AEF).copy(alpha = 0.22f), RoundedCornerShape(14.dp))
            .padding(8.dp)
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(
                "ÉMOTICÔNES MEEWAV", color = white(0.55f), fontSize = 9.sp,
                fontWeight = FontWeight.SemiBold, letterSpacing = 0.8.sp,
                fontFamily = WaveMixerTheme.fontFamily,
                modifier = Modifier.weight(1f).padding(start = 2.dp),
            )
            Box(Modifier.size(44.dp).clip(CircleShape).clickable(onClick = onClose),
                contentAlignment = Alignment.Center) {
                Icon(WaveIcons.Close, "Fermer les émoticônes", tint = white(0.75f), modifier = Modifier.size(18.dp))
            }
        }
        LazyVerticalGrid(
            columns = GridCells.Adaptive(48.dp),
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            gridItems(mwEmojiMap.entries.toList()) { (name, res) ->
                Box(
                    Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onSelect(name) }
                        .padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Image(painterResource(res), name, modifier = Modifier.fillMaxSize())
                }
            }
        }
    }
}

/* Compact Hi-Fi rail: same black chassis as the Chat / Mixeur navbar. */
@Composable
private fun WaveChatSocialRail(
    modifier: Modifier = Modifier,
    onOpenTools: () -> Unit,
    notificationCount: Int,
    onOpenNotifications: () -> Unit,
) {
    val context = LocalContext.current
    BoxWithConstraints(modifier, contentAlignment = Alignment.Center) {
        Column(
            Modifier.fillMaxWidth().height(maxHeight.coerceAtMost(346.dp))
                .hifiBlackSurface(17.dp).clip(RoundedCornerShape(17.dp))
                .verticalScroll(rememberScrollState()).padding(vertical = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            RailToolButton(icon = WaveIcons.More, tint = chatAccent, label = "Outils du chat", onClick = onOpenTools)
            RailToolButton(icon = WaveIcons.Bell, tint = white(0.8f), label = "Notifications",
                badge = notificationCount.takeIf { it > 0 }?.toString(), onClick = onOpenNotifications)
            RailSeparator()
            Box(Modifier.height(44.dp), contentAlignment = Alignment.Center) { ChatRailItem(imageRes = R.drawable.money_bag, value = "148") }
            Box(Modifier.height(44.dp), contentAlignment = Alignment.Center) { ChatRailItem(icon = WaveIcons.Star, tint = Color(0xFFF3BF49), value = "86") }
            Box(Modifier.height(44.dp), contentAlignment = Alignment.Center) { ChatRailItem(icon = WaveIcons.Heart, tint = Color(0xFFFF64AA), value = "1,2k") }
            Box(Modifier.height(44.dp), contentAlignment = Alignment.Center) { ChatRailItem(icon = WaveIcons.Eye, tint = Color(0xFF9A63FF), value = "312") }
            RailSeparator()
            RailToolButton(icon = WaveIcons.Share, tint = white(0.8f), label = "Partager le live", onClick = {
                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, "Meewav · La Wave — Freestyle session · Luma invite")
                }
                context.startActivity(Intent.createChooser(intent, "Partager le live"))
            })
        }
    }
}

@Composable
private fun RailSeparator() {
    Box(Modifier.height(5.dp), contentAlignment = Alignment.Center) {
        Box(Modifier.width(22.dp).height(0.5.dp).background(white(0.12f)))
    }
}
/* Bouton d'outil du rail — icône + badge optionnel (notifications). */
@Composable
private fun RailToolButton(
    icon: ImageVector, tint: Color, label: String, badge: String? = null,
    onClick: () -> Unit = {},
) {
    Box(
        Modifier
            .fillMaxWidth()
            .height(44.dp)
            .clickable(onClick = onClick)
            .padding(4.dp),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, label, tint = tint, modifier = Modifier.size(16.dp))
        badge?.let {
            Box(
                Modifier
                    .align(Alignment.TopEnd)
                    .clip(CircleShape)
                    .background(Color(0xFFFF536C))
                    .padding(horizontal = 3.dp, vertical = 1.dp)
            ) {
                Text(it, color = Color.White, fontSize = 7.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

/* Item du rail — icône nue + compteur serré. */
@Composable
private fun ChatRailItem(
    value: String,
    tint: Color? = null,
    icon: ImageVector? = null,
    imageRes: Int? = null,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        if (imageRes != null) {
            Image(painterResource(imageRes), null, modifier = Modifier.size(17.dp))
        } else if (icon != null && tint != null) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(17.dp))
        }
        Spacer(Modifier.height(3.dp))
        Text(
            value, color = white(0.85f),
            fontSize = 9.sp, fontWeight = FontWeight.Bold,
            fontFamily = WaveMixerTheme.fontFamily
        )
    }
}

/* Composer liquid-glass : input-well (champ + bouton emoji -> mur) + send. */
@Composable
private fun WaveChatComposer(
    draft: String,
    emojiInput: WaveEmojiInputController,
    emojiOpen: Boolean,
    onDraftChange: (String) -> Unit,
    onToggleEmoji: () -> Unit,
    onSend: () -> Unit,
) {
    val canSend = draft.trim().isNotEmpty()
    var focused by remember { mutableStateOf(false) }
    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 3.dp)
            .height(52.dp)
            .chatComposerGlass(focused = focused),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(0.dp),
    ) {
        Row(
            Modifier
                .weight(1f)
                .height(50.dp)
                .padding(start = 16.dp, end = 2.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            WaveEmojiInput(
                draft = draft,
                controller = emojiInput,
                onDraftChange = onDraftChange,
                onSend = { if (canSend) onSend() },
                onFocus = { focused = it },
                modifier = Modifier.weight(1f).height(44.dp),
            )
            Spacer(Modifier.width(7.dp))
            Box(Modifier.width(1.dp).height(22.dp).background(
                Brush.verticalGradient(listOf(Color.Transparent, Color(0x4077759C), Color.Transparent))
            ))
            Box(
                Modifier.size(44.dp).clip(CircleShape).clickable(onClick = onToggleEmoji),
                contentAlignment = Alignment.Center,
            ) {
                Icon(WaveIcons.Emoji, "Émoticônes Meewav",
                    tint = if (emojiOpen) chatAccent else Color(0xFFA7A8BB),
                    modifier = Modifier.size(21.dp))
            }
        }
        Box(
            Modifier
                .size(44.dp)
                .clip(CircleShape)
                .clickable(enabled = canSend, onClick = onSend),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                WaveIcons.Send, "Envoyer",
                tint = WaveMixerTheme.capsuleAccentSoft.copy(alpha = if (canSend) 1f else .48f),
                modifier = Modifier.size(23.dp)
            )
        }
    }
}

private val waveArtistPortraits = listOf(
    R.drawable.wave_chat_artist_0,
    R.drawable.wave_chat_artist_1,
    R.drawable.wave_chat_artist_2,
    R.drawable.wave_chat_artist_3,
    R.drawable.wave_chat_artist_4,
    R.drawable.wave_chat_artist_5,
    R.drawable.wave_chat_artist_6,
    R.drawable.wave_chat_artist_7,
    R.drawable.wave_chat_artist_8,
    R.drawable.wave_chat_artist_9,
)

internal fun waveDemoPortrait(userId: String): Int {
    val artistIndex = userId.removePrefix("artist_").toIntOrNull()
    val index = artistIndex ?: when (userId) {
        "u_zoe" -> 0
        "u_kel" -> 1
        "u_nova" -> 2
        "u_dio" -> 3
        else -> Math.floorMod(userId.hashCode(), waveArtistPortraits.size)
    }
    return waveArtistPortraits[Math.floorMod(index, waveArtistPortraits.size)]
}
