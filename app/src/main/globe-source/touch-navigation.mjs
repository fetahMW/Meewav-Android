// One geometric gesture, sampled by the renderer's existing frame loop.
// Coordinates and velocity are CSS pixels and CSS pixels/second.
const RAD = 180 / Math.PI;
const angleDelta = value => Math.atan2(Math.sin(value), Math.cos(value));
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const TAP_MS = 280, TAP_RADIUS = 26, SLOP = 5, MIN_SPAN = 16;

export function pairTransform(p, q, out = {}) {
  const ax = p[1].x - p[0].x, ay = p[1].y - p[0].y;
  const bx = q[1].x - q[0].x, by = q[1].y - q[0].y;
  out.fromX = (p[0].x + p[1].x) / 2; out.fromY = (p[0].y + p[1].y) / 2;
  out.x = (q[0].x + q[1].x) / 2; out.y = (q[0].y + q[1].y) / 2;
  out.oldDistance = Math.hypot(ax, ay); out.distance = Math.hypot(bx, by);
  out.angle = angleDelta(Math.atan2(by, bx) - Math.atan2(ay, ax));
  out.scale = out.oldDistance > 0 ? out.distance / out.oldDistance : 1;
  return out;
}

export function createTouchNavigation(api, { pointers = new Map(), reducedMotion = false } = {}) {
  let dirty = false, multi = false, moved = 0, quick = false, quickMoved = false;
  let firstX = 0, firstY = 0, downTime = 0, lastTouch = -Infinity;
  let previousFrame = 0, rotation = 0, rotating = false, tilt = 0, tilting = false;
  let pendingTap = null, zoomAnimation = null, coast = null, settling = false, settleTime = 0;
  let historyCount = 0, historyIndex = 0;
  const history = Array.from({ length: 12 }, () => ({ x: 0, y: 0, t: 0 }));
  const before = [{ x: 0, y: 0 }, { x: 0, y: 0 }], after = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
  const pair = {}, from = { x: 0, y: 0 }, to = { x: 0, y: 0 }, drag = { anchor: null };
  const command = { factor: 1, rotation: 0, pitch: 0, from, to, anchor: null };
  const time = e => Number.isFinite(e.timeStamp) ? e.timeStamp : performance.now();
  const accept = e => e.pointerType === 'touch' || e.pointerType === 'pen';

  function sample(x, y, t) {
    const h = history[historyIndex]; h.x = x; h.y = y; h.t = t;
    historyIndex = (historyIndex + 1) % history.length;
    historyCount = Math.min(history.length, historyCount + 1);
  }
  function velocity(now) {
    if (!historyCount) return null;
    const last = history[(historyIndex + history.length - 1) % history.length];
    if (now - last.t > 80) return null;
    let n = 0, st = 0, sx = 0, sy = 0, stt = 0, stx = 0, sty = 0, oldest = last.t;
    for (let i = 0; i < historyCount; i++) {
      const h = history[(historyIndex + history.length - 1 - i) % history.length];
      if (last.t - h.t > 80) break;
      const t = (h.t - last.t) / 1000;
      n++; st += t; sx += h.x; sy += h.y; stt += t * t; stx += t * h.x; sty += t * h.y; oldest = h.t;
    }
    const denominator = n * stt - st * st;
    if (n < 2 || last.t - oldest < 12 || denominator < 1e-8) return null;
    let vx = (n * stx - st * sx) / denominator, vy = (n * sty - st * sy) / denominator;
    const speed = Math.hypot(vx, vy);
    if (speed < 25) return null;
    const limit = Math.min(1, 2200 / speed); vx *= limit; vy *= limit;
    return { vx, vy, x: last.x, y: last.y, anchor: drag.anchor };
  }
  function stop() {
    coast = zoomAnimation = null; settling = false; previousFrame = 0;
    api.interrupt();
  }
  function rebase(now) {
    dirty = false; drag.anchor = null; rotation = tilt = 0; rotating = tilting = false;
    historyCount = historyIndex = 0;
    for (const p of pointers.values()) { p.px = p.x; p.py = p.y; }
    if (pointers.size === 1) {
      const p = pointers.values().next().value;
      drag.anchor = api.pickPoint(p.x, p.y); sample(p.x, p.y, now);
    }
  }
  function apply(factor, degrees, pitch, anchor) {
    command.factor = factor; command.rotation = degrees; command.pitch = pitch; command.anchor = anchor;
    api.transform(command);
  }
  function flush() {
    if (!dirty || !pointers.size) return;
    dirty = false;
    const iterator = pointers.values(), p = iterator.next().value;
    from.x = p.px; from.y = p.py; to.x = p.x; to.y = p.y;
    if (pointers.size === 1) {
      if (quick) {
        if (!quickMoved && Math.hypot(p.x - firstX, p.y - firstY) >= SLOP) quickMoved = true;
        if (quickMoved) {
          const dy = p.y - p.py;
          from.x = to.x = firstX; from.y = to.y = firstY;
          apply(Math.exp(-dy * .008), 0, 0, drag.anchor);
        }
      } else api.pan(from, to, drag);
    } else {
      const q = iterator.next().value;
      before[0].x = p.px; before[0].y = p.py; before[1].x = q.px; before[1].y = q.py;
      after[0].x = p.x; after[0].y = p.y; after[1].x = q.x; after[1].y = q.y;
      pairTransform(before, after, pair);
      from.x = pair.fromX; from.y = pair.fromY; to.x = pair.x; to.y = pair.y;
      // Reacquire the world point at the previous centroid, never the initial
      // screen centroid: asymmetric pinches retain their translation component.
      const anchor = api.pickPoint(from.x, from.y);
      const stable = Math.min(pair.oldDistance, pair.distance) >= MIN_SPAN && Math.abs(pair.angle) < Math.PI / 2;
      let degrees = 0, pitch = 0;
      if (stable) {
        const delta = pair.angle * RAD;
        if (rotating) degrees = delta;
        else {
          rotation += delta;
          if (Math.abs(rotation) > 2.5) { rotating = true; degrees = rotation - Math.sign(rotation) * 2.5; }
        }
        const dx1 = p.x - p.px, dy1 = p.y - p.py, dx2 = q.x - q.px, dy2 = q.y - q.py;
        const dy = (dy1 + dy2) / 2;
        const vertical = Math.abs(dy1) > Math.abs(dx1) * 1.15 && Math.abs(dy2) > Math.abs(dx2) * 1.15;
        const parallel = dy1 * dy2 > 0 && Math.abs(dy1 - dy2) < Math.abs(dy) * .65;
        const littleScale = Math.abs(Math.log(pair.scale)) < (tilting ? .07 : .035);
        if (vertical && parallel && littleScale && Math.abs(delta) < (tilting ? 5 : 2.5)) {
          if (tilting) pitch = -dy * .22;
          else {
            tilt += dy;
            if (Math.abs(tilt) > 6) { tilting = true; pitch = -(tilt - Math.sign(tilt) * 6) * .22; }
          }
        }
        apply(1 / pair.scale, degrees, pitch, anchor);
      } else {
        // Near-coincident/crossing fingers cannot define a reliable angle.
        rotation = tilt = 0; rotating = tilting = false;
        apply(1, 0, 0, anchor);
      }
    }
    for (const p of pointers.values()) { p.px = p.x; p.py = p.y; }
    api.changed?.();
  }
  function startSettle() { settling = true; settleTime = 0; api.release?.(); }
  function zoomAt(factor, x, y, duration = 280) {
    stop(); pendingTap = null;
    const anchor = api.pickPoint(x, y);
    if (reducedMotion) {
      from.x = to.x = x; from.y = to.y = y; apply(factor, 0, 0, anchor); startSettle();
    } else zoomAnimation = { x, y, anchor, log: Math.log(factor), duration: duration / 1000, elapsed: 0, applied: 0 };
  }
  function cancel(settle = false) {
    dirty = false; pendingTap = null; quick = quickMoved = false;
    pointers.clear(); rebase(0); stop(); api.release?.();
    if (settle) startSettle();
  }

  return {
    pointers, cancel, zoomAt,
    suppressDoubleClick: now => now - lastTouch < 650,
    isMoving: () => pointers.size > 0 || coast !== null || zoomAnimation !== null || settling,
    down(e) {
      if (!accept(e)) return false;
      const now = time(e); flush();
      const second = pointers.size === 0 && pendingTap && now - pendingTap.time <= TAP_MS
        && Math.hypot(e.clientX - pendingTap.x, e.clientY - pendingTap.y) < TAP_RADIUS;
      stop(); pendingTap = null; lastTouch = now;
      if (!pointers.size) {
        multi = false; moved = 0; firstX = e.clientX; firstY = e.clientY; downTime = now;
        quick = Boolean(second); quickMoved = false;
      } else { multi = true; quick = quickMoved = false; }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY });
      rebase(now); api.started?.(e); return true;
    },
    move(e) {
      if (!accept(e)) return false;
      const p = pointers.get(e.pointerId); if (!p) return true;
      if (p.x === e.clientX && p.y === e.clientY) return true;
      p.x = e.clientX; p.y = e.clientY; dirty = true; lastTouch = time(e);
      moved = Math.max(moved, Math.hypot(p.x - firstX, p.y - firstY));
      if (pointers.size === 1 && !quick) sample(p.x, p.y, time(e));
      return true;
    },
    up(e, cancelled = false) {
      if (!accept(e)) return false;
      if (!pointers.has(e.pointerId)) return true;
      const now = time(e); lastTouch = now;
      if (cancelled) { cancel(true); return true; }
      this.move(e); flush();
      const final = pointers.size === 1;
      const tap = final && !multi && moved < SLOP && now - downTime < 450;
      const nextCoast = final && !quick && moved >= SLOP && !reducedMotion ? velocity(now) : null;
      pointers.delete(e.pointerId);
      if (!final) { multi = true; rebase(now); return true; }
      if (quick && !quickMoved) zoomAt(.5, firstX, firstY);
      else {
        if (tap) {
          const selection = { x: e.clientX, y: e.clientY, time: now, pointerId: e.pointerId };
          // Portraits are controls: open on release. Empty geography keeps the
          // double-tap / one-handed zoom window without delaying artist cards.
          if (!api.immediateTap?.(selection)) pendingTap = selection;
        }
        coast = nextCoast; previousFrame = now;
        startSettle();
      }
      quick = quickMoved = false; return true;
    },
    tick(now) {
      const dt = previousFrame ? Math.max(0, (now - previousFrame) / 1000) : 0;
      previousFrame = now; flush();
      if (dt > .18) { coast = null; zoomAnimation = null; }
      if (pendingTap && now - pendingTap.time > TAP_MS) {
        const tap = pendingTap; pendingTap = null; api.tap?.(tap);
      }
      if (pointers.size) return;
      if (zoomAnimation && dt > 0) {
        const z = zoomAnimation; z.elapsed = Math.min(z.duration, z.elapsed + dt);
        const progress = 1 - (1 - z.elapsed / z.duration) ** 3;
        from.x = to.x = z.x; from.y = to.y = z.y;
        apply(Math.exp(z.log * progress - z.applied), 0, 0, z.anchor); z.applied = z.log * progress;
        if (z.elapsed >= z.duration) { zoomAnimation = null; startSettle(); }
      }
      if (coast && dt > 0) {
        const decay = Math.exp(-7 * dt), c = coast;
        from.x = c.x; from.y = c.y; c.x += c.vx * (1 - decay) / 7; c.y += c.vy * (1 - decay) / 7;
        to.x = c.x; to.y = c.y; drag.anchor = c.anchor;
        api.pan(from, to, drag); c.anchor = drag.anchor; c.vx *= decay; c.vy *= decay;
        if (Math.hypot(c.vx, c.vy) < 12) { coast = null; startSettle(); }
      }
      if (settling && !coast && !zoomAnimation) {
        settleTime += dt;
        settling = api.settle?.(reducedMotion ? 1 : settleTime) === true;
      }
    },
  };
}
