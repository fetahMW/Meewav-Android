package com.meewav.android.features.rooms.wave

/** A document picker covers the room temporarily; it is not a departure from the live. */
internal class RoomDocumentPickerState {
    var isOpen: Boolean = false
        private set
    fun launch(open: () -> Unit) {
        if (isOpen) return
        isOpen = true // Must precede launch: ON_STOP may follow immediately.
        try { open() } catch (failure: Throwable) { isOpen = false; throw failure }
    }
    fun complete() { isOpen = false }
}
