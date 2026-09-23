# Android viewer joining an iOS live — 23 September 2026

## Findings and changes

- RoomsHome selects the real `rooms_v2.id`; real and demo entries both mount `RoomViewer` / `PlaceRoomExperience`. The reported legacy appearance has not yet been reproduced. Do not claim it is resolved based on transport changes alone.
- Admission used direct participant upsert, forcing `viewer` even for an invited guest. Replaced with `rooms_enter_room_v2`; leaving uses `rooms_leave_room_v2`. Classe keeps its dedicated RPCs.
- `usePlaceRoom` now obtains server admission before loading the participant-dependent live projection.
- Viewer RTC required a separate manual audio action and had no video subscription. Live non-Classe rooms now connect on entry. Camera streams use native BytePlus canvases behind the web participant tiles, with the existing web controls retained above them.
- Canvas selection and subscriptions use server participant identity and stage permissions. Native audio follows the viewer playback mute/volume. No mock video is substituted for a remote stream.

## Validation

- Debug APK compiles; targeted RoomsAudioPolicy and WavePerformanceBus tests pass.
- Nine frontend repository tests pass (admission, denial, closed room, Classe isolation, leave, no demo fallback).
- Read-only deployed database checks: room projection tables and public stage/audio/engagement RPCs accessible under authenticated RLS. No room or user records changed by those checks.

## Still requires device validation

Actual iOS → Android camera/audio reception, stage changes, fullscreen, reconnect/background lifecycle and identification of the reported old UX. Current native video adapter handles camera publications; separate screen-share streams and multiple camera streams per identity need explicit mapping before claiming full video-regie parity. Classe transport is separate and unchanged.
