import * as T from 'three';
import { xyz, RADIUS } from './geo.mjs';
import { METRES_TO_WORLD, quartierHeight } from './territory-style.mjs';
import { createGroundAvatarSprites } from './ground-avatar-sprites.mjs';
import { mobileArtistPanel } from '../../../../mobile-artist-panel';
import { CHARONNE_ID } from './navigation-presets.mjs';
import { PROFILE_ICON_FILES, getProfileIconImageUrl } from './reference/components/shared/avatar/profileIconAssets.ts';
import {
  createParisAvatarPopulation,
  formatAvatarCount,
  PARIS_CITY_ID,
} from './paris-avatar-population.mjs';

const ICON_KEYS = Object.keys(PROFILE_ICON_FILES).filter(key => key.startsWith('avatar_'));
const PIXEL_SIZE = 41 * 1.3;
const HOST_SCALE = 2.5;
const PIN_HOST_SCALE = 1.85;
const SIZE_LOCK_HEIGHT = 0.003;
const SHOW_HEIGHT = 0.2;
const HIDE_HEIGHT = 0.28;
const LIFT_METRES = 8;
const FILTER_ROLES = ICON_KEYS.filter(key => Number(key.slice(7)) <= 30);
const STORAGE_FILTERS = 'globelab.artistFilters.v1';
const STORAGE_CONSULTED = 'globelab.consultedAvatars.v1';
const STORAGE_PINS = 'globelab.pinnedAvatars.v1';
const FALLBACK_ICON = 'avatar_4';
const HOST_PIN_COLOR = '#22C55E';
const HOVER_LIFT_PX = 60;

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

function readFilters() {
  const stored = readJson(STORAGE_FILTERS, null);
  const roles = Array.isArray(stored?.roles)
    ? stored.roles.filter(id => FILTER_ROLES.includes(id))
    : FILTER_ROLES;
  const grades = Array.isArray(stored?.grades)
    ? stored.grades.filter(n => Number.isInteger(n) && n >= 1 && n <= 6)
    : [];
  return { roles: new Set(roles.length ? roles : FILTER_ROLES), grades: new Set(grades), hideConsulted: stored?.hideConsulted === true };
}

function readConsulted() {
  const stored = readJson(STORAGE_CONSULTED, []);
  return new Set(Array.isArray(stored) ? stored.map(String) : []);
}

function persistConsulted(ids) {
  try { localStorage.setItem(STORAGE_CONSULTED, JSON.stringify([...ids])); } catch { /* optional */ }
}

function readPinned() {
  const stored = readJson(STORAGE_PINS, {});
  const pins = new Map();
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return pins;
  for (const [id, color] of Object.entries(stored)) {
    if (typeof color === 'string' && color) pins.set(String(id), color);
  }
  return pins;
}

function iconSrc(key) {
  return getProfileIconImageUrl(PROFILE_ICON_FILES[key] ? key : FALLBACK_ICON);
}

function loadIcons(keys, onReady) {
  const images = new Map();
  let pending = keys.length;
  if (!pending) { onReady(images); return images; }
  for (const key of keys) {
    const image = new Image();
    image.decoding = 'async';
    const done = () => {
      pending--;
      if (image.naturalWidth) images.set(key, image);
      if (pending <= 0) onReady(images);
    };
    image.onload = done;
    image.onerror = done;
    image.src = iconSrc(key);
  }
  return images;
}

function personScale(avatar) {
  return avatar.isHost ? HOST_SCALE : avatar.scale || 1;
}

function zoomFromSize(size, avatar) {
  return size / (PIXEL_SIZE * personScale(avatar));
}

function selectedSpriteMetrics(item) {
  const isHost = Boolean(item?.avatar?.isHost);
  const zoom = item ? zoomFromSize(item.size, item.avatar) : 1;
  const spriteBaseSize = isHost ? 60 : 56;
  const spriteScale = (isHost ? 4 : 3.65) * zoom;
  const spriteDrop = (isHost ? -10 : -8) * zoom;
  return {
    spriteBaseSize,
    spriteScale,
    spriteDrop,
    lift: HOVER_LIFT_PX * zoom,
    halfSpriteSize: (spriteBaseSize * spriteScale) / 2,
  };
}

function createPinLayer(host) {
  const layer = document.createElement('div');
  layer.className = 'ground-avatar-pin-layer';
  layer.setAttribute('aria-hidden', 'true');
  host.append(layer);
  const nodes = new Map();
  return {
    sync(items) {
      const seen = new Set();
      for (const item of items) {
        const color = item.avatar.pinColor;
        if (!color) continue;
        seen.add(item.avatar.id);
        let node = nodes.get(item.avatar.id);
        if (!node) {
          node = document.createElement('div');
          node.className = 'profile-pin-repere profile-pin-repere--ground';
          const ground = document.createElement('div');
          ground.className = 'profile-pin-repere__ground';
          node.append(ground);
          layer.append(node);
          nodes.set(item.avatar.id, node);
        }
        node.classList.toggle('is-current-user', Boolean(item.avatar.isHost));
        node.style.setProperty('--profile-pin-color', color);
        node.style.setProperty('--profile-pin-x', `${item.x}px`);
        node.style.setProperty('--profile-pin-y', `${item.y}px`);
        node.style.setProperty('--profile-pin-scale', String(zoomFromSize(item.size, item.avatar) * (item.avatar.isHost ? PIN_HOST_SCALE : 1)));
      }
      for (const [id, node] of nodes) {
        if (seen.has(id)) continue;
        node.remove();
        nodes.delete(id);
      }
    },
    hide() { this.sync([]); },
    dispose() {
      for (const node of nodes.values()) node.remove();
      nodes.clear();
      layer.remove();
    },
  };
}

function createSelectedOverlay(host) {
  const layer = document.createElement('div');
  layer.className = 'profile-icon-hover-overlay is-hover';
  layer.setAttribute('aria-hidden', 'true');
  layer.hidden = true;
  const connection = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  connection.classList.add('profile-icon-hover-overlay__connection');
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const origin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  origin.setAttribute('r', '5');
  connection.append(line, origin);
  let layoutWidth = 0, layoutHeight = 0, mobile = null;
  const glow = document.createElement('div');
  glow.className = 'profile-icon-hover-overlay__glow';
  const sprite = document.createElement('img');
  sprite.className = 'profile-icon-hover-overlay__sprite';
  sprite.alt = '';
  sprite.draggable = false;
  sprite.addEventListener('error', () => {
    const fallback = iconSrc(FALLBACK_ICON);
    if (sprite.getAttribute('src') !== fallback) sprite.src = fallback;
  });
  const name = document.createElement('div');
  name.className = 'profile-icon-hover-overlay__name';
  layer.append(connection, glow, sprite, name);
  host.append(layer);
  return {
    show(item, consulted = false, viewport) {
      if (!item) { layer.hidden = true; return; }
      if (viewport.width !== layoutWidth || viewport.height !== layoutHeight) {
        layoutWidth = viewport.width; layoutHeight = viewport.height;
        mobile = mobileArtistPanel(viewport);
      }
      const hostUser = Boolean(item.avatar.isHost);
      const metrics = selectedSpriteMetrics(item);
      let x = item.x, feetY = item.y + metrics.lift;
      let scale = metrics.spriteScale, drop = metrics.spriteDrop;
      if (mobile) {
        // Only the enlarged presentation moves. The map location stays marked.
        const size = Math.min(Math.max(112, metrics.spriteBaseSize * scale),
          208, Math.max(64, viewport.height - 110), viewport.height * 0.64, Math.max(72, mobile.left - 100));
        x = mobile.left - 12 - size / 2;
        feetY = Math.max(66 + size, Math.min(viewport.height - 34, feetY));
        scale = size / metrics.spriteBaseSize; drop = 0;
        line.setAttribute('x1', String(item.x)); line.setAttribute('y1', String(item.y));
        line.setAttribute('x2', String(x)); line.setAttribute('y2', String(feetY));
        origin.setAttribute('cx', String(item.x)); origin.setAttribute('cy', String(item.y));
      }
      layer.classList.toggle('is-mobile-profile', Boolean(mobile));
      layer.classList.toggle('is-current-user', hostUser);
      layer.classList.toggle('is-consulted', Boolean(consulted) && !hostUser);
      layer.style.setProperty('--profile-hover-x', `${x}px`);
      layer.style.setProperty('--profile-hover-y', `${feetY}px`);
      layer.style.setProperty('--profile-hover-scale', String(scale));
      layer.style.setProperty('--profile-hover-drop', `${drop}px`);
      layer.style.setProperty('--profile-hover-name-drop', mobile ? '6px' : `${(hostUser ? -4 : -3) * zoomFromSize(item.size, item.avatar)}px`);
      const src = iconSrc(item.avatar.icon);
      if (sprite.getAttribute('src') !== src) sprite.src = src;
      if (name.textContent !== item.avatar.name) name.textContent = item.avatar.name;
      layer.hidden = false;
    },
    hide() { layer.hidden = true; },
    dispose() { layer.remove(); },
  };
}

function createHoverCard(host) {
  const card = document.createElement('div');
  card.className = 'quarter-hover-card avatar-hover-card';
  card.setAttribute('role', 'tooltip');
  card.hidden = true;
  const name = document.createElement('strong');
  const role = document.createElement('span');
  role.className = 'quarter-hover-card__count';
  const place = document.createElement('span');
  place.className = 'avatar-hover-card__place';
  card.append(name, role, place);
  host.append(card);
  return {
    show(avatar, x, y) {
      if (!avatar) { card.hidden = true; return; }
      if (name.textContent !== avatar.name) name.textContent = avatar.name;
      if (role.textContent !== avatar.role) role.textContent = avatar.role;
      const label = avatar.zoneName || avatar.city;
      if (place.textContent !== label) place.textContent = label;
      card.hidden = false;
      const w = card.offsetWidth, h = card.offsetHeight;
      const right = document.documentElement.clientWidth;
      const bottom = document.documentElement.clientHeight;
      const left = x + 18 + w <= right - 12 ? x + 18 : x - w - 18;
      const top = y + 18 + h <= bottom - 12 ? y + 18 : y - h - 18;
      card.style.transform = `translate(${Math.max(12, Math.min(left, right - w - 12))}px, ${Math.max(12, Math.min(top, bottom - h - 12))}px)`;
    },
    hide() { card.hidden = true; },
    dispose() { card.remove(); },
  };
}

export function createGroundAvatars(host, sectors, communes, invalidate, camera, align = null, landmarkDepthAt = null) {
  const population = createParisAvatarPopulation(sectors, communes, { eager: false });
  const availableIcons = new Set();
  const pinLayer = createPinLayer(host);
  const sprites = createGroundAvatarSprites();
  const selectedOverlay = createSelectedOverlay(host);
  const hoverCard = createHoverCard(host);
  const byZone = new Map();
  const zoneCounts = new Map();
  const cityCounts = new Map();
  const drawn = [];
  const direction = new T.Vector3();
  const projected = new T.Vector3();
  let filters = readFilters();
  let consulted = readConsulted();
  let pinned = readPinned();
  let showing = false;
  let hoveredId = '';
  let selectedId = '';
  let selectedRestore = false;
  let activeZoneId = '';
  let viewState = null;
  let disposed = false;
  let paintState = null;
  let contentGeneration = 0;
  const populationWorker = new Worker(new URL('./avatar-population-worker.js', import.meta.url), { type: 'module' });
  const pendingZones = new Set(), failedZones = new Set();
  let searchId = 0, pendingSearch = null, workerFailed = false;
  populationWorker.onmessage = ({ data }) => {
    if (disposed) return;
    if (data.type === 'search') {
      if (data.id === searchId) { pendingSearch?.(data.hits); pendingSearch = null; }
      if (data.error) console.warn('Recherche des artistes indisponible :', data.error);
      return;
    }
    if (data.type !== 'zone') return;
    pendingZones.delete(data.zoneId);
    if (data.error) {
      failedZones.add(data.zoneId);
      console.warn('Avatars du quartier indisponibles :', data.error);
      return;
    }
    for (const avatar of data.avatars) prepareAvatar(avatar);
    byZone.set(data.zoneId, data.avatars);
    rebuildCounts();
    invalidate();
  };
  populationWorker.onerror = event => {
    workerFailed = true;
    pendingZones.clear();
    pendingSearch?.([]); pendingSearch = null;
    console.warn('Préparation des avatars interrompue :', event.message);
  };
  populationWorker.postMessage({ type: 'init', sectors, communes });

  function prepareAvatar(avatar) {
    const metres = (avatar.cityId === PARIS_CITY_ID ? quartierHeight(avatar.zoneId) : 0.18) + LIFT_METRES;
    avatar.radius = RADIUS + metres * METRES_TO_WORLD;
    avatar.position = new T.Vector3(...xyz(avatar.lon, avatar.lat, avatar.radius));
    if (align) avatar.position.applyQuaternion(align);
    avatar.screen = { avatar, x: 0, y: 0, size: 0, distance: 0, depth: 1 };
    avatar.pass = true;
  }

  function loadZone(zoneId) {
    if (!zoneId) return [];
    if (byZone.has(zoneId)) return byZone.get(zoneId);
    if (!pendingZones.has(zoneId) && !failedZones.has(zoneId) && !workerFailed) {
      pendingZones.add(zoneId);
      populationWorker.postMessage({ type: 'zone', zoneId });
    }
    return [];
  }

  loadZone(CHARONNE_ID);

  loadIcons(FILTER_ROLES, loaded => {
    if (disposed) return;
    availableIcons.clear();
    for (const key of loaded.keys()) availableIcons.add(key);
    sprites.setImages(loaded);
    contentGeneration++;
    paintState = null;
    invalidate();
  });

  function rebuildCounts() {
    contentGeneration++;
    paintState = null;
    zoneCounts.clear();
    cityCounts.clear();
    for (const list of byZone.values()) {
      for (const avatar of list) {
        let pass = true;
        // The host's permanent green marker takes precedence over saved pins.
        const pinColor = avatar.isHost ? HOST_PIN_COLOR : pinned.get(avatar.id) || '';
        avatar.pinColor = pinColor;
        if (!avatar.isHost && !pinned.get(avatar.id)) {
          if (!filters.roles.has(avatar.icon)) pass = false;
          else if (filters.grades.size && !filters.grades.has(avatar.grade)) pass = false;
          // Keep the open profile's avatar visible. The history filter takes
          // effect when selection is cleared or moves to another profile.
          else if (filters.hideConsulted && consulted.has(avatar.id) && avatar.id !== selectedId) pass = false;
        }
        avatar.pass = pass;
        if (!pass) continue;
        zoneCounts.set(avatar.zoneId, (zoneCounts.get(avatar.zoneId) || 0) + 1);
        cityCounts.set(avatar.cityId, (cityCounts.get(avatar.cityId) || 0) + 1);
      }
    }
  }
  rebuildCounts();

  let restoredVisitId = '';
  function finishSelectedVisit() {
    if (!selectedId || restoredVisitId === selectedId || consulted.has(selectedId) || pinned.get(selectedId)) return;
    for (const list of byZone.values()) {
      const avatar = list.find(entry => entry.id === selectedId);
      if (!avatar) continue;
      if (!avatar.isHost) {
        consulted.add(selectedId);
        contentGeneration++;
        persistConsulted(consulted);
      }
      return;
    }
  }

  function resolveZone(preferredId) {
    if (preferredId) {
      const list = loadZone(preferredId);
      return list.length ? preferredId : '';
    }
    if (showing && activeZoneId && byZone.has(activeZoneId)) return activeZoneId;
    return '';
  }

  function clearOverlay() {
    sprites.hide();
    drawn.length = 0;
    paintState = null;
    pinLayer.hide();
    selectedOverlay.hide();
  }

  function paintIsCurrent() {
    if (!viewState || !paintState) return false;
    const { view, width, height, preferredId } = viewState;
    return paintState.generation === contentGeneration && paintState.preferredId === preferredId
      && paintState.hoveredId === hoveredId && paintState.selectedId === selectedId && paintState.selectedRestore === selectedRestore
      && paintState.width === width && paintState.height === height
      && paintState.lon === view.lon && paintState.lat === view.lat && paintState.distance === view.height
      && paintState.pitch === view.pitch && paintState.bearing === view.bearing;
  }

  function collectScreen(view, width, height, preferredId) {
    activeZoneId = resolveZone(preferredId);
    const candidates = byZone.get(activeZoneId) || [];
    const items = [];
    for (const avatar of candidates) {
      if (!avatar.pass) continue;
      if (!availableIcons.has(avatar.icon) && !availableIcons.has(FALLBACK_ICON)) continue;
      const anchor = avatar.position;
      direction.copy(camera.position).sub(anchor);
      const distance = direction.length();
      const facing = anchor.dot(direction) / (avatar.radius * distance);
      if (facing < 0.08) continue;
      projected.copy(anchor).project(camera);
      if (projected.z < -1 || projected.z > 1) continue;
      const x = (projected.x + 1) * width / 2;
      const y = (1 - projected.y) * height / 2;
      const size = PIXEL_SIZE * personScale(avatar) * SIZE_LOCK_HEIGHT / Math.max(distance, camera.near);
      if (x < -size || y < -size || x > width + size || y > height + size * 1.2) continue;
      const item = avatar.screen;
      item.x = x; item.y = y; item.size = size; item.distance = distance; item.depth = projected.z;
      items.push(item);
    }
    items.sort((a, b) => {
      if (a.distance !== b.distance) return b.distance - a.distance;
      return a.avatar.id < b.avatar.id ? -1 : 1;
    });
    return items;
  }

  function paint(requestRender = true) {
    if (!viewState || !showing) {
      clearOverlay();
      if (requestRender) invalidate();
      return;
    }
    const { view, width, height, preferredId } = viewState;
    if (paintIsCurrent()) return;
    const items = collectScreen(view, width, height, preferredId);
    paintState = { generation: contentGeneration, preferredId, hoveredId, selectedId, selectedRestore,
      width, height, lon: view.lon, lat: view.lat, distance: view.height, pitch: view.pitch, bearing: view.bearing };
    sprites.begin(width, height, items.length);
    drawn.length = 0;
    const pinItems = [];
    let hostItem = null;
    let selectedItem = null;
    for (const item of items) {
      drawn.push(item);
      if (item.avatar.pinColor && !item.avatar.isHost) pinItems.push(item);
      if (item.avatar.isHost) hostItem = item;
      if (item.avatar.id === selectedId) { selectedItem = item; continue; }
      if (item.avatar.isHost) continue;
      const hovered = item.avatar.id === hoveredId;
      const gray = consulted.has(item.avatar.id) && !item.avatar.pinColor;
      sprites.add(item, item.size * (hovered ? 1.08 : 1), gray ? 0.55 : 1, gray ? 0 : 1);
    }
    if (hostItem) {
      const hovered = hostItem.avatar.id === hoveredId;
      // Keep the ground marker when the enlarged profile presentation replaces
      // the sprite. Its radius and foot anchor stay fixed during hover/selection.
      const pinRadius = 41 * zoomFromSize(hostItem.size, hostItem.avatar) * PIN_HOST_SCALE;
      sprites.add(hostItem, hostItem.size * (hovered ? 1.06 : 1), hostItem === selectedItem ? 0 : 1, 1, pinRadius);
    }
    sprites.finish();
    pinLayer.sync(pinItems);
    selectedOverlay.show(selectedItem, selectedRestore && !selectedItem?.avatar.pinColor, { width, height });
    if (requestRender) invalidate();
  }

  function pickScreen(clientX, clientY) {
    if (!showing || !drawn.length) return null;
    const rect = host.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    let best = null, bestD = Infinity;
    // Query the monument only if an avatar hit area reaches the pointer,
    // and at most once per pick; never raycast for every rendered avatar.
    let monumentDepth;
    for (const item of drawn) {
      const dx = x - item.x;
      const dy = y - (item.y - item.size / 2);
      const distance = dx * dx + dy * dy;
      const radius = Math.max(24, item.size * 0.68);
      if (distance <= radius * radius && distance < bestD) {
        if (monumentDepth === undefined) monumentDepth = landmarkDepthAt?.(x, y, rect.width, rect.height) ?? Infinity;
        if (monumentDepth < item.depth - 0.0000001) continue;
        best = item.avatar;
        bestD = distance;
      }
    }
    return best;
  }

  const onFilters = event => {
    const detail = event.detail || {};
    filters = {
      roles: new Set(Array.isArray(detail.roles) ? detail.roles : FILTER_ROLES),
      grades: new Set(Array.isArray(detail.grades) ? detail.grades : []),
      hideConsulted: detail.hideConsulted === true,
    };
    rebuildCounts();
    if (selectedId) {
      let visible = false;
      for (const list of byZone.values()) {
        const avatar = list.find(entry => entry.id === selectedId);
        if (avatar?.pass) { visible = true; break; }
      }
      if (!visible) {
        finishSelectedVisit();
        selectedId = '';
        selectedRestore = false;
        window.dispatchEvent(new CustomEvent('meewav:ground-avatar-select', { detail: null }));
      }
    }
    paint();
    invalidate();
  };
  window.addEventListener('meewav:filters-change', onFilters);

  const onPin = event => {
    const detail = event.detail || {};
    const id = String(detail.id || '');
    if (!id) return;
    if (detail.active && typeof detail.color === 'string' && detail.color) pinned.set(id, detail.color);
    else pinned.delete(id);
    try { localStorage.setItem(STORAGE_PINS, JSON.stringify(Object.fromEntries(pinned))); } catch { /* optional */ }
    rebuildCounts();
    paint();
    invalidate();
  };
  window.addEventListener('meewav:ground-avatar-pin', onPin);

  const onRestore = event => {
    const id = String(event.detail?.id || '');
    if (!id || !consulted.has(id)) return;
    consulted.delete(id);
    contentGeneration++;
    persistConsulted(consulted);
    if (selectedId === id) {
      selectedRestore = false;
      restoredVisitId = id;
    }
    if (filters.hideConsulted) rebuildCounts();
    paint();
    invalidate();
  };
  window.addEventListener('meewav:ground-avatar-restore', onRestore);

  return {
    get avatars() {
      const list = [];
      for (const zone of byZone.values()) list.push(...zone);
      return list;
    },
    pick(x, y) { return pickScreen(x, y); },
    hover(x, y) {
      const avatar = pickScreen(x, y);
      const next = avatar ? avatar.id : '';
      const changed = next !== hoveredId;
      hoveredId = next;
      if (selectedId) hoverCard.hide();
      else if (avatar) hoverCard.show(avatar, x, y);
      else hoverCard.hide();
      if (changed) paint();
      return avatar;
    },
    hideHover() {
      hoverCard.hide();
      if (!hoveredId) return;
      hoveredId = '';
    },
    select(avatar, x, y, width, height) {
      // Opening a profile starts a visit. Only leaving it completes that visit.
      if (selectedId !== avatar?.id) {
        finishSelectedVisit();
        restoredVisitId = '';
      }
      selectedRestore = Boolean(
        avatar && !avatar.isHost && !pinned.get(avatar.id) && consulted.has(avatar.id),
      );
      selectedId = avatar?.id || '';
      hoveredId = selectedId;
      // Reapply even for a pinned/self profile: the previous selection loses
      // its temporary exemption as soon as a different profile is opened.
      if (filters.hideConsulted) rebuildCounts();
      hoverCard.hide();
      paint();
      const rect = host.getBoundingClientRect();
      const item = drawn.find(entry => entry.avatar.id === avatar.id);
      const feetX = item ? item.x : x - rect.left;
      const feetY = item ? item.y : y - rect.top;
      const metrics = selectedSpriteMetrics(item || { avatar, size: PIXEL_SIZE * personScale(avatar) });
      host.dispatchEvent(new CustomEvent('meewav:ground-avatar-select', {
        bubbles: true,
        detail: {
          id: avatar.id, name: avatar.name, role: avatar.role, icon: avatar.icon,
          zoneName: avatar.zoneName, city: avatar.city, grade: avatar.grade, isHost: avatar.isHost,
          wasConsulted: selectedRestore,
          lon: avatar.lon, lat: avatar.lat, zoneId: avatar.zoneId,
          anchor: {
            x: rect.left + feetX,
            y: rect.top + feetY + metrics.lift + metrics.spriteDrop - metrics.halfSpriteSize,
            clearance: metrics.halfSpriteSize,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          },
        },
      }));
      return avatar;
    },
    clearSelection() {
      if (!selectedId) return;
      finishSelectedVisit();
      selectedId = '';
      restoredVisitId = '';
      selectedRestore = false;
      if (filters.hideConsulted) rebuildCounts();
      paint();
    },
    countFor(feature) {
      if (!feature) return 0;
      if (feature.properties?.kind === 'quartier') {
        population.ensureQuartier(feature);
        return population.quota(feature.id);
      }
      loadZone(feature.id);
      return cityCounts.get(feature.id) || population.quota(feature.id) || population.cityTotal(feature.id);
    },
    countForCity(cityId) { return cityCounts.get(cityId) || population.cityTotal(cityId); },
    search(needle) {
      pendingSearch?.([]);
      pendingSearch = null;
      const id = ++searchId;
      if (disposed || workerFailed) return Promise.resolve([]);
      if (!String(needle).trim()) {
        populationWorker.postMessage({ type: 'cancel-search' });
        return Promise.resolve([]);
      }
      return new Promise(resolve => {
        pendingSearch = resolve;
        populationWorker.postMessage({ type: 'search', id, query: needle,
          preferredZones: [...byZone.keys()],
          roles: [...filters.roles], grades: [...filters.grades], hideConsulted: filters.hideConsulted,
          pinned: [...pinned.keys()], consulted: [...consulted], selectedId });
      });
    },
    occupiedZone() { return showing && activeZoneId ? activeZoneId : ''; },
    warmup(zoneId) { loadZone(zoneId); },
    adoptQuartiers(features) {
      if (!Array.isArray(features) || !features.length) return;
      for (const feature of features) population.ensureQuartier(feature);
      populationWorker.postMessage({ type: 'quarters', features });
      rebuildCounts();
      if (showing) invalidate();
    },
    stats() {
      return { total: population.total(), visible: showing ? drawn.length : 0 };
    },
    update(view, width, height, preferredId, options = {}) {
      const next = showing ? view.height <= HIDE_HEIGHT : view.height <= SHOW_HEIGHT;
      viewState = { view, width, height, preferredId };
      if (next !== showing) {
        showing = next;
        if (!showing) {
          hoveredId = '';
          activeZoneId = '';
          hoverCard.hide();
          selectedOverlay.hide();
          pinLayer.hide();
          clearOverlay();
          return;
        }
      }
      if (!showing) return;
      // A frozen overlay stays glued to the screen, so the sprites ride the
      // camera. Hide them on a long approach; keep painting on street hops.
      if (options.hold) {
        hoverCard.hide();
        selectedOverlay.hide();
        pinLayer.hide();
        clearOverlay();
        return;
      }
      paint(false);
    },
    render(renderer) { sprites.render(renderer); },
    dispose() {
      disposed = true;
      populationWorker.terminate();
      pendingZones.clear();
      pendingSearch?.([]); pendingSearch = null;
      window.removeEventListener('meewav:filters-change', onFilters);
      window.removeEventListener('meewav:ground-avatar-pin', onPin);
      window.removeEventListener('meewav:ground-avatar-restore', onRestore);
      hoverCard.dispose();
      selectedOverlay.dispose();
      pinLayer.dispose();
      sprites.dispose();
    },
  };
}

export { formatAvatarCount };
