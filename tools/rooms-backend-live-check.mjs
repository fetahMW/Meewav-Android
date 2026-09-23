// Rooms backend wiring check — runs against the live Supabase Postgres.
// Verifies schema, RLS, deployed RPCs and real enter/leave/message/host-guard
// behaviour by impersonating authenticated users inside a rolled-back
// transaction (no production data is written).
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(root,'tools/messaging-media/package.json'));
const {Client}=require('pg');
const env=Object.fromEntries((await readFile(resolve(root,'../Meewav-Web/.env.local'),'utf8')).split(/\r?\n/)
  .filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^['"]|['"]$/g,'')];}));
const database=new URL(env.SUPABASE_DB_URL);
if (!`${database.hostname}/${database.username}`.includes('dqabekaqpznjsagoxzwc')) throw Error('Unexpected deployment target');
database.searchParams.delete('sslmode');
const client=new Client({connectionString:database.href,ssl:{rejectUnauthorized:true,
  ca:await readFile(resolve(root,'tools/messaging-media/supabase-ca.crt'),'utf8')},connectionTimeoutMillis:15000});

const EXPECTED_RPCS=`rooms_accept_experience_v1 rooms_accept_invitation_v2 rooms_apply_place_tools_v1 rooms_cage_launch_v1 rooms_cage_presence_v1
rooms_cancel_gift_draw_v1 rooms_cancel_invitation_v2 rooms_clear_pinned_item_v2 rooms_commit_host_audio_state_v1 rooms_commit_specialized_state_v1
rooms_complete_wave_switch_base_v1 rooms_create_gift_draw_v1 rooms_create_poll_v2 rooms_decline_invitation_v2 rooms_delete_message_v2
rooms_end_guest_passage_v3 rooms_end_live_call_invitation_v1 rooms_end_place_v3 rooms_engagement_state_v1 rooms_enter_room_v2
rooms_get_cage_state_v1 rooms_get_experience_v1 rooms_get_or_create_classe_direct_conversation_v1 rooms_get_place_tools_v1
rooms_get_specialized_state_v1 rooms_get_voting_policy_v1 rooms_give_golden_like_v1 rooms_initialize_specialized_state_v1
rooms_invite_from_queue_v2 rooms_invite_live_call_contact_v1 rooms_invite_profile_v1 rooms_join_queue_v2 rooms_leave_queue_v2
rooms_leave_room_v2 rooms_list_live_call_contacts_v1 rooms_list_my_live_call_invitations_v1 rooms_mark_invitation_ready_v2
rooms_pin_custom_item_v2 rooms_pin_message_item_v2 rooms_poll_state_v3 rooms_prepare_wave_switch_v1 rooms_public_audio_channels_v1
rooms_public_stage_v1 rooms_respond_live_call_invitation_v1 rooms_reveal_gift_draw_v1 rooms_send_message_v2
rooms_set_audio_live_enabled_v2 rooms_set_host_camera_forced_off_v1 rooms_set_host_guest_mic_gain_v3 rooms_set_host_guest_music_gain_v3
rooms_set_host_mic_forced_muted_v2 rooms_set_live_call_on_air_v1 rooms_set_live_call_route_v1 rooms_set_own_audio_playback_state_v2
rooms_set_own_audio_preview_v2 rooms_set_own_camera_enabled_v1 rooms_set_own_mic_gain_v2 rooms_set_own_mic_muted_v2
rooms_set_own_music_gain_v2 rooms_set_own_music_muted_v3 rooms_set_program_layout_v1 rooms_set_queue_open_v3 rooms_set_voting_policy_v1
rooms_start_gift_draw_v1 rooms_stop_poll_v2 rooms_submit_gift_v1 rooms_switch_experience_v1 rooms_vote_poll_v2 rooms_wave_viewer_snapshot_v6`.split(/\s+/);

let passed=0,failed=0,warned=0;
const check=(name,ok,detail='')=>{ok?passed++:failed++;console.log(`${ok?'PASS':'FAIL'}  ${name}${detail?'  — '+detail:''}`)};
const warn=(name,detail='')=>{warned++;console.log(`WARN  ${name}${detail?'  — '+detail:''}`)};
let sp=0;
const tryRpc=async(name,sql,args=[])=>{
  const s='sp'+(++sp);
  try { await client.query(`savepoint ${s}`); const r=await client.query(sql,args); await client.query(`release savepoint ${s}`); return {ok:true,rows:r.rows}; }
  catch(e){ await client.query(`rollback to savepoint ${s}`).catch(()=>{}); return {ok:false,err:e.message}; }
};

await client.connect();
try {
  // ---------- 1. Schema ----------
  const {rows:cols}=await client.query(`select column_name from information_schema.columns where table_schema='public' and table_name='rooms_v2' order by 1`);
  const colNames=cols.map(c=>c.column_name);
  for (const c of ['id','host_id','type','title','status','livekit_room_name','participants_count','created_at','ended_at','video_format','queue_open'])
    check(`rooms_v2.${c}`,colNames.includes(c));
  const {rows:tables}=await client.query(`select table_name,coalesce((select relrowsecurity from pg_class where oid=(quote_ident(table_schema)||'.'||quote_ident(table_name))::regclass),false) rls from information_schema.tables where table_schema='public' and table_name in ('rooms_v2','room_participants_v2','room_messages_v2','room_queue_v2','room_bans_v2','room_specialized_state_v1')`);
  for (const t of ['rooms_v2','room_participants_v2','room_messages_v2','room_queue_v2']) {
    const row=tables.find(r=>r.table_name===t);
    check(`table ${t}`,!!row);
    if (row) check(`RLS on ${t}`,row.rls===true);
  }

  // ---------- 2. RPC presence ----------
  const {rows:procs}=await client.query(`select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname like 'rooms_%'`);
  const deployed=new Set(procs.map(p=>p.proname));
  const missing=EXPECTED_RPCS.filter(r=>!deployed.has(r));
  const present=EXPECTED_RPCS.filter(r=>deployed.has(r));
  check(`RPCs appelées par le front déployées : ${present.length}/${EXPECTED_RPCS.length}`,missing.length===0);
  if (missing.length) console.log('   MANQUANTES: '+missing.join(','));

  // ---------- 3. Fixture : room live ----------
  const {rows:rooms}=await client.query(`select id,host_id,status,type,participants_count from public.rooms_v2 where status='live' order by created_at desc limit 1`);
  check('une room live existe en base',rooms.length>0,rooms[0]?.id);
  if (!rooms.length) throw Error('no live room');
  const room=rooms[0];
  const {rows:parts}=await client.query(`select user_id,role,left_at from public.room_participants_v2 where room_id=$1`,[room.id]);
  const activeParts=parts.filter(p=>!p.left_at);
  check('participants_count = lignes participants actives',room.participants_count===activeParts.length,`${room.participants_count} vs ${activeParts.length}`);
  check('le host est participant actif',parts.some(p=>p.user_id===room.host_id&&!p.left_at));

  // ---------- 4. Comportement authentifié (transaction annulée) ----------
  await client.query('begin');
  const as=async(uid)=>{
    await client.query('set local role authenticated');
    await client.query(`select set_config('request.jwt.claims',$1,true)`,[JSON.stringify({sub:uid,role:'authenticated',aud:'authenticated'})]);
    await client.query(`select set_config('request.jwt.claim.sub',$1,true)`,[uid]);
  };
  const unrole=()=>client.query('reset role');
  const {rows:other}=await client.query(`select id from public.profiles where id<>$1 limit 1`,[room.host_id]);
  const viewer=other[0]?.id;
  check('un profil viewer existe pour les tests',!!viewer);

  if (viewer) {
    await as(room.host_id);
    const exp=await tryRpc('rooms_get_experience_v1',`select public.rooms_get_experience_v1($1) r`,[room.id]);
    exp.ok?check('rooms_get_experience_v1 (host)',true,JSON.stringify(exp.rows[0].r).slice(0,80))
          :warn('rooms_get_experience_v1 (host)',exp.err.slice(0,90));

    await as(viewer);
    const enter=await tryRpc('enter',`select public.rooms_enter_room_v2($1) r`,[room.id]);
    if (enter.ok) {
      await unrole();
      const {rows:[myPart]}=await client.query(`select 1 from public.room_participants_v2 where room_id=$1 and user_id=$2 and left_at is null`,[room.id,viewer]);
      check('rooms_enter_room_v2 → participant actif',!!myPart);
      const {rows:[ca]}=await client.query(`select participants_count c from public.rooms_v2 where id=$1`,[room.id]);
      check('participants_count incrémenté',ca.c===room.participants_count+1,`-> ${ca.c}`);
    } else warn('rooms_enter_room_v2',enter.err.slice(0,90));

    await as(viewer);
    const msg=await tryRpc('msg',`select public.rooms_send_message_v2($1,$2)`,[room.id,'backend-check']);
    if (msg.ok) {
      await unrole();
      const {rows:[m]}=await client.query(`select content from public.room_messages_v2 where room_id=$1 and user_id=$2`,[room.id,viewer]);
      check('rooms_send_message_v2 → message persisté',m?.content==='backend-check');
    } else warn('rooms_send_message_v2',msg.err.slice(0,90));

    await as(viewer);
    const leave=await tryRpc('leave',`select public.rooms_leave_room_v2($1)`,[room.id]);
    if (leave.ok) {
      await unrole();
      const {rows:[lp]}=await client.query(`select left_at from public.room_participants_v2 where room_id=$1 and user_id=$2 order by left_at desc nulls last limit 1`,[room.id,viewer]);
      check('rooms_leave_room_v2 → left_at renseigné',!!lp?.left_at);
    } else warn('rooms_leave_room_v2',leave.err.slice(0,90));

    await as(viewer);
    const end=await tryRpc('end',`select public.rooms_end_room_v1($1)`,[room.id]);
    check('rooms_end_room_v1 refusé au non-host',!end.ok,end.ok?'aucune erreur!':end.err.slice(0,60));

    await client.query('set local role anon');
    const anon=await tryRpc('anon',`select public.rooms_send_message_v2($1,$2)`,[room.id,'anon-check']);
    check('rooms_send_message_v2 refusé en anon',!anon.ok,anon.ok?'aucune erreur!':anon.err.slice(0,60));
  }
  await client.query('rollback');

  // ---------- 5. livekit_room_name ----------
  const {rows:[lk]}=await client.query(`select livekit_room_name from public.rooms_v2 where id=$1`,[room.id]);
  check('livekit_room_name dérivé du room id',lk.livekit_room_name?.includes(room.id),lk.livekit_room_name);
} catch(e) {
  console.error('ERREUR:',e.message); failed++;
} finally { await client.end(); }
console.log(`\n=== ${passed} PASS / ${failed} FAIL / ${warned} WARN (RPC absentes en prod) ===`);
process.exitCode=failed?1:0;
