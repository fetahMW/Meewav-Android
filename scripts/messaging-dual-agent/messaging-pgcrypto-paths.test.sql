select case when count(*) = 19 then 'ok 1 - all audited RPCs resolve pgcrypto'
  else 'not ok 1 - an audited RPC still cannot resolve pgcrypto' end
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'send_message_v2', 'create_creative_project_v1', 'invite_creative_project_member_v1',
    'create_artist_group_v1', 'invite_artist_group_member_v1',
    'respond_to_artist_group_invitation_v1', 'cancel_artist_group_invitation_v1',
    'update_artist_group_v1', 'set_my_artist_group_preferences_v1',
    'set_artist_group_authority_role_v1', 'set_artist_group_artistic_role_v1',
    'transfer_artist_group_ownership_v1', 'remove_artist_group_member_v1',
    'leave_artist_group_v1', 'set_artist_group_archived_v1',
    'delete_artist_group_v1', 'attach_collaboration_uploads_v1',
    'rooms_invite_live_call_contact_v1', 'rooms_get_or_create_classe_direct_conversation_v1'
  )
  and exists (
    select 1 from unnest(p.proconfig) setting
    where setting like 'search_path=%' and setting like '%extensions%'
  );
select '1..1';
