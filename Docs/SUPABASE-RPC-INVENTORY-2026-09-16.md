# Inventaire RPC — audit du 16 septembre 2026

Complément du [rapport de câblage](SUPABASE-WIRING-AUDIT-2026-09-16.md). Lecture des sources et du catalogue PostgreSQL du projet Dev `dqabekaqpznjsagoxzwc`, sans exécution de mutations. « Présente » signifie uniquement qu’une fonction publique de ce nom existe ; les signatures du tchat direct ont été recoupées séparément. Les services Web historiques remplacés par un adaptateur restent inventoriés : ce tableau ne mesure pas le pourcentage de fonctionnalités utilisables. Les appels dynamiques non littéraux ne sont pas déduits automatiquement.

## Android — Auth native

| Fonction | Déployée | Première référence source |
|---|---|---|
| `is_profile_username_available` | Présente | `app/src/main/java/com/meewav/android/core/auth/MeewavAuthRepository.kt:50` |
| `resolve_profile_email_for_username` | Présente | `app/src/main/java/com/meewav/android/core/auth/MeewavAuthRepository.kt:40` |

## Android — Messagerie

| Fonction | Déployée | Première référence source |
|---|---|---|
| `attach_collaboration_uploads_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.attachments.service.ts:315` |
| `cancel_artist_group_invitation_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:198` |
| `cancel_collaboration_request_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.collaboration.service.ts:137` |
| `cancel_creative_project_invitation_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:235` |
| `create_artist_group_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:143` |
| `create_creative_project_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:158` |
| `create_group_conversation_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:141` |
| `delete_artist_group_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:269` |
| `delete_creative_project_task_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:316` |
| `delete_creative_project_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:339` |
| `delete_message_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:273` |
| `discard_messaging_upload_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.attachments.service.ts:271` |
| `finalize_messaging_upload_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.attachments.service.ts:260` |
| `forward_message_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:284` |
| `get_artist_group_detail_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:106` |
| `get_conversation_members_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:182` |
| `get_conversation_messages_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:353` |
| `get_conversation_messages_v2` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.attachments.service.ts:335` |
| `get_conversation_messages_v3` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:170` |
| `get_creative_project_workspace_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:124` |
| `get_or_create_collaboration_conversation_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:105` |
| `get_or_create_direct_conversation_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:113` |
| `invite_artist_group_member_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:175` |
| `invite_creative_project_member_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:204` |
| `leave_artist_group_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:254` |
| `leave_group_conversation_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:242` |
| `list_artist_group_activity_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:115` |
| `list_my_artist_group_invitations_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:125` |
| `list_my_artist_groups_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:97` |
| `list_my_collaboration_requests_v2` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.attachments.service.ts:362` |
| `list_my_conversation_invitations_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:151` |
| `list_my_conversations_v2` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:81` |
| `list_my_creative_project_invitations_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:145` |
| `list_my_creative_projects_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:112` |
| `mark_collaboration_request_viewed_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.collaboration.service.ts:108` |
| `mark_conversation_read_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:209` |
| `messaging_find_contact_by_username_v1` | Présente | `app/src/main/messaging-source/iosDirectMessaging.ts:52` |
| `messaging_list_direct_conversations_v1` | Présente | `app/src/main/messaging-source/iosDirectMessaging.ts:28` |
| `messaging_mark_direct_conversation_read_v1` | Présente | `app/src/main/messaging-source/iosDirectMessaging.ts:49` |
| `messaging_resolve_direct_conversation_v1` | Présente | `app/src/main/messaging-source/iosDirectMessaging.ts:59` |
| `messaging_send_text_message_v1` | Présente | `app/src/main/messaging-source/iosDirectMessaging.ts:63` |
| `messaging_send_voice_message_v1` | Présente | `app/src/main/messaging-source/iosDirectMessaging.ts:88` |
| `messaging_video_call_v1` | Présente | `app/src/main/messaging-source/calls/VideoCalls.tsx:13` |
| `prepare_messaging_upload_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.attachments.service.ts:228` |
| `remove_artist_group_member_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:247` |
| `remove_or_leave_creative_project_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:281` |
| `report_content_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:313` |
| `respond_to_artist_group_invitation_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:188` |
| `respond_to_collaboration_request_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.collaboration.service.ts:125` |
| `respond_to_conversation_invitation_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:160` |
| `respond_to_creative_project_invitation_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:224` |
| `rooms_get_or_create_classe_direct_conversation_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:125` |
| `search_messageable_profiles_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:95` |
| `send_message_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:367` |
| `send_message_v2` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.attachments.service.ts:290` |
| `set_artist_group_archived_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:261` |
| `set_artist_group_artistic_role_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:231` |
| `set_artist_group_authority_role_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:222` |
| `set_conversation_hidden_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:232` |
| `set_conversation_preferences_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:219` |
| `set_creative_project_status_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:328` |
| `set_message_pinned_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:263` |
| `set_message_reaction_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:252` |
| `set_my_artist_group_preferences_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:210` |
| `set_user_block_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.service.ts:295` |
| `transfer_artist_group_ownership_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:239` |
| `transfer_creative_project_ownership_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:270` |
| `update_artist_group_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.groups.service.ts:159` |
| `update_creative_project_member_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:252` |
| `update_creative_project_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:177` |
| `upsert_creative_project_task_v1` | Absente | `app/src/main/messaging-source/vendor/src/features/messaging/messaging.projects.service.ts:299` |

## Android — Profil et dépendances

| Fonction | Déployée | Première référence source |
|---|---|---|
| `archive_media_file` | Absente | `app/src/main/profile-source/vendor/src/features/profile/profile.media.service.ts:555` |
| `attach_collaboration_uploads_v1` | Absente | `app/src/main/profile-source/vendor/src/features/messaging/messaging.attachments.service.ts:315` |
| `cancel_collaboration_request_v1` | Absente | `app/src/main/profile-source/vendor/src/features/messaging/messaging.collaboration.service.ts:137` |
| `discard_messaging_upload_v1` | Absente | `app/src/main/profile-source/vendor/src/features/messaging/messaging.attachments.service.ts:271` |
| `finalize_messaging_upload_v1` | Absente | `app/src/main/profile-source/vendor/src/features/messaging/messaging.attachments.service.ts:260` |
| `get_conversation_messages_v2` | Absente | `app/src/main/profile-source/vendor/src/features/messaging/messaging.attachments.service.ts:335` |
| `get_golden_like_state` | Absente | `app/src/main/profile-source/vendor/src/features/globe/api/preProfile.api.ts:361` |
| `get_my_private_profile` | Absente | `app/src/main/profile-source/vendor/src/features/globe/api/preProfile.api.ts:214` |
| `get_my_profile_metrics` | Absente | `app/src/main/profile-source/vendor/src/features/profile/profile.analytics.service.ts:476` |
| `get_my_profile_rankings_v1` | Absente | `app/src/main/profile-source/vendor/src/features/profile/profile.ranking.service.ts:176` |
| `get_profile_certif_summary_v1` | Absente | `app/src/main/profile-source/vendor/src/features/profile/gifts/profileCertifEndorsements.service.ts:143` |
| `give_golden_like` | Absente | `app/src/main/profile-source/vendor/src/features/globe/api/preProfile.api.ts:389` |
| `list_my_collaboration_requests_v2` | Absente | `app/src/main/profile-source/vendor/src/features/messaging/messaging.attachments.service.ts:362` |
| `mark_collaboration_request_viewed_v1` | Absente | `app/src/main/profile-source/vendor/src/features/messaging/messaging.collaboration.service.ts:108` |
| `prepare_messaging_upload_v1` | Absente | `app/src/main/profile-source/vendor/src/features/messaging/messaging.attachments.service.ts:228` |
| `profile_list_my_gift_inventory_v1` | Absente | `app/src/main/profile-source/vendor/src/features/profile/gifts/profileGiftInventory.service.ts:145` |
| `profile_set_my_certif_state_v1` | Absente | `app/src/main/profile-source/vendor/src/features/profile/gifts/profileCertifEndorsements.service.ts:225` |
| `request_profile_collaboration` | Absente | `app/src/main/profile-source/vendor/src/features/globe/api/preProfile.api.ts:403` |
| `respond_to_collaboration_request_v1` | Absente | `app/src/main/profile-source/vendor/src/features/messaging/messaging.collaboration.service.ts:125` |
| `send_message_v2` | Absente | `app/src/main/profile-source/vendor/src/features/messaging/messaging.attachments.service.ts:290` |
| `track_analytics_event` | Absente | `app/src/main/profile-source/vendor/src/features/globe/api/preProfile.api.ts:187` |

## Web — Auth, Profil, Messagerie et API pré-profil

| Fonction | Déployée | Première référence source |
|---|---|---|
| `archive_media_file` | Absente | `../Meewav-Web/src/features/profile/profile.media.service.ts:555` |
| `attach_collaboration_uploads_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.attachments.service.ts:315` |
| `cancel_artist_group_invitation_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:198` |
| `cancel_collaboration_request_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.collaboration.service.ts:137` |
| `cancel_creative_project_invitation_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:235` |
| `claim_globe_treasure_v1` | Absente | `../Meewav-Web/src/features/globe/api/globeTreasure.api.ts:146` |
| `complete_onboarding` | Absente | `../Meewav-Web/src/features/auth/auth.service.ts:89` |
| `create_artist_group_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:143` |
| `create_creative_project_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:158` |
| `create_group_conversation_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:141` |
| `delete_artist_group_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:269` |
| `delete_creative_project_task_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:316` |
| `delete_creative_project_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:339` |
| `delete_message_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:273` |
| `discard_messaging_upload_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.attachments.service.ts:271` |
| `finalize_messaging_upload_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.attachments.service.ts:260` |
| `forward_message_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:284` |
| `get_artist_group_detail_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:106` |
| `get_conversation_members_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:182` |
| `get_conversation_messages_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:353` |
| `get_conversation_messages_v2` | Absente | `../Meewav-Web/src/features/messaging/messaging.attachments.service.ts:335` |
| `get_conversation_messages_v3` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:170` |
| `get_creative_project_workspace_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:124` |
| `get_globe_treasure_state_v1` | Absente | `../Meewav-Web/src/features/globe/api/globeTreasure.api.ts:136` |
| `get_golden_like_state` | Absente | `../Meewav-Web/src/features/globe/api/preProfile.api.ts:361` |
| `get_my_private_profile` | Absente | `../Meewav-Web/src/features/auth/AuthProvider.tsx:38` |
| `get_my_profile_metrics` | Absente | `../Meewav-Web/src/features/profile/profile.analytics.service.ts:476` |
| `get_my_profile_rankings_v1` | Absente | `../Meewav-Web/src/features/profile/profile.ranking.service.ts:176` |
| `get_or_create_collaboration_conversation_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:105` |
| `get_or_create_direct_conversation_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:113` |
| `get_profile_certif_summary_v1` | Absente | `../Meewav-Web/src/features/profile/gifts/profileCertifEndorsements.service.ts:143` |
| `give_golden_like` | Absente | `../Meewav-Web/src/features/globe/api/preProfile.api.ts:389` |
| `invite_artist_group_member_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:175` |
| `invite_creative_project_member_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:204` |
| `is_profile_username_available` | Présente | `../Meewav-Web/src/features/auth/auth.service.ts:80` |
| `leave_artist_group_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:254` |
| `leave_group_conversation_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:242` |
| `list_artist_group_activity_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:115` |
| `list_my_artist_group_invitations_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:125` |
| `list_my_artist_groups_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:97` |
| `list_my_collaboration_requests_v2` | Absente | `../Meewav-Web/src/features/messaging/messaging.attachments.service.ts:362` |
| `list_my_conversation_invitations_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:151` |
| `list_my_conversations_v2` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:81` |
| `list_my_creative_project_invitations_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:145` |
| `list_my_creative_projects_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:112` |
| `mark_collaboration_request_viewed_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.collaboration.service.ts:108` |
| `mark_conversation_read_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:209` |
| `prepare_messaging_upload_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.attachments.service.ts:228` |
| `profile_list_my_gift_inventory_v1` | Absente | `../Meewav-Web/src/features/profile/gifts/profileGiftInventory.service.ts:145` |
| `profile_set_my_certif_state_v1` | Absente | `../Meewav-Web/src/features/profile/gifts/profileCertifEndorsements.service.ts:225` |
| `remove_artist_group_member_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:247` |
| `remove_or_leave_creative_project_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:281` |
| `report_content_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:313` |
| `request_profile_collaboration` | Absente | `../Meewav-Web/src/features/globe/api/preProfile.api.ts:403` |
| `respond_to_artist_group_invitation_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:188` |
| `respond_to_collaboration_request_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.collaboration.service.ts:125` |
| `respond_to_conversation_invitation_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:160` |
| `respond_to_creative_project_invitation_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:224` |
| `rooms_get_or_create_classe_direct_conversation_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:125` |
| `search_messageable_profiles_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:95` |
| `send_message_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:367` |
| `send_message_v2` | Absente | `../Meewav-Web/src/features/messaging/messaging.attachments.service.ts:290` |
| `set_artist_group_archived_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:261` |
| `set_artist_group_artistic_role_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:231` |
| `set_artist_group_authority_role_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:222` |
| `set_conversation_hidden_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:232` |
| `set_conversation_preferences_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:219` |
| `set_creative_project_status_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:328` |
| `set_message_pinned_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:263` |
| `set_message_reaction_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:252` |
| `set_my_artist_group_preferences_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:210` |
| `set_user_block_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.service.ts:295` |
| `track_analytics_event` | Absente | `../Meewav-Web/src/features/globe/api/preProfile.api.ts:187` |
| `transfer_artist_group_ownership_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:239` |
| `transfer_creative_project_ownership_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:270` |
| `update_artist_group_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.groups.service.ts:159` |
| `update_creative_project_member_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:252` |
| `update_creative_project_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:177` |
| `update_my_public_discovery_profile` | Absente | `../Meewav-Web/src/features/auth/auth.service.ts:107` |
| `upsert_creative_project_task_v1` | Absente | `../Meewav-Web/src/features/messaging/messaging.projects.service.ts:299` |

## iOS — contrat direct relu sur main

| Fonction | Déployée | Signature distante |
|---|---|---|
| `resolve_profile_email_for_username` | Présente | `p_username text` |
| `messaging_list_direct_conversations_v1` | Présente | `sans paramètres` |
| `messaging_find_contact_by_username_v1` | Présente | `p_username text` |
| `messaging_resolve_direct_conversation_v1` | Présente | `p_peer_username text` |
| `messaging_send_text_message_v1` | Présente | `p_conversation_id uuid, p_client_message_id uuid, p_body text` |
| `messaging_send_voice_message_v1` | Présente | `p_conversation_id uuid, p_client_message_id uuid, p_storage_path text, p_duration_ms integer, p_mime_type text, p_byte_size integer` |
| `messaging_mark_direct_conversation_read_v1` | Présente | `p_conversation_id uuid` |

## Provenance des services importés

Comparaison octet par octet des services centraux Android avec le Web canonique lu pendant cet audit. Les adaptations d’interface et le repository `iosDirectMessaging.ts` restent distincts.

| Service | Identique au Web actuel |
|---|---|
| `profile.service.ts` | Oui |
| `profile.media.service.ts` | Oui |
| `profile.private.service.ts` | Oui |
| `profile.analytics.service.ts` | Oui |
| `profile.ranking.service.ts` | Oui |
| `messaging.service.ts` | Oui |
| `messaging.collaboration.service.ts` | Oui |
| `messaging.projects.service.ts` | Oui |
| `messaging.groups.service.ts` | Oui |
| `messaging.attachments.service.ts` | Oui |
