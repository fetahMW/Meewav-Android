package com.meewav.android.features.auth

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.platform.LocalDensity
import kotlinx.coroutines.delay

/** Attend la fin du redimensionnement IME avant de ramener le champ entier dans la vitre. */
@OptIn(ExperimentalFoundationApi::class)
@Composable
internal fun rememberKeyboardFieldModifier(): Modifier {
    val requester = remember { BringIntoViewRequester() }
    var focused by remember { mutableStateOf(false) }
    val keyboardBottom = WindowInsets.ime.getBottom(LocalDensity.current)
    LaunchedEffect(focused, keyboardBottom) {
        if (focused && keyboardBottom > 0) {
            delay(150)
            requester.bringIntoView()
        }
    }
    return Modifier.bringIntoViewRequester(requester).onFocusChanged { focused = it.hasFocus }
}
