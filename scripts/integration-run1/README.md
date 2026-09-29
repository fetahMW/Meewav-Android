# MEEWAV ANDROID INTEGRATION — RUN 1 harness

This harness reuses the two existing LIVE QA accounts and emulators. It does not provision accounts, clear app data, deploy Supabase changes, or target the S22.

| Actor | Android serial | Maestro direct `adbd` port |
| --- | --- | ---: |
| A | `emulator-5570` | `5571` |
| B | `emulator-5572` | `5573` |

`invoke-maestro.ps1` fixes this mapping and holds an exclusive file lock per actor while Maestro runs. It scopes `ANDROID_SERIAL` to the mapped emulator for each Maestro process, then restores the previous value. This resolves adb discovery ambiguity after an AVD restart while retaining the direct port and avoiding `--device`. Keep one coordinator for steps that involve both actors. Save screenshots, hierarchy, Activity stack, CDP, backend snapshots, and timestamps under ignored `app/build/integration-run1/`.

```powershell
& .\scripts\integration-run1\invoke-maestro.ps1 -Actor A -Operation hierarchy
& .\scripts\integration-run1\invoke-maestro.ps1 -Actor B -Operation test -Flow .\path\to\flow.yaml -OutputDirectory .\app\build\integration-run1\some-step
```

`profile-marker.mjs` reads and conditionally changes only QA A's `profiles.display_name` with QA A's own session. `set` records the original value in the ignored directory before writing. Always call `restore`, even after a failed observation; it refuses to overwrite a concurrent profile edit.

```powershell
node .\scripts\integration-run1\profile-marker.mjs snapshot
node .\scripts\integration-run1\profile-marker.mjs set RUN1_20260924_1138
node .\scripts\integration-run1\profile-marker.mjs restore
```

`rooms-qa.mjs` uses QA A's own session. Its ledger records exact room UUIDs before any write. `create` inserts a QA Room and host membership, `register` records a Room made through Android after checking its exact title and owner, `snapshot` reads room/participant/message rows, `send` makes one tagged idempotent QA message, and `end` closes only a UUID in this run's ledger. Check the LIVE API response and UI/backend/peer evidence after each operation; do not infer a PASS from a successful request alone.

```powershell
node .\scripts\integration-run1\rooms-qa.mjs create RUN1_20260924_1138 A
node .\scripts\integration-run1\rooms-qa.mjs snapshot <room-uuid>
node .\scripts\integration-run1\rooms-qa.mjs send <room-uuid>
node .\scripts\integration-run1\rooms-qa.mjs end <room-uuid>
```

For the limited DM smoke, the existing Messaging harness accepts `--smoke --run-id RUN1_...`; it sends one text in each direction and skips audio. Its `verify.mjs --smoke` mode checks the same conversation and the two exact markers under both QA identities. The existing full conversation run remains the default.

After copying the successful smoke and verification reports into the ignored run evidence, `cleanup-messaging-smoke.mjs <conversation-report.json> <verification.json>` calls the authenticated `delete_message_v1` RPC for those two exact message UUIDs only. The LIVE RPC soft-deletes their content and retains tombstones; the helper verifies the tombstones under both QA identities.
