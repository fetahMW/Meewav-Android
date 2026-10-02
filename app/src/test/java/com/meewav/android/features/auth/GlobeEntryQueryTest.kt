package com.meewav.android.features.auth

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GlobeEntryQueryTest {
    @Test fun regularEntryModesRemainAvailableInBothBuilds() {
        for (nativeRenderer in listOf(false, true)) {
            assertTrue(isPermittedGlobeEntryQuery("mode=demo", nativeRenderer))
            assertTrue(isPermittedGlobeEntryQuery("mode=real", nativeRenderer))
        }
    }

    @Test fun nativeEntryUrlsLoadOnlyInTheSeparateTestBuild() {
        for (mode in listOf("demo", "real")) {
            val query = "mode=$mode&renderer=native"
            assertTrue(isPermittedGlobeEntryQuery(query, true))
            assertFalse(isPermittedGlobeEntryQuery(query, false))
        }
    }

    @Test fun unexpectedOrAmbiguousParametersCannotBypassTheLocalAssetRule() {
        for (query in listOf(null, "", "mode=unknown", "renderer=native", "mode=demo&renderer=webgl",
            "mode=demo&renderer=native&extra=1", "mode=demo&mode=real", "mode=demo&renderer=native&renderer=native")) {
            assertFalse("Unexpected query: $query", isPermittedGlobeEntryQuery(query, true))
        }
    }
}
