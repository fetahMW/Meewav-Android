package com.meewav.android.features.auth

import androidx.activity.compose.BackHandler
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.Image
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
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
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
import androidx.compose.ui.unit.sp
import com.meewav.android.R
import com.meewav.android.core.design.*

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
)

@Composable
fun AuthScreen(state: AuthUiState, viewModel: AuthViewModel) {
    AuthContent(state, AuthActions(viewModel::navigate, viewModel::back, viewModel::email,
        viewModel::username, viewModel::password, viewModel::confirmation, viewModel::profile,
        viewModel::submit, viewModel::signOut))
}

@Composable
internal fun AuthContent(state: AuthUiState, actions: AuthActions) {
    val keyboard = LocalSoftwareKeyboardController.current
    val focus = LocalFocusManager.current
    val scroll = rememberScrollState()
    val submit = { keyboard?.hide(); focus.clearFocus(); actions.submit() }
    LaunchedEffect(state.page) { scroll.scrollTo(0) }
    BackHandler(enabled = state.page !in setOf(AuthPage.Login, AuthPage.SignedIn)) {
        if (!state.busy) actions.back()
    }
    Box(Modifier.fillMaxSize().background(Ink)) {
        Image(painterResource(R.drawable.auth_acoustic_background), null,
            Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        BoxWithConstraints(Modifier.fillMaxSize().safeDrawingPadding().imePadding()) {
            val availableHeight = maxHeight
            Column(Modifier.fillMaxSize().verticalScroll(scroll).heightIn(min = availableHeight)
                .padding(horizontal = 22.dp, vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center) {
                Row(Modifier.widthIn(max = 440.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(48.dp), contentAlignment = Alignment.Center) {
                        if (state.page !in setOf(AuthPage.Login, AuthPage.SignedIn)) {
                            IconButton(onClick = actions.back, enabled = !state.busy) {
                                Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Retour", tint = Color.White)
                            }
                        }
                    }
                    Image(painterResource(R.drawable.meewav_logo), "Meewav",
                        Modifier.weight(1f).height(52.dp), contentScale = ContentScale.Fit)
                    Spacer(Modifier.size(48.dp))
                }
                Spacer(Modifier.height(24.dp))
                val step = when (state.page) { AuthPage.Avatar -> 0; AuthPage.Register -> 1; AuthPage.Location -> 2; else -> -1 }
                if (step >= 0) {
                    RegistrationSteps(step)
                    Spacer(Modifier.height(18.dp))
                }
                GlassPanel(Modifier.widthIn(max = 440.dp).fillMaxWidth()) {
                    if (state.initializing) {
                        CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally).padding(28.dp), color = Violet)
                    } else {
                        WaveMark()
                        Spacer(Modifier.height(12.dp))
                        Text(when (state.page) {
                            AuthPage.Login -> "Bienvenue"
                            AuthPage.Avatar -> "Choisis ton avatar"
                            AuthPage.Register -> "Ton compte Meewav"
                            AuthPage.Location -> "Ta scène locale"
                            AuthPage.Forgot -> "Mot de passe oublié"
                            AuthPage.NewPassword -> "Nouveau mot de passe"
                            AuthPage.CheckEmail -> "Vérifie tes e-mails"
                            AuthPage.SignedIn -> "Bienvenue${state.connectedName.takeIf { it.isNotBlank() }?.let { ", $it" }.orEmpty()}"
                        }, style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().semantics { heading() })
                        Spacer(Modifier.height(8.dp))
                        Text(when (state.page) {
                            AuthPage.Login -> "Entrez dans votre univers sonore."
                            AuthPage.Avatar -> "Il représentera ton rôle sur Meewav."
                            AuthPage.Register -> "Un compte pour tout l’univers Meewav."
                            AuthPage.Location -> "Rejoins la musique près de toi."
                            AuthPage.Forgot -> "Un lien pour retrouver ton espace."
                            AuthPage.NewPassword -> "Choisis un mot de passe rien qu’à toi."
                            AuthPage.CheckEmail -> state.email
                            AuthPage.SignedIn -> "Ton compte Meewav est connecté."
                        }, color = Muted, style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                        Spacer(Modifier.height(24.dp))
                        state.error?.let { Message(it, true); Spacer(Modifier.height(14.dp)) }
                        state.notice?.let { Message(it, false); Spacer(Modifier.height(14.dp)) }
                        when (state.page) {
                            AuthPage.Avatar -> AvatarSelection(state, actions.profile, submit)
                            AuthPage.Location -> LocationRegistration(state, actions.profile, submit)
                            AuthPage.Login, AuthPage.Register, AuthPage.Forgot, AuthPage.NewPassword -> {
                                if (state.page == AuthPage.Register) {
                                    SelectedAvatar(state.profile, onEdit = { actions.navigate(AuthPage.Avatar) })
                                    Spacer(Modifier.height(14.dp))
                                }
                                if (state.page != AuthPage.NewPassword) {
                                    AuthField(if (state.page == AuthPage.Login) "E-mail ou nom d’utilisateur" else "Adresse e-mail",
                                        state.email, actions.email, Icons.Outlined.AlternateEmail,
                                        type = if (state.page == AuthPage.Login) KeyboardType.Text else KeyboardType.Email,
                                        enabled = !state.busy, ime = if (state.page == AuthPage.Forgot) ImeAction.Done else ImeAction.Next, onDone = submit)
                                    Spacer(Modifier.height(12.dp))
                                }
                                if (state.page == AuthPage.Register) {
                                    AuthField("Nom d’utilisateur", state.username, actions.username, Icons.Outlined.PersonOutline, enabled = !state.busy)
                                    Spacer(Modifier.height(12.dp))
                                    AuthField("Naissance · JJ/MM/AAAA (facultatif)", state.profile.birthDate,
                                        { actions.profile(state.profile.copy(birthDate = it)) }, Icons.Outlined.CalendarMonth,
                                        enabled = !state.busy)
                                    Spacer(Modifier.height(12.dp))
                                }
                                if (state.page != AuthPage.Forgot) {
                                    AuthField("Mot de passe", state.password, actions.password, Icons.Outlined.Lock,
                                        secret = true, enabled = !state.busy,
                                        ime = if (state.page == AuthPage.Login) ImeAction.Done else ImeAction.Next, onDone = submit)
                                }
                                if (state.page in setOf(AuthPage.Register, AuthPage.NewPassword)) {
                                    Spacer(Modifier.height(12.dp))
                                    AuthField("Confirmer le mot de passe", state.confirmation, actions.confirmation, Icons.Outlined.Lock,
                                        secret = true, enabled = !state.busy, ime = ImeAction.Done, onDone = submit)
                                }
                                if (state.page == AuthPage.Login) {
                                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                                        TextButton(onClick = { actions.navigate(AuthPage.Forgot) }, enabled = !state.busy) {
                                            Text("Mot de passe oublié ?", color = Muted, fontSize = 12.sp)
                                        }
                                    }
                                } else Spacer(Modifier.height(22.dp))
                                PrimaryAction(when (state.page) {
                                    AuthPage.Login -> "Se connecter"
                                    AuthPage.Register -> "Suivant"
                                    AuthPage.Forgot -> "Recevoir le lien"
                                    else -> "Enregistrer"
                                }, state.busy, submit)
                                if (state.page == AuthPage.Login) {
                                    Spacer(Modifier.height(24.dp)); DividerWithWave(); Spacer(Modifier.height(12.dp))
                                    Text("NOUVEAU ICI ?", fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
                                        letterSpacing = 1.6.sp, color = Muted,
                                        modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                                    TextButton(onClick = { actions.navigate(AuthPage.Avatar) }, enabled = !state.busy,
                                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) {
                                        Text("Créer un compte", color = Violet, fontWeight = FontWeight.Bold)
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
                                Text("L’expérience Android se prépare. Ton compte reste accessible sur les autres versions de Meewav.",
                                    color = Muted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                                Spacer(Modifier.height(22.dp))
                                OutlinedButton(onClick = actions.signOut, enabled = !state.busy,
                                    modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp)) {
                                    if (state.busy) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                                    else Text("Se déconnecter de cet appareil")
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(24.dp))
                Text("LA MUSIQUE NOUS RASSEMBLE", color = Muted, fontSize = 9.sp,
                    letterSpacing = 2.sp, textAlign = TextAlign.Center)
            }
        }
    }
}

@Composable
private fun RegistrationSteps(current: Int) {
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
internal fun GlassPanel(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    val shape = RoundedCornerShape(28.dp)
    Column(modifier.clip(shape)
        .background(Brush.verticalGradient(listOf(Color(0xFF141219), Color(0xFF07070A), Color(0xFF10091E))))
        .border(1.dp, Brush.verticalGradient(listOf(Color(0xFF655076), Color(0xFF28222F), Color(0xFF50327F))), shape)
        .padding(22.dp), content = content)
}

@Composable
internal fun AuthField(
    label: String, value: String, onValue: (String) -> Unit, icon: ImageVector,
    secret: Boolean = false, type: KeyboardType = KeyboardType.Text,
    enabled: Boolean = true, ime: ImeAction = ImeAction.Next, onDone: () -> Unit = {},
) {
    var visible by rememberSaveable { mutableStateOf(false) }
    OutlinedTextField(value, onValue, modifier = Modifier.fillMaxWidth(), enabled = enabled,
        label = { Text(label, fontSize = 13.sp) }, singleLine = true,
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
        keyboardActions = KeyboardActions(onDone = { onDone() }),
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
            .background(Brush.verticalGradient(listOf(Color(0xFF8150DC), Color(0xFF592DA5), Color(0xFF47228A))))
            .border(1.dp, Brush.verticalGradient(listOf(Color(0xFFA580F0), Color(0xFF5D349B))), shape),
        shape = shape, contentPadding = PaddingValues(horizontal = 16.dp, vertical = 15.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, disabledContainerColor = Color.Transparent,
            contentColor = Color.White, disabledContentColor = Color.White)) {
        if (busy) CircularProgressIndicator(Modifier.size(22.dp), color = Color.White, strokeWidth = 2.dp)
        else {
            Text(label, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), textAlign = TextAlign.Center)
            Icon(Icons.AutoMirrored.Outlined.ArrowForward, null, Modifier.size(18.dp))
        }
    }
}

@Composable
private fun Message(text: String, error: Boolean) {
    Text(text, color = if (error) Color(0xFFFFBBC4) else Color(0xFFCEB9F9),
        style = MaterialTheme.typography.bodySmall,
        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
            .background(if (error) Color(0xFF2A161E) else Color(0xFF21162F)).padding(12.dp)
            .semantics { liveRegion = LiveRegionMode.Polite })
}

@Composable
private fun WaveMark() {
    Row(Modifier.fillMaxWidth().height(23.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
        listOf(8, 17, 23, 13, 20, 8).forEach {
            Box(Modifier.padding(horizontal = 2.dp).width(3.dp).height(it.dp)
                .clip(RoundedCornerShape(3.dp)).background(Violet))
        }
    }
}

@Composable
private fun DividerWithWave() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        HorizontalDivider(Modifier.weight(1f), color = Color(0xFF302139))
        Icon(Icons.Outlined.GraphicEq, null, Modifier.padding(horizontal = 14.dp).size(22.dp), tint = Color(0xFFA499B7))
        HorizontalDivider(Modifier.weight(1f), color = Color(0xFF302139))
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
