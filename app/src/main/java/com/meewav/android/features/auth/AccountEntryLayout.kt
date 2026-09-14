package com.meewav.android.features.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.AlternateEmail
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.meewav.android.R
import com.meewav.android.core.design.Violet

/** Comme Bienvenue : le clavier déplace la vitre, sans en recalculer le dessin. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun AccountEntryLayout(state: AuthUiState, actions: AuthActions, submit: () -> Unit) {
    val density = LocalDensity.current
    val hostView = LocalView.current
    SideEffect {
        hostView.isVerticalScrollBarEnabled = false
        hostView.isHorizontalScrollBarEnabled = false
        hostView.scrollIndicators = 0
    }
    val safeInsets = WindowInsets.systemBars.union(WindowInsets.displayCutout)
    val safeBottom = safeInsets.getBottom(density)
    val ime = WindowInsets.ime.getBottom(density)
    val source = WindowInsets.imeAnimationSource.getBottom(density)
    val target = WindowInsets.imeAnimationTarget.getBottom(density)
    val extent = (maxOf(source, target, ime) - safeBottom).coerceAtLeast(0)
    val overlap = (ime - safeBottom).coerceAtLeast(0)
    val progress = if (extent > 0) (overlap.toFloat() / extent).coerceIn(0f, 1f) else 0f
    val typing = ime > 0 || target > 0

    // Les insets IME ne réduisent jamais les contraintes servant à dimensionner la vitre.
    BoxWithConstraints(Modifier.fillMaxSize().windowInsetsPadding(safeInsets)) {
        val panelHeight = (maxHeight - 170.dp).coerceIn(320.dp, 640.dp)
        val headerHeight = 98.dp // Logo (48), espace (12), étapes (38).
        val restHeaderTop = ((maxHeight - panelHeight - headerHeight - 48.dp) / 2)
            .coerceAtLeast(12.dp)
        val restPanelTop = restHeaderTop + headerHeight
        val panelTop = restPanelTop + (12.dp - restPanelTop) * progress
        val viewport = (maxHeight - with(density) { overlap.toDp() } - panelTop - 4.dp)
            .coerceIn(0.dp, panelHeight)

        Column(Modifier.align(Alignment.TopCenter).padding(horizontal = 22.dp)
            .widthIn(max = 440.dp).fillMaxWidth().offset(y = restHeaderTop)
            .graphicsLayer { alpha = 1f - progress }, horizontalAlignment = Alignment.CenterHorizontally) {
            Row(Modifier.fillMaxWidth().height(48.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = actions.back, enabled = !state.busy && !typing,
                    modifier = Modifier.size(48.dp)) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Retour", tint = Color.White)
                }
                Image(painterResource(R.drawable.meewav_logo), "Meewav",
                    Modifier.weight(1f).height(40.dp), contentScale = ContentScale.Fit)
                Spacer(Modifier.size(48.dp))
            }
            Spacer(Modifier.height(12.dp))
            Box(Modifier.fillMaxWidth().height(38.dp), contentAlignment = Alignment.TopCenter) {
                RegistrationSteps(1)
            }
        }
        AuthWindowPanel(Modifier.align(Alignment.TopCenter).padding(horizontal = 22.dp)
            .widthIn(max = 440.dp).fillMaxWidth().offset(y = panelTop),
            panelHeight = panelHeight, compact = true, scrollKey = state.page,
            allowScroll = typing, contentViewportHeight = if (typing) viewport else null,
            contentBottomPadding = if (typing) 8.dp else null,
            footer = if (state.initializing) null else { { PrimaryAction("Suivant", state.busy, submit) } }) {
            if (state.initializing) {
                CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally).padding(28.dp), color = Violet)
            } else {
                AccountRegistrationForm(state, actions, submit)
            }
        }
    }
}

@Composable
private fun AccountRegistrationForm(state: AuthUiState, actions: AuthActions, submit: () -> Unit) {
    val fields = remember { List(4) { FocusRequester() } }
    AccountHeader()
    state.error?.let { Message(it, true); Spacer(Modifier.height(14.dp)) }
    state.notice?.let { Message(it, false); Spacer(Modifier.height(14.dp)) }
    AccountSocialOptions(state, actions.social)
    AuthField("Adresse e-mail", state.email, actions.email, Icons.Outlined.AlternateEmail,
        type = KeyboardType.Email, enabled = !state.busy,
        modifier = Modifier.focusRequester(fields[0]), onNext = { fields[1].requestFocus() })
    Spacer(Modifier.height(12.dp))
    AuthField("Nom d’utilisateur", state.username, actions.username, Icons.Outlined.PersonOutline,
        enabled = !state.busy, modifier = Modifier.focusRequester(fields[1]),
        onNext = { fields[2].requestFocus() })
    Spacer(Modifier.height(12.dp))
    AuthField("Mot de passe", state.password, actions.password, Icons.Outlined.Lock,
        secret = true, enabled = !state.busy, modifier = Modifier.focusRequester(fields[2]),
        onNext = { fields[3].requestFocus() })
    Spacer(Modifier.height(12.dp))
    AuthField("Confirmer mot de passe", state.confirmation, actions.confirmation, Icons.Outlined.Lock,
        secret = true, enabled = !state.busy, ime = ImeAction.Done, onDone = submit,
        singleLineLabel = true, modifier = Modifier.focusRequester(fields[3]))
}
