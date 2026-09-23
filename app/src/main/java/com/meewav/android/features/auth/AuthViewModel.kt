package com.meewav.android.features.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.meewav.android.BuildConfig
import com.meewav.android.core.auth.AuthPolicy
import com.meewav.android.core.auth.CanonicalAvatar
import com.meewav.android.core.auth.MeewavAuthRepository
import com.meewav.android.core.auth.RegistrationProfile
import com.meewav.android.core.auth.SocialAuthProvider
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonPrimitive

enum class AuthPage { Login, Avatar, Register, Location, Forgot, CheckEmail, NewPassword, SignedIn, Preview, Globe }

data class ProfileDraft(
    val avatarIcon: String = "UserFIcon",
    val realArtist: Boolean = true,
    val birthDate: String = "",
    val city: String = "",
    val postalCode: String = "",
    val country: String = "France",
    val acceptsTerms: Boolean = false,
    val communeCode: String = "",
    val musicScene: MusicScene? = null,
    val visibleOnScene: Boolean = true,
)

data class GlobeHomeScene(
    val longitude: Double,
    val latitude: Double,
    val communeCode: String,
    val zoneId: String,
    val label: String,
    val profileId: String,
)

data class AuthUiState(
    val page: AuthPage = AuthPage.Login,
    val email: String = "",
    val username: String = "",
    val password: String = "",
    val confirmation: String = "",
    val busy: Boolean = false,
    val initializing: Boolean = true,
    val configured: Boolean = true,
    val error: String? = null,
    val notice: String? = null,
    val connectedName: String = "",
    val localPreview: Boolean = false,
    val modeSelected: Boolean = true,
    val authenticated: Boolean = false,
    val onboardingComplete: Boolean = false,
    val profile: ProfileDraft = ProfileDraft(),
    val homeScene: GlobeHomeScene? = null,
)

class AuthViewModel(private val repository: MeewavAuthRepository, preview: Boolean = BuildConfig.DEBUG) : ViewModel() {
    private val mutable = MutableStateFlow(AuthUiState(configured = repository.configured,
        initializing = repository.configured && !preview, localPreview = false, modeSelected = !preview))
    val state = mutable.asStateFlow()
    private var recoveryInProgress = false
    private var routedUserId: String? = null
    // Choosing the real application is an explicit login boundary. An old
    // encrypted session must not skip the form or open the Globe by itself.
    private var explicitLoginRequired = false

    init {
        if (repository.configured) viewModelScope.launch {
            repository.auth.sessionStatus.collect { status ->
                if (state.value.localPreview || !state.value.modeSelected || explicitLoginRequired) return@collect
                when (status) {
                    is SessionStatus.Authenticated -> {
                        // Refreshes must not reset the current screen or an OAuth draft.
                        if (!state.value.busy && routedUserId != status.session.user?.id) {
                            try { routeAuthenticated() }
                            catch (error: Exception) {
                                if (error is CancellationException) throw error
                                mutable.update { it.copy(initializing = false, error = MeewavAuthRepository.messageFor(error)) }
                            }
                        }
                    }
                    is SessionStatus.NotAuthenticated -> {
                        routedUserId = null
                        mutable.update { it.copy(initializing = false, authenticated = false, onboardingComplete = false,
                            page = if (it.authenticated || it.page == AuthPage.NewPassword) AuthPage.Login else it.page,
                            password = "", confirmation = "") }
                    }
                    is SessionStatus.RefreshFailure -> mutable.update {
                        it.copy(initializing = false, error = "La session doit être actualisée. Vérifie ta connexion.")
                    }
                    SessionStatus.Initializing -> Unit
                }
            }
        }
    }

    private suspend fun routeAuthenticated() {
        val user = repository.auth.currentUserOrNull() ?: return
        if (recoveryInProgress) {
            mutable.update { it.copy(page = AuthPage.NewPassword, initializing = false, authenticated = true) }
            return
        }
        val identity = repository.ownerIdentity()
        if (repository.auth.currentUserOrNull()?.id != user.id) return
        val completed = identity["onboarding_completed_at"]?.jsonPrimitive?.contentOrNull != null
        val saved = repository.avatarChoice()
        val icon = saved?.first ?: CanonicalAvatar.iconForStyle(identity["avatar_style_key"]?.jsonPrimitive?.contentOrNull)
        val username = identity["username"]?.jsonPrimitive?.contentOrNull.orEmpty()
        val longitude = identity["longitude"]?.jsonPrimitive?.doubleOrNull
        val latitude = identity["latitude"]?.jsonPrimitive?.doubleOrNull
        val homeScene = if (longitude != null && latitude != null && longitude in -180.0..180.0 && latitude in -90.0..90.0)
            GlobeHomeScene(longitude, latitude,
                identity["commune_code"]?.jsonPrimitive?.contentOrNull.orEmpty(),
                identity["zone_id"]?.jsonPrimitive?.contentOrNull.orEmpty(),
                identity["scene_name"]?.jsonPrimitive?.contentOrNull.orEmpty(), user.id)
        else null
        routedUserId = user.id
        mutable.update { it.copy(initializing = false, authenticated = true, onboardingComplete = completed,
            page = if (completed) AuthPage.Globe else AuthPage.Register,
            email = user.email.orEmpty(), username = username.ifBlank { it.username }, connectedName = username,
            password = "", confirmation = "", error = null,
            profile = it.profile.copy(avatarIcon = icon ?: it.profile.avatarIcon,
                realArtist = saved?.second ?: (identity["artist_type"]?.jsonPrimitive?.contentOrNull != "IA")),
            homeScene = homeScene) }
    }

    fun email(value: String) { mutable.update { it.copy(email = value, error = null) } }
    fun username(value: String) { mutable.update { it.copy(username = value, error = null) } }
    fun password(value: String) { mutable.update { it.copy(password = value, error = null) } }
    fun confirmation(value: String) { mutable.update { it.copy(confirmation = value, error = null) } }
    fun profile(value: ProfileDraft) {
        if (!state.value.busy) mutable.update { it.copy(profile = value, error = null) }
    }

    fun startPreview() {
        if (!BuildConfig.DEBUG || state.value.busy) return
        routedUserId = null
        mutable.update {
            it.copy(localPreview = true, modeSelected = true, authenticated = false, onboardingComplete = false,
                initializing = false, error = null, notice = null,
                email = "", username = "", password = "", confirmation = "", connectedName = "",
                page = AuthPage.Login)
        }
    }

    fun selectReal() {
        if (state.value.busy) return
        routedUserId = null
        explicitLoginRequired = true
        mutable.update { AuthUiState(configured = repository.configured, initializing = repository.configured,
            modeSelected = true, localPreview = false) }
        if (!repository.configured) return
        viewModelScope.launch {
            try {
                repository.auth.awaitInitialization()
                if (state.value.localPreview || !state.value.modeSelected) return@launch
                // Sign out locally so registration and every feature start
                // from the account deliberately entered on this device.
                if (repository.auth.currentSessionOrNull() != null) repository.signOut()
                mutable.update { it.copy(initializing = false, page = AuthPage.Login,
                    authenticated = false, onboardingComplete = false) }
            } catch (cancel: CancellationException) { throw cancel }
            catch (error: Exception) { mutable.update { it.copy(initializing = false,
                error = MeewavAuthRepository.messageFor(error)) } }
        }
    }

    fun exitPreview() {
        if (!BuildConfig.DEBUG || state.value.busy || !state.value.modeSelected) return
        routedUserId = null
        mutable.update { AuthUiState(initializing = false, configured = repository.configured,
            modeSelected = false) }
    }

    fun navigate(page: AuthPage) {
        if (state.value.busy || !state.value.modeSelected) return
        if (page in setOf(AuthPage.Preview, AuthPage.Globe) &&
            !(BuildConfig.DEBUG && state.value.localPreview) && !state.value.onboardingComplete) return
        if (page == AuthPage.Login && state.value.localPreview) { exitPreview(); return }
        mutable.update {
            val preserve = it.page in setOf(AuthPage.Avatar, AuthPage.Register, AuthPage.Location) &&
                page in setOf(AuthPage.Avatar, AuthPage.Register, AuthPage.Location)
            it.copy(page = page, password = if (preserve) it.password else "",
                confirmation = if (preserve) it.confirmation else "", error = null, notice = null,
                profile = if (page == AuthPage.Login) ProfileDraft() else it.profile)
        }
    }

    fun back() {
        when (state.value.page) {
            AuthPage.Globe -> navigate(AuthPage.Preview)
            AuthPage.Preview -> navigate(AuthPage.Location)
            AuthPage.Location -> navigate(AuthPage.Register)
            AuthPage.Register -> navigate(AuthPage.Avatar)
            AuthPage.NewPassword -> signOut()
            else -> navigate(AuthPage.Login)
        }
    }

    fun submit() {
        val draft = state.value
        if (draft.busy || draft.initializing || !draft.modeSelected) return
        if (draft.localPreview) {
            if (!BuildConfig.DEBUG) return
            val next = when (draft.page) {
                AuthPage.Login -> AuthPage.Avatar
                AuthPage.Avatar -> AuthPage.Register
                AuthPage.Register -> AuthPage.Location
                AuthPage.Location -> AuthPage.Preview
                AuthPage.Preview -> AuthPage.Globe
                else -> return
            }
            navigate(next)
            return
        }
        if (draft.page == AuthPage.Preview && draft.onboardingComplete) { navigate(AuthPage.Globe); return }
        if (draft.page == AuthPage.Avatar) { navigate(AuthPage.Register); return }
        if (!draft.configured && draft.page != AuthPage.Register) {
            mutable.update { it.copy(error = "La connexion n’est pas disponible dans cette version de l’application.") }
            return
        }
        val validation = when (draft.page) {
            AuthPage.Register, AuthPage.Location -> (if (draft.authenticated) AuthPolicy.usernameError(draft.username)
                else AuthPolicy.signupError(draft.username, draft.email, draft.password, draft.confirmation))
                ?: if (draft.profile.birthDate.isNotBlank() && RegistrationProfile.normalizedBirthDate(draft.profile.birthDate) == null)
                    "Entre une date de naissance valide au format JJ/MM/AAAA." else null
            AuthPage.Login -> when {
                draft.email.isBlank() -> "Entre ton e-mail ou ton nom d’utilisateur."
                draft.email.contains('@') && AuthPolicy.emailError(draft.email) != null -> AuthPolicy.emailError(draft.email)
                draft.password.isEmpty() -> "Entre ton mot de passe."
                else -> null
            }
            AuthPage.Forgot -> AuthPolicy.emailError(draft.email)
            AuthPage.NewPassword -> when {
                draft.password.length < 8 -> "Choisis un mot de passe d’au moins 8 caractères."
                draft.password != draft.confirmation -> "Les mots de passe ne correspondent pas."
                else -> null
            }
            else -> return
        }
        if (validation != null) { mutable.update { it.copy(error = validation) }; return }
        if (draft.page == AuthPage.Register) { navigate(AuthPage.Location); return }
        if (draft.page == AuthPage.Location) {
            val locationError = when {
                draft.profile.communeCode.isBlank() || draft.profile.musicScene == null -> "Choisis la scène musicale que tu veux rejoindre."
                else -> null
            }
            if (locationError != null) { mutable.update { it.copy(error = locationError) }; return }
        }
        execute {
            when (draft.page) {
                AuthPage.Login -> { repository.signIn(draft.email, draft.password); explicitLoginRequired = false; routeAuthenticated() }
                AuthPage.Location -> {
                    val avatar = AvatarCatalog.find(draft.profile.avatarIcon)
                    val registration = RegistrationProfile(draft.username, avatar.icon, avatar.name,
                        draft.profile.realArtist, draft.profile.birthDate, draft.profile.city,
                        draft.profile.postalCode, draft.profile.country,
                        communeCode = draft.profile.communeCode,
                        zoneId = draft.profile.musicScene?.zoneId.orEmpty(),
                        sceneName = draft.profile.musicScene?.label.orEmpty(),
                        sceneSource = draft.profile.musicScene?.source.orEmpty(),
                        sceneLongitude = draft.profile.musicScene?.center?.getOrNull(0),
                        sceneLatitude = draft.profile.musicScene?.center?.getOrNull(1),
                        visibleOnScene = draft.profile.visibleOnScene)
                    if (draft.authenticated) repository.completeRegistration(registration)
                    else repository.signUp(registration, draft.email, draft.password)
                    if (repository.auth.currentSessionOrNull() != null) {
                        explicitLoginRequired = false
                        routeAuthenticated()
                        mutable.update { it.copy(page = AuthPage.Preview) }
                    }
                    if (repository.auth.currentSessionOrNull() == null) mutable.update {
                        it.copy(page = AuthPage.CheckEmail, password = "", confirmation = "", profile = ProfileDraft(),
                            notice = "Vérifie tes e-mails pour confirmer ton adresse, puis connecte-toi.")
                    }
                }
                AuthPage.Forgot -> {
                    repository.requestRecovery(draft.email)
                    mutable.update { it.copy(page = AuthPage.CheckEmail,
                        notice = "Si un compte correspond à cette adresse, tu recevras un lien pour choisir un nouveau mot de passe.") }
                }
                AuthPage.NewPassword -> {
                    repository.updatePassword(draft.password)
                    recoveryInProgress = false
                    routeAuthenticated()
                }
                else -> Unit
            }
        }
    }

    fun handleCallback(raw: String) {
        if (state.value.busy || state.value.localPreview) return
        val callback = AuthPolicy.callback(raw)
        if (callback == null) { mutable.update { it.copy(error = "Ce lien de connexion est invalide ou a expiré.") }; return }
        execute {
            recoveryInProgress = callback.recovery
            try {
                repository.auth.awaitInitialization()
                repository.exchangeCode(callback.code)
                explicitLoginRequired = false
                routeAuthenticated()
            } catch (error: Exception) {
                recoveryInProgress = false
                throw error
            }
        }
    }

    fun signInSocial(provider: SocialAuthProvider) {
        if (state.value.busy || state.value.initializing || state.value.localPreview || state.value.page != AuthPage.Register) return
        if (!repository.configured) {
            mutable.update { it.copy(error = "La connexion n’est pas disponible dans cette version de l’application.") }
            return
        }
        recoveryInProgress = false
        repository.saveAvatarChoice(state.value.profile.avatarIcon, state.value.profile.realArtist)
        execute { repository.signInSocial(provider) }
    }

    fun signOut() = execute {
        repository.signOut()
        routedUserId = null
        explicitLoginRequired = false
        recoveryInProgress = false
        mutable.update { AuthUiState(initializing = false, configured = repository.configured,
            modeSelected = !BuildConfig.DEBUG) }
    }

    private fun execute(action: suspend () -> Unit) {
        if (state.value.busy || state.value.localPreview) return
        mutable.update { it.copy(busy = true, error = null, notice = null) }
        viewModelScope.launch {
            try { action() }
            catch (cancelled: CancellationException) { throw cancelled }
            catch (error: Exception) { mutable.update { it.copy(error = MeewavAuthRepository.messageFor(error),
                authenticated = repository.configured && repository.auth.currentSessionOrNull() != null) } }
            finally { mutable.update { it.copy(busy = false) } }
        }
    }
}
