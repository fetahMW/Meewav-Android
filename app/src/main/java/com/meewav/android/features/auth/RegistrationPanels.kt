package com.meewav.android.features.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PageSize
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import com.meewav.android.core.design.Muted
import com.meewav.android.core.design.Violet
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.distinctUntilChanged

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun AvatarSelection(state: AuthUiState, onProfile: (ProfileDraft) -> Unit, onContinue: () -> Unit,
                            onBack: () -> Unit,
                            panelHeight: Dp = 600.dp, modifier: Modifier = Modifier) {
    val entries = AvatarCatalog.profiles
    // Rail circulaire comme SaturnCarouselView ; la sélection backend reste l'un des 28 identifiants.
    val middlePage = Int.MAX_VALUE / 2 - (Int.MAX_VALUE / 2) % entries.size
    val pager = rememberPagerState(initialPage = middlePage +
        entries.indexOfFirst { it.icon == state.profile.avatarIcon }.coerceAtLeast(0)) { Int.MAX_VALUE }
    val currentProfile by rememberUpdatedState(state.profile)
    val changeProfile by rememberUpdatedState(onProfile)
    val scope = rememberCoroutineScope()
    var showPicker by rememberSaveable { mutableStateOf(false) }
    var pickerPage by rememberSaveable { mutableIntStateOf(0) }
    LaunchedEffect(pager) {
        snapshotFlow { pager.settledPage }.distinctUntilChanged().collect { index ->
            changeProfile(currentProfile.copy(avatarIcon = entries[index % entries.size].icon))
        }
    }
    val selectedIndex = pager.settledPage % entries.size
    val avatar = entries[selectedIndex]
    val stageHeight = authStageHeight(panelHeight)
    // Enveloppe fixe : le plateau est extérieur à la vitre, pas dans le formulaire.
    Box(modifier.height(panelHeight)) {
        AuthWindowPanel(Modifier.fillMaxWidth().padding(top = stageHeight - 14.dp),
            panelHeight = panelHeight - stageHeight + 14.dp, compact = true,
            iosStageWindow = true, allowScroll = false,
            footer = {
                IosAuthDivider()
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    OutlinedButton(onClick = onBack, enabled = !state.busy,
                        modifier = Modifier.weight(1f).height(48.dp), shape = RoundedCornerShape(15.dp),
                        border = BorderStroke(1.dp, Color(0xFF554079))) {
                        Text("Retour", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                    Box(Modifier.weight(1f)) {
                        IosAuthAction("Suivant", state.busy) {
                            if (!pager.isScrollInProgress) onContinue()
                        }
                    }
                }
            }) {
        OutlinedButton(onClick = { pickerPage = selectedIndex / 6; showPicker = true }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
            colors = ButtonDefaults.outlinedButtonColors(containerColor = Color(0xFF09090B)),
            border = BorderStroke(.5.dp, Color(0xFF29262F)), shape = RoundedCornerShape(14.dp)) {
            Text(avatar.name, color = Color.White, modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold)
            Text("${selectedIndex + 1}/${entries.size}", color = Violet, fontSize = 12.sp)
            Icon(Icons.Outlined.ExpandMore, "Choisir un avatar", Modifier.padding(start = 6.dp).size(20.dp), tint = Violet)
        }
        Spacer(Modifier.height(12.dp))
        Text(avatar.description.lineSequence().take(2).joinToString("\n"), color = Muted, fontSize = 12.sp, lineHeight = 17.sp,
            textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis,
            modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.weight(.5f))
        HorizontalDivider(Modifier.align(Alignment.CenterHorizontally).width(120.dp), color = Color(0x22FFFFFF))
        Spacer(Modifier.height(12.dp))
        Text(if (state.profile.realArtist)
            "Choisis Artiste réel si tu crées ou travailles ta musique toi-même : chant, rap, instruments, production, mixage, écriture, composition, etc."
            else "Choisis Créateur IA si tu crées principalement ta musique à l’aide de l’intelligence artificielle.",
            color = Muted, fontSize = 10.sp, lineHeight = 15.sp, textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.weight(1f))
        state.error?.let { Text(it, color = Color(0xFFFFBBC4), fontSize = 11.sp) }
        state.notice?.let { Text(it, color = Muted, fontSize = 11.sp) }
        Text("Type de profil", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
            modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
        Spacer(Modifier.height(6.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            listOf(false to "Créateur IA", true to "Artiste réel").forEach { (real, title) ->
                FilterChip(state.profile.realArtist == real, { onProfile(state.profile.copy(realArtist = real)) },
                    label = { Text(title, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
                    modifier = Modifier.weight(1f).heightIn(min = 48.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        containerColor = Color(0xFF111016), labelColor = Muted,
                        selectedContainerColor = Color(0xFF291B40), selectedLabelColor = Color.White))
            }
        }
        }
        IosAvatarStage(pager, Modifier.fillMaxWidth().height(stageHeight), enabled = !state.busy && !showPicker)
    }
    if (showPicker) {
        // Un sélecteur fixe et paginé : ni panneau glissant, ni liste verticale.
        val pageCount = (entries.size + 5) / 6
        AlertDialog(onDismissRequest = { showPicker = false }, containerColor = Color(0xFF101014),
            title = { Text("Choisis ton avatar", style = MaterialTheme.typography.titleMedium) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    repeat(2) { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            repeat(3) { column ->
                                val item = entries.getOrNull(pickerPage * 6 + row * 3 + column)
                                if (item == null) Spacer(Modifier.weight(1f))
                                else {
                                    val isSelected = item.icon == avatar.icon
                                    Column(Modifier.weight(1f).clip(RoundedCornerShape(12.dp))
                                        .background(if (isSelected) Color(0xFF281B3D) else Color(0xFF19171F))
                                        .border(1.dp, if (isSelected) Violet else Color(0xFF302B38), RoundedCornerShape(12.dp))
                                        .semantics { selected = isSelected }
                                        .clickable(role = Role.RadioButton) {
                                            showPicker = false
                                            scope.launch {
                                                val delta = entries.indexOf(item) - selectedIndex
                                                pager.scrollToPage(pager.settledPage + delta)
                                            }
                                        }.padding(6.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Image(painterResource(item.image), null, Modifier.fillMaxWidth().height(72.dp), contentScale = ContentScale.Fit)
                                        Text(item.name, fontSize = 10.sp, lineHeight = 13.sp,
                                            minLines = 2, maxLines = 2, overflow = TextOverflow.Ellipsis,
                                            textAlign = TextAlign.Center)
                                    }
                                }
                            }
                        }
                    }
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween) {
                        IconButton(onClick = { pickerPage-- }, enabled = pickerPage > 0) {
                            Icon(Icons.Outlined.ChevronLeft, "Page précédente")
                        }
                        Text("${pickerPage + 1} / $pageCount", color = Muted, fontSize = 12.sp)
                        IconButton(onClick = { pickerPage++ }, enabled = pickerPage < pageCount - 1) {
                            Icon(Icons.Outlined.ChevronRight, "Page suivante")
                        }
                    }
                }
            }, confirmButton = { TextButton(onClick = { showPicker = false }) { Text("Fermer") } })
    }
}

@Composable
internal fun AccountAvatar(profile: ProfileDraft) {
    val avatar = AvatarCatalog.find(profile.avatarIcon)
    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.BottomCenter) {
        // L'outline du champ commence 8 dp après son bord de mise en page.
        Image(painterResource(avatar.image), avatar.name,
            Modifier.size(width = 96.dp, height = 64.dp).offset(y = 8.dp),
            alignment = Alignment.BottomCenter, contentScale = ContentScale.Fit)
    }
}

@Composable
internal fun LocationRegistration(state: AuthUiState, onProfile: (ProfileDraft) -> Unit, onSubmit: () -> Unit) {
    var showTerms by rememberSaveable { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        AuthField("Ville", state.profile.city, { onProfile(state.profile.copy(city = it)) }, Icons.Outlined.LocationCity, enabled = !state.busy)
        AuthField("Code postal (facultatif)", state.profile.postalCode,
            { onProfile(state.profile.copy(postalCode = it)) }, Icons.Outlined.PinDrop, enabled = !state.busy)
        AuthField("Pays", state.profile.country, { onProfile(state.profile.copy(country = it)) },
            Icons.Outlined.Public, enabled = !state.busy, ime = ImeAction.Done)
        Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF19151F)).padding(12.dp),
            verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.Lock, null, Modifier.size(19.dp), tint = Violet)
            Text("Ton profil reste invisible par défaut. Tu choisiras quand apparaître aux autres.",
                modifier = Modifier.padding(start = 10.dp), color = Muted, fontSize = 12.sp, lineHeight = 18.sp)
        }
        Row(Modifier.fillMaxWidth().toggleable(state.profile.acceptsTerms, enabled = !state.busy,
            role = Role.Checkbox, onValueChange = { onProfile(state.profile.copy(acceptsTerms = it)) }),
            verticalAlignment = Alignment.CenterVertically) {
            Checkbox(state.profile.acceptsTerms, onCheckedChange = null,
                modifier = Modifier.padding(12.dp), enabled = !state.busy)
            Text("J’accepte les conditions de la version de test.", fontSize = 12.sp, color = Muted,
                modifier = Modifier.weight(1f).padding(vertical = 12.dp))
        }
        TextButton(onClick = { showTerms = true }, modifier = Modifier.fillMaxWidth()) {
            Text("Lire les conditions", color = Violet)
        }
        PrimaryAction(if (state.localPreview) "Terminer l’aperçu" else "Créer mon compte", state.busy, onSubmit)
    }
    if (showTerms) {
        AlertDialog(onDismissRequest = { showTerms = false }, containerColor = Color(0xFF15121C),
            title = { Text("Conditions · version de test") },
            text = {
                Column(Modifier.heightIn(max = 380.dp).verticalScroll(rememberScrollState())) {
                    Text("Texte de démonstration repris de l’application iOS. Les conditions publiques restent à valider.",
                        color = Violet, fontSize = 12.sp)
                    Spacer(Modifier.height(16.dp))
                    Text(PreviewTerms, fontSize = 13.sp, lineHeight = 20.sp)
                }
            }, confirmButton = { TextButton(onClick = { showTerms = false }) { Text("Fermer") } })
    }
}
