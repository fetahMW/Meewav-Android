package com.meewav.android.core.design

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.material3.LocalContentColor
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.meewav.android.R

val Violet = Color(0xFF9B6AFF)
val Muted = Color(0xFFB5B1C2)
val Ink = Color(0xFF08080D)
val MeewavFont = FontFamily(
    Font(R.font.inter_variable, FontWeight.Normal),
    Font(R.font.inter_variable, FontWeight.Medium),
    Font(R.font.inter_variable, FontWeight.SemiBold),
    Font(R.font.inter_variable, FontWeight.Bold),
    Font(R.font.inter_variable, FontWeight.ExtraBold),
)

@Composable
fun MeewavTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Violet, onPrimary = Color.White,
            background = Ink, onBackground = Color(0xFFF8F7FC),
            surface = Color(0xFF0D0C13), onSurface = Color(0xFFF8F7FC),
            onSurfaceVariant = Muted, outline = Color(0xFF35313F),
            error = Color(0xFFFFA4B0),
        ),
        typography = Typography(
            bodyLarge = TextStyle(fontFamily = MeewavFont, fontSize = 15.sp, lineHeight = 23.sp),
            bodyMedium = TextStyle(fontFamily = MeewavFont, fontSize = 13.sp, lineHeight = 20.sp),
            bodySmall = TextStyle(fontFamily = MeewavFont, fontSize = 12.sp, lineHeight = 18.sp),
            titleLarge = TextStyle(fontFamily = MeewavFont, fontWeight = FontWeight.Bold, fontSize = 25.sp, lineHeight = 31.sp),
            titleMedium = TextStyle(fontFamily = MeewavFont, fontWeight = FontWeight.SemiBold, fontSize = 17.sp, lineHeight = 24.sp),
            labelLarge = TextStyle(fontFamily = MeewavFont, fontWeight = FontWeight.Bold, fontSize = 15.sp),
        ),
        content = {
            // The auth backdrop is drawn on a Canvas/Box, not a Material Surface.
            // Explicitly provide light foreground content for all uncoloured labels.
            CompositionLocalProvider(LocalContentColor provides MaterialTheme.colorScheme.onSurface, content = content)
        },
    )
}
