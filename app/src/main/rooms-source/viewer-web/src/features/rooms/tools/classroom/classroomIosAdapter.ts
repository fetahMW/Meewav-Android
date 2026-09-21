/** Adapter over the canonical iOS Classe RPCs; no duplicate classroom state store. */
export async function readClasse(client:any,roomId:string,control=false){
 const {data,error}=await client.rpc(control?'rooms_classe_host_state_v1':'rooms_classe_viewer_state_v1',{p_room_id:roomId});
 if(error)throw error;if(!data?.room)throw Error('classe_state_missing');return data;
}
const person=(u:any)=>({id:u.user_id,name:u.username||'Artiste',avatarUrl:u.avatar_url||'',role:u.artist_type||'',microphone:'off',camera:'off'});
export async function projectClasse(client:any,roomId:string,control=false){
 const data=await readClasse(client,roomId,control);
 const {data:{user}}=await client.auth.getUser();
 const people=[...(data.backstage??[]),...(data.onstage??[])].map(row=>person(row.user));
 const teacherId=data.room.host_id??null;
 const admitted=control||['backstage','onstage'].includes(data.self_participation?.status);
 if(admitted&&user&&!people.some(p=>p.id===user.id)&&!control){const profile=await client.rpc('rooms_classe_profile_projection_v1',{p_user_id:user.id});if(profile.error)throw profile.error;if(profile.data)people.push(person(profile.data));}
 const floors=data.floor_requests??[data.self_floor_request&&{...data.self_floor_request,user:user?{user_id:user.id}:null},data.floor_speaker].filter(Boolean);
 const speaker=data.floor_speaker?.user?.user_id??floors.find(f=>f.status==='granted')?.user?.user_id??null;
 const hands=floors.filter(f=>f.status==='requested'&&f.user).map(f=>({personId:f.user.user_id,raisedAt:f.requested_at}));
 return {roomId,roomType:'classe',revision:data.state_revision,updatedAt:new Date().toISOString(),audience:{eligible:admitted,actorRole:control?'teacher':data.self_participation&&['backstage','onstage'].includes(data.self_participation.status)?'premium_participant':'viewer'},gifts:{stock:[],transactions:[],redemptions:[],purchaseEnabled:false},classe:{teacherId,people,handsOpen:data.room.hands_open,questionsOpen:data.room.questions_open,raisedHands:hands,activeSpeakerId:speaker,publicCallStudentId:speaker,privateTalkStudentId:null,screenShareOwnerId:null,seatsLocked:true,seatPriceCents:0,featuredQuestionId:null,resources:[],questions:(data.questions??[]).map(q=>({id:q.id,author:person(q.user),text:q.body,status:'pending',sentAt:q.created_at,supports:q.like_count,supporterIds:q.current_user_has_liked&&user?[user.id]:[]})),seats:Array.from({length:24},(_,i)=>({number:i+1,person:people[i],status:!people[i]?'free':people[i].id===speaker?'speaking':hands.some(h=>h.personId===people[i].id)?'hand-raised':'listening',canSpeak:people[i]?.id===speaker,canShareScreen:false,handRaised:hands.some(h=>h.personId===people[i]?.id)}))}};
}
export async function executeClasse(client:any,roomId:string,command:any,control:boolean){
 const data=await readClasse(client,roomId,control);
 let name:string,args:any;
 switch(command.type){
 case 'classe.hand.raise':{
  if(!window.confirm('Demander la parole et autoriser ton micro lorsque le professeur te la donne ?'))throw Error('Demande annulée.');
  const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});stream.getTracks().forEach(track=>track.stop());
  name='rooms_classe_request_floor_v1';args={p_room_id:roomId,p_microphone_ready:true,p_audio_consent:true,p_consent_version:data.room.media_consent_version,p_client_request_id:crypto.randomUUID()};break;
 }
 case 'classe.question.add':name='rooms_classe_submit_question_v1';args={p_room_id:roomId,p_body:command.question.text,p_client_request_id:command.question.id};break;
 case 'classe.question.support':name='rooms_classe_toggle_question_like_v1';args={p_question_id:command.questionId,p_should_like:!(data.questions??[]).find(q=>q.id===command.questionId)?.current_user_has_liked};break;
 case 'classe.questions.open':name='rooms_classe_configure_v1';args={p_room_id:roomId,p_applications_open:data.room.applications_open,p_questions_open:command.open};break;
 case 'classe.question.status':name='rooms_classe_resolve_question_v1';args={p_question_id:command.questionId,p_resolution:command.status==='answered'?'answered':'dismissed'};break;
 case 'classe.hands.open':name='rooms_classe_set_hands_open_v1';args={p_room_id:roomId,p_hands_open:command.open};break;
 case 'classe.hand.lower-own':name='rooms_classe_cancel_floor_v1';args={p_request_id:data.self_floor_request?.id};break;
 case 'classe.speaker.end-own':name='rooms_classe_release_floor_v1';args={p_request_id:data.self_floor_request?.id,p_reason:'participant_released'};break;
 case 'classe.speaker':{const request=(data.floor_requests??[]).find(f=>f.user.user_id===command.personId);name='rooms_classe_grant_floor_v1';args={p_request_id:request?.id};break;}
 default:throw Error('Cette commande nécessite encore son raccordement Classe.');
 }
 const {error}=await client.rpc(name,args);if(error)throw error;
 return projectClasse(client,roomId,control);
}
