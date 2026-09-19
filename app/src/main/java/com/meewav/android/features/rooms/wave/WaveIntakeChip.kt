package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Same component in guest requests and Wave proposals. */
@Composable
internal fun WaveIntakeChip(open: Boolean, onClick: () -> Unit) {
    Box(Modifier.height(44.dp).semantics { role = Role.Switch; stateDescription = if (open) "Ouvert" else "Fermé" }
        .clickable(onClick = onClick), contentAlignment = Alignment.Center) {
        Row(Modifier.hifiBlackSurface(14.dp).padding(horizontal = 12.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
            Box(Modifier.size(6.dp).background(if (open) Color(0xFF86B69B) else Color(0xFFC88B90), CircleShape))
            Text(if (open) "Ouvert" else "Fermé", color = Color(0xFFD8D8DF), fontSize = 11.sp, maxLines = 1)
        }
    }
}
