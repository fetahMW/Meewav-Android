package com.meewav.android.features.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.meewav.android.BuildConfig
import com.meewav.android.core.auth.AuthPolicy
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
import kotlinx.serialization.json.JsonPrimitive

enum class AuthPage { Login, Avatar, Register, Location, Forgot, CheckEmail, NewPassword, SignedIn, Preview }

data class ProfileDraft(
    val avatarIcon: String = "UserFIcon",
    val realArtist: Boolean = true,
    val birthDate: String = "",
    val city: String = "",
    val postalCode: String = "",
    val country: String = "France",
    val acceptsTerms: Boolean = false,
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
    val profile: ProfileDraft = ProfileDraft(),
)

class AuthViewModel(private val repository: MeewavAuthRepository) : ViewModel() {
    private val mutable = MutableStateFlow(AuthUiState(configured = repository.configured, initializing = repository.configured))
    val state = mutable.asStateFlow()
    private var recoveryInProgress = false

    init {
        if (repository.configured) viewModelScope.launch {
            repository.auth.sessionStatus.collect { status ->
                if (state.value.localPreview) return@collect
                when (status) {
                    is SessionStatus.Authenticated -> mutable.update {
                        it.copy(initializing = false,
                            page = if (recoveryInProgress) AuthPage.NewPassword else AuthPage.SignedIn,
                            connectedName = (status.session.user?.userMetadata?.get("username") as? JsonPrimitive)?.contentOrNull.orEmpty(),
                            email = status.session.user?.email ?: it.email,
                            password = "", confirmation = "", error = null, profile = ProfileDraft())
                    }
                    is SessionStatus.NotAuthenticated -> mutable.update {
                        it.copy(initializing = false,
                            page = if (it.page == AuthPage.SignedIn || it.page == AuthPage.NewPassword) AuthPage.Login else it.page,
                            password = "", confirmation = "")
                    }
                    is SessionStatus.RefreshFailure -> mutable.update {
                        it.copy(initializing = false, error = "La session doit être actualisée. Vérifie ta connexion.")
                    }
                    SessionStatus.Initializing -> Unit
                }
            }
        }
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
        mutable.update {
            it.copy(localPreview = true, initializing = false, error = null, notice = null,
                email = "", username = "", password = "", confirmation = "", connectedName = "",
                page = if (it.page in setOf(AuthPage.Avatar, AuthPage.Register, AuthPage.Location)) it.page else AuthPage.Avatar)
        }
    }

    fun exitPreview() {
        if (!state.value.localPreview) return
        mutable.update { AuthUiState(initializing = false, configured = repository.configured) }
    }

    fun navigate(page: AuthPage) {
        if (state.value.busy) return
        if (page == AuthPage.Preview && !(BuildConfig.DEBUG && state.value.localPreview)) return
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
            AuthPage.Location -> navigate(AuthPage.Register)
            AuthPage.Register -> navigate(AuthPage.Avatar)
            AuthPage.NewPassword -> signOut()
            else -> navigate(AuthPage.Login)
        }
    }

    fun submit() {
        val draft = state.value
        if (draft.busy || draft.initializing) return
        if (draft.localPreview) {
            if (!BuildConfig.DEBUG) return
            val next = when (draft.page) {
                AuthPage.Avatar -> AuthPage.Register
                AuthPage.Register -> AuthPage.Location
                AuthPage.Location -> AuthPage.Preview
                else -> return
            }
            navigate(next)
            return
        }
        if (draft.page == AuthPage.Avatar) { navigate(AuthPage.Register); return }
        if (!draft.configured && draft.page != AuthPage.Register) {
            mutable.update { it.copy(error = "La connexion n’est pas disponible dans cette version de l’application.") }
            return
        }
        val validation = when (draft.page) {
            AuthPage.Register, AuthPage.Location -> AuthPolicy.signupError(draft.username, draft.email, draft.password, draft.confirmation)
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
                draft.profile.city.isBlank() || draft.profile.country.isBlank() -> "Indique ta ville et ton pays."
                !draft.profile.acceptsTerms -> "Consulte et accepte les conditions de cette version de test."
                else -> null
            }
            if (locationError != null) { mutable.update { it.copy(error = locationError) }; return }
        }
        execute {
            when (draft.page) {
                AuthPage.Login -> repository.signIn(draft.email, draft.password)
                AuthPage.Location -> {
                    val avatar = AvatarCatalog.find(draft.profile.avatarIcon)
                    repository.signUp(RegistrationProfile(draft.username, avatar.icon, avatar.name,
                        draft.profile.realArtist, draft.profile.birthDate, draft.profile.city,
                        draft.profile.postalCode, draft.profile.country), draft.email, draft.password)
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
                    mutable.update { it.copy(page = AuthPage.SignedIn, password = "", confirmation = "", notice = "Ton mot de passe a été mis à jour.") }
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
                mutable.update { it.copy(page = if (callback.recovery) AuthPage.NewPassword else AuthPage.SignedIn) }
            } catch (error: Exception) {
                recoveryInProgress = false
                throw error
            }
        }
    }

    fun signInSocial(provider: SocialAuthProvider) {
        if (state.value.busy || state.value.initializing || state.value.localPreview || state.value.page != AuthPage.Login) return
        if (!repository.configured) {
            mutable.update { it.copy(error = "La connexion n’est pas disponible dans cette version de l’application.") }
            return
        }
        recoveryInProgress = false
        execute { repository.signInSocial(provider) }
    }

    fun signOut() = execute {
        repository.signOut()
        recoveryInProgress = false
        mutable.update { AuthUiState(initializing = false, configured = repository.configured) }
    }

    private fun execute(action: suspend () -> Unit) {
        if (state.value.busy || state.value.localPreview) return
        mutable.update { it.copy(busy = true, error = null, notice = null) }
        viewModelScope.launch {
            try { action() }
            catch (cancelled: CancellationException) { throw cancelled }
            catch (error: Exception) { mutable.update { it.copy(error = MeewavAuthRepository.messageFor(error)) } }
            finally { mutable.update { it.copy(busy = false) } }
        }
    }
}
