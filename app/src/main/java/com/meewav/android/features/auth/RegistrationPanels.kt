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
                            stageHeight: Dp = 160.dp) {
    val entries = AvatarCatalog.profiles
    val pager = rememberPagerState(initialPage = entries.indexOfFirst { it.icon == state.profile.avatarIcon }) { entries.size }
    val currentProfile by rememberUpdatedState(state.profile)
    val changeProfile by rememberUpdatedState(onProfile)
    val scope = rememberCoroutineScope()
    var showPicker by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(pager) {
        snapshotFlow { pager.settledPage }.distinctUntilChanged().collect { index ->
            changeProfile(currentProfile.copy(avatarIcon = entries[index].icon))
        }
    }
    val avatar = entries[pager.settledPage]
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        OutlinedButton(onClick = { showPicker = true }, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
            border = BorderStroke(1.dp, Color(0xFF463557)), shape = RoundedCornerShape(14.dp)) {
            Text(avatar.name, color = Color.White, modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold)
            Text("${pager.settledPage + 1}/${entries.size}", color = Violet, fontSize = 12.sp)
            Icon(Icons.Outlined.ExpandMore, "Choisir un avatar", Modifier.padding(start = 6.dp).size(20.dp), tint = Violet)
        }
        BoxWithConstraints(Modifier.fillMaxWidth().height(stageHeight).clipToBounds()) {
            val pageWidth = maxWidth * .56f
            val avatarHeight = maxHeight - 12.dp
            val pedestalWidth = (pageWidth * .72f).coerceAtMost(112.dp)
            Canvas(Modifier.align(Alignment.BottomCenter).width(pedestalWidth).height(22.dp)) {
                drawOval(Brush.radialGradient(listOf(Color(0xFF47306F), Color(0xFF15101F))))
                drawOval(Color(0xFF8251D0), style = Stroke(.8.dp.toPx()))
                drawOval(Color(0x404F347C), Offset(4.dp.toPx(), 3.dp.toPx()),
                    Size(size.width - 8.dp.toPx(), size.height - 6.dp.toPx()), style = Stroke(.6.dp.toPx()))
            }
            HorizontalPager(pager, pageSize = PageSize.Fixed(pageWidth),
                contentPadding = PaddingValues(horizontal = (maxWidth - pageWidth) / 2),
                modifier = Modifier.fillMaxSize()) { index ->
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
                    // All avatars remain fully opaque, including the lateral previews.
                    Image(painterResource(entries[index].image), entries[index].name,
                        Modifier.padding(bottom = 8.dp).width(pageWidth * .85f)
                            .height(if (index == pager.currentPage) avatarHeight else avatarHeight * .78f),
                        contentScale = ContentScale.Fit)
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(avatar.description, color = Muted, fontSize = 12.sp, lineHeight = 17.sp, textAlign = TextAlign.Center)
        Spacer(Modifier.height(10.dp))
        Text("TYPE DE PROFIL", color = Muted, fontSize = 10.sp, letterSpacing = 1.6.sp)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            listOf(true to "Artiste réel", false to "Créateur IA").forEach { (real, title) ->
                FilterChip(state.profile.realArtist == real, { onProfile(state.profile.copy(realArtist = real)) },
                    label = { Text(title, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
                    modifier = Modifier.weight(1f).heightIn(min = 48.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        containerColor = Color(0xFF111016), labelColor = Muted,
                        selectedContainerColor = Color(0xFF291B40), selectedLabelColor = Color.White))
            }
        }
        Text(if (state.profile.realArtist) "Tu crées ou travailles ta musique toi-même."
            else "Tu crées principalement à l’aide de l’IA.",
            color = Muted, fontSize = 11.sp, textAlign = TextAlign.Center)
        Spacer(Modifier.height(12.dp))
        PrimaryAction("Suivant", busy = state.busy) {
            if (!pager.isScrollInProgress) onContinue()
        }
    }
    if (showPicker) {
        ModalBottomSheet(onDismissRequest = { showPicker = false }, containerColor = Color(0xFF101014)) {
            Text("Choisis ton avatar", style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(horizontal = 22.dp, vertical = 8.dp))
            LazyVerticalGrid(GridCells.Adaptive(100.dp), modifier = Modifier.fillMaxWidth().heightIn(max = 440.dp),
                contentPadding = PaddingValues(16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(entries, key = { it.icon }) { item ->
                    val isSelected = item.icon == avatar.icon
                    Column(Modifier.clip(RoundedCornerShape(14.dp))
                        .background(if (isSelected) Color(0xFF281B3D) else Color(0xFF19171F))
                        .border(1.dp, if (isSelected) Violet else Color(0xFF302B38), RoundedCornerShape(14.dp))
                        .semantics { selected = isSelected }
                        .clickable(role = Role.RadioButton) {
                            showPicker = false
                            scope.launch { pager.scrollToPage(entries.indexOf(item)) }
                        }.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Image(painterResource(item.image), null, Modifier.size(84.dp), contentScale = ContentScale.Fit)
                        Text(item.name, fontSize = 11.sp, textAlign = TextAlign.Center, lineHeight = 15.sp)
                    }
                }
            }
        }
    }
}

@Composable
internal fun SelectedAvatar(profile: ProfileDraft, onEdit: () -> Unit) {
    val avatar = AvatarCatalog.find(profile.avatarIcon)
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Color(0xFF1B1623))
        .clickable(onClick = onEdit, role = Role.Button).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Image(painterResource(avatar.image), null, Modifier.size(52.dp), contentScale = ContentScale.Fit)
        Column(Modifier.weight(1f).padding(horizontal = 10.dp)) {
            Text(avatar.name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Text(if (profile.realArtist) "Artiste réel" else "Créateur IA", color = Muted, fontSize = 12.sp)
        }
        Icon(Icons.Outlined.Edit, "Modifier mon avatar", Modifier.size(18.dp), tint = Violet)
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
