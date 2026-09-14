package com.meewav.android.app

import android.app.Application
import com.meewav.android.core.auth.MeewavAuthRepository

class MeewavApplication : Application() {
    val authRepository by lazy { MeewavAuthRepository(this) }
}
