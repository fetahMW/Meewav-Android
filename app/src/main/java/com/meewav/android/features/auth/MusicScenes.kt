package com.meewav.android.features.auth

import android.content.res.AssetManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.*
import java.text.Normalizer
import java.util.Locale

@Serializable
data class MusicCity(
    val communeCode: String, val label: String, val departmentCode: String,
    val subtitle: String = "", val population: Long = 0,
    val center: List<Double>, val bbox: List<Double> = emptyList(),
    val postalCodes: List<String> = emptyList(), val aliases: List<String> = emptyList(),
    val departmentName: String = "", val regionName: String = "",
)

@Serializable
data class MusicScene(
    val zoneId: String, val label: String, val communeCode: String, val communeName: String,
    val center: List<Double>, val bbox: List<Double>? = null,
    val source: String, val irisCode: String? = null,
    val geographyVersion: String = "vinyl-v1", val geometry: JsonObject? = null,
)

@Serializable private data class MusicCatalog(val cities: List<MusicCity>)
@Serializable private data class MusicDepartment(val cities: Map<String, List<MusicScene>>)

/** Catalogue canonique du Web embarqué : aucun géocodage ni envoi d'une adresse. */
internal class MusicScenes(private val assets: AssetManager) {
    private val json = Json { ignoreUnknownKeys = true; coerceInputValues = true }
    private val lock = Mutex()
    private var cities: List<MusicCity>? = null
    private val departments = linkedMapOf<String, Map<String, List<MusicScene>>>()

    suspend fun cities(): List<MusicCity> = withContext(Dispatchers.IO) {
        lock.withLock {
            cities ?: assets.open("music-scenes/catalog.json").bufferedReader().use {
                json.decodeFromString<MusicCatalog>(it.readText()).cities
                    .sortedWith(compareByDescending<MusicCity> { city -> city.population }.thenBy { city -> city.label })
                    .also { loaded -> cities = loaded }
            }
        }
    }

    suspend fun scenes(city: MusicCity): List<MusicScene> = withContext(Dispatchers.IO) {
        lock.withLock {
            val data = departments[city.departmentCode] ?: assets.open("music-scenes/scenes/${city.departmentCode}.json")
                .bufferedReader().use { json.decodeFromString<MusicDepartment>(it.readText()).cities }.also {
                    if (departments.size >= 2) departments.remove(departments.keys.first())
                    departments[city.departmentCode] = it
                }
            data[city.communeCode].orEmpty()
        }
    }

    suspend fun locate(longitude: Double, latitude: Double): Pair<MusicCity, MusicScene>? = withContext(Dispatchers.IO) {
        for (city in cities().filter { containsBox(it.bbox, longitude, latitude) }) {
            for (scene in scenes(city)) {
                if (containsBox(scene.bbox.orEmpty(), longitude, latitude) && containsGeometry(scene.geometry, longitude, latitude))
                    return@withContext city to scene
            }
        }
        null
    }
}

private val sceneMarks = "\\p{M}+".toRegex()
private val sceneSeparators = "[^a-z0-9]+".toRegex()
internal fun normalizedSceneQuery(value: String): String = Normalizer.normalize(value, Normalizer.Form.NFD)
    .replace(sceneMarks, "").lowercase(Locale.FRENCH).replace(sceneSeparators, " ").trim()

internal class MusicCitySearch(cities: List<MusicCity>) {
    private data class Entry(val city: MusicCity, val name: String, val code: String,
        val postals: List<String>, val aliases: List<String>, val values: List<String>)
    private val entries = cities.map { city ->
        Entry(city, normalizedSceneQuery(city.label), normalizedSceneQuery(city.communeCode),
            city.postalCodes.map(::normalizedSceneQuery), city.aliases.map(::normalizedSceneQuery),
            (listOf(city.label, city.communeCode, city.subtitle, city.departmentName, city.regionName) + city.postalCodes + city.aliases)
                .map(::normalizedSceneQuery))
    }
    fun find(query: String, limit: Int = 60): List<MusicCity> {
        val q = normalizedSceneQuery(query)
        if (q.isEmpty()) return entries.take(limit).map { it.city }
        val words = q.split(' ')
        return entries.asSequence().filter { item -> words.all { term -> item.values.any { term in it } } }
            .map { item -> item to when {
                item.code == q -> -20
                item.name == q -> 0
                q in item.aliases -> 6
                q in item.postals -> 8
                item.name.startsWith(q) -> 10
                item.values.any { it == q } -> 18
                item.values.any { it.startsWith(q) } -> 24
                else -> 40
            } }.sortedWith(compareBy<Pair<Entry, Int>> { it.second }.thenByDescending { it.first.city.population })
            .take(limit).map { it.first.city }.toList()
    }
}

private fun containsBox(box: List<Double>, x: Double, y: Double) = box.size == 4 &&
    x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3]

private fun containsGeometry(geometry: JsonObject?, x: Double, y: Double): Boolean {
    val coordinates = geometry?.get("coordinates") as? JsonArray ?: return false
    return when (geometry["type"]?.jsonPrimitive?.content) {
        "Polygon" -> containsPolygon(coordinates, x, y)
        "MultiPolygon" -> coordinates.any { containsPolygon(it.jsonArray, x, y) }
        else -> false
    }
}

private fun containsPolygon(rings: JsonArray, x: Double, y: Double): Boolean =
    rings.isNotEmpty() && containsRing(rings[0].jsonArray, x, y) && rings.drop(1).none { containsRing(it.jsonArray, x, y) }

private fun containsRing(ring: JsonArray, x: Double, y: Double): Boolean {
    if (ring.size < 3) return false
    var inside = false
    var previous = ring.last().jsonArray
    for (item in ring) {
        val current = item.jsonArray
        val x1 = previous[0].jsonPrimitive.double; val y1 = previous[1].jsonPrimitive.double
        val x2 = current[0].jsonPrimitive.double; val y2 = current[1].jsonPrimitive.double
        if ((y1 > y) != (y2 > y) && x < (x2 - x1) * (y - y1) / (y2 - y1) + x1) inside = !inside
        previous = current
    }
    return inside
}
