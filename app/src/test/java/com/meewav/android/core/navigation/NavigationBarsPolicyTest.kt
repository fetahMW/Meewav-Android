package com.meewav.android.core.navigation

import org.junit.Assert.*
import org.junit.Test

class NavigationBarsPolicyTest {
    @Test fun appDockUsesTheBottomEdgeWithoutChangingFeatureStatusBars() {
        assertEquals(NavigationBarsPolicy(true, false), navigationBarsPolicy(NavigationDockMode.APP, true, false))
    }

    @Test fun globeRetainsItsImmersiveStatusBarWhenShowingOurDock() {
        assertEquals(NavigationBarsPolicy(false, false), navigationBarsPolicy(NavigationDockMode.APP, true, true))
    }

    @Test fun samsungNavigationStaysVisibleInBothGlobeAndOtherFeatures() {
        assertTrue(navigationBarsPolicy(NavigationDockMode.SYSTEM, true, true).showNavigation)
        assertTrue(navigationBarsPolicy(NavigationDockMode.SYSTEM, true, false).showNavigation)
    }

    @Test fun anAbsentDockKeepsBackAndHomeAccessibleRegardlessOfPreference() {
        for (mode in NavigationDockMode.entries) for (immersive in listOf(false, true)) {
            assertTrue(navigationBarsPolicy(mode, false, immersive).showNavigation)
        }
    }

    @Test fun returningFromADocklessPageRestoresTheAppChoice() {
        val preference = NavigationDockMode.APP
        assertTrue(navigationBarsPolicy(preference, false, false).showNavigation)
        assertFalse(navigationBarsPolicy(preference, true, false).showNavigation)
    }

    @Test fun unknownWireValuesAreRejected() {
        assertNull(NavigationDockMode.fromWire("APP"))
        assertNull(NavigationDockMode.fromWire(""))
        assertNull(NavigationDockMode.fromWire(null))
        assertEquals(NavigationDockMode.APP, NavigationDockMode.fromWire("app"))
        assertEquals(NavigationDockMode.SYSTEM, NavigationDockMode.fromWire("system"))
    }
}
