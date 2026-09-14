package com.meewav.android.features.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.meewav.android.core.auth.AuthPolicy
import com.meewav.android.core.auth.MeewavAuthRepository
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

enum class AuthPage { Login, Register, Forgot, CheckEmail, NewPassword, SignedIn }

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
)

class AuthViewModel(private val repository: MeewavAuthRepository) : ViewModel() {
    private val mutable = MutableStateFlow(AuthUiState(configured = repository.configured, initializing = repository.configured))
    val state = mutable.asStateFlow()
    private var recoveryInProgress = false

    init {
        if (repository.configured) viewModelScope.launch {
            repository.auth.sessionStatus.collect { status ->
                when (status) {
                    is SessionStatus.Authenticated -> mutable.update {
                        it.copy(initializing = false,
                            page = if (recoveryInProgress) AuthPage.NewPassword else AuthPage.SignedIn,
                            connectedName = status.session.user?.userMetadata?.get("username")?.jsonPrimitive?.contentOrNull.orEmpty(),
                            email = status.session.user?.email ?: it.email,
                            password = "", confirmation = "", error = null)
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

    fun navigate(page: AuthPage) {
        if (state.value.busy) return
        mutable.update { it.copy(page = page, password = "", confirmation = "", error = null, notice = null) }
    }

    fun submit() {
        val draft = state.value
        if (draft.busy || draft.initializing) return
        if (!draft.configured) {
            mutable.update { it.copy(error = "La connexion n’est pas disponible dans cette version de l’application.") }
            return
        }
        val validation = when (draft.page) {
            AuthPage.Register -> AuthPolicy.signupError(draft.username, draft.email, draft.password, draft.confirmation)
            AuthPage.Login -> AuthPolicy.emailError(draft.email) ?: if (draft.password.isEmpty()) "Entre ton mot de passe." else null
            AuthPage.Forgot -> AuthPolicy.emailError(draft.email)
            AuthPage.NewPassword -> when {
                draft.password.length < 8 -> "Choisis un mot de passe d’au moins 8 caractères."
                draft.password != draft.confirmation -> "Les mots de passe ne correspondent pas."
                else -> null
            }
            else -> return
        }
        if (validation != null) { mutable.update { it.copy(error = validation) }; return }
        execute {
            when (draft.page) {
                AuthPage.Login -> repository.signIn(draft.email, draft.password)
                AuthPage.Register -> {
                    repository.signUp(draft.username, draft.email, draft.password)
                    if (repository.auth.currentSessionOrNull() == null) mutable.update {
                        it.copy(page = AuthPage.CheckEmail, password = "", confirmation = "",
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
        if (state.value.busy) return
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

    fun signOut() = execute {
        repository.signOut()
        recoveryInProgress = false
        mutable.update { AuthUiState(initializing = false, configured = repository.configured) }
    }

    private fun execute(action: suspend () -> Unit) {
        if (state.value.busy) return
        mutable.update { it.copy(busy = true, error = null, notice = null) }
        viewModelScope.launch {
            try { action() }
            catch (cancelled: CancellationException) { throw cancelled }
            catch (error: Exception) { mutable.update { it.copy(error = MeewavAuthRepository.messageFor(error)) } }
            finally { mutable.update { it.copy(busy = false) } }
        }
    }
}
