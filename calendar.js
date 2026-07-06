// calendar.js — pulls upcoming events from the public Google Calendar and
// renders them into themed cards. Read-only; the API key is referrer-restricted.
(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────────────────
  const CALENDAR_ID = 'c_85dd93d7420e432326c20b6d87124a07100e9d95cb27ba93299f065fc4cd8880@group.calendar.google.com';
  const API_KEY     = 'AIzaSyBNmzqR9Cy0LgAR6V4pJ3UyhlcN5akjp1o';
  const TIME_ZONE   = 'America/New_York'; // events display in Pittsburgh time
  const MAX_EVENTS  = 25;
  const CACHE_KEY   = 'qc_cal_cache_v1';
  const CACHE_TTL   = 60 * 60 * 1000;     // 1 hour

  const listEl = document.getElementById('cal-list');
  if (!listEl) return;

  const params = new URLSearchParams({
    key: API_KEY,
    timeMin: new Date().toISOString(),
    singleEvents: 'true',   // expand recurring events into individual instances
    orderBy: 'startTime',
    maxResults: String(MAX_EVENTS),
  });
  const url = 'https://www.googleapis.com/calendar/v3/calendars/' +
    encodeURIComponent(CALENDAR_ID) + '/events?' + params.toString();

  // ── Boot ────────────────────────────────────────────────────────────────
  const cached = readCache();
  if (cached) { render(cached); }
  else { fetchEvents(); }

  function fetchEvents() {
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        const items = data.items || [];
        writeCache(items);
        render(items);
      })
      .catch(function (err) {
        console.error('[Calendar] failed to load events:', err);
        renderError();
      });
  }

  // ── Cache ───────────────────────────────────────────────────────────────
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > CACHE_TTL) return null;
      return parsed.items;
    } catch (e) { return null; }
  }
  function writeCache(items) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: items }));
    } catch (e) { /* private mode / quota — ignore */ }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  function render(items) {
    const events = (items || [])
      .filter(function (ev) {
        return ev.status !== 'cancelled' && ev.start && (ev.start.dateTime || ev.start.date);
      })
      .map(function (ev) {
        const s = getStart(ev);
        return { ev: ev, start: s.date, allDay: s.allDay, end: getEnd(ev) };
      })
      .filter(function (it) { return it.start >= startOfToday(); })
      .sort(function (a, b) { return a.start - b.start; });

    if (!events.length) { renderEmpty(); return; }

    listEl.innerHTML = '';
    let currentMonth = '';
    events.forEach(function (item) {
      const monthLabel = fmt(item.start, { month: 'long', year: 'numeric' }, !item.allDay);
      if (monthLabel !== currentMonth) {
        currentMonth = monthLabel;
        listEl.appendChild(monthHeader(monthLabel));
      }
      listEl.appendChild(eventCard(item));
    });
  }

  function monthHeader(label) {
    const wrap = el('div', 'cal-month');
    wrap.appendChild(el('span', 'cal-month__label', label));
    wrap.appendChild(el('span', 'cal-month__line'));
    return wrap;
  }

  function eventCard(item) {
    const ev = item.ev;
    const useTZ = !item.allDay;
    const card = el('div', 'cal-event');

    // Date rail
    const date = el('div', 'cal-date');
    date.appendChild(el('span', 'cal-date__month', fmt(item.start, { month: 'short' }, useTZ)));
    date.appendChild(el('span', 'cal-date__day', fmt(item.start, { day: 'numeric' }, useTZ)));
    date.appendChild(el('span', 'cal-date__weekday', fmt(item.start, { weekday: 'short' }, useTZ)));
    card.appendChild(date);

    const body = el('div', 'cal-body');
    const parsed = parseDescription(ev.description);

    // Title + category tag
    const head = el('div', 'cal-event__head');
    head.appendChild(el('h3', 'cal-event__title', ev.summary || 'Untitled event'));
    if (parsed.category) {
      head.appendChild(el('span', 'cal-tag ' + tagClass(parsed.category), parsed.category));
    }
    body.appendChild(head);

    // Time + location
    const meta = el('div', 'cal-meta');
    meta.appendChild(metaItem(null, item.allDay ? 'All day' : timeRange(item.start, item.end)));
    if (ev.location) meta.appendChild(metaItem('📍', ev.location));
    body.appendChild(meta);

    // Description
    if (parsed.desc) body.appendChild(el('p', 'cal-desc', parsed.desc));

    // Registration link
    if (parsed.register) {
      const a = el('a', 'cal-register');
      a.href = parsed.register;
      a.target = '_blank';
      a.rel = 'noopener';
      a.appendChild(document.createTextNode('Register '));
      a.appendChild(el('span', null, '→'));
      body.appendChild(a);
    }

    card.appendChild(body);
    return card;
  }

  function renderEmpty() {
    listEl.innerHTML = '';
    const box = el('div', 'cal-status');
    box.appendChild(document.createTextNode('No upcoming events are scheduled right now. '));
    const a = el('a', null, 'Join the mailing list');
    a.href = 'https://lists.andrew.cmu.edu/mailman/listinfo/cmu-quant';
    a.target = '_blank';
    a.rel = 'noopener';
    box.appendChild(a);
    box.appendChild(document.createTextNode(' to hear about new events.'));
    listEl.appendChild(box);
  }

  function renderError() {
    listEl.innerHTML = '';
    listEl.appendChild(el('div', 'cal-status',
      'We couldn’t load the calendar right now. Please try again later.'));
  }

  // ── Parsing ─────────────────────────────────────────────────────────────
  // Convention for event descriptions in Google Calendar:
  //   Category: Workshop            -> colored tag
  //   Register: https://...         -> "Register" button (also Apply/RSVP/Sign up/Link)
  //   everything else               -> shown as the description
  function parseDescription(raw) {
    let text = (raw || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');

    let category = null;
    let register = null;
    const kept = [];

    text.split('\n').forEach(function (line) {
      const cat = line.match(/^\s*category\s*:\s*(.+)$/i);
      const reg = line.match(/^\s*(?:register|apply|rsvp|sign[\s-]?up|link)\s*:\s*(https?:\/\/\S+)/i);
      if (cat) { category = cat[1].trim(); return; }
      if (reg) { register = reg[1].trim(); return; }
      kept.push(line);
    });

    return { category: category, register: register, desc: kept.join('\n').trim() };
  }

  function tagClass(cat) {
    const c = cat.toLowerCase();
    if (/(flagship|competition|game|quantathon|market\s*making|tournament)/.test(c)) return 'cal-tag--red';
    if (/(recruit|info|career|firm|networking|coffee)/.test(c)) return 'cal-tag--gold';
    if (/(seminar|lecture|talk|speaker|workshop|panel)/.test(c)) return 'cal-tag--teal';
    if (/(social|mixer|party|dinner|kickoff)/.test(c)) return 'cal-tag--purple';
    return '';
  }

  // ── Dates / formatting ──────────────────────────────────────────────────
  function getStart(ev) {
    if (ev.start.dateTime) return { date: new Date(ev.start.dateTime), allDay: false };
    const p = ev.start.date.split('-');
    return { date: new Date(+p[0], +p[1] - 1, +p[2], 12, 0), allDay: true }; // noon avoids DST edges
  }
  function getEnd(ev) {
    if (ev.end && ev.end.dateTime) return new Date(ev.end.dateTime);
    return null;
  }
  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function timeRange(start, end) {
    const t1 = fmt(start, { hour: 'numeric', minute: '2-digit' }, true);
    if (!end) return t1;
    const dayOpts = { year: 'numeric', month: 'short', day: 'numeric' };
    if (fmt(start, dayOpts, true) !== fmt(end, dayOpts, true)) return t1; // multi-day: start only
    return t1 + ' – ' + fmt(end, { hour: 'numeric', minute: '2-digit' }, true);
  }
  function fmt(date, opts, useTZ) {
    const o = Object.assign({}, opts);
    if (useTZ) o.timeZone = TIME_ZONE;
    return new Intl.DateTimeFormat('en-US', o).format(date);
  }

  // ── DOM helpers ─────────────────────────────────────────────────────────
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function metaItem(icon, text) {
    const s = el('span', 'cal-meta__item');
    if (icon) s.appendChild(el('span', 'cal-meta__icon', icon));
    s.appendChild(el('span', null, text));
    return s;
  }
})();
