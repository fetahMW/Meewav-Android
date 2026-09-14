package com.meewav.android.features.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R
import com.meewav.android.core.design.Muted
import com.meewav.android.core.design.Violet

/** Même enveloppe, même vitre et même plateau que l'étape Avatar. */
@Composable
internal fun IosLoginScene(state: AuthUiState, actions: AuthActions, submit: () -> Unit,
                          panelHeight: Dp, modifier: Modifier = Modifier, typingLayout: Boolean = false) {
    val stageHeight = if (typingLayout) 0.dp else authStageHeight(panelHeight)
    val motion = rememberInfiniteTransition(label = "Signature suspendue")
    val rotation = motion.animateFloat(0f, 360f,
        infiniteRepeatable(tween(32000, easing = LinearEasing)), label = "Rotation horaire MW")
    val sweep = motion.animateFloat(0f, 360f,
        infiniteRepeatable(tween(16000, easing = LinearEasing)), label = "Balayage des faisceaux")
    val levitation = motion.animateFloat(-3f, 3f,
        infiniteRepeatable(tween(2800, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "Lévitation MW")
    Box(modifier.height(panelHeight)) {
        AuthWindowPanel(Modifier.fillMaxWidth().padding(top = if (typingLayout) 0.dp else stageHeight - 14.dp),
            panelHeight = if (typingLayout) panelHeight else panelHeight - stageHeight + 14.dp,
            compact = true, iosStageWindow = true, scrollKey = state.page, allowScroll = typingLayout,
            footer = if (state.initializing || typingLayout) null else { {
                IosAuthDivider()
                Spacer(Modifier.height(6.dp))
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Nouveau ici ?", fontSize = 11.sp, lineHeight = 14.sp, color = Muted)
                    Spacer(Modifier.height(4.dp))
                        OutlinedButton(onClick = { actions.navigate(AuthPage.Avatar) }, enabled = !state.busy,
                            modifier = Modifier.widthIn(min = 180.dp).height(48.dp), shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, Color(0xFF5137A1)),
                            colors = ButtonDefaults.outlinedButtonColors(containerColor = Color(0xFF0C0914)),
                            contentPadding = PaddingValues(horizontal = 12.dp)) {
                            Text("Créer un compte", fontSize = 12.sp, maxLines = 1,
                                fontWeight = FontWeight.Bold, color = Color.White)
                        }
                }
                // La signature libère 20 dp, réaffectés sous la capsule.
                Spacer(Modifier.height(40.dp))
            } }) {
            if (state.initializing) {
                CircularProgressIndicator(Modifier.align(Alignment.CenterHorizontally).padding(28.dp), color = Violet)
            } else {
                Text("Bienvenue", fontSize = 23.sp, lineHeight = 28.sp, fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().semantics { heading() })
                Spacer(Modifier.height(4.dp))
                Text("Entrez dans votre univers sonore.", color = Muted, fontSize = 12.sp, lineHeight = 18.sp,
                    textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(10.dp))
                state.error?.let {
                    Text(it, color = Color(0xFFFFBBC4), fontSize = 11.sp,
                        modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite })
                    Spacer(Modifier.height(8.dp))
                }
                state.notice?.let { Text(it, color = Muted, fontSize = 11.sp) }
                IosLoginField("E-mail ou nom d’utilisateur", state.email, actions.email, enabled = !state.busy)
                Spacer(Modifier.height(10.dp))
                IosLoginField("Mot de passe", state.password, actions.password,
                    secret = true, enabled = !state.busy, onDone = submit)
                TextButton(onClick = { actions.navigate(AuthPage.Forgot) }, enabled = !state.busy,
                    modifier = Modifier.align(Alignment.End).height(32.dp), contentPadding = PaddingValues(0.dp)) {
                    Text("Mot de passe oublié ?", color = Muted, fontSize = 10.sp)
                }
                IosAuthAction("Se connecter", state.busy, submit)
            }
        }
        if (!typingLayout) Box(Modifier.fillMaxWidth().height(stageHeight + AuthStageOverlap)) {
            IosStageBackdrop(Modifier.fillMaxSize(), light = { 1f }, sweepPhase = { sweep.value })
            Image(painterResource(R.drawable.auth_web_signature), null,
                Modifier.align(Alignment.BottomCenter).padding(bottom = 36.dp).size(54.dp)
                    .graphicsLayer {
                        rotationY = rotation.value
                        cameraDistance = 12f * density
                        translationY = levitation.value * density
                    })
        }
    }
}

@Composable
private fun IosLoginField(label: String, value: String, onValue: (String) -> Unit,
                          secret: Boolean = false, enabled: Boolean = true, onDone: () -> Unit = {}) {
    var visible by rememberSaveable { mutableStateOf(false) }
    TextField(value = value, onValueChange = onValue, singleLine = true, enabled = enabled,
        modifier = Modifier.fillMaxWidth().then(rememberKeyboardFieldModifier()), shape = RoundedCornerShape(15.dp),
        placeholder = { Text(label, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis) },
        leadingIcon = { Icon(if (secret) Icons.Outlined.Lock else Icons.Outlined.PersonOutline, null,
            Modifier.size(21.dp), tint = Muted) },
        trailingIcon = if (secret) { {
            IconButton(onClick = { visible = !visible }, enabled = enabled) {
                Icon(if (visible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                    if (visible) "Masquer le mot de passe" else "Afficher le mot de passe", tint = Muted)
            }
        } } else null,
        visualTransformation = if (secret && !visible) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = if (secret) KeyboardType.Password else KeyboardType.Text,
            imeAction = if (secret) ImeAction.Done else ImeAction.Next, autoCorrectEnabled = false),
        keyboardActions = KeyboardActions(onDone = { onDone() }),
        colors = TextFieldDefaults.colors(
            unfocusedContainerColor = Color(0xFF08080A), focusedContainerColor = Color(0xFF0D0B12),
            unfocusedIndicatorColor = Color.Transparent, focusedIndicatorColor = Color.Transparent,
            disabledIndicatorColor = Color.Transparent, cursorColor = Violet,
            unfocusedPlaceholderColor = Muted, focusedPlaceholderColor = Muted))
}

@Composable
internal fun IosAuthDivider() = HorizontalDivider(thickness = .5.dp, color = Color(0x335137A1))

@Composable
internal fun IosAuthAction(label: String, busy: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(15.dp)
    Button(onClick = onClick, enabled = !busy, shape = shape,
        modifier = Modifier.fillMaxWidth().height(48.dp).clip(shape)
            .background(Brush.verticalGradient(listOf(Color(0xFF5137A1), Color(0xFF4E349F), Color(0xFF372574)))),
        border = BorderStroke(.5.dp, Color(0xFF7960B2)),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent,
            disabledContainerColor = Color.Transparent, contentColor = Color.White)) {
        if (busy) CircularProgressIndicator(Modifier.size(21.dp), color = Color.White, strokeWidth = 2.dp)
        else Text(label, fontWeight = FontWeight.Bold, fontSize = 13.sp)
    }
}
