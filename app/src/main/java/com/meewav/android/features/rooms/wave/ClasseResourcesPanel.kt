package com.meewav.android.features.rooms.wave

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.provider.OpenableColumns
import android.widget.MediaController
import android.widget.VideoView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
internal fun ClasseResourcesPanel(state: ClasseToolsState, modifier: Modifier) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    var add by remember { mutableStateOf(false) }
    var link by remember { mutableStateOf(false) }
    var preview by remember { mutableStateOf<ClasseResource?>(null) }
    var remove by remember { mutableStateOf<ClasseResource?>(null) }
    var export by remember { mutableStateOf<ClasseResource?>(null) }
    val saveFile = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/octet-stream")) { target ->
        val resource = export; export = null
        if (target != null && resource != null) scope.launch {
            busy = true
            val error = withContext(Dispatchers.IO) { runCatching {
                context.contentResolver.openInputStream(Uri.parse(resource.uri))?.use { input ->
                    context.contentResolver.openOutputStream(target)?.use { output -> input.copyTo(output) } ?: error("Destination indisponible")
                } ?: error("Fichier indisponible")
            }.exceptionOrNull() }
            busy = false; state.notice = if (error == null) "Ressource enregistrée." else "Impossible d’enregistrer cette ressource."
        }
    }
    val importFiles = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        if (uris.isNotEmpty()) scope.launch {
            busy = true
            val result = withContext(Dispatchers.IO) { uris.take(24).map { uri -> runCatching {
                context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
                val mime = context.contentResolver.getType(uri) ?: "application/octet-stream"
                require(mime.startsWith("image/") || mime.startsWith("video/") || mime == "application/pdf")
                val name = context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor -> if (cursor.moveToFirst()) cursor.getString(0) else null } ?: "Ressource"
                ClasseResource(title = name, uri = uri.toString(), mime = mime)
            } } }
            state.addResources(result.mapNotNull { it.getOrNull() }); busy = false
            if (result.any { it.isFailure }) state.notice = "Certaines ressources n’ont pas pu être importées. Choisis des images, vidéos ou PDF accessibles."
        }
    }
    fun open(resource: ClasseResource) {
        if (resource.mime == "text/uri-list") {
            runCatching { val uri = Uri.parse(resource.uri); require(uri.scheme in listOf("https", "http") && !uri.host.isNullOrBlank()); context.startActivity(Intent(Intent.ACTION_VIEW, uri)) }
                .onFailure { state.notice = "Impossible d’ouvrir ce lien." }
        } else preview = resource
    }
    Column(modifier.fillMaxWidth()) {
        Row(Modifier.height(44.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("${state.resources.size} ressources", color = Color(0xFFA7A3B2), fontSize = 11.sp, modifier = Modifier.weight(1f))
            if (busy) CircularProgressIndicator(Modifier.size(18.dp), color = WaveMixerTheme.capsuleAccentSoft, strokeWidth = 2.dp)
            TextButton(onClick = { add = true }, enabled = !busy) { Icon(WaveIcons.Add, null, Modifier.size(16.dp)); Text(" Ajouter", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 12.sp) }
        }
        if (state.resources.isEmpty()) Column(Modifier.fillMaxWidth().weight(1f), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Filled.FolderOpen, null, tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(36.dp))
            Text("Les supports de la classe", color = Color.White, fontSize = 15.sp, modifier = Modifier.padding(top = 12.dp))
            Text("Photos, vidéos, PDF et liens", color = Color(0xFFA7A3B2), fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
            TextButton(onClick = { add = true }, enabled = !busy) { Text("Ajouter une ressource", color = WaveMixerTheme.capsuleAccentSoft) }
        } else LazyVerticalGrid(columns = GridCells.Fixed(3), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 12.dp)) {
            items(state.resources, key = { it.id }) { resource ->
                val visual = resource.mime.startsWith("image/") || resource.mime.startsWith("video/")
                var menu by remember { mutableStateOf(false) }
                Column(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(6.dp)) {
                    Box(Modifier.fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(8.dp)).clickable { open(resource) }, contentAlignment = Alignment.Center) {
                        if (resource.mime.startsWith("image/")) ClasseImage(resource.uri, Modifier.fillMaxSize(), crop = true)
                        else Icon(if (resource.mime.startsWith("video/")) WaveIcons.Play else if (resource.mime == "text/uri-list") Icons.Filled.Link else Icons.Filled.PictureAsPdf, "Ouvrir ${resource.title}", tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(if (visual) 36.dp else 30.dp))
                    }
                    Text(resource.title, color = Color.White, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 6.dp).clickable { open(resource) })
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(if (resource.mime == "text/uri-list") "Lien" else resource.mime.substringAfter('/').uppercase(), fontSize = 8.sp, color = Color(0xFFA7A3B2), modifier = Modifier.weight(1f), maxLines = 1)
                        Box {
                            IconButton(onClick = { menu = true }, modifier = Modifier.size(36.dp)) { Icon(WaveIcons.More, "Actions de la ressource", tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(18.dp)) }
                            DropdownMenu(menu, { menu = false }, containerColor = Color(0xFF16151C)) {
                                DropdownMenuItem(text = { Text("Ouvrir", color = Color.White) }, onClick = { menu = false; open(resource) })
                                if (resource.mime != "text/uri-list") DropdownMenuItem(text = { Text("Enregistrer une copie", color = Color.White) }, onClick = { menu = false; export = resource; saveFile.launch(resource.title) })
                                DropdownMenuItem(text = { Text("Partager", color = Color.White) }, onClick = {
                                    menu = false
                                    runCatching {
                                        val intent = Intent(Intent.ACTION_SEND).apply {
                                            if (resource.mime == "text/uri-list") { type = "text/plain"; putExtra(Intent.EXTRA_TEXT, resource.uri) }
                                            else { type = resource.mime; putExtra(Intent.EXTRA_STREAM, Uri.parse(resource.uri)); addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION) }
                                        }
                                        context.startActivity(Intent.createChooser(intent, "Partager la ressource"))
                                    }.onFailure { state.notice = "Aucune application disponible pour partager cette ressource." }
                                })
                                DropdownMenuItem(text = { Text("Retirer", color = Color(0xFFE99A9E)) }, onClick = { menu = false; remove = resource })
                            }
                        }
                    }
                }
            }
        }
    }
    if (add) ClasseSheet("Ajouter une ressource", { add = false }) {
        TextButton(onClick = { add = false; importFiles.launch(arrayOf("image/*", "video/*", "application/pdf")) }, modifier = Modifier.fillMaxWidth().hifiBlackSurface(12.dp)) { Text("Photos, vidéos et PDF", color = WaveMixerTheme.capsuleAccentSoft) }
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = { add = false; link = true }, modifier = Modifier.fillMaxWidth().hifiBlackSurface(12.dp)) { Text("Ajouter un lien", color = WaveMixerTheme.capsuleAccentSoft) }
    }
    if (link) ClasseLinkSheet({ link = false }) { name, uri -> state.addResources(listOf(ClasseResource(title = name, uri = uri, mime = "text/uri-list"))); link = false }
    preview?.let { resource -> ClasseResourcePreview(resource) { preview = null } }
    remove?.let { resource -> AlertDialog(onDismissRequest = { remove = null }, containerColor = Color(0xFF15141B), title = { Text("Retirer cette ressource ?", color = Color.White) }, text = { Text("Le fichier d’origine reste sur ton téléphone.", color = Color(0xFFBEB8C9)) }, confirmButton = { TextButton(onClick = { state.deleteResource(resource.id); remove = null }) { Text("Retirer", color = Color(0xFFE99A9E)) } }, dismissButton = { TextButton(onClick = { remove = null }) { Text("Annuler") } }) }
}

@Composable private fun ClasseLinkSheet(onDismiss: () -> Unit, onSave: (String, String) -> Unit) {
    var title by remember { mutableStateOf("") }; var address by remember { mutableStateOf("") }
    val uri = remember(address) { runCatching { Uri.parse(address.trim()).takeIf { it.scheme in listOf("http", "https") && !it.host.isNullOrBlank() } }.getOrNull() }
    ClasseSheet("Ajouter un lien", onDismiss) {
        val colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = WaveMixerTheme.capsuleAccentSoft)
        OutlinedTextField(address, { address = it }, label = { Text("https://…") }, singleLine = true, colors = colors, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(title, { title = it.take(120) }, label = { Text("Titre facultatif") }, singleLine = true, colors = colors, modifier = Modifier.fillMaxWidth())
        Button(onClick = { uri?.let { onSave(title.trim().ifBlank { it.host ?: "Lien" }, it.toString()) } }, enabled = uri != null, modifier = Modifier.fillMaxWidth().padding(top = 12.dp), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF453677))) { Text("Ajouter") }
    }
}

@Composable private fun ClasseImage(uri: String, modifier: Modifier, crop: Boolean = false) {
    val context = LocalContext.current
    var failed by remember(uri) { mutableStateOf(false) }
    val bitmap by produceState<Bitmap?>(null, uri) {
        value = withContext(Dispatchers.IO) { runCatching {
            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            context.contentResolver.openInputStream(Uri.parse(uri))?.use { BitmapFactory.decodeStream(it, null, options) }
            options.inSampleSize = 1
            while (maxOf(options.outWidth, options.outHeight) / options.inSampleSize > 1600) options.inSampleSize *= 2
            options.inJustDecodeBounds = false
            context.contentResolver.openInputStream(Uri.parse(uri))?.use { BitmapFactory.decodeStream(it, null, options) }
        }.getOrNull() }
        failed = value == null
    }
    Box(modifier, contentAlignment = Alignment.Center) {
        bitmap?.let { Image(it.asImageBitmap(), "Aperçu de l’image", Modifier.fillMaxSize(), contentScale = if (crop) ContentScale.Crop else ContentScale.Fit) }
            ?: if (failed) Text("Image indisponible", color = Color.Gray, fontSize = 10.sp) else CircularProgressIndicator(Modifier.size(20.dp), color = WaveMixerTheme.capsuleAccentSoft)
    }
}

@Composable private fun ClasseResourcePreview(resource: ClasseResource, onClose: () -> Unit) {
    var error by remember { mutableStateOf<String?>(null) }
    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Column(Modifier.fillMaxSize().background(Color(0xFF09090C)).systemBarsPadding()) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(resource.title, color = Color.White, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                IconButton(onClick = onClose) { Icon(WaveIcons.Close, "Fermer", tint = WaveMixerTheme.capsuleAccentSoft) }
            }
            when {
                resource.mime.startsWith("image/") -> {
                    var zoom by remember { mutableStateOf(false) }
                    BoxWithConstraints(Modifier.weight(1f).fillMaxWidth()) {
                        val width = maxWidth * if (zoom) 2f else 1f
                        val height = maxHeight * if (zoom) 2f else 1f
                        Box(Modifier.fillMaxSize().horizontalScroll(rememberScrollState()).verticalScroll(rememberScrollState())) {
                            ClasseImage(resource.uri, Modifier.size(width, height).clickable { zoom = !zoom })
                        }
                    }
                }
                resource.mime.startsWith("video/") -> AndroidView(factory = { context -> VideoView(context).apply { setMediaController(MediaController(context).also { it.setAnchorView(this) }); setVideoURI(Uri.parse(resource.uri)); setOnPreparedListener { start() }; setOnErrorListener { _, _, _ -> error = "Vidéo indisponible"; true } } }, modifier = Modifier.fillMaxWidth().weight(1f), onRelease = { it.stopPlayback() })
                resource.mime == "application/pdf" -> ClassePdf(resource.uri, Modifier.weight(1f))
            }
            error?.let { Text(it, color = Color(0xFFE99A9E), modifier = Modifier.padding(16.dp)) }
        }
    }
}

@Composable private fun ClassePdf(uri: String, modifier: Modifier) {
    val context = LocalContext.current
    var page by remember(uri) { mutableIntStateOf(0) }
    var total by remember(uri) { mutableIntStateOf(0) }
    var error by remember(uri) { mutableStateOf(false) }
    val image by produceState<Bitmap?>(null, uri, page) {
        value = null
        val rendered = withContext(Dispatchers.IO) { runCatching {
            val fd = context.contentResolver.openFileDescriptor(Uri.parse(uri), "r") ?: error("PDF indisponible")
            fd.use { PdfRenderer(it).use { renderer ->
                renderer.openPage(page.coerceIn(0, renderer.pageCount - 1)).use { source ->
                    val scale = 1200f / maxOf(source.width, source.height)
                    val bitmap = Bitmap.createBitmap((source.width * scale).toInt().coerceAtLeast(1), (source.height * scale).toInt().coerceAtLeast(1), Bitmap.Config.ARGB_8888)
                    bitmap.eraseColor(android.graphics.Color.WHITE)
                    source.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    bitmap to renderer.pageCount
                }
            } }
        } }
        rendered.onSuccess { value = it.first; total = it.second; error = false }.onFailure { error = true }
    }
    Column(modifier.fillMaxWidth()) {
        Box(Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
            image?.let { Image(it.asImageBitmap(), "Page ${page + 1}", Modifier.fillMaxSize(), contentScale = ContentScale.Fit) }
                ?: if (error) Text("PDF indisponible", color = Color.Gray) else CircularProgressIndicator(color = WaveMixerTheme.capsuleAccentSoft)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { page-- }, enabled = page > 0) { Icon(WaveIcons.Previous, "Page précédente", tint = WaveMixerTheme.capsuleAccentSoft) }
            Text("${if (total == 0) 0 else page + 1} / $total", color = Color.White)
            IconButton(onClick = { page++ }, enabled = page + 1 < total) { Icon(WaveIcons.Next, "Page suivante", tint = WaveMixerTheme.capsuleAccentSoft) }
        }
    }
}
