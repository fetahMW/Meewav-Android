package com.meewav.android.features.auth

import androidx.activity.compose.BackHandler
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.Image
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R
import com.meewav.android.BuildConfig
import com.meewav.android.core.design.*
import com.meewav.android.core.auth.SocialAuthProvider

data class AuthActions(
    val navigate: (AuthPage) -> Unit = {},
    val back: () -> Unit = {},
    val email: (String) -> Unit = {},
    val username: (String) -> Unit = {},
    val password: (String) -> Unit = {},
    val confirmation: (String) -> Unit = {},
    val profile: (ProfileDraft) -> Unit = {},
    val submit: () -> Unit = {},
    val signOut: () -> Unit = {},
    val startPreview: () -> Unit = {},
    val exitPreview: () -> Unit = {},
    val social: (SocialAuthProvider) -> Unit = {},
    val closeApp: () -> Unit = {},
    val openMessages: () -> Unit = {},
)

@Composable
fun AuthScreen(state: AuthUiState, viewModel: AuthViewModel, onCloseApp: () -> Unit, onOpenMessages: () -> Unit = {}) {
    AuthContent(state, AuthActions(viewModel::navigate, viewModel::back, viewModel::email,
        viewModel::username, viewModel::password, viewModel::confirmation, viewModel::profile,
        viewModel::submit, viewModel::signOut, viewModel::startPreview, viewModel::exitPreview, viewModel::signInSocial,
        closeApp = onCloseApp, openMessages = onOpenMessages))
}

@Composable
internal fun AuthContent(state: AuthUiState, actions: AuthActions) {
    val keyboard = LocalSoftwareKeyboardController.current
    val keyboardOpen = WindowInsets.ime.getBottom(LocalDensity.current) > 0
    val typingLayout = keyboardOpen && state.page == AuthPage.Login
    val focus = LocalFocusManager.current
    val scroll = rememberScrollState()
    val submit = { keyboard?.hide(); focus.clearFocus(); actions.submit() }
    LaunchedEffect(state.page) { scroll.scrollTo(0) }
    BackHandler(enabled = !keyboardOpen && state.page !in setOf(AuthPage.Login, AuthPage.SignedIn)) {
        if (!state.busy) {
            if (state.page == AuthPage.Globe) actions.closeApp() else actions.back()
        }
    }
    Box(Modifier.fillMaxSize().background(Ink)) {
        if (state.page != AuthPage.Globe) {
            Image(painterResource(R.drawable.auth_ios_background), null,
                Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        }
        if (state.page == AuthPage.Login) {
            LoginEntryLayout(state, actions, submit)
            return@Box
        }
        if (state.page == AuthPage.Register) {
            AccountEntryLayout(state, actions, submit)
            return@Box
        }
        if (state.page == AuthPage.Preview || state.page == AuthPage.Globe) {
            SceneGlobeArrival(state, onBack = actions.back, onEnter = submit, onClose = actions.closeApp)
            return@Box
        }
        BoxWithConstraints(Modifier.fillMaxSize().safeDrawingPadding().imePadding()) {
            val availableHeight = maxHeight
            val isAvatarPage = state.page == AuthPage.Avatar
            val isIosEntry = isAvatarPage || state.page == AuthPage.Login
            val fixedStep = isIosEntry || state.page == AuthPage.Location
            // Au repos : enveloppe fixe. Pendant la saisie : place disponible au-dessus du clavier.
            val basePanelHeight = (availableHeight - 170.dp).coerceIn(320.dp, 640.dp)
            val panelHeight = if (typingLayout) (availableHeight - 24.dp).coerceAtLeast(0.dp)
                else basePanelHeight + if (isIosEntry) AuthWindowLowerExtension else 0.dp
            Column(Modifier.fillMaxSize()
                .then(if (fixedStep) Modifier else Modifier.imePadding().verticalScroll(scroll))
                .heightIn(min = availableHeight)
                .padding(horizontal = 22.dp, vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = if (isIosEntry) Arrangement.Top else Arrangement.Center) {
                if (!typingLayout) {
                if (isIosEntry) Spacer(Modifier.height(((availableHeight - basePanelHeight - 132.dp) / 2).coerceAtLeast(0.dp)))
                if (isIosEntry) {
                    // Même largeur utile et même hauteur que l'ancien en-tête avec deux réserves de 48 dp.
                    Box(Modifier.widthIn(max = 440.dp).fillMaxWidth().height(48.dp), contentAlignment = Alignment.Center) {
                    if (isAvatarPage) IconButton(onClick = actions.back, enabled = !state.busy,
                        modifier = Modifier.align(Alignment.CenterStart).size(48.dp)) {
                        Icon(Icons.Outlined.ChevronLeft, "Retour", tint = Color.White)
                    }
                    Image(painterResource(R.drawable.meewav_logo), "Meewav",
                        Modifier.fillMaxWidth().padding(horizontal = 48.dp).height(40.dp), contentScale = ContentScale.Fit)
                    }
                } else Row(Modifier.widthIn(max = 440.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(48.dp), contentAlignment = Alignment.Center) {
                        if (state.page !in setOf(AuthPage.Login, AuthPage.SignedIn)) {
                            IconButton(onClick = actions.back, enabled = !state.busy) {
                                Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Retour", tint = Color.White)
                            }
                        }
                    }
                    Image(painterResource(R.drawable.meewav_logo), "Meewav",
                        Modifier.weight(1f).height(40.dp), contentScale = ContentScale.Fit)
                    Spacer(Modifier.size(48.dp))
                }
                Spacer(Modifier.height(12.dp))
                val step = when (state.page) { AuthPage.Avatar -> 0; AuthPage.Register -> 1; AuthPage.Location -> 2; else -> -1 }
                if (!isIosEntry) Box(Modifier.height(38.dp).fillMaxWidth(), contentAlignment = Alignment.TopCenter) {
                    if (step >= 0) RegistrationSteps(step)
                }
                }
                if (isAvatarPage && !state.initializing) {
                    AvatarSelection(state, actions.profile, submit, panelHeight = panelHeight,
                        modifier = Modifier.widthIn(max = 440.dp).fillMaxWidth())
                } else if (state.page == AuthPage.Login) {
                    IosLoginScene(state, actions, submit, panelHeight,
                        Modifier.widthIn(max = 440.dp).fillMaxWidth(), typingLayout = typingLayout)
                } else GlassPanel(Modifier.widthIn(max = 440.dp).fillMaxWidth(), panelHeight = panelHeight,
                    compact = fixedStep || state.page == AuthPage.Location, scrollKey = state.page, allowScroll = !fixedStep || typingLayout,
                    footer = if (state.page == AuthPage.Location && !state.initializing) {
                        { PrimaryAction("Terminer", state.busy, submit) }
                    } else null) {
                    if (state.initializing) {
                        CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally).padding(28.dp), color = Violet)
                    } else {
                        WaveMark()
                        Spacer(Modifier.height(4.dp))
                        Text(when (state.page) {
                            AuthPage.Login -> "Bienvenue"
                            AuthPage.Avatar -> "Choisis ton avatar"
                            AuthPage.Register -> "Ton compte Meewav"
                            AuthPage.Location -> "Choisis ta scène"
                            AuthPage.Forgot -> "Mot de passe oublié"
                            AuthPage.NewPassword -> "Nouveau mot de passe"
                            AuthPage.CheckEmail -> "Vérifie tes e-mails"
                            AuthPage.SignedIn -> "Bienvenue${state.connectedName.takeIf { it.isNotBlank() }?.let { ", $it" }.orEmpty()}"
                            AuthPage.Preview -> "Ton aperçu est prêt"
                            AuthPage.Globe -> "Mon Globe"
                        }, style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().semantics { heading() })
                            Spacer(Modifier.height(4.dp))
                            Text(when (state.page) {
                            AuthPage.Login -> "Entrez dans votre univers sonore."
                            AuthPage.Avatar -> "Il représentera ton rôle sur Meewav."
                            AuthPage.Register -> ""
                            AuthPage.Location -> "Rejoins un quartier musical. Ton adresse reste privée."
                            AuthPage.Forgot -> "Un lien pour retrouver ton espace."
                            AuthPage.NewPassword -> "Choisis un mot de passe rien qu’à toi."
                            AuthPage.CheckEmail -> state.email
                            AuthPage.SignedIn -> "Ton compte Meewav est connecté."
                            AuthPage.Preview -> "Mode aperçu · aucun compte créé."
                            AuthPage.Globe -> ""
                        }, color = Muted, style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                        SubtitleDivider(compact = isAvatarPage || state.page == AuthPage.Location)
                        state.error?.let { Message(it, true); Spacer(Modifier.height(14.dp)) }
                        state.notice?.let { Message(it, false); Spacer(Modifier.height(14.dp)) }
                        when (state.page) {
                            AuthPage.Avatar, AuthPage.Register -> Unit // Ces étapes ont leur propre disposition.
                            AuthPage.Location -> LocationRegistration(state, actions.profile)
                            AuthPage.Globe -> Unit
                            AuthPage.Login, AuthPage.Forgot, AuthPage.NewPassword -> {
                                if (state.page != AuthPage.NewPassword) {
                                    AuthField(if (state.page == AuthPage.Login) "E-mail ou nom d’utilisateur" else "Adresse e-mail",
                                        state.email, actions.email, Icons.Outlined.AlternateEmail,
                                        type = if (state.page == AuthPage.Login) KeyboardType.Text else KeyboardType.Email,
                                        enabled = !state.busy, ime = if (state.page == AuthPage.Forgot) ImeAction.Done else ImeAction.Next, onDone = submit)
                                    Spacer(Modifier.height(12.dp))
                                }
                                if (state.page != AuthPage.Forgot) {
                                    AuthField("Mot de passe", state.password, actions.password, Icons.Outlined.Lock,
                                        secret = true, enabled = !state.busy,
                                        ime = if (state.page == AuthPage.Login) ImeAction.Done else ImeAction.Next, onDone = submit)
                                }
                                if (state.page == AuthPage.NewPassword) {
                                    Spacer(Modifier.height(12.dp))
                                    AuthField("Confirmer mot de passe", state.confirmation, actions.confirmation, Icons.Outlined.Lock,
                                        secret = true, enabled = !state.busy, ime = ImeAction.Done, onDone = submit,
                                        singleLineLabel = true)
                                }
                                if (state.page == AuthPage.Login) {
                                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                                        TextButton(onClick = { actions.navigate(AuthPage.Forgot) }, enabled = !state.busy) {
                                            Text("Mot de passe oublié ?", color = Muted, fontSize = 12.sp)
                                        }
                                    }
                                } else Spacer(Modifier.height(22.dp))
                                    PrimaryAction(when (state.page) {
                                        AuthPage.Login -> if (state.localPreview) "Suivant" else "Se connecter"
                                        AuthPage.Forgot -> "Recevoir le lien"
                                        else -> "Enregistrer"
                                    }, state.busy, submit)
                                if (state.page == AuthPage.Login) {
                                    Spacer(Modifier.height(24.dp)); DividerWithWave(); Spacer(Modifier.height(12.dp))
                                    Text("NOUVEAU ICI ?", fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
                                        letterSpacing = 1.6.sp, color = Muted,
                                        modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                                    Spacer(Modifier.height(8.dp))
                                    OutlinedButton(onClick = { actions.navigate(AuthPage.Avatar) }, enabled = !state.busy,
                                        border = BorderStroke(1.dp, Color(0xFF37224F)),
                                        shape = RoundedCornerShape(50),
                                        modifier = Modifier.align(Alignment.CenterHorizontally).heightIn(min = 48.dp)) {
                                        Text("Créer un compte", color = Color.White, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                            AuthPage.CheckEmail -> {
                                Icon(Icons.Outlined.MarkEmailRead, null, Modifier.align(Alignment.CenterHorizontally).size(48.dp), tint = Violet)
                                Spacer(Modifier.height(20.dp))
                                PrimaryAction("Revenir à la connexion", false) { actions.navigate(AuthPage.Login) }
                            }
                            AuthPage.SignedIn -> {
                                Icon(Icons.Outlined.CheckCircleOutline, null, Modifier.align(Alignment.CenterHorizontally).size(52.dp), tint = Violet)
                                Spacer(Modifier.height(18.dp))
                                Text("Retrouve tes conversations dans la messagerie Meewav.",
                                    color = Muted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                                Spacer(Modifier.height(22.dp))
                                PrimaryAction("Ouvrir la messagerie", state.busy) { actions.openMessages() }
                                Spacer(Modifier.height(12.dp))
                                OutlinedButton(onClick = actions.signOut, enabled = !state.busy,
                                    modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp)) {
                                    if (state.busy) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                                    else Text("Se déconnecter de cet appareil")
                                }
                            }
                            AuthPage.Preview -> {
                                Image(painterResource(AvatarCatalog.find(state.profile.avatarIcon).image), null,
                                    Modifier.align(Alignment.CenterHorizontally).size(128.dp), contentScale = ContentScale.Fit)
                                Spacer(Modifier.height(16.dp))
                                Text("Tu peux parcourir les étapes sans e-mail ni mot de passe. Les prochains écrans Android seront ajoutés ici.",
                                    color = Muted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                                Spacer(Modifier.height(20.dp))
                                PrimaryAction("Revoir mon avatar", false) { actions.navigate(AuthPage.Avatar) }
                                TextButton(onClick = actions.exitPreview, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
                                    Text("Revenir à la connexion", color = Violet)
                                }
                            }
                        }
                    }
                }
                if (!typingLayout) Spacer(Modifier.height(48.dp))
            }
        }
    }
}

@Composable
internal fun RegistrationSteps(current: Int) {
    Row(Modifier.widthIn(max = 340.dp).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        listOf("Avatar", "Compte", "Localisation").forEachIndexed { index, title ->
            Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("${index + 1} · $title", color = if (current == index) Color.White else Muted,
                    fontSize = 11.sp, fontWeight = if (current == index) FontWeight.Bold else FontWeight.Normal)
                Spacer(Modifier.height(8.dp))
                Box(Modifier.fillMaxWidth().height(3.dp).clip(RoundedCornerShape(3.dp))
                    .background(if (index <= current) Violet else Color(0xFF342A42)))
            }
        }
    }
}

@Composable
internal fun GlassPanel(modifier: Modifier = Modifier, panelHeight: Dp = 640.dp, compact: Boolean = false,
                       scrollKey: Any? = null, footer: (@Composable () -> Unit)? = null,
                       allowScroll: Boolean = true,
                       content: @Composable ColumnScope.() -> Unit) {
    AuthWindowPanel(modifier, panelHeight = panelHeight, compact = compact, scrollKey = scrollKey,
        footer = footer, allowScroll = allowScroll, content = content)
}

@Composable
internal fun AuthField(
    label: String, value: String, onValue: (String) -> Unit, icon: ImageVector,
    secret: Boolean = false, type: KeyboardType = KeyboardType.Text,
    enabled: Boolean = true, ime: ImeAction = ImeAction.Next, onDone: () -> Unit = {},
    singleLineLabel: Boolean = false,
    modifier: Modifier = Modifier, onNext: (() -> Unit)? = null,
) {
    var visible by rememberSaveable { mutableStateOf(false) }
    OutlinedTextField(value, onValue, modifier = modifier.fillMaxWidth().then(rememberKeyboardFieldModifier()), enabled = enabled,
        label = { Text(label, fontSize = 13.sp, maxLines = if (singleLineLabel) 1 else Int.MAX_VALUE,
            softWrap = !singleLineLabel) }, singleLine = true,
        shape = RoundedCornerShape(15.dp),
        leadingIcon = { Icon(icon, null, Modifier.size(20.dp), tint = Muted) },
        trailingIcon = if (secret) { {
            IconButton(onClick = { visible = !visible }, enabled = enabled) {
                Icon(if (visible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                    if (visible) "Masquer le mot de passe" else "Afficher le mot de passe", Modifier.size(21.dp), tint = Muted)
            }
        } } else null,
        visualTransformation = if (secret && !visible) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = if (secret) KeyboardType.Password else type,
            imeAction = ime, autoCorrectEnabled = !secret && type != KeyboardType.Email),
        keyboardActions = KeyboardActions(onDone = { onDone() },
            onNext = { if (onNext != null) onNext() else defaultKeyboardAction(ImeAction.Next) }),
        colors = OutlinedTextFieldDefaults.colors(
            unfocusedContainerColor = Color(0xFF0E0D15), focusedContainerColor = Color(0xFF100D18),
            unfocusedBorderColor = Color(0xFF373240), focusedBorderColor = Violet,
            unfocusedLabelColor = Muted, focusedLabelColor = Violet, cursorColor = Violet),
    )
}

@Composable
internal fun PrimaryAction(label: String, busy: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(16.dp)
    Button(onClick = onClick, enabled = !busy,
        modifier = Modifier.fillMaxWidth().heightIn(min = 54.dp).clip(shape)
            .background(Brush.verticalGradient(listOf(Color(0xFF4C3398), Color(0xFF3F2A7E))))
            .border(.5.dp, Brush.verticalGradient(listOf(Color(0xFF7763AF), Color(0xFF3F2A7E))), shape),
        shape = shape, contentPadding = PaddingValues(horizontal = 16.dp, vertical = 15.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, disabledContainerColor = Color.Transparent,
            contentColor = Color.White, disabledContentColor = Color.White)) {
        if (busy) CircularProgressIndicator(Modifier.size(22.dp), color = Color.White, strokeWidth = 2.dp)
        else {
            Text(label, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
        }
    }
}

@Composable
internal fun Message(text: String, error: Boolean) {
    Text(text, color = if (error) Color(0xFFFFBBC4) else Color(0xFFCEB9F9),
        style = MaterialTheme.typography.bodySmall,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
            .background(if (error) Color(0xFF2A161E) else Color(0xFF21162F)).padding(12.dp)
            .semantics { liveRegion = LiveRegionMode.Polite })
}

@Composable
private fun WaveMark() {
    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Image(painterResource(R.drawable.auth_web_signature), null, Modifier.size(34.dp, 22.dp))
    }
}

@Composable
private fun SubtitleDivider(compact: Boolean = false) {
    Box(Modifier.fillMaxWidth().padding(top = if (compact) 8.dp else 14.dp, bottom = if (compact) 12.dp else 22.dp),
        contentAlignment = Alignment.Center) {
        Box(Modifier.width(132.dp).height(1.dp).background(Brush.horizontalGradient(
            0f to Color.Transparent, .2f to Color(0x408B5CF6), .42f to Color(0xD98B5CF6),
            .5f to Color(0xF2FFFFFF), .58f to Color(0xD98B5CF6), .8f to Color(0x408B5CF6),
            1f to Color.Transparent)))
    }
}

@Composable
internal fun DividerWithWave() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        val line = Brush.horizontalGradient(listOf(Color(0x0D8B5CF6), Color(0x618B5CF6), Color(0x0D8B5CF6)))
        Box(Modifier.weight(1f).height(1.dp).background(line))
        Row(Modifier.padding(horizontal = 18.dp).height(21.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
            listOf(7, 11, 17, 21, 17, 11, 7).forEach {
                Box(Modifier.width(3.dp).height(it.dp).clip(RoundedCornerShape(3.dp))
                    .background(Brush.verticalGradient(listOf(Color(0xEBFFFFFF), Color(0xF5E6D6FF), Color(0xEBFFFFFF)))))
            }
        }
        Box(Modifier.weight(1f).height(1.dp).background(line))
    }
}

@Preview(name = "S22 Ultra · Connexion mobile", widthDp = 412, heightDp = 915)
@Composable
private fun LoginPreview() = MeewavTheme { AuthContent(AuthUiState(initializing = false), AuthActions()) }

@Preview(name = "S22 Ultra · Avatar", widthDp = 412, heightDp = 915)
@Composable
private fun AvatarPreview() = MeewavTheme {
    AuthContent(AuthUiState(page = AuthPage.Avatar, initializing = false), AuthActions())
}

@Preview(name = "Inscription · texte agrandi", widthDp = 412, heightDp = 915, fontScale = 1.3f)
@Composable
private fun RegisterPreview() = MeewavTheme {
    AuthContent(AuthUiState(page = AuthPage.Register, initializing = false), AuthActions())
}
