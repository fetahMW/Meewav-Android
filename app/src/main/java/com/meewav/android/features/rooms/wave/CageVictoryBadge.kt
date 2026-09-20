package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
internal fun CageVictoryBadge(victories: Int, modifier: Modifier = Modifier) {
    if (victories <= 0) return
    val gold = Color(0xFFE4C47F)
    Row(modifier.semantics { contentDescription = "$victories victoire${if (victories > 1) "s" else ""}" }
        .background(Color(0xED17140F), RoundedCornerShape(7.dp)).padding(horizontal = 6.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Canvas(Modifier.size(17.dp, 14.dp)) {
            drawPath(Path().apply {
                moveTo(0f, size.height * .2f); lineTo(size.width * .25f, size.height * .45f)
                lineTo(size.width * .5f, 0f); lineTo(size.width * .75f, size.height * .45f)
                lineTo(size.width, size.height * .2f); lineTo(size.width * .86f, size.height * .92f)
                lineTo(size.width * .14f, size.height * .92f); close()
            }, gold)
        }
        Text("$victories", color = gold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}
