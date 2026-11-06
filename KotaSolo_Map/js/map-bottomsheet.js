/**
 * Solo Explorer — Bottom Sheet
 *
 * Three states:
 * - collapsed
 * - half
 * - full
 *
 * Mobile only.
 * On desktop, the sidebar handles destination details.
 */

import { escapeHtml, pickImage } from './map-utils.js';
import { logEvent } from './map-activity-log.js';

// ============================================================
// STATE
// ============================================================

let _sheet = null;
let _handle = null;
let _content = null;

let _current = 'collapsed';

let _pointerStartY = null;
let _pointerStartState = 'collapsed';
let _pointerId = null;

let _dragging = false;
let _suppressNextClick = false;
let _initialized = false;

// Bottom sheet snap states
const SNAPS = ['collapsed', 'half', 'full'];

// Mobile breakpoint
const MOBILE_BREAKPOINT = 768;

// ============================================================
// INITIALIZATION
// ============================================================

export function initBottomSheet() {
    _sheet = document.getElementById('bottomsheet');
    _handle = _sheet?.querySelector('.bottomsheet__handle');
    _content = document.getElementById('bottomsheet-content');

    if (!_sheet || !_handle) {
        console.warn('[BottomSheet] Required elements not found.');
        return;
    }

    // Prevent duplicate event listeners
    if (_initialized) return;

    _initialized = true;

    // Set initial state
    setState('collapsed');

    // --------------------------------------------------------
    // Handle click: cycle bottom sheet upward
    // collapsed -> half -> full
    // --------------------------------------------------------

    _handle.addEventListener('click', () => {
        // Ignore synthetic click generated after dragging
        if (_suppressNextClick) {
            _suppressNextClick = false;
            return;
        }

        if (_dragging) return;

        const idx = SNAPS.indexOf(_current);

        const next = SNAPS[
            Math.min(idx + 1, SNAPS.length - 1)
        ];

        setState(next);
    });

    // --------------------------------------------------------
    // Pointer events
    // --------------------------------------------------------

    _handle.addEventListener('pointerdown', onPointerDown);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);

    console.info('[BottomSheet] Initialized successfully.');
}

// ============================================================
// PUBLIC METHODS
// ============================================================

/**
 * Open bottom sheet and display destination details.
 *
 * @param {Object} destination
 * @param {Object} mapContext
 */

export function openSheet(destination, mapContext) {
    if (!_sheet) return;

    if (_content && destination) {
        renderContent(destination, mapContext);
    }

    _sheet.setAttribute('aria-hidden', 'false');

    setState('half');
}

/**
 * Close bottom sheet.
 */

export function closeSheet() {
    if (!_sheet) return;

    setState('collapsed');

    _sheet.setAttribute('aria-hidden', 'true');
}

// ============================================================
// STATE MANAGEMENT
// ============================================================

function setState(state) {
    if (!SNAPS.includes(state)) {
        console.warn(`[BottomSheet] Invalid state: ${state}`);
        return;
    }

    _current = state;

    if (_sheet) {
        _sheet.dataset.state = state;
    }

    // Update map layout state
    document.getElementById('map')
        ?.classList.toggle('bs-open', state !== 'collapsed');
}

// ============================================================
// POINTER INTERACTIONS
// ============================================================

/**
 * Pointer down:
 * Start tracking user interaction.
 */

function onPointerDown(e) {
    // Bottom sheet is mobile-only
    if (window.innerWidth >= MOBILE_BREAKPOINT) return;

    // Ignore right-click and other mouse buttons
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    _dragging = false;

    _pointerStartY = e.clientY;

    _pointerStartState = SNAPS.includes(_current)
        ? _current
        : 'collapsed';

    _pointerId = e.pointerId;

    // Capture pointer for consistent drag tracking
    try {
        _handle.setPointerCapture(e.pointerId);
    } catch (err) {
        console.warn('[BottomSheet] Pointer capture failed:', err);
    }
}

/**
 * Pointer move:
 * Detect whether the user is dragging.
 */

function onPointerMove(e) {
    if (_pointerStartY === null) return;

    if (e.pointerId !== _pointerId) return;

    const dy = e.clientY - _pointerStartY;

    // Minimum movement threshold: 6px
    if (Math.abs(dy) > 6) {
        _dragging = true;
    }
}

/**
 * Pointer up:
 * Determine the next bottom sheet state.
 */

function onPointerUp(e) {
    if (_pointerStartY === null) return;

    if (e.pointerId !== _pointerId) return;

    const dy = e.clientY - _pointerStartY;

    const wasDragging = _dragging;

    // Reset pointer tracking
    _pointerStartY = null;
    _pointerId = null;
    _dragging = false;

    if (!wasDragging) return;

    // Prevent the click event generated after dragging
    _suppressNextClick = true;

    window.setTimeout(() => {
        _suppressNextClick = false;
    }, 350);

    const idx = SNAPS.indexOf(_pointerStartState);

    let target = _pointerStartState;

    // Swipe upward
    if (dy < -60) {
        target = SNAPS[
            Math.min(idx + 1, SNAPS.length - 1)
        ];
    }

    // Swipe downward
    else if (dy > 60) {
        target = SNAPS[
            Math.max(idx - 1, 0)
        ];
    }

    setState(target);
}

/**
 * Pointer cancel:
 * Reset tracking if the interaction is interrupted.
 */

function onPointerCancel(e) {
    if (e.pointerId !== _pointerId) return;

    _pointerStartY = null;
    _pointerId = null;
    _dragging = false;
}

// ============================================================
// DESTINATION CONTENT
// ============================================================

function renderContent(destination, mapContext) {
    if (!_content || !destination || typeof destination !== 'object') {
        return;
    }

    const img = pickImage(destination);

    // Convert coordinates safely.
    // Supports both numeric values and numeric strings.

    const lat = (
        destination.lat !== null &&
        destination.lat !== undefined &&
        destination.lat !== ''
    )
        ? Number(destination.lat)
        : NaN;

    const lng = (
        destination.lng !== null &&
        destination.lng !== undefined &&
        destination.lng !== ''
    )
        ? Number(destination.lng)
        : NaN;

    const hasCoords =
        Number.isFinite(lat) &&
        Number.isFinite(lng);

    const catLabel = cap(destination.category);

    const desc =
        destination.description || 'Tidak ada deskripsi.';

    const address =
        destination.address || '';

    const coordsText = hasCoords
        ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        : '';

    // --------------------------------------------------------
    // Render destination card
    // --------------------------------------------------------

    _content.innerHTML = `
        <article class="card" role="article">

            <div class="card__media">
                ${
                    img
                        ? `
                            <img
                                src="${escapeHtml(String(img))}"
                                alt=""
                                loading="lazy"
                                onerror="this.remove()"
                            >
                        `
                        : ''
                }
            </div>

            <div class="card__body">

                <div class="card__cat">
                    ${escapeHtml(String(catLabel))}
                </div>

                <h2 class="card__title">
                    ${escapeHtml(String(destination.name || ''))}
                </h2>

                <p class="card__desc">
                    ${escapeHtml(String(desc))}
                </p>

                <div class="card__meta">

                    ${
                        address
                            ? `
                                <span>
                                    📍 ${escapeHtml(String(address))}
                                </span>
                            `
                            : ''
                    }

                    ${
                        coordsText
                            ? `
                                <span>
                                    🧭 ${coordsText}
                                </span>
                            `
                            : ''
                    }

                </div>

                <div class="card__actions">

                    <button
                        class="btn btn--primary"
                        data-action="route"
                        type="button"
                    >
                        🧭 Lihat rute
                    </button>

                    <button
                        class="btn btn--ghost"
                        data-action="save"
                        type="button"
                    >
                        ⭐ Simpan
                    </button>

                    <button
                        class="btn btn--ghost"
                        data-action="share"
                        type="button"
                    >
                        📤 Bagikan
                    </button>

                </div>

            </div>

        </article>
    `;

    // ========================================================
    // ROUTE BUTTON
    // ========================================================

    _content
        .querySelector('[data-action="route"]')
        ?.addEventListener('click', () => {

            if (!hasCoords) {
                console.warn('[BottomSheet] Destination coordinates unavailable.');
                return;
            }

            // ---- LOG: user membuka rute ke destinasi ini ----
            try {
                logEvent('route_open', {
                    description: `Membuka rute ke: ${destination.name || 'destinasi'}`,
                    destination: {
                        id: destination.id ?? null,
                        name: destination.name ?? null,
                        category: destination.category ?? null,
                        lat,
                        lng
                    },
                    route: 'google-maps',
                    routeUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                });
            } catch (err) {
                console.warn('[BottomSheet] Failed to log route:', err);
            }

            const mapsUrl =
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    `${lat},${lng}`
                )}`;

            window.open(
                mapsUrl,
                '_blank',
                'noopener,noreferrer'
            );
        });

    // ========================================================
    // SAVE BUTTON
    // ========================================================

    _content
        .querySelector('[data-action="save"]')
        ?.addEventListener('click', (e) => {

            try {
                const destinationId = destination.id;

                if (
                    destinationId === null ||
                    destinationId === undefined
                ) {
                    console.warn('[BottomSheet] Destination ID unavailable.');
                    return;
                }

                const raw = localStorage.getItem(
                    'solo-explorer:favorites'
                );

                const parsed = raw
                    ? JSON.parse(raw)
                    : [];

                const list = Array.isArray(parsed)
                    ? parsed
                    : [];

                if (!list.includes(destinationId)) {
                    list.push(destinationId);

                    localStorage.setItem(
                        'solo-explorer:favorites',
                        JSON.stringify(list)
                    );

                    // ---- LOG: user menyimpan destinasi ----
                    try {
                        logEvent('destination_save', {
                            description: `Menyimpan destinasi: ${destination.name || 'destinasi'}`,
                            destination: {
                                id: destination.id ?? null,
                                name: destination.name ?? null,
                                category: destination.category ?? null,
                                lat: Number.isFinite(lat) ? lat : null,
                                lng: Number.isFinite(lng) ? lng : null
                            }
                        });
                    } catch (err) {
                        console.warn('[BottomSheet] Failed to log save:', err);
                    }
                }

                const button = e.currentTarget;

                button.classList.add('is-active');
                button.textContent = '⭐ Tersimpan';

            } catch (err) {
                console.warn('[BottomSheet] Failed to save favorite:', err);
            }
        });

    // ========================================================
    // SHARE BUTTON
    // ========================================================

    _content
        .querySelector('[data-action="share"]')
        ?.addEventListener('click', async () => {

            const url = new URL(window.location.href);

            url.searchParams.set(
                'dest',
                destination.id
            );

            // ---- LOG: user membagikan destinasi ----
            try {
                logEvent('share', {
                    description: `Membagikan destinasi: ${destination.name || 'destinasi'}`,
                    destination: {
                        id: destination.id ?? null,
                        name: destination.name ?? null,
                        category: destination.category ?? null,
                        lat: Number.isFinite(lat) ? lat : null,
                        lng: Number.isFinite(lng) ? lng : null
                    },
                    url: url.toString()
                });
            } catch (err) {
                console.warn('[BottomSheet] Failed to log share:', err);
            }

            const shareData = {
                title: destination.name || 'Solo Explorer',
                url: url.toString()
            };

            // Native share
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    // User cancellation is not an application error
                    if (err.name !== 'AbortError') {
                        console.warn('[BottomSheet] Share failed:', err);
                    }
                }

                return;
            }

            // Clipboard fallback
            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(
                        url.toString()
                    );

                    alert('Tautan disalin.');
                } else {
                    window.prompt(
                        'Salin tautan:',
                        url.toString()
                    );
                }

            } catch (err) {
                window.prompt(
                    'Salin tautan:',
                    url.toString()
                );
            }
        });
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Capitalize first character.
 *
 * @param {string} s
 * @returns {string}
 */

function cap(s) {
    const value = String(s || '');

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}