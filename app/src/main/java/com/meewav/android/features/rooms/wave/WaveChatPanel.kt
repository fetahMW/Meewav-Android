package com.meewav.android.features.rooms.wave

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
private val mwEmojiMap: Map<String, Int> = mapOf(
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
private fun chatAnnotatedText(content: String): Pair<AnnotatedString, Map<String, InlineTextContent>> {
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
fun WaveChatPanel(modifier: Modifier = Modifier) {
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
        )
    }
    var liveIndex by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) {
        val delays = longArrayOf(1400, 2200, 3100, 1900, 2600, 1800, 3400, 2400, 2900, 2100)
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
                    else -> null
                }
            )).takeLast(60)
        }
    }
    var actionMessage by remember { mutableStateOf<WaveChatMessage?>(null) }
    var emojiWallOpen by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    // Smart-scroll web : on suit le direct seulement si on est déjà en bas (<64px).
    val isAtLiveEdge by remember {
        derivedStateOf {
            val last = listState.layoutInfo.visibleItemsInfo.lastOrNull() ?: return@derivedStateOf true
            last.index >= messages.size - 1
        }
    }
    LaunchedEffect(messages.size) {
        if (messages.isEmpty()) return@LaunchedEffect
        if (isAtLiveEdge) {
            listState.animateScrollToItem(messages.size - 1)
        } else {
            unreadCount++
        }
    }

    Box(modifier.fillMaxSize().padding(bottom = 6.dp)) {
        Column(Modifier.fillMaxSize()) {
            Row(Modifier.weight(1f).fillMaxWidth()) {
                Box(Modifier.weight(1f).fillMaxSize()) {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
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
                    if (!isAtLiveEdge) {
                        Row(
                            Modifier
                                .align(Alignment.BottomCenter)
                                .padding(bottom = 6.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color(0xFF1B1826))
                                .border(1.dp, chatAccent.copy(alpha = 0.45f), RoundedCornerShape(14.dp))
                                .clickable {
                                    unreadCount = 0
                                    scope.launch { listState.animateScrollToItem(messages.size - 1) }
                                }
                                .padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(WaveIcons.ChevronDown, null, tint = chatAccent, modifier = Modifier.size(12.dp))
                            Spacer(Modifier.width(4.dp))
                            Text(
                                if (unreadCount > 0) "$unreadCount nouveaux" else "Revenir au direct",
                                color = Color.White, fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold, fontFamily = WaveMixerTheme.fontFamily
                            )
                        }
                    }
                }

                // Rail social iOS — vraie colonne chrome (outils + indicateurs).
                WaveChatSocialRail(
                    Modifier
                        .width(42.dp)
                        .fillMaxSize()
                        .padding(start = 6.dp, top = 6.dp, bottom = 6.dp),
                    onOpenEmoji = { emojiWallOpen = !emojiWallOpen },
                    onReturnToLive = {
                        unreadCount = 0
                        if (messages.isNotEmpty()) scope.launch { listState.animateScrollToItem(messages.lastIndex) }
                    }
                )
            }

            // Mur d'emoji maison — panneau au-dessus du composer.
            if (emojiWallOpen) {
                MwEmojiWall(
                    onSelect = { name ->
                        val token = "[[mw:$name]]"
                        draft = if (draft.isEmpty() || draft.endsWith(" ")) "$draft$token" else "$draft $token"
                    }
                )
            }

            Spacer(Modifier.height(8.dp))
            WaveChatComposer(
                draft = draft,
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

        // Sheet d'outils message — long-press (PlaceMessageActionSheet iOS).
        actionMessage?.let { msg ->
            WaveMessageActionSheet(
                message = msg,
                onDismiss = { actionMessage = null },
                onPin = { actionMessage = null },
                onDelete = {
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
            .padding(vertical = 8.dp, horizontal = 4.dp)
    ) {
        Row(
            Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Portrait 28dp — image réelle, sinon initiale sur #162333 (place-chat__portrait).
            Box(
                Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF162333)),
                contentAlignment = Alignment.Center
            ) {
                if (message.avatarRes != null) {
                    Image(
                        painterResource(message.avatarRes), null,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Text(
                        message.userName.first().uppercase(),
                        color = Color(0xFFB9D9FF),
                        fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                        fontFamily = WaveMixerTheme.fontFamily
                    )
                }
            }
            Spacer(Modifier.width(8.dp))
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
            Text(
                messageClock(message.createdAtMs),
                color = chatTimeGrey, fontSize = 8.sp,
                fontWeight = FontWeight.Medium,
                fontFamily = WaveMixerTheme.fontFamily
            )
        }
        Spacer(Modifier.height(3.dp))
        // Corps du message — blanc, tokens [[mw:name]] rendus en images inline.
        val (annotated, inline) = chatAnnotatedText(message.content)
        Text(
            annotated,
            inlineContent = inline,
            color = chatTextWhite,
            fontSize = 12.sp, fontWeight = FontWeight.Normal,
            fontFamily = WaveMixerTheme.fontFamily,
            lineHeight = 17.sp,
            modifier = Modifier.padding(start = 36.dp)
        )
    }
}

/* Mur d'emoji maison — grille des 50 emoticons customs (mw-emoticon-wall web). */
@Composable
private fun MwEmojiWall(onSelect: (String) -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .padding(top = 8.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFF0D0B16).copy(alpha = 0.96f))
            .border(1.dp, Color(0xFFBE9AEF).copy(alpha = 0.22f), RoundedCornerShape(14.dp))
            .padding(8.dp)
    ) {
        Text(
            "EMOTICONS MEEWAV",
            color = white(0.55f), fontSize = 9.sp,
            fontWeight = FontWeight.SemiBold, letterSpacing = 0.8.sp,
            fontFamily = WaveMixerTheme.fontFamily,
            modifier = Modifier.padding(start = 2.dp, bottom = 6.dp)
        )
        LazyVerticalGrid(
            columns = GridCells.Fixed(6),
            modifier = Modifier
                .fillMaxWidth()
                .height(150.dp),
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            gridItems(mwEmojiMap.entries.toList()) { (name, res) ->
                Box(
                    Modifier
                        .size(40.dp)
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

/* Rail social iOS (WaveChatSocialActionRail) — vraie colonne chrome :
   outils host (dons, dashboard, notifications) + métriques + partage. */
@Composable
private fun WaveChatSocialRail(
    modifier: Modifier = Modifier,
    onOpenEmoji: () -> Unit,
    onReturnToLive: () -> Unit,
) {
    var menuOpen by remember { mutableStateOf(false) }
    BoxWithConstraints(
        modifier
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.verticalGradient(
                    listOf(white(0.11f), white(0.045f), white(0.02f))
                )
            )
            .border(0.7.dp, white(0.10f), RoundedCornerShape(14.dp))
    ) {
    Column(
        Modifier.fillMaxWidth().verticalScroll(rememberScrollState())
            .heightIn(min = maxHeight).padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceEvenly
    ) {
        Box {
            RailToolButton(
                icon = WaveIcons.Settings, tint = chatAccent, label = "Menu du chat",
                onClick = { menuOpen = true }
            )
            DropdownMenu(
                expanded = menuOpen,
                onDismissRequest = { menuOpen = false },
                containerColor = Color(0xFF10121A),
                shape = RoundedCornerShape(16.dp),
            ) {
                DropdownMenuItem(
                    text = { Text("Émoticônes Meewav", color = Color(0xFFE4E3EE)) },
                    leadingIcon = { Icon(WaveIcons.Emoji, null, tint = chatAccent) },
                    onClick = { menuOpen = false; onOpenEmoji() },
                )
                DropdownMenuItem(
                    text = { Text("Revenir au direct", color = Color(0xFFE4E3EE)) },
                    leadingIcon = { Icon(WaveIcons.ChevronDown, null, tint = chatAccent) },
                    onClick = { menuOpen = false; onReturnToLive() },
                )
            }
        }
        RailToolButton(icon = WaveIcons.Dashboard, tint = white(0.8f), label = "Dashboard")
        RailToolButton(icon = WaveIcons.Bell, tint = white(0.8f), label = "Notifications", badge = "3")
        // Métriques — indicateurs web.
        ChatRailItem(imageRes = R.drawable.money_bag, value = "148")
        ChatRailItem(icon = WaveIcons.Star, tint = Color(0xFFF3BF49), value = "86")
        ChatRailItem(icon = WaveIcons.Heart, tint = Color(0xFFFF64AA), value = "1,2k")
        ChatRailItem(icon = WaveIcons.Eye, tint = Color(0xFF9A63FF), value = "312")
    }
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
            .height(40.dp)
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

/* Sheet d'outils message — long-press : épingler / supprimer / modérer. */
@Composable
private fun WaveMessageActionSheet(
    message: WaveChatMessage,
    onDismiss: () -> Unit,
    onPin: () -> Unit,
    onDelete: () -> Unit
) {
    Box(Modifier.fillMaxSize()) {
        Box(
            Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.5f))
                .clickable(onClick = onDismiss)
        )
        Column(
            Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 10.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFF14121C))
                .border(1.dp, white(0.09f), RoundedCornerShape(16.dp))
        ) {
            Row(
                Modifier.fillMaxWidth().padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "@${message.userName}  ·  ${message.content.take(60)}",
                    color = white(0.55f), fontSize = 11.sp,
                    fontFamily = WaveMixerTheme.fontFamily, maxLines = 1
                )
            }
            ChatSheetDivider()
            SheetAction(label = "Épingler le message", accent = chatAccent, onClick = onPin)
            SheetAction(label = "Supprimer le message", accent = Color(0xFFFF536C), onClick = onDelete)
            ChatSheetDivider()
            SheetAction(label = "Mode lent · @${message.userName} (30 s)", onClick = onDismiss)
            SheetAction(label = "Expulser @${message.userName}", onClick = onDismiss)
            SheetAction(label = "Bannir @${message.userName}", accent = Color(0xFFFF536C), onClick = onDismiss)
        }
    }
}

@Composable
private fun SheetAction(label: String, onClick: () -> Unit, accent: Color = white(0.88f)) {
    Text(
        label,
        color = accent, fontSize = 13.sp, fontWeight = FontWeight.Medium,
        fontFamily = WaveMixerTheme.fontFamily,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 12.dp)
    )
}

@Composable
private fun ChatSheetDivider() {
    Box(Modifier.fillMaxWidth().height(0.5.dp).background(white(0.08f)))
}

/* Composer liquid-glass : input-well (champ + bouton emoji -> mur) + send. */
@Composable
private fun WaveChatComposer(
    draft: String,
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
            BasicTextField(
                value = draft,
                onValueChange = { onDraftChange(it.take(1_000)) },
                modifier = Modifier.weight(1f)
                    .onFocusChanged { focused = it.isFocused }
                    .semantics { contentDescription = "Écrire un message" },
                singleLine = true,
                textStyle = TextStyle(
                    color = Color(0xFFE4E3EE), fontSize = 13.sp,
                    fontFamily = WaveMixerTheme.fontFamily
                ),
                cursorBrush = SolidColor(Color(0xFFB49AFF)),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = { if (canSend) onSend() }),
                decorationBox = { inner ->
                    Box {
                        if (draft.isEmpty()) {
                            Text(
                                "Écris un message…", color = Color(0xFF9794A6),
                                fontSize = 13.sp, fontFamily = WaveMixerTheme.fontFamily
                            )
                        }
                        inner()
                    }
                }
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
                WaveIcons.Envelope, "Envoyer",
                tint = WaveMixerTheme.capsuleAccentSoft.copy(alpha = if (canSend) 1f else .48f),
                modifier = Modifier.size(23.dp)
            )
        }
    }
}
