/** Owns one pointer gesture; a late microphone permission can never send audio. */
export class VoiceHoldGesture {
  private session: { pointerId: number; startX: number; startedAt: number | null; cancel: boolean } | null = null;

  get active() { return this.session !== null; }

  begin(pointerId: number, x: number) {
    if (this.session) return false;
    this.session = { pointerId, startX: x, startedAt: null, cancel: false };
    return true;
  }

  started(now: number) {
    if (this.session) this.session.startedAt = now;
  }

  move(pointerId: number, x: number, overTrash: boolean) {
    if (!this.session || this.session.pointerId !== pointerId) return null;
    this.session.cancel = overTrash || x <= this.session.startX - 72;
    return this.session.cancel;
  }

  finish(pointerId: number, now: number, interrupted = false): "send" | "cancel" | null {
    const session = this.session;
    if (!session || session.pointerId !== pointerId) return null;
    this.session = null;
    // A tap or a release while permission is pending is never a voice message.
    return !interrupted && !session.cancel && session.startedAt !== null && now - session.startedAt >= 250
      ? "send" : "cancel";
  }

  cancel() { this.session = null; }
}
