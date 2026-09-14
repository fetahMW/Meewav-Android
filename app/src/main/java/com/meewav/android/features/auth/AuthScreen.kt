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

@Composable
fun AuthScreen(state: AuthUiState, viewModel: AuthViewModel) {
    AuthContent(state, viewModel::navigate, viewModel::email, viewModel::username,
        viewModel::password, viewModel::confirmation, viewModel::submit, viewModel::signOut)
}

@Composable
private fun AuthContent(
    state: AuthUiState,
    navigate: (AuthPage) -> Unit,
    onEmail: (String) -> Unit,
    onUsername: (String) -> Unit,
    onPassword: (String) -> Unit,
    onConfirmation: (String) -> Unit,
    onSubmit: () -> Unit,
    onSignOut: () -> Unit,
) {
    val keyboard = LocalSoftwareKeyboardController.current
    val focus = LocalFocusManager.current
    val submit = { keyboard?.hide(); focus.clearFocus(); onSubmit() }
    val showIntro = state.page == AuthPage.Login
    BackHandler(enabled = state.page !in setOf(AuthPage.Login, AuthPage.SignedIn)) {
        if (!state.busy) {
            if (state.page == AuthPage.NewPassword) onSignOut() else navigate(AuthPage.Login)
        }
    }
    Box(Modifier.fillMaxSize().background(Ink)) {
        Image(painterResource(R.drawable.auth_acoustic_background), null,
            Modifier.fillMaxSize(), contentScale = ContentScale.Crop, alignment = Alignment.Center)
        // A bottom fade supports scrolling content; the acoustic wall keeps its original brightness.
        Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0x5007060C), Ink))))
        Column(
            Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().imePadding()
                .verticalScroll(rememberScrollState()).padding(horizontal = 22.dp, vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(Modifier.widthIn(max = 480.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Image(painterResource(R.drawable.meewav_logo), "Meewav", Modifier.width(155.dp).height(50.dp))
                Spacer(Modifier.weight(1f))
                Text("FR", color = Color(0xFFD0C7E4), fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.clip(RoundedCornerShape(50)).background(Color(0x70130E22)).padding(horizontal = 13.dp, vertical = 8.dp))
            }
            Spacer(Modifier.height(if (showIntro) 23.dp else 32.dp))
            if (showIntro) {
                Column(Modifier.widthIn(max = 480.dp).fillMaxWidth()) {
                    Text(buildAnnotatedString {
                        append("Rejoignez\nl’écosystème ")
                        withStyle(SpanStyle(color = Violet)) { append("musical") }
                    }, fontFamily = MeewavFont, fontWeight = FontWeight.ExtraBold,
                        fontSize = 33.sp, lineHeight = 37.sp, letterSpacing = (-1.1).sp,
                        modifier = Modifier.semantics { heading() })
                    Spacer(Modifier.height(12.dp))
                    Text(buildAnnotatedString {
                        append("Fondée par des ")
                        withStyle(SpanStyle(color = Violet, fontWeight = FontWeight.SemiBold)) { append("artistes") }
                        append(", pour les artistes et leur public.")
                    }, color = Color(0xFFDDD8E6), style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(23.dp))
                    FeatureTiles()
                }
                Spacer(Modifier.height(24.dp))
            }

            GlassPanel(Modifier.widthIn(max = 480.dp).fillMaxWidth().animateContentSize()) {
                if (state.initializing) {
                    Column(Modifier.fillMaxWidth().padding(vertical = 42.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(Modifier.size(26.dp), color = Violet, strokeWidth = 2.dp)
                        Spacer(Modifier.height(16.dp))
                        Text("Retrouvons ton espace…", color = Muted)
                    }
                } else {
                    if (state.page !in setOf(AuthPage.Login, AuthPage.SignedIn, AuthPage.NewPassword)) {
                        TextButton(onClick = { navigate(AuthPage.Login) }, enabled = !state.busy,
                            contentPadding = PaddingValues(0.dp)) {
                            Icon(Icons.AutoMirrored.Outlined.ArrowBack, null, Modifier.size(17.dp))
                            Spacer(Modifier.width(6.dp)); Text("Retour", fontSize = 12.sp)
                        }
                    }
                    WaveMark()
                    Spacer(Modifier.height(9.dp))
                    Text(when (state.page) {
                        AuthPage.Login -> "Bienvenue"
                        AuthPage.Register -> "Crée ton compte"
                        AuthPage.Forgot -> "Retrouve ton compte"
                        AuthPage.NewPassword -> "Nouveau mot de passe"
                        AuthPage.CheckEmail -> "Vérifie tes e-mails"
                        AuthPage.SignedIn -> "Bienvenue${state.connectedName.takeIf { it.isNotBlank() }?.let { ", $it" }.orEmpty()}"
                    }, style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().semantics { heading() })
                    Spacer(Modifier.height(7.dp))
                    Text(when (state.page) {
                        AuthPage.Login -> "Entre dans ton univers sonore."
                        AuthPage.Register -> "Un compte pour tout l’univers Meewav."
                        AuthPage.Forgot -> "Un lien pour retrouver ton espace."
                        AuthPage.NewPassword -> "Choisis un mot de passe rien qu’à toi."
                        AuthPage.CheckEmail -> state.email
                        AuthPage.SignedIn -> "Ton compte Meewav est connecté."
                    }, color = Muted, style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(22.dp))

                    if (state.error != null) {
                        Message(state.error, error = true)
                        Spacer(Modifier.height(14.dp))
                    }
                    if (state.notice != null) {
                        Message(state.notice, error = false)
                        Spacer(Modifier.height(14.dp))
                    }
                    when (state.page) {
                        AuthPage.Login, AuthPage.Register, AuthPage.Forgot, AuthPage.NewPassword -> {
                            if (state.page == AuthPage.Register) {
                                AuthField("Nom d’utilisateur", state.username, onUsername, Icons.Outlined.PersonOutline, enabled = !state.busy)
                                Spacer(Modifier.height(12.dp))
                            }
                            if (state.page != AuthPage.NewPassword) {
                                AuthField("Adresse e-mail", state.email, onEmail, Icons.Outlined.AlternateEmail,
                                    type = KeyboardType.Email, enabled = !state.busy,
                                    ime = if (state.page == AuthPage.Forgot) ImeAction.Done else ImeAction.Next, onDone = submit)
                                Spacer(Modifier.height(12.dp))
                            }
                            if (state.page != AuthPage.Forgot) {
                                AuthField("Mot de passe", state.password, onPassword, Icons.Outlined.Lock,
                                    secret = true, enabled = !state.busy,
                                    ime = if (state.page == AuthPage.Login) ImeAction.Done else ImeAction.Next, onDone = submit)
                            }
                            if (state.page in setOf(AuthPage.Register, AuthPage.NewPassword)) {
                                Spacer(Modifier.height(12.dp))
                                AuthField("Confirmer le mot de passe", state.confirmation, onConfirmation, Icons.Outlined.Lock,
                                    secret = true, enabled = !state.busy, ime = ImeAction.Done, onDone = submit)
                            }
                            if (state.page == AuthPage.Login) {
                                Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                                    TextButton(onClick = { navigate(AuthPage.Forgot) }, enabled = !state.busy) {
                                        Text("Mot de passe oublié ?", color = Muted, fontSize = 12.sp)
                                    }
                                }
                            } else Spacer(Modifier.height(22.dp))
                            PrimaryAction(when (state.page) {
                                AuthPage.Login -> "Se connecter"
                                AuthPage.Register -> "Créer mon compte"
                                AuthPage.Forgot -> "Recevoir le lien"
                                else -> "Enregistrer"
                            }, state.busy, onClick = submit)
                            if (state.page == AuthPage.Login) {
                                Spacer(Modifier.height(23.dp)); DividerWithWave(); Spacer(Modifier.height(13.dp))
                                Text("NOUVEAU ICI ?", fontSize = 10.sp, fontWeight = FontWeight.SemiBold,
                                    letterSpacing = 1.6.sp, color = Muted,
                                    modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center)
                                Spacer(Modifier.height(9.dp))
                                OutlinedButton(onClick = { navigate(AuthPage.Register) }, enabled = !state.busy,
                                    modifier = Modifier.fillMaxWidth().heightIn(min = 49.dp),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF46345F)),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                                    shape = RoundedCornerShape(16.dp)) { Text("Créer un compte") }
                            }
                        }
                        AuthPage.CheckEmail -> {
                            Icon(Icons.Outlined.MarkEmailRead, null, Modifier.align(Alignment.CenterHorizontally).size(48.dp), tint = Violet)
                            Spacer(Modifier.height(20.dp))
                            PrimaryAction("Revenir à la connexion", false) { navigate(AuthPage.Login) }
                        }
                        AuthPage.SignedIn -> {
                            Icon(Icons.Outlined.CheckCircleOutline, null, Modifier.align(Alignment.CenterHorizontally).size(52.dp), tint = Violet)
                            Spacer(Modifier.height(18.dp))
                            Text("L’expérience Android se prépare. Ton compte reste accessible sur les autres versions de Meewav.",
                                color = Muted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                            Spacer(Modifier.height(22.dp))
                            OutlinedButton(onClick = onSignOut, enabled = !state.busy, modifier = Modifier.fillMaxWidth().heightIn(min = 50.dp)) {
                                if (state.busy) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                                else Text("Se déconnecter de cet appareil")
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(21.dp))
            Text("LA MUSIQUE NOUS RASSEMBLE", color = Color(0xFFA7A0B6), fontSize = 9.sp,
                letterSpacing = 2.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center)
            Spacer(Modifier.height(14.dp))
        }
    }
}

@Composable
private fun GlassPanel(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    val shape = RoundedCornerShape(28.dp)
    Column(modifier.clip(shape)
        .background(Brush.verticalGradient(listOf(Color(0xFF141219), Color(0xFF07070A), Color(0xFF10091E))))
        .border(1.dp, Brush.verticalGradient(listOf(Color(0xFF655076), Color(0xFF28222F), Color(0xFF50327F))), shape)
        .padding(22.dp), content = content)
}

@Composable
private fun FeatureTiles() {
    val features = listOf(
        "Globe" to Icons.Outlined.Language,
        "Messagerie" to Icons.Outlined.ChatBubbleOutline,
        "Rooms" to Icons.Outlined.ViewInAr,
        "La Scène" to Icons.Outlined.PlayArrow,
        "Marketplace" to Icons.Outlined.Storefront,
        "Tremplin" to Icons.Outlined.RocketLaunch,
    )
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        features.chunked(3).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { (label, icon) ->
                    val shape = RoundedCornerShape(15.dp)
                    Column(Modifier.weight(1f).clip(shape)
                        .background(Brush.verticalGradient(listOf(Color(0xFF121016), Color(0xFF07070A), Color(0xFF1B102E))))
                        .border(1.dp, Brush.verticalGradient(listOf(Color(0xFF66507F), Color(0xFF30213E), Color(0xFF65428E))), shape)
                        .padding(horizontal = 5.dp, vertical = 13.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(icon, null, Modifier.size(23.dp), tint = Violet)
                        Spacer(Modifier.height(7.dp))
                        Text(label, color = Color(0xFFECE8F5), fontSize = 10.sp, lineHeight = 14.sp,
                            fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
                    }
                }
            }
        }
    }
}

@Composable
private fun AuthField(
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
private fun PrimaryAction(label: String, busy: Boolean, onClick: () -> Unit) {
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

@Preview(name = "S22 Ultra · Connexion", widthDp = 412, heightDp = 915, showBackground = true)
@Composable
private fun LoginPreview() = MeewavTheme {
    AuthContent(AuthUiState(initializing = false), {}, {}, {}, {}, {}, {}, {})
}

@Preview(name = "Inscription · texte agrandi", widthDp = 412, heightDp = 915, fontScale = 1.3f)
@Composable
private fun RegisterPreview() = MeewavTheme {
    AuthContent(AuthUiState(page = AuthPage.Register, initializing = false), {}, {}, {}, {}, {}, {}, {})
}
