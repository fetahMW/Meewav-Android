# EDGE QA Rooms (Samsung S22)

This is boundary testing, not a screenshot smoke suite. The flows use Maestro
for actions/assertions, then `run-edge.ps1` checks Android's Activity stack and
the live backend. On the first failure it stops and saves a screenshot, UI dump,
Activity stack, camera state, and relevant logcat under ignored `artifacts/`.
No app state is cleared, no network setting is changed, and all created Rooms
have a unique `QA_` title. No business code is modified by this suite.

## Risk map from the current code

1. `MainActivity` selects a local preview only for explicit debug entry;
   `AuthViewModel.localPreview` and the Globe's `previewMessages` must agree.
2. Globe opens `RoomsActivity` with a `preview` extra. `MessagingActivity`
   then injects this mode, profile ID, and token into the local WebView's
   `meewavMessaging.configure()` call. A wrong extra or stale WebView means a
   different data source, even if the UI looks similar.
3. `RoomsPage` chooses fixture or `rooms_v2` catalogue from `previewEnabled()`.
   It creates a live Room with a client request UUID, then navigates to
   `/native/room-session`.
4. `MessagingActivity` translates that URL into `WaveMixerActivity` extras.
   Only a non-preview request with `source=live` and a UUID becomes
   `liveRoomId`; `WaveMixerScreen` derives its remote audio/chat/guest state
   from that value. The native Activity and backend must refer to one Room.
5. Android Back and feature dock navigation cross WebView, Compose, and
   multiple Activities; stale Activity stacks can revive an old mode/Room.

## Eight highest-yield tests, in order

1. LIVE/DEMO isolation across Globe, Rooms, Marketplace, and the wizard.
2. `createLiveRoom` → `/native/room-session` → `WaveMixerActivity`, including
   one backend Room, one active host, and one native Activity.
3. Rapid double launch: idempotent request ID and no duplicate host Activity.
4. Room A → Room B: no retained Room ID, chat, participants, media, or program.
5. Android Back from wizard, Green House, native mixer, and feature hop.
6. Background/foreground at wizard, camera check-up, and native live join.
7. Expired session: real login, never an implicit demo fallback.
8. Camera/micro revoked between check-up and native join: no false ready state.

The first three are implemented. Test 1 has two independent halves:
`01-live-mode-boundary.yaml`, `01b-demo-mode-boundary.yaml`, and
`01c-demo-exit.yaml`. The two demo flows are safe without an account; the LIVE
half and tests 2–3 require an authenticated
QA account and the LIVE Rooms home open on the phone. Do not provide passwords
to the runner. Tests 2–3 require camera/micro permission and access to the
read-only deployment database check in `../Meewav-Web/.env.local`.

Run one case at a time (PowerShell, from repository root):

```powershell
& .\.maestro\rooms\edge\run-edge.ps1 -Case 01b
& .\.maestro\rooms\edge\run-edge.ps1 -Case 01c
& .\.maestro\rooms\edge\run-edge.ps1 -Case 01
& .\.maestro\rooms\edge\run-edge.ps1 -Case 02
& .\.maestro\rooms\edge\run-edge.ps1 -Case 03
```

If wireless debugging changes its port, pass `-Device <current-ip:port>`.

If a case fails, inspect its `artifacts/<timestamp>_<case>/` and report the
first divergence before changing app code. The script does not run later cases
automatically. FAST contains the mode tests; MEDIUM contains the real creation
and race tests; DEEP is reserved for lifecycle, permission, network, and
repetition flows after the first findings are triaged.
