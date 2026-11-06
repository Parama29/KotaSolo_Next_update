/**
 * Solo Explorer — Local search + autocomplete
 * Supports desktop input (sidebar) and mobile input (top bar) independently.
 */

import { debounce, escapeHtml } from './map-utils.js';
import { CONFIG } from './map-config.js';
import { getState } from './map-state.js';

let _onSelect = () => {};

export function initSearch({ onSelectDestination }) {
  _onSelect = onSelectDestination;

  const configs = [
    {
      input: document.getElementById('search-input'),
      suggestions: document.getElementById('search-suggestions'),
      clear: document.getElementById('search-clear')
    },
    {
      input: document.getElementById('search-input-mobile'),
      suggestions: document.getElementById('search-suggestions-mobile'),
      clear: document.getElementById('search-clear-mobile')
    }
  ];

  for (const cfg of configs) {
    if (cfg.input && cfg.suggestions) setupController(cfg);
  }
}

function setupController({ input, suggestions, clear }) {
  let activeIndex = -1;

  function runQuery(q) {
    if (!q || q.length < 2) { hide(); return; }
    const { destinations, stops } = getState();
    const needle = q.toLowerCase();

    const destMatches = destinations
      .filter((d) => d.name.toLowerCase().includes(needle))
      .slice(0, 6)
      .map((d) => ({ kind: 'destinasi', item: d }));

    const stopMatches = stops
      .filter((s) => s.name.toLowerCase().includes(needle))
      .slice(0, 4)
      .map((s) => ({ kind: s.mode === 'krl' ? 'stasiun' : 'halte', item: s }));

    render([...destMatches, ...stopMatches]);
  }

  function render(results) {
    activeIndex = -1;
    suggestions.innerHTML = '';
    suggestions.hidden = false;

    if (!results.length) {
      suggestions.innerHTML = '<li class="suggestions__empty">Tidak ada hasil</li>';
      return;
    }

    results.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'suggestions__item';
      li.setAttribute('role', 'option');
      li.setAttribute('data-index', String(i));
      li.innerHTML = `
        <span class="suggestions__kind">${escapeHtml(r.kind)}</span>
        <span class="suggestions__name">${escapeHtml(r.item.name)}</span>
      `;
      li.addEventListener('click', () => select(r));
      suggestions.appendChild(li);
    });
  }

  function select(result) {
    hide();
    input.value = result.item.name;
    if (clear) clear.hidden = false;
    _onSelect(result.item, result.kind === 'destinasi' ? 'destination' : 'stop');
  }

  function hide() {
    suggestions.hidden = true;
    suggestions.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  }

  function highlight() {
    suggestions.querySelectorAll('.suggestions__item').forEach((el, i) => {
      el.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
      if (i === activeIndex) el.scrollIntoView({ block: 'nearest' });
    });
  }

  const debounced = debounce(runQuery, CONFIG.searchDebounceMs);

  input.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    if (clear) clear.hidden = q.length === 0;
    input.setAttribute('aria-expanded', q.length > 0 ? 'true' : 'false');
    if (!q) { hide(); return; }
    debounced(q);
  });

  input.addEventListener('keydown', (e) => {
    const items = suggestions.querySelectorAll('.suggestions__item');
    if (!items.length) {
      if (e.key === 'Escape') hide();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      highlight();
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].click();
    } else if (e.key === 'Escape') {
      hide();
    }
  });

  clear?.addEventListener('click', () => {
    input.value = '';
    clear.hidden = true;
    hide();
    input.focus();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search')) hide();
  });
}