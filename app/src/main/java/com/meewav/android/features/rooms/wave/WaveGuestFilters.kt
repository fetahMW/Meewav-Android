package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

internal data class WaveGuestFilters(val roles: Set<String> = emptySet(), val grades: Set<Int> = emptySet(),
                                     val readiness: Set<String> = emptySet()) {
    val count get() = roles.size + grades.size + readiness.size
    fun matches(guest: WaveGuest): Boolean =
        (roles.isEmpty() || guest.roleKey() in roles) &&
        (grades.isEmpty() || guest.gradeLevel in grades) &&
        (readiness.isEmpty() || readiness.any { when(it) {
            "media-ready" -> guest.mic && guest.camera
            "stable" -> guest.latencyMs?.let { ms -> ms <= 80 } == true
            else -> guest.location in setOf(WaveGuestLocation.INVITED, WaveGuestLocation.BACKSTAGE)
        } })
}

// Explicit classification of this local demo roster; no inference from portrait filenames.
private fun WaveGuest.roleKey(): String = when (role) {
    "Rappeuse", "Chanteuse" -> "avatar_23"
    "Chanteur", "Rappeur" -> "avatar_24"
    "Productrice", "Producteur" -> "avatar_25"
    "Compositeur" -> "avatar_21"
    "Guitariste" -> "avatar_16"
    "Auteur" -> "avatar_29"
    else -> ""
}

private fun <T> Set<T>.toggle(value: T) = if (value in this) this - value else this + value

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaveGuestFilterSheet(state: WaveGuestState, participants: List<WaveGuest>, onDismiss: () -> Unit) {
    var draft by remember { mutableStateOf(state.filters) }
    var section by remember { mutableIntStateOf(0) }
    val resultCount = participants.count(draft::matches)
    ModalBottomSheet(onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF101114), contentColor = Color.White) {
        Column(Modifier.fillMaxWidth().fillMaxHeight(.85f).padding(horizontal = 16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Filtrer les invités", fontSize = 18.sp, modifier = Modifier.weight(1f))
                IconButton(onClick = onDismiss) { Icon(WaveIcons.Close, "Fermer les filtres") }
            }
            Text("${draft.count} filtres · données de démonstration", color = Color.White.copy(alpha = .45f), fontSize = 11.sp)
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("Styles d’avatar", "Badge MeeWav", "Prêt pour le live").forEachIndexed { index, title ->
                    Row(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).clickable { section = if (section == index) -1 else index }
                        .padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(title, fontSize = 13.sp, modifier = Modifier.weight(1f))
                        val count = when(index) { 0 -> draft.roles.size; 1 -> draft.grades.size; else -> draft.readiness.size }
                        Text(if (count == 0) "Tous" else "$count", fontSize = 11.sp, color = WaveMixerTheme.capsuleAccentSoft)
                        Spacer(Modifier.width(8.dp))
                        Text(if (section == index) "−" else "+", color = Color.White.copy(alpha = .6f))
                    }
                    if (section == index) when(index) {
                        0 -> waveGuestRoles.chunked(2).forEach { pair ->
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                pair.forEach { option ->
                                    FilterChoice(option.label, option.id in draft.roles, Modifier.weight(1f),
                                        onClick = { draft = draft.copy(roles = draft.roles.toggle(option.id)) }) {
                                        Image(painterResource(option.image), null, modifier = Modifier.size(38.dp))
                                    }
                                }
                                if (pair.size == 1) Spacer(Modifier.weight(1f))
                            }
                        }
                        1 -> listOf("Débutant", "Émergent", "Confirmé", "Élite", "Maître", "Légendaire").forEachIndexed { i, label ->
                            FilterChoice("Niveau ${i + 1} · $label", i + 1 in draft.grades,
                                onClick = { draft = draft.copy(grades = draft.grades.toggle(i + 1)) }) {}
                        }
                        else -> listOf("media-ready" to "Prêt à passer · Micro + caméra", "stable" to "Connexion stable · ≤ 80 ms",
                            "green-house" to "Green House · Déjà préparé").forEach { (id, label) ->
                            FilterChoice(label, id in draft.readiness,
                                onClick = { draft = draft.copy(readiness = draft.readiness.toggle(id)) }) {}
                        }
                    }
                }
            }
            Row(Modifier.fillMaxWidth().padding(vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = { draft = WaveGuestFilters() }) { Text("Tout effacer", color = Color.White.copy(alpha = .7f)) }
                Button(onClick = { state.filters = draft; state.selected = emptySet(); onDismiss() }, modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = WaveMixerTheme.capsuleAccent)) {
                    Text("Afficher $resultCount profils", fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
private fun FilterChoice(label: String, selected: Boolean, modifier: Modifier = Modifier,
                         onClick: () -> Unit, leading: @Composable () -> Unit) {
    Row(modifier.fillMaxWidth().heightIn(min = 52.dp).hifiBlackSurface(10.dp).clickable(onClick = onClick).padding(8.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        leading()
        Text(label, modifier = Modifier.weight(1f), fontSize = 11.sp,
            color = if (selected) WaveMixerTheme.capsuleAccentSoft else Color.White.copy(alpha = .75f))
        Checkbox(checked = selected, onCheckedChange = null, modifier = Modifier.size(20.dp),
            colors = CheckboxDefaults.colors(checkedColor = WaveMixerTheme.capsuleAccent))
    }
}
