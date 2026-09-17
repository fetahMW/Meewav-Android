import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  MeewavActiveFilterChips,
  MeewavFilterPanel,
  MeewavFilterSection,
  MeewavSearchFilterBar,
  type MeewavActiveFilter,
} from "../../../components/shared/search-filter/MeewavSearchFilter";
import {
  GLOBE_ARTIST_ROLE_OPTIONS,
  type ProfileIconCategoryId,
} from "../../../components/shared/avatar/profileIconCatalog";
import { RoomCard } from "./RoomCard";
import { MeewavGradeBadge } from "../../grades/MeewavGradeBadge";
import { RoomRail } from "./RoomRail";
import LaunchRoomSheet from "../launch/LaunchRoomSheet";
import { ROOMS_HOME_CATALOG, ROOMS_HOME_COLLECTIONS } from "./roomsHome.fixtures";
import {
  getRoomsHomeCollectionBySlug,
  getRoomsHomeCollectionItems,
  getRoomsHomeRails,
} from "./roomsHome.selectors";
import {
  readRoomsHomeSessionSnapshot,
  updateRoomsHomeSessionSnapshot,
} from "./roomsHome.session";
import type {
  RoomsHomeCollectionDefinition,
  RoomsHomeAccessType,
  RoomsHomeFormatFilter,
  RoomsHomeRoom,
  RoomsHomeRoomType,
} from "./roomsHome.types";
import "./rooms-home.css";
import "./rooms-home-filter-lacquer.css";
import "./rooms-home-lacquer.css";

const FORMAT_OPTIONS: ReadonlyArray<{ value: RoomsHomeFormatFilter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
];

const ROOM_TYPE_OPTIONS: ReadonlyArray<{ value: RoomsHomeRoomType; label: string }> = [
  { value: "loge", label: "La Loge" },
  { value: "place", label: "La Place" },
  { value: "wave", label: "La Wave" },
  { value: "cage", label: "La Cage" },
  { value: "classe", label: "La Classe" },
  { value: "scene", label: "La Scène" },
];

const GRADE_LEVELS = [1, 2, 3, 4, 5, 6] as const;
const MUSIC_STYLE_OPTIONS = [...new Set(ROOMS_HOME_CATALOG.map((room) => room.musicStyle))]
  .sort((left, right) => left.localeCompare(right, "fr"));

type RoomsHomeFilters = {
  roomTypes: RoomsHomeRoomType[];
  avatarStyles: ProfileIconCategoryId[];
  musicStyle: string;
  gradeLevels: number[];
  accessType: "all" | RoomsHomeAccessType;
  cities: string[];
  districts: string[];
};

const EMPTY_FILTERS: RoomsHomeFilters = {
  roomTypes: [],
  avatarStyles: [],
  musicStyle: "all",
  gradeLevels: [],
  accessType: "all",
  cities: [],
  districts: [],
};

const ROOMS_HOME_CITIES = [...new Set(ROOMS_HOME_CATALOG.map((room) => room.city).filter((city): city is string => Boolean(city)))];
const ROOMS_HOME_DISTRICTS_BY_CITY = ROOMS_HOME_CITIES.reduce<Record<string, string[]>>((acc, city) => {
  acc[city] = [...new Set(ROOMS_HOME_CATALOG.filter((room) => room.city === city).map((room) => room.district).filter((district): district is string => Boolean(district)))];
  return acc;
}, {});

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function roomMatchesAvatarStyle(room: RoomsHomeRoom, avatarStyle: ProfileIconCategoryId) {
  const role = normalized(room.hostRole);
  const option = GLOBE_ARTIST_ROLE_OPTIONS.find(({ key }) => key === avatarStyle);
  return Boolean(option?.filterTokens.some((token) => {
    const normalizedToken = normalized(token.replaceAll("_", " "));
    return normalizedToken.length > 2 && !normalizedToken.startsWith("avatar ") && role.includes(normalizedToken);
  }));
}

const ROOM_AVATAR_OPTIONS = GLOBE_ARTIST_ROLE_OPTIONS
  .map((option) => ({
    ...option,
    count: ROOMS_HOME_CATALOG.filter((room) => roomMatchesAvatarStyle(room, option.key)).length,
  }))
  .filter(({ count }) => count > 0);

function roomMatchesFilters(room: RoomsHomeRoom, query: string, filters: RoomsHomeFilters) {
  const normalizedQuery = normalized(query.trim());
  if (normalizedQuery) {
    const haystack = normalized([
      room.title,
      room.hostName,
      room.hostRole,
      room.musicStyle,
      room.roomType,
      ...room.tags,
    ].join(" "));
    if (!haystack.includes(normalizedQuery)) return false;
  }
  if (filters.roomTypes.length > 0 && !filters.roomTypes.includes(room.roomType)) return false;
  if (filters.avatarStyles.length > 0 && !filters.avatarStyles.some((style) => roomMatchesAvatarStyle(room, style))) return false;
  if (filters.musicStyle !== "all" && room.musicStyle !== filters.musicStyle) return false;
  if (filters.gradeLevels.length > 0 && (!room.gradeLevel || !filters.gradeLevels.includes(room.gradeLevel))) return false;
  if (filters.accessType !== "all" && room.accessType !== filters.accessType) return false;
  if (filters.cities.length > 0 && (!room.city || !filters.cities.includes(room.city))) return false;
  if (filters.districts.length > 0 && (!room.district || !filters.districts.includes(room.district))) return false;
  return true;
}

function filterCount(filters: RoomsHomeFilters) {
  return filters.roomTypes.length
    + filters.avatarStyles.length
    + filters.gradeLevels.length
    + (filters.musicStyle === "all" ? 0 : 1)
    + (filters.accessType === "all" ? 0 : 1)
    + filters.cities.length
    + filters.districts.length;
}

function toggleValue<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

type RoomsHomeProps = {
  roomType?: RoomsHomeRoomType;
  collectionSlug?: string | null;
  onOpenRoom?: (room: RoomsHomeRoom) => void;
};

export function RoomsHome({ collectionSlug = null, roomType, onOpenRoom }: RoomsHomeProps) {
  const navigate = useNavigate();
  const initialSnapshotRef = useRef(readRoomsHomeSessionSnapshot());
  const scrollSurfaceRef = useRef<HTMLDivElement | null>(null);
  const railPositionsRef = useRef<Record<string, number>>({
    ...initialSnapshotRef.current.railScrollLeftBySlug,
  });
  const launchDialogCloseRef = useRef<HTMLButtonElement | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [format, setFormat] = useState<RoomsHomeFormatFilter>(initialSnapshotRef.current.format);
  const [launchDialogOpen, setLaunchDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<RoomsHomeFilters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<RoomsHomeFilters>(EMPTY_FILTERS);
  const collection = collectionSlug ? getRoomsHomeCollectionBySlug(collectionSlug) : undefined;
  const isCollectionView = Boolean(collectionSlug);
  const activeFilterCount = filterCount(filters);
  const draftFilterCount = filterCount(draftFilters);

  const filteredCatalog = useMemo(
    () => ROOMS_HOME_CATALOG.filter((room) => room.country === "FR" && (!roomType || room.roomType === roomType) && roomMatchesFilters(room, query, filters)),
    [filters, query, roomType],
  );
  const draftResultCount = useMemo(
    () => ROOMS_HOME_CATALOG.filter((room) => room.country === "FR" && (!roomType || room.roomType === roomType) && roomMatchesFilters(room, query, draftFilters)).length,
    [draftFilters, query, roomType],
  );

  const rails = useMemo(() => {
    const nextRails = getRoomsHomeRails(format, filteredCatalog);
    if (roomType) return nextRails;
    const heroByType = new Map<RoomsHomeRoomType, RoomsHomeRoom>();
    [...filteredCatalog]
      .sort((left, right) => right.buzzScore - left.buzzScore || right.viewerCount - left.viewerCount || left.id.localeCompare(right.id, "fr"))
      .forEach((room) => { if (!heroByType.has(room.roomType)) heroByType.set(room.roomType, room); });
    const heroes = [...heroByType.values()];
    if (heroes.length === 0) return nextRails;
    return nextRails.map((rail, index) => index === 0 ? { ...rail, items: heroes } : rail);
  }, [filteredCatalog, format, roomType]);
  const collectionItems = useMemo(
    () => (collection ? getRoomsHomeCollectionItems(collection.slug, format, filteredCatalog) : []),
    [collection, filteredCatalog, format],
  );

  const activeFilterChips = useMemo<MeewavActiveFilter[]>(() => {
    const chips: MeewavActiveFilter[] = [];
    filters.roomTypes.forEach((roomType) => {
      chips.push({
        id: `room:${roomType}`,
        label: ROOM_TYPE_OPTIONS.find(({ value }) => value === roomType)?.label ?? roomType,
        onRemove: () => setFilters((current) => ({
          ...current,
          roomTypes: current.roomTypes.filter((value) => value !== roomType),
        })),
      });
    });
    filters.avatarStyles.forEach((avatarStyle) => {
      chips.push({
        id: `avatar:${avatarStyle}`,
        label: ROOM_AVATAR_OPTIONS.find(({ key }) => key === avatarStyle)?.label ?? "Avatar",
        onRemove: () => setFilters((current) => ({
          ...current,
          avatarStyles: current.avatarStyles.filter((value) => value !== avatarStyle),
        })),
      });
    });
    filters.gradeLevels.forEach((gradeLevel) => {
      chips.push({
        id: `grade:${gradeLevel}`,
        label: `Badge ${gradeLevel}`,
        onRemove: () => setFilters((current) => ({
          ...current,
          gradeLevels: current.gradeLevels.filter((value) => value !== gradeLevel),
        })),
      });
    });
    if (filters.musicStyle !== "all") chips.push({
      id: "music-style",
      label: filters.musicStyle,
      onRemove: () => setFilters((current) => ({ ...current, musicStyle: "all" })),
    });
    if (filters.accessType !== "all") chips.push({
      id: "access",
      label: filters.accessType === "members" ? "Membres" : filters.accessType === "invitation" ? "Invitation" : "Public",
      onRemove: () => setFilters((current) => ({ ...current, accessType: "all" })),
    });
    filters.cities.forEach((city) => {
      chips.push({
        id: `city:${city}`,
        label: city,
        onRemove: () => setFilters((current) => ({
          ...current,
          cities: current.cities.filter((value) => value !== city),
          districts: current.districts.filter((value) => !(ROOMS_HOME_DISTRICTS_BY_CITY[city] ?? []).includes(value)),
        })),
      });
    });
    filters.districts.forEach((district) => {
      chips.push({
        id: `district:${district}`,
        label: district,
        onRemove: () => setFilters((current) => ({
          ...current,
          districts: current.districts.filter((value) => value !== district),
        })),
      });
    });
    return chips;
  }, [filters]);

  const savePosition = useCallback(() => {
    const scrollTop = scrollSurfaceRef.current?.scrollTop ?? 0;
    if (collection) {
      updateRoomsHomeSessionSnapshot({
        format,
        collectionScrollTopBySlug: { [collection.slug]: scrollTop },
      });
      return;
    }
    updateRoomsHomeSessionSnapshot({
      format,
      homeScrollTop: scrollTop,
      railScrollLeftBySlug: railPositionsRef.current,
    });
  }, [collection, format]);

  useLayoutEffect(() => {
    const surface = scrollSurfaceRef.current;
    if (!surface) return undefined;
    const snapshot = readRoomsHomeSessionSnapshot();
    const savedTop = collection
      ? snapshot.collectionScrollTopBySlug[collection.slug] ?? 0
      : snapshot.homeScrollTop;
    const frame = window.requestAnimationFrame(() => {
      surface.scrollTop = savedTop;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [collection]);

  useEffect(() => () => savePosition(), [savePosition]);

  useEffect(() => {
    if (!launchDialogOpen) return undefined;
    const focusFrame = window.requestAnimationFrame(() => launchDialogCloseRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLaunchDialogOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [launchDialogOpen]);

  const handleFormatChange = (nextFormat: RoomsHomeFormatFilter) => {
    setFormat(nextFormat);
    updateRoomsHomeSessionSnapshot({ format: nextFormat });
  };

  const toggleFilters = () => {
    if (!filterOpen) {
      setDraftFilters({
        ...filters,
        roomTypes: [...filters.roomTypes],
        avatarStyles: [...filters.avatarStyles],
        gradeLevels: [...filters.gradeLevels],
      });
    }
    setFilterOpen((current) => !current);
  };

  const resetAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    setDraftFilters(EMPTY_FILTERS);
  };

  const openRoom = (room: RoomsHomeRoom) => {
    savePosition();
    onOpenRoom?.(room);
  };

  const openCollection = (nextCollection: RoomsHomeCollectionDefinition) => {
    savePosition();
    navigate(`/rooms/collections/${nextCollection.slug}${roomType ? `?type=${roomType}` : ""}`);
  };

  const returnHome = () => {
    savePosition();
    navigate(`/rooms/home${roomType ? `?type=${roomType}` : ""}`);
  };

  const closeLaunchDialogFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) setLaunchDialogOpen(false);
  };

  return (
    <div
      ref={scrollSurfaceRef}
      className={`rooms-home${isCollectionView ? " rooms-home--collection" : ""}`}
      data-testid="rooms-home"
      data-media-format={format}
    >
      <div className="rooms-home__ambient" aria-hidden="true" />

      <header className="rooms-home__controls">
        {isCollectionView ? (
          <button type="button" className="rooms-home__back" onClick={returnHome}>
            <ArrowLeft aria-hidden="true" />
            <span>Retour à l’accueil</span>
          </button>
        ) : (
          <div className="rooms-home__search-wrap">
            <MeewavSearchFilterBar
              query={query}
              placeholder="Rechercher une room…"
              inputAriaLabel="Rechercher une Room, un artiste ou un style"
              onQueryChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery("")}
              onToggleFilters={toggleFilters}
              filterOpen={filterOpen}
              filterActive={activeFilterCount > 0}
              activeFilterCount={activeFilterCount}
              filterPanelId="rooms-home-filter-panel"
              filterTriggerRef={filterTriggerRef}
              placement="flow"
              className="rooms-home__search"
            />
          </div>
        )}

        <div className="rooms-home__control-actions">
          <div className="rooms-home__format" role="group" aria-label="Filtrer les Rooms par format">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={format === option.value ? "is-active" : ""}
                aria-pressed={format === option.value}
                onClick={() => handleFormatChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {!isCollectionView ? (
            <button
              type="button"
              className="rooms-home__launch"
              onClick={() => setLaunchDialogOpen(true)}
              aria-label="Ouvrir le séquenceur de lancement"
            >
              <span className="rooms-home__launch-icon"><Plus aria-hidden="true" /></span>
              <span className="rooms-home__launch-copy">
                <strong>Lancer une Room</strong>
              </span>
            </button>
          ) : null}
        </div>
      </header>

      {!isCollectionView ? (
        <div className="rooms-home__discovery">
          <span className="rooms-home__live-dot" aria-hidden="true" />
          <strong>{filteredCatalog.length} Room{filteredCatalog.length > 1 ? "s" : ""} en direct</strong>
          <span>France · {roomType ? ROOM_TYPE_OPTIONS.find((option) => option.value === roomType)?.label : "Tous les univers"}</span><small className="rooms-home__demo-label">Présentation · directs simulés</small>
        </div>
      ) : null}

      {!isCollectionView && activeFilterChips.length > 0 ? (
        <div className="rooms-home__active-filters">
          <MeewavActiveFilterChips filters={activeFilterChips} onClear={resetAllFilters} />
        </div>
      ) : null}

      {isCollectionView ? (
        collection ? (
          <main className="rooms-home-collection" aria-labelledby="rooms-home-collection-title">
            <div className="rooms-home-collection__intro">
              <div>
                <span>{collectionItems.length} Rooms disponibles</span>
                <h1 id="rooms-home-collection-title">{collection.title}</h1>
                <p>{collection.description}</p>
              </div>
            </div>
            {collectionItems.length > 0 ? (
              <div className="rooms-home-collection__grid">
                {collectionItems.map((room, index) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    priority={index < 2}
                    onOpen={openRoom}
                  />
                ))}
              </div>
            ) : (
              <div className="rooms-home__empty" role="status">
                <strong>Aucune Room dans ce format</strong>
                <span>Essaie un autre format pour retrouver les directs de cette collection.</span>
              </div>
            )}
          </main>
        ) : (
          <main className="rooms-home__empty rooms-home__empty--page" role="status">
            <strong>Cette collection n’existe pas</strong>
            <span>Reviens à l’accueil pour découvrir les sept sélections Rooms.</span>
            <button type="button" onClick={returnHome}>Retour à l’accueil</button>
          </main>
        )
      ) : (
        <main className="rooms-home__rails" aria-label="Sélections Rooms">
          {rails.filter(({ items }) => items.length > 0).map(({ collection: railCollection, items }) => (
            <RoomRail
              key={`${railCollection.slug}:${format}`}
              collection={railCollection}
              title={railCollection.title}
              items={items}
              featured={railCollection.cardSize === "featured"}
              initialScrollLeft={railPositionsRef.current[railCollection.slug] ?? 0}
              onScrollPosition={(changedCollection, scrollLeft) => {
                railPositionsRef.current[changedCollection.slug] = scrollLeft;
              }}
              onOpen={openRoom}
              onSeeMore={openCollection}
            />
          ))}
          {rails.some(({ items }) => items.length > 0) ? null : (
            <div className="rooms-home__empty" role="status">Aucune Room avec ces critères. Essaie un autre format ou efface les filtres.</div>
          )}
        </main>
      )}

      <MeewavFilterPanel
        open={filterOpen}
        panelId="rooms-home-filter-panel"
        eyebrow="DÉCOUVERTE LIVE"
        title="Filtrer les Rooms"
        description="Trouve le direct qui correspond à ton univers et aux artistes que tu veux rejoindre."
        onClose={() => setFilterOpen(false)}
        onReset={() => setDraftFilters(EMPTY_FILTERS)}
        onApply={() => {
          setFilters({
            ...draftFilters,
            roomTypes: [...draftFilters.roomTypes],
            avatarStyles: [...draftFilters.avatarStyles],
            gradeLevels: [...draftFilters.gradeLevels],
          });
          setFilterOpen(false);
        }}
        resetLabel="Tout effacer"
        applyLabel={`Afficher ${draftResultCount} Room${draftResultCount > 1 ? "s" : ""}`}
        selectionHint={`${draftFilterCount} filtre${draftFilterCount > 1 ? "s" : ""} actif${draftFilterCount > 1 ? "s" : ""}`}
        triggerRef={filterTriggerRef}
        boundarySelector=".rooms-page__future-surface"
      >
        <MeewavFilterSection
          label="Styles d’avatar"
          summary={draftFilters.avatarStyles.length > 0 ? `${draftFilters.avatarStyles.length} choisis` : "Tous"}
        >
          <div className="meewav-filter-choice-grid" role="group" aria-label="Filtrer par style d’avatar">
            {ROOM_AVATAR_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`meewav-filter-choice rooms-home-filter__artist${draftFilters.avatarStyles.includes(option.key) ? " is-active" : ""}`}
                aria-label={option.label}
                aria-pressed={draftFilters.avatarStyles.includes(option.key)}
                onClick={() => setDraftFilters((current) => ({
                  ...current,
                  avatarStyles: toggleValue(current.avatarStyles, option.key),
                }))}
              >
                <img className="rooms-home-filter__avatar" src={option.imageUrl} alt="" loading="lazy" decoding="async" draggable={false} />
                <span>{option.label}</span>
                <small>{option.count}</small>
              </button>
            ))}
          </div>
        </MeewavFilterSection>

        <MeewavFilterSection
          label="Type de Room"
          summary={draftFilters.roomTypes.length > 0 ? `${draftFilters.roomTypes.length} choisies` : "Toutes"}
        >
          <div className="meewav-filter-choice-grid">
            {ROOM_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`meewav-filter-choice rooms-home-filter__room rooms-home-filter__room--${option.value}${draftFilters.roomTypes.includes(option.value) ? " is-active" : ""}`}
                aria-pressed={draftFilters.roomTypes.includes(option.value)}
                onClick={() => setDraftFilters((current) => ({
                  ...current,
                  roomTypes: toggleValue(current.roomTypes, option.value),
                }))}
              >
                {option.label}
              </button>
            ))}
          </div>
        </MeewavFilterSection>

        <MeewavFilterSection label="Style musical" summary={draftFilters.musicStyle === "all" ? "Tous" : draftFilters.musicStyle}>
          <label className="meewav-filter-field">
            <span>Univers musical</span>
            <select
              value={draftFilters.musicStyle}
              onChange={(event) => setDraftFilters((current) => ({ ...current, musicStyle: event.target.value }))}
            >
              <option value="all">Tous les styles</option>
              {MUSIC_STYLE_OPTIONS.map((style) => <option key={style} value={style}>{style}</option>)}
            </select>
          </label>
        </MeewavFilterSection>

        <MeewavFilterSection
          label="Badge MeeWav"
          summary={draftFilters.gradeLevels.length > 0 ? `${draftFilters.gradeLevels.length} niveaux` : "Tous"}
        >
          <div className="rooms-home-filter__grades" role="group" aria-label="Filtrer par badge MeeWav">
            {GRADE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={draftFilters.gradeLevels.includes(level) ? "is-active" : ""}
                aria-label={`Badge niveau ${level}`}
                aria-pressed={draftFilters.gradeLevels.includes(level)}
                onClick={() => setDraftFilters((current) => ({
                  ...current,
                  gradeLevels: toggleValue(current.gradeLevels, level),
                }))}
              >
                <MeewavGradeBadge level={level} size="sm" variant="icon" labelMode="none" />
                <span>Niveau {level}</span>
              </button>
            ))}
          </div>
        </MeewavFilterSection>

        <MeewavFilterSection label="Accès" summary={draftFilters.accessType === "all" ? "Tous" : draftFilters.accessType}>
          <div className="meewav-filter-choice-grid">
            {([
              ["all", "Tous les accès"],
              ["public", "Public"],
              ["members", "Membres"],
              ["invitation", "Sur invitation"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`meewav-filter-choice${draftFilters.accessType === value ? " is-active" : ""}`}
                aria-pressed={draftFilters.accessType === value}
                onClick={() => setDraftFilters((current) => ({ ...current, accessType: value }))}
              >
                {label}
              </button>
            ))}
          </div>
        </MeewavFilterSection>

        <MeewavFilterSection
          label="Par lieu"
          summary={draftFilters.cities.length === 0
            ? "Partout en France"
            : draftFilters.cities.length === 1
              ? (draftFilters.districts.length > 0 ? draftFilters.districts.join(", ") : draftFilters.cities[0])
              : `${draftFilters.cities.length} villes`}
        >
          <div className="meewav-filter-choice-grid" role="group" aria-label="Filtrer par ville">
            {ROOMS_HOME_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                className={`meewav-filter-choice${draftFilters.cities.includes(city) ? " is-active" : ""}`}
                aria-pressed={draftFilters.cities.includes(city)}
                onClick={() => setDraftFilters((current) => {
                  const removing = current.cities.includes(city);
                  return {
                    ...current,
                    cities: toggleValue(current.cities, city),
                    districts: removing
                      ? current.districts.filter((value) => !(ROOMS_HOME_DISTRICTS_BY_CITY[city] ?? []).includes(value))
                      : current.districts,
                  };
                })}
              >
                {city}
              </button>
            ))}
          </div>
          {draftFilters.cities.length === 1 ? (
            <div className="meewav-filter-choice-grid rooms-home-filter__districts" role="group" aria-label={`Quartiers de ${draftFilters.cities[0]}`}>
              {(ROOMS_HOME_DISTRICTS_BY_CITY[draftFilters.cities[0]] ?? []).map((district) => (
                <button
                  key={district}
                  type="button"
                  className={`meewav-filter-choice${draftFilters.districts.includes(district) ? " is-active" : ""}`}
                  aria-pressed={draftFilters.districts.includes(district)}
                  onClick={() => setDraftFilters((current) => ({
                    ...current,
                    districts: toggleValue(current.districts, district),
                  }))}
                >
                  {district}
                </button>
              ))}
            </div>
          ) : null}
        </MeewavFilterSection>
      </MeewavFilterPanel>

      {launchDialogOpen ? createPortal((
        <div
          className="rooms-home-launch-dialog"
          role="presentation"
          onMouseDown={closeLaunchDialogFromBackdrop}
        >
          <LaunchRoomSheet initialType={roomType}
            closeRef={launchDialogCloseRef}
            onClose={() => setLaunchDialogOpen(false)}
          />
        </div>
      ), document.body) : null}
    </div>
  );
}

export default RoomsHome;
