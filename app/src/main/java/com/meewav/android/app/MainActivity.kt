package com.meewav.android.app

import android.content.Intent
import android.content.pm.ActivityInfo
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.SystemBarStyle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.meewav.android.core.design.MeewavTheme
import com.meewav.android.features.auth.AuthScreen
import com.meewav.android.features.auth.AuthViewModel
import com.meewav.android.features.auth.AuthPage
import com.meewav.android.features.messaging.MessagingActivity
import com.meewav.android.features.profile.ProfileActivity
import com.meewav.android.BuildConfig

class MainActivity : ComponentActivity() {
    companion object {
        const val EXTRA_OPEN_GLOBE = "com.meewav.android.OPEN_GLOBE"
        // Temporary Profile workshop entry. Set false to restore authentication.
        private const val OPEN_PROFILE_WORKSHOP = true
    }
    private lateinit var authViewModel: AuthViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (BuildConfig.DEBUG && OPEN_PROFILE_WORKSHOP && intent.action != Intent.ACTION_VIEW
            && !intent.getBooleanExtra(EXTRA_OPEN_GLOBE, false)) {
            startActivity(Intent(this, ProfileActivity::class.java).putExtra("preview", true))
            finish()
            return
        }
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.rgb(8, 8, 13)),
        )
        authViewModel = ViewModelProvider(this, object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                AuthViewModel((application as MeewavApplication).authRepository) as T
        })[AuthViewModel::class.java]
        if (savedInstanceState == null) handleAuthIntent(intent)
        setContent {
            val state by authViewModel.state.collectAsStateWithLifecycle()
            val landscape = state.page == AuthPage.Preview || state.page == AuthPage.Globe
            LaunchedEffect(landscape) { applyDisplayMode(landscape) }
            MeewavTheme { AuthScreen(state, authViewModel, onCloseApp = { finishAndRemoveTask() },
                onOpenMessages = { startActivity(Intent(this, MessagingActivity::class.java)) }) }
        }
    }

    private fun applyDisplayMode(landscape: Boolean) {
        val orientation = if (landscape) ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            else ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        if (requestedOrientation != orientation) requestedOrientation = orientation
        WindowCompat.getInsetsController(window, window.decorView).apply {
            if (landscape) {
                systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                hide(WindowInsetsCompat.Type.systemBars())
            } else {
                systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_DEFAULT
                show(WindowInsetsCompat.Type.systemBars())
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleAuthIntent(intent)
    }

    private fun handleAuthIntent(intent: Intent?) {
        // The debug workshop can open a feature without an existing globe activity.
        if (BuildConfig.DEBUG && intent?.getBooleanExtra(EXTRA_OPEN_GLOBE, false) == true) {
            authViewModel.navigate(AuthPage.Globe)
            intent.removeExtra(EXTRA_OPEN_GLOBE)
            return
        }
        if (intent?.action == Intent.ACTION_VIEW) intent.dataString?.let(authViewModel::handleCallback)
    }
}
