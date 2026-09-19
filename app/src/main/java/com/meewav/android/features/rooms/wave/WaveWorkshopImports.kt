package com.meewav.android.features.rooms.wave

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import android.provider.DocumentsContract
import kotlinx.coroutines.ensureActive
import java.io.File
import java.util.UUID
import java.util.zip.ZipInputStream
import kotlin.coroutines.coroutineContext

internal data class WaveImportedSource(val uri: Uri, val title: String)

/** The zip container is never used as a destination path; every extracted name is generated. */
internal object WaveWorkshopImports {
    suspend fun folder(context: Context, tree: Uri): List<WaveImportedSource> {
        val files = mutableListOf<WaveImportedSource>()
        suspend fun read(documentId: String, depth: Int) {
            require(depth <= 8) { "Le dossier contient trop de sous-dossiers." }
            val children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, documentId)
            context.contentResolver.query(children, arrayOf(DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                DocumentsContract.Document.COLUMN_DISPLAY_NAME, DocumentsContract.Document.COLUMN_MIME_TYPE), null, null, null)?.use { cursor ->
                while (cursor.moveToNext()) {
                    coroutineContext.ensureActive()
                    val id = cursor.getString(0); val name = cursor.getString(1); val mime = cursor.getString(2)
                    if (mime == DocumentsContract.Document.MIME_TYPE_DIR) read(id, depth + 1)
                    else if (mime.startsWith("audio/")) {
                        require(files.size < 32) { "Sélectionne un dossier contenant au maximum 32 sons." }
                        files += WaveImportedSource(DocumentsContract.buildDocumentUriUsingTree(tree, id), name.substringBeforeLast('.'))
                    }
                }
            }
        }
        read(DocumentsContract.getTreeDocumentId(tree), 0)
        require(files.isNotEmpty()) { "Aucun fichier audio dans ce dossier." }
        return files
    }
    fun name(context: Context, uri: Uri): String = runCatching {
        context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
            if (it.moveToFirst()) it.getString(0) else null
        }
    }.getOrNull() ?: uri.lastPathSegment?.substringAfterLast('/') ?: "Audio importé"

    suspend fun unpack(context: Context, uri: Uri): List<WaveImportedSource> {
        val folder = File(context.filesDir, "wave-packs/${UUID.randomUUID()}").apply { mkdirs() }
        val result = mutableListOf<WaveImportedSource>()
        var total = 0L
        try {
            val input = context.contentResolver.openInputStream(uri) ?: error("Impossible de lire ce pack.")
            ZipInputStream(input.buffered()).use { zip ->
                val buffer = ByteArray(65536)
                while (true) {
                    coroutineContext.ensureActive()
                    val entry = zip.nextEntry ?: break
                    val label = entry.name.substringAfterLast('/').substringAfterLast('\\')
                    val extension = label.substringAfterLast('.', "").lowercase()
                    if (!entry.isDirectory && extension in setOf("wav", "mp3", "m4a", "aac", "ogg", "flac", "opus") && !entry.name.startsWith("__MACOSX/")) {
                        require(result.size < 32) { "Ce pack dépasse 32 fichiers audio." }
                        val file = File(folder, "${result.size}.$extension")
                        file.outputStream().buffered().use { output ->
                            while (true) {
                                coroutineContext.ensureActive()
                                val count = zip.read(buffer)
                                if (count < 0) break
                                total += count
                                require(total <= 256L * 1024 * 1024) { "Ce pack dépasse 256 Mo une fois décompressé." }
                                output.write(buffer, 0, count)
                            }
                        }
                        result += WaveImportedSource(Uri.fromFile(file), label.substringBeforeLast('.'))
                    } else {
                        // Count skipped content as well: an ignored archive entry must not bypass the size bound.
                        while (true) {
                            coroutineContext.ensureActive()
                            val count = zip.read(buffer)
                            if (count < 0) break
                            total += count
                            require(total <= 256L * 1024 * 1024) { "Ce pack dépasse 256 Mo une fois décompressé." }
                        }
                    }
                    zip.closeEntry()
                }
            }
            require(result.isNotEmpty()) { "Ce pack ne contient aucun fichier audio compatible." }
            return result
        } catch (error: Exception) {
            folder.deleteRecursively()
            throw error
        }
    }

    fun category(title: String): String = when {
        title.contains("drum", true) || title.contains("beat", true) || title.contains("kick", true) -> "Drums"
        title.contains("bass", true) -> "Basse"
        title.contains("vocal", true) || title.contains("acapella", true) || title.contains("voice", true) -> "Acapella"
        title.contains("pad", true) || title.contains("nappe", true) -> "Nappe"
        title.contains("chord", true) || title.contains("accord", true) -> "Accords"
        title.contains("fx", true) -> "FX"
        else -> "Mélodie"
    }
}
