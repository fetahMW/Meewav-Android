package com.meewav.android.features.auth

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.CancellationSignal
import android.os.Looper
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.core.design.Muted
import com.meewav.android.core.design.Violet
import kotlinx.coroutines.*
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun LocationRegistration(state: AuthUiState, onProfile: (ProfileDraft) -> Unit) {
    val context = LocalContext.current
    val repository = remember { MusicScenes(context.applicationContext.assets) }
    val scope = rememberCoroutineScope()
    val latestProfile by rememberUpdatedState(state.profile)
    val changeProfile by rememberUpdatedState(onProfile)
    var cities by remember { mutableStateOf<List<MusicCity>>(emptyList()) }
    var scenes by remember { mutableStateOf<List<MusicScene>>(emptyList()) }
    var loadingCities by remember { mutableStateOf(true) }
    var loadingScenes by remember { mutableStateOf(false) }
    var locating by remember { mutableStateOf(false) }
    var automaticScene by remember { mutableStateOf(true) }
    var message by remember { mutableStateOf<String?>(null) }
    var picker by rememberSaveable { mutableStateOf<String?>(null) }
    var query by rememberSaveable { mutableStateOf("") }
    val selectedCity = cities.firstOrNull { it.communeCode == state.profile.communeCode }
    val searchIndex by produceState<MusicCitySearch?>(null, cities) {
        value = withContext(Dispatchers.Default) { MusicCitySearch(cities) }
    }
    LaunchedEffect(repository) {
        try { cities = repository.cities() }
        catch (cancelled: CancellationException) { throw cancelled }
        catch (_: Exception) { message = "Le répertoire des scènes est momentanément indisponible." }
        finally { loadingCities = false }
    }
    LaunchedEffect(selectedCity?.communeCode) {
        scenes = emptyList()
        selectedCity?.let { city ->
            loadingScenes = true
            try {
                scenes = repository.scenes(city)
                if (scenes.size == 1 && latestProfile.musicScene == null && automaticScene)
                    changeProfile(latestProfile.copy(musicScene = scenes.single()))
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (_: Exception) { message = "Impossible de charger les quartiers de cette commune." }
            finally { loadingScenes = false }
        }
    }
    val findNearby: () -> Unit = {
        if (!locating) scope.launch {
            locating = true; message = null
            try {
                val position = currentSceneLocation(context)
                val result = repository.locate(position.longitude, position.latitude)
                if (result == null) message = "Aucune scène trouvée ici. Choisis une commune dans le répertoire."
                else {
                    val (city, scene) = result
                    val preciseEnough = position.hasAccuracy() && position.accuracy <= 250f
                    automaticScene = preciseEnough
                    changeProfile(latestProfile.copy(city = city.label, communeCode = city.communeCode,
                        country = "France", postalCode = "", musicScene = if (preciseEnough) scene else null))
                    message = if (preciseEnough) "Ta scène ${scene.label} a été trouvée."
                        else "Position approximative : vérifie la commune et choisis ton quartier."
                }
            } catch (_: TimeoutCancellationException) { message = "Position indisponible. Choisis simplement une commune et un quartier." }
            catch (cancelled: CancellationException) { throw cancelled }
            catch (_: Exception) { message = "Position indisponible. Choisis simplement une commune et un quartier." }
            finally { locating = false }
        }
        Unit
    }
    val permissions = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
        if (grants.values.any { it }) findNearby()
        else message = "Position non partagée. Choisis simplement une commune et un quartier."
    }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedButton(onClick = {
            if (context.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) findNearby()
            else permissions.launch(arrayOf(Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION))
        }, enabled = !state.busy && !locating && !loadingCities,
            modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp), shape = RoundedCornerShape(14.dp),
            border = BorderStroke(.75.dp, Violet), colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)) {
            if (locating) CircularProgressIndicator(Modifier.size(18.dp), color = Violet, strokeWidth = 2.dp)
            else Icon(Icons.Outlined.MyLocation, null, Modifier.size(18.dp), tint = Violet)
            Spacer(Modifier.width(8.dp))
            Text(if (locating) "Recherche de ta scène…" else "Trouver ma scène autour de moi", fontSize = 12.sp)
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            HorizontalDivider(Modifier.weight(1f), color = Color(0x335137A1))
            Text("ou choisir ton quartier", fontSize = 10.sp, color = Muted)
            HorizontalDivider(Modifier.weight(1f), color = Color(0x335137A1))
        }
        message?.let { Text(it, color = Muted, fontSize = 11.sp, lineHeight = 15.sp) }
        ScenePickerButton(selectedCity?.label ?: if (loadingCities) "Chargement des communes…" else "Ville ou commune",
            Icons.Outlined.Search, !state.busy && !locating && !loadingCities && cities.isNotEmpty()) { query = ""; picker = "city" }
        ScenePickerButton(state.profile.musicScene?.label ?: if (loadingScenes) "Chargement des quartiers…" else "Quartier / scène musicale",
            Icons.Outlined.MusicNote, !state.busy && !locating && selectedCity != null && !loadingScenes) { query = ""; picker = "scene" }
        Row(Modifier.fillMaxWidth().background(Color(0xFF191225), RoundedCornerShape(14.dp)).padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(if (state.profile.musicScene != null) Icons.Outlined.MusicNote else Icons.Outlined.Shield,
                null, tint = Violet, modifier = Modifier.size(20.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(if (state.profile.musicScene != null) "Ta scène musicale" else "Localisation respectueuse", color = Muted, fontSize = 10.sp)
                Text(state.profile.musicScene?.label ?: "Aucune adresse précise demandée", color = Color.White,
                    fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                Text(if (state.profile.musicScene != null) "${state.profile.city} · découvertes, rooms et battles locales"
                    else "Ton profil rejoint un quartier musical, jamais une adresse.", color = Muted, fontSize = 10.sp, lineHeight = 14.sp)
            }
        }
        Column {
            Text("Visibilité sur la scène", color = Muted, fontSize = 10.sp)
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.PersonOutline, null, tint = Violet, modifier = Modifier.size(20.dp))
                Column(Modifier.weight(1f).padding(horizontal = 8.dp)) {
                    Text("Afficher mon avatar", color = Color.White, fontSize = 12.sp)
                    Text("Ton adresse n’est jamais affichée.", color = Muted, fontSize = 10.sp)
                }
                Switch(state.profile.visibleOnScene, { onProfile(state.profile.copy(visibleOnScene = it)) }, enabled = !state.busy,
                    colors = SwitchDefaults.colors(checkedTrackColor = Color(0xFF5137A1)))
            }
        }
    }
    if (picker != null) {
        val results by produceState<List<MusicCity>>(emptyList(), query, searchIndex) {
            value = withContext(Dispatchers.Default) { searchIndex?.find(query).orEmpty() }
        }
        val sceneResults = remember(query, scenes) { scenes.filter { normalizedSceneQuery(query) in normalizedSceneQuery(it.label) } }
        ModalBottomSheet(onDismissRequest = { picker = null }, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = Color(0xFF0C0A12), contentColor = Color.White) {
            Column(Modifier.fillMaxWidth().fillMaxHeight(.85f).imePadding().padding(horizontal = 20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(if (picker == "city") "Ville ou commune" else "Quartier musical", fontSize = 20.sp,
                        fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                    IconButton(onClick = { picker = null }) { Icon(Icons.Outlined.Close, "Fermer") }
                }
                OutlinedTextField(query, { query = it }, singleLine = true, modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text(if (picker == "city") "Nom, code postal ou commune" else "Rechercher un quartier", fontSize = 12.sp) },
                    leadingIcon = { Icon(Icons.Outlined.Search, null) }, shape = RoundedCornerShape(14.dp))
                Spacer(Modifier.height(8.dp))
                LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(bottom = 24.dp)) {
                    if (picker == "city") {
                        items(results, key = { it.communeCode }) { city ->
                            SceneResult(city.label, city.subtitle.ifBlank { "Département ${city.departmentCode}" }) {
                                automaticScene = true
                                onProfile(state.profile.copy(city = city.label, communeCode = city.communeCode, musicScene = null,
                                    country = "France", postalCode = ""))
                                picker = null; message = null
                            }
                        }
                        if (results.isEmpty()) item { Text("Aucune commune trouvée.", Modifier.padding(vertical = 20.dp), color = Muted) }
                    } else {
                        items(sceneResults, key = { it.zoneId }) { scene ->
                            SceneResult(scene.label, scene.communeName) { onProfile(state.profile.copy(musicScene = scene)); picker = null; message = null }
                        }
                        if (sceneResults.isEmpty()) item { Text("Aucun quartier trouvé.", Modifier.padding(vertical = 20.dp), color = Muted) }
                    }
                }
            }
        }
    }
}

@Composable private fun ScenePickerButton(label: String, icon: ImageVector, enabled: Boolean, onClick: () -> Unit) {
    OutlinedButton(onClick, enabled = enabled, modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp),
        shape = RoundedCornerShape(14.dp), border = BorderStroke(.75.dp, Color(0xFF514060)),
        colors = ButtonDefaults.outlinedButtonColors(containerColor = Color(0xFF0E0D15), contentColor = Color.White)) {
        Icon(icon, null, Modifier.size(18.dp), tint = Violet)
        Text(label, Modifier.weight(1f).padding(horizontal = 10.dp), fontSize = 12.sp)
        Icon(Icons.Outlined.ExpandMore, null, Modifier.size(18.dp))
    }
}

@Composable private fun SceneResult(label: String, subtitle: String, onClick: () -> Unit) {
    Column(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(vertical = 14.dp)) {
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        Text(subtitle, fontSize = 11.sp, color = Muted)
    }
    HorizontalDivider(color = Color(0x225137A1))
}

/** Position éphémère : seule la scène canonique est copiée dans le brouillon. */
@Suppress("MissingPermission")
private suspend fun currentSceneLocation(context: Context): Location = withTimeout(15000) {
    suspendCancellableCoroutine { continuation ->
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val fine = context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val provider = when {
            manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
            fine && manager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
            else -> { continuation.resumeWithException(IllegalStateException("Position indisponible")); return@suspendCancellableCoroutine }
        }
        if (Build.VERSION.SDK_INT >= 30) {
            val signal = CancellationSignal()
            continuation.invokeOnCancellation { signal.cancel() }
            manager.getCurrentLocation(provider, signal, context.mainExecutor) { location ->
                if (continuation.isActive) {
                    if (location != null) continuation.resume(location)
                    else continuation.resumeWithException(IllegalStateException("Position indisponible"))
                }
            }
        } else {
            val listener = object : LocationListener {
                override fun onLocationChanged(location: Location) { manager.removeUpdates(this); if (continuation.isActive) continuation.resume(location) }
                override fun onProviderEnabled(provider: String) = Unit
                override fun onProviderDisabled(provider: String) = Unit
                @Deprecated("Android legacy callback")
                override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) = Unit
            }
            continuation.invokeOnCancellation { manager.removeUpdates(listener) }
            manager.requestSingleUpdate(provider, listener, Looper.getMainLooper())
        }
    }
}
