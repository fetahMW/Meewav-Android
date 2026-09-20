package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*

/** Experiences offered to fans; separate from invitations to join the current live. */
@Composable internal fun LogeInvitationsPanel(state:LogeToolsState) {
    var creating by remember { mutableStateOf(false) }
    var type by remember { mutableStateOf("Concert") }
    var recipient by remember { mutableStateOf(state.selectedId) }
    var search by remember { mutableStateOf("") }
    var detail by remember { mutableStateOf("") }
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(9.dp)) {
        item { Row(verticalAlignment=Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) { Text("Un moment à offrir",color=Color.White,fontSize=16.sp,fontWeight=FontWeight.SemiBold);Text("Concert, rencontre ou scène partagée",color=sceneMuted,fontSize=11.sp) }
            SceneIcon(if(creating)WaveIcons.Close else Icons.Default.Add,if(creating)"Fermer la création"else"Créer une invitation"){creating=!creating}
        } }
        if(creating) {
            item { SceneCard {
                SceneChoice(type,listOf("Concert","Sur scène","Rencontre","Session studio").map{it to it}){type=it}
                OutlinedTextField(search,{search=it.take(80)},Modifier.fillMaxWidth(),singleLine=true,label={Text("Rechercher un fan")},colors=logeFieldColors())
                val people=state.people.filter { search.isBlank() || it.name.contains(search,true) }
                SceneChoice(state.people.find{it.id==recipient}?.name?:"Choisir un fan",people.map{it.id to it.name}){recipient=it}
                OutlinedTextField(detail,{detail=it.take(240)},Modifier.fillMaxWidth(),label={Text("Date, lieu et attention offerte")},placeholder={Text(when(type){"Concert"->"Deux places · Paris · date à convenir";"Sur scène"->"Un morceau ensemble lors du prochain show";"Rencontre"->"Rencontre après le concert · 20 minutes";else->"Assister à une séance d’enregistrement"})},minLines=2,maxLines=3,colors=logeFieldColors())
                SceneButton("Préparer l’invitation",Modifier.fillMaxWidth(),primary=true,icon=Icons.Default.CardGiftcard){if(state.offerExperience(recipient,type,detail)){creating=false;detail=""}else if(detail.isBlank())state.notice="Précise le moment que tu souhaites offrir."}
            } }
        }
        if(state.data.experiences.isEmpty() && !creating)item { SceneCard {
            Icon(Icons.Default.LocalActivity,null,tint=sceneAccent,modifier=Modifier.size(28.dp))
            Text("Offre à tes fans un souvenir à partager.",color=Color.White,fontSize=14.sp)
            Text("Choisis une expérience et son destinataire, puis retrouve ici sa réponse et les détails à organiser.",color=sceneMuted,fontSize=12.sp)
            SceneButton("Créer une invitation",Modifier.fillMaxWidth(),primary=true,icon=Icons.Default.Add){creating=true}
        } }
        items(state.data.experiences,key={it.id}) { invite -> SceneCard {
            val person=state.people.find{it.id==invite.personId}
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(9.dp)) {
                if(person!=null)LogePortrait(state,person,36.dp)
                Column(Modifier.weight(1f)){Text(person?.name?:"Fan",color=Color.White,fontSize=13.sp,fontWeight=FontWeight.SemiBold);Text(invite.type,color=sceneAccent,fontSize=11.sp)}
                if(person!=null)SceneIcon(WaveIcons.Chat,"Contacter "+person.name){state.message(person.id)}
            }
            Text(invite.detail,color=Color.White,fontSize=12.sp)
            Text(when(invite.status){"pending"->"Préparée · en attente de réponse simulée";"accepted"->"Acceptée · à organiser";"declined"->"Déclinée";"completed"->"Expérience réalisée";else->"Annulée"},color=if(invite.status=="accepted")logeGreen else sceneMuted,fontSize=10.sp)
            if(invite.status=="pending" && com.meewav.android.BuildConfig.DEBUG)Row(horizontalArrangement=Arrangement.spacedBy(6.dp)) {
                SceneButton("Accepter · démo",Modifier.weight(1f)){state.experienceStatus(invite.id,"accepted")}
                SceneButton("Décliner · démo",Modifier.weight(1f)){state.experienceStatus(invite.id,"declined")}
            }
            if(invite.status in setOf("pending","accepted"))Row(horizontalArrangement=Arrangement.spacedBy(6.dp)) {
                if(invite.status=="accepted")SceneButton("Marquer réalisée",Modifier.weight(1f),icon=Icons.Default.Check){state.experienceStatus(invite.id,"completed")}
                SceneButton("Annuler"){state.experienceStatus(invite.id,"cancelled")}
            }
        } }
        item { Text("Invitations conservées dans cet atelier de démonstration. Aucun envoi à un compte réel.",color=sceneMuted,fontSize=10.sp) }
    }
}
