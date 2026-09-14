package com.meewav.android.features.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
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
import com.meewav.android.R
import com.meewav.android.core.auth.SocialAuthProvider
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.distinctUntilChanged

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun AvatarSelection(state: AuthUiState, onProfile: (ProfileDraft) -> Unit, onContinue: () -> Unit,
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
    var confirming by remember { mutableStateOf(false) }
    val confirmation = remember { Animatable(0f) }
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
        AuthWindowPanel(Modifier.fillMaxWidth().padding(top = stageHeight - 14.dp).graphicsLayer {
                val pulse = confirmationPulse(confirmation.value)
                scaleX = 1f + .008f * pulse
                scaleY = 1f + .008f * pulse
            },
            panelHeight = panelHeight - stageHeight + 14.dp, compact = true,
            iosStageWindow = true, allowScroll = false) {
        OutlinedButton(onClick = { showPicker = true }, enabled = !state.busy && !confirming,
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
            colors = ButtonDefaults.outlinedButtonColors(containerColor = Color(0xFF09090B)),
            border = BorderStroke(.5.dp, Color(0xFF29262F)), shape = RoundedCornerShape(14.dp)) {
            Text(avatar.name, color = Color.White, modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold,
                maxLines = 2, lineHeight = 18.sp)
            Text("${selectedIndex + 1}/${entries.size}", color = Violet, fontSize = 12.sp)
            Icon(Icons.Outlined.ExpandMore, "Choisir un avatar", Modifier.padding(start = 6.dp).size(20.dp), tint = Violet)
        }
        Spacer(Modifier.height(10.dp))
        Text(avatar.description.lineSequence().take(2).joinToString("\n"), color = Muted, fontSize = 12.sp, lineHeight = 16.sp,
            textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis,
            modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(8.dp))
        HorizontalDivider(Modifier.align(Alignment.CenterHorizontally).width(120.dp), color = Color(0x22FFFFFF))
        Spacer(Modifier.height(8.dp))
        Text(if (state.profile.realArtist)
            "Tu crées ou travailles ta musique toi-même : chant, instruments, production, mixage, écriture ou composition."
            else "Choisis Créateur IA si tu crées principalement ta musique à l’aide de l’intelligence artificielle.",
            color = Muted, fontSize = 10.sp, lineHeight = 14.sp, textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        state.error?.let { Text(it, color = Color(0xFFFFBBC4), fontSize = 11.sp) }
        state.notice?.let { Text(it, color = Muted, fontSize = 11.sp) }
        Text("Type de profil", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
            modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
        Spacer(Modifier.height(4.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            listOf(false to "Créateur IA", true to "Artiste réel").forEach { (real, title) ->
                val chosen = state.profile.realArtist == real
                // Une surface fine dans une cible tactile de 48 dp.
                Box(Modifier.weight(1f).height(48.dp), contentAlignment = Alignment.Center) {
                FilterChip(chosen, { onProfile(state.profile.copy(realArtist = real)) },
                    enabled = !state.busy && !confirming, shape = RoundedCornerShape(12.dp),
                    label = { Text(title, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center,
                        fontSize = 12.sp, fontWeight = FontWeight.Medium) },
                    modifier = Modifier.fillMaxWidth().height(36.dp).drawBehind {
                        if (chosen) {
                            // Halo gradué limité au contour ; le fond du bouton reste opaque et noir.
                            for (spread in 2 downTo 1) {
                                val inset = spread.dp.toPx()
                                drawRoundRect(Violet.copy(alpha = .018f * (3 - spread)),
                                    topLeft = Offset(-inset, -inset),
                                    size = Size(size.width + inset * 2, size.height + inset * 2),
                                    cornerRadius = CornerRadius(12.dp.toPx() + inset),
                                    style = Stroke(1.dp.toPx()))
                            }
                        }
                    },
                    border = BorderStroke(if (chosen) .75.dp else .5.dp,
                        if (chosen) Violet.copy(alpha = .8f) else Color(0xFF373040)),
                    colors = FilterChipDefaults.filterChipColors(
                        containerColor = Color(0xFF08080B), labelColor = Muted,
                        selectedContainerColor = Color(0xFF08080B), selectedLabelColor = Color.White,
                        disabledContainerColor = Color(0xFF08080B), disabledSelectedContainerColor = Color(0xFF08080B)))
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        IosAuthDivider()
        Spacer(Modifier.height(10.dp))
        IosAuthAction("Suivant", state.busy || confirming) {
            if (!pager.isScrollInProgress && !confirming) {
                confirming = true
                scope.launch {
                    confirmation.animateTo(1f, tween(920, easing = LinearEasing))
                    delay(100)
                    onContinue()
                }
            }
        }
        // Le surplus d'espace reste sous l'action, sans étirer les blocs du formulaire.
        Spacer(Modifier.height(12.dp))
        }
        IosAvatarStage(pager, Modifier.fillMaxWidth().height(stageHeight + AuthStageOverlap),
            enabled = !state.busy && !showPicker && !confirming, confirmation = { confirmation.value })
    }
    if (showPicker) {
        val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        val grid = rememberLazyGridState(initialFirstVisibleItemIndex = selectedIndex)
        ModalBottomSheet(onDismissRequest = { showPicker = false }, sheetState = sheet,
            containerColor = Color(0xFF0C0A12), contentColor = Color.White,
            scrimColor = Color.Black.copy(alpha = .7f), tonalElevation = 0.dp,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)) {
            Column(Modifier.fillMaxWidth().fillMaxHeight(.85f).padding(horizontal = 20.dp)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Choisis ton avatar", fontSize = 21.sp, fontWeight = FontWeight.Bold)
                        Text("${entries.size} façons de représenter ton rôle", color = Muted, fontSize = 12.sp)
                    }
                    IconButton(onClick = { showPicker = false }) {
                        Icon(Icons.Outlined.Close, "Fermer", tint = Muted)
                    }
                }
                Spacer(Modifier.height(16.dp))
                IosAuthDivider()
                LazyVerticalGrid(columns = GridCells.Fixed(3), state = grid, modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(top = 18.dp, bottom = 24.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(entries, key = { it.icon }) { item ->
                        val isSelected = item.icon == avatar.icon
                        Box(Modifier.clip(RoundedCornerShape(18.dp))
                            .background(Brush.verticalGradient(listOf(Color(0xFF17121F), Color(0xFF08080B))))
                            .border(if (isSelected) 1.dp else .5.dp,
                                if (isSelected) Violet else Color(0xFF302A3C), RoundedCornerShape(18.dp))
                            .semantics { selected = isSelected }
                            .clickable(role = Role.RadioButton) {
                                scope.launch {
                                    pager.scrollToPage(pager.settledPage + entries.indexOf(item) - selectedIndex)
                                    sheet.hide()
                                    showPicker = false
                                }
                            }.padding(8.dp)) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Image(painterResource(item.image), null, Modifier.fillMaxWidth().height(92.dp), contentScale = ContentScale.Fit)
                                Spacer(Modifier.height(8.dp))
                                Text(item.name, fontSize = 11.sp, lineHeight = 15.sp, minLines = 2, maxLines = 2,
                                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                    overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
                            }
                            if (isSelected) Icon(Icons.Outlined.CheckCircle, null,
                                Modifier.align(Alignment.TopEnd).size(18.dp), tint = Violet)
                        }
                    }
                }
            }
        }
    }
}

@Composable
internal fun AccountHeader(profile: ProfileDraft) {
    val avatar = AvatarCatalog.find(profile.avatarIcon)
    Row(Modifier.fillMaxWidth().padding(bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
        Image(painterResource(avatar.image), avatar.name, Modifier.size(42.dp, 48.dp), contentScale = ContentScale.Fit)
        Spacer(Modifier.width(8.dp))
        Text("Ton compte Meewav", fontSize = 19.sp, lineHeight = 23.sp,
            fontWeight = FontWeight.SemiBold, color = Color.White,
            modifier = Modifier.weight(1f, fill = false).semantics { heading() })
    }
}

@Composable
internal fun AccountSocialOptions(state: AuthUiState, onContinue: (SocialAuthProvider) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf(SocialAuthProvider.Apple, SocialAuthProvider.Google).forEach { provider ->
            OutlinedButton(onClick = { onContinue(provider) },
                enabled = !state.busy && !state.initializing && !state.localPreview,
                modifier = Modifier.weight(1f).height(48.dp), shape = RoundedCornerShape(14.dp),
                border = BorderStroke(.75.dp, Violet.copy(alpha = .7f)),
                colors = ButtonDefaults.outlinedButtonColors(containerColor = Color(0xFF08080B), contentColor = Color.White),
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)) {
                Image(painterResource(if (provider == SocialAuthProvider.Apple) R.drawable.auth_apple else R.drawable.auth_google_round),
                    null, Modifier.size(24.dp))
                Spacer(Modifier.width(6.dp))
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Continuer avec", fontSize = 10.sp, lineHeight = 13.sp, maxLines = 1)
                    Text(if (provider == SocialAuthProvider.Apple) "Apple" else "Google",
                        fontSize = 12.sp, lineHeight = 15.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
    Row(Modifier.fillMaxWidth().height(26.dp), verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        HorizontalDivider(Modifier.weight(1f), thickness = .5.dp, color = Color(0x665C4B79))
        Text("ou", fontSize = 11.sp, color = Muted)
        HorizontalDivider(Modifier.weight(1f), thickness = .5.dp, color = Color(0x665C4B79))
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
