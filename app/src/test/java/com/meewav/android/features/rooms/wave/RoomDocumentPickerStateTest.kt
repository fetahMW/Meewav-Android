package com.meewav.android.features.rooms.wave

import org.junit.Assert.*
import org.junit.Test

class RoomDocumentPickerStateTest {
    @Test fun `opening a picker preserves live before activity stops`() {
        val picker = RoomDocumentPickerState()
        assertFalse(picker.isOpen)
        picker.launch { assertTrue(picker.isOpen) }
        assertTrue(picker.isOpen)
        picker.complete() // Both selection and cancellation release the exception.
        assertFalse(picker.isOpen)
    }
    @Test fun `failed launch does not leave background capture exemption`() {
        val picker = RoomDocumentPickerState()
        try { picker.launch { throw IllegalStateException("No document provider") }; fail() }
        catch (_: IllegalStateException) { assertFalse(picker.isOpen) }
    }
    @Test fun `double tap launches only one picker and next import still works`() {
        val picker = RoomDocumentPickerState()
        var launches = 0
        picker.launch { launches++ }
        picker.launch { launches++ }
        assertEquals(1, launches)
        picker.complete()
        picker.launch { launches++ }
        assertEquals(2, launches)
    }
}
