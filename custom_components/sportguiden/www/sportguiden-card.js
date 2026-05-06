/**
 * SportGuiden - Home Assistant Card
 * ══════════════════════════════════
 * Shows today's live sport on TV/streaming (tv.nu)
 *
 * YAML Config:
 *   type: custom:sportguiden-card
 *   entity: sensor.sportguiden
 */

console.log("SportGuiden: card JS loaded");

const SPORTGUIDEN_VERSION = "2.13.0";

const LOGOS_BASE = "/sportguiden/logos";
const _LOGO_MAP = [
  [["svt1"],                                              `${LOGOS_BASE}/svt1.png`],
  [["svt2"],                                              `${LOGOS_BASE}/svt2.png`],
  [["tv4 sport","tv4sport","sportkanalen tv4"],            `${LOGOS_BASE}/tv4sport.png`],
  [["tv4"],                                               `${LOGOS_BASE}/tv4.png`],
  [["viaplay"],                                           `${LOGOS_BASE}/viaplay.png`],
  [["v sport 1","vsport1","v sport premium"],              `${LOGOS_BASE}/vsport1.png`],
  [["v sport 2","vsport2"],                               `${LOGOS_BASE}/vsport2.png`],
  [["v sport fotboll","v sport football","vsport fotboll"],`${LOGOS_BASE}/vsportfotboll.png`],
  [["tv3"],                                               `${LOGOS_BASE}/tv3.png`],
  [["tv6"],                                               `${LOGOS_BASE}/tv6.png`],
  [["tv8"],                                               `${LOGOS_BASE}/tv8.png`],
  [["sportkanalen"],                                      `${LOGOS_BASE}/sportkanalen.png`],
];
const _CHANNEL_FALLBACK = {
  "svt":        { bg: "#006AB3", text: "#fff" },
  "svt play":   { bg: "#006AB3", text: "#fff" },
  "tv4 play":   { bg: "#E31E24", text: "#fff" },
  "eurosport":  { bg: "#003DA5", text: "#fff" },
  "discovery+": { bg: "#2175D9", text: "#fff" },
  "c more":     { bg: "#F5821F", text: "#fff" },
  "max":        { bg: "#5822E9", text: "#fff" },
  "dazn":       { bg: "#111",    text: "#F5F500" },
  "kanal 5":    { bg: "#e4a000", text: "#fff" },
};
const _LEAGUE_COLORS = {
  "champions league": "#1a237e",
  "europa league": "#e65100",
  "conference league": "#004d40",
  "premier league": "#38003c",
  "allsvenskan": "#002f6c",
  "superettan": "#1565c0",
  "damallsvenskan": "#6a1b9a",
  "bundesliga": "#d50000",
  "la liga": "#ff6f00",
  "serie a": "#1b5e20",
  "ligue 1": "#0d47a1",
  "fa women's super league": "#880e4f",
  "svenska cupen": "#f9a825",
  "shl": "#002855",
  "hockeyallsvenskan": "#003d7a",
  "nhl": "#000000",
  "atp": "#00529b",
  "wta": "#5c068c",
  "world tour": "#e91e63",
  "pga tour": "#003366",
};
const _SPORT_ICONS = {
  "fotboll": "mdi:soccer",
  "ishockey": "mdi:hockey-puck",
  "tennis": "mdi:tennis",
  "motorsport": "mdi:racing-helmet",
  "golf": "mdi:golf",
  "basket": "mdi:basketball",
  "handboll": "mdi:handball",
  "bordtennis": "mdi:table-tennis",
  "cykling": "mdi:bike",
  "friidrott": "mdi:run",
  "simning": "mdi:swim",
  "vintersport": "mdi:skiing",
  "baseball": "mdi:baseball",
};

class SportguidenCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  static getConfigElement() {
    return document.createElement("sportguiden-card-editor");
  }

  static getStubConfig(hass) {
    const entity = hass
      ? (Object.keys(hass.states).find(e => e.startsWith("sensor.sportguiden")) || "")
      : "";
    return {
      entity,
      title: "🏆 Sport på TV idag",
      accent_color: "#667eea",
      background: "gradient",
      show_channel: true,
      show_league: true,
      show_time: true,
    };
  }

  set hass(hass) {
    this._hass = hass;
    this._renderCard();
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Du måste ange entity (t.ex. sensor.sportguiden)");
    }
    // Backward compat: convert old single `source` string to `sources` array
    const { source: _legacySource, show_channel: _legacyShowChannel, ...restConfig } = config;
    const sources = config.sources || (_legacySource ? [_legacySource] : []);
    // Backward compat: old show_channel:false → both logo and name off
    const legacyOff = _legacyShowChannel === false;
    this._config = {
      title: "🏆 Sport på TV idag",
      accent_color: "#667eea",
      accent_color_2: "#764ba2",
      background: "gradient",
      card_bg_color: "",
      text_color: "",
      show_channel_logo: !legacyOff,
      show_channel_name: !legacyOff,
      show_league: true,
      show_time: true,
      show_header_icon: true,
      header_icon: "mdi:television-classic",
      compact: false,
      max_items: 0,
      header_icon_size: 80,
      sources: [],
      channels: [],
      leagues: [],
      ...restConfig,
      sources,
    };
  }

  getCardSize() {
    return 5;
  }

  _getEvents() {
    if (!this._hass || !this._config.entity) return [];
    const entity = this._hass.states[this._config.entity];
    if (!entity) return [];

    let events = [];
    const attr = entity.attributes || {};

    try {
      const selectedSources = this._config.sources || [];
      const sourcesMap = attr.sources || {};

      if (selectedSources.length > 0) {
        const seen = new Set();
        const merged = [];
        for (const srcId of selectedSources) {
          const srcData = sourcesMap[srcId];
          if (srcData && Array.isArray(srcData.events)) {
            for (const ev of srcData.events) {
              const key = `${ev.time}_${ev.title}`.toLowerCase();
              if (!seen.has(key)) { seen.add(key); merged.push(ev); }
            }
          }
        }
        if (merged.length > 0) {
          events = merged.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          if (selectedSources.length === 1 && sourcesMap[selectedSources[0]]) {
            const sd = sourcesMap[selectedSources[0]];
            this._autoTitle = sd.name || null;
            this._autoIcon = sd.icon || null;
            this._autoAccent = sd.accent_color || null;
          } else {
            this._autoTitle = null;
            this._autoIcon = null;
            this._autoAccent = null;
          }
        }
      }

      if (events.length === 0) {
        if (attr.all_events && attr.all_events.length > 0) {
          events = attr.all_events;
        } else if (attr.events) {
          events = attr.events;
        } else if (attr.matches) {
          events = attr.matches;
        } else {
          try {
            const parsed = JSON.parse(entity.state);
            events = parsed.events || parsed.matches || parsed.all_events || [];
          } catch (e) {}
        }
      }
    } catch (e) {}

    // Filter by channels if configured
    const channelFilter = this._config.channels || [];
    if (channelFilter.length > 0) {
      const norm = s => s.toLowerCase().replace(/\s+/g, "");
      const filterNorm = channelFilter.map(norm);
      events = events.filter(ev => {
        const chParts = (ev.channel || "").split(/\s*[&,/]\s*/).map(norm).filter(Boolean);
        return chParts.some(part => filterNorm.some(f => part.includes(f) || f.includes(part)));
      });
    }

    // Filter by leagues/tournaments if configured
    const leagueFilter = this._config.leagues || [];
    if (leagueFilter.length > 0) {
      const filterLower = leagueFilter.map(l => l.toLowerCase());
      events = events.filter(ev => {
        const league = (ev.league || "").toLowerCase();
        const subtitle = (ev.subtitle || "").toLowerCase();
        return filterLower.some(f => league.includes(f) || subtitle.includes(f));
      });
    }

    const max = parseInt(this._config.max_items) || 0;
    if (max > 0) {
      events = events.slice(0, max);
    }
    return events;
  }

  _getConfiguredSources() {
    // Return list of available sources from sensor
    if (!this._hass || !this._config.entity) return [];
    const entity = this._hass.states[this._config.entity];
    if (!entity) return [];
    return entity.attributes.configured_sources || [];
  }

  _renderCard() {
    if (!this._hass || !this._config.entity) return;

    const entity = this._hass.states[this._config.entity];
    if (!entity) {
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div style="padding:16px;color:#ef4444;">
            <strong>⚠️ Entity "${this._config.entity}" hittades inte.</strong><br>
            Kontrollera att sensorn är konfigurerad korrekt.
          </div>
        </ha-card>`;
      return;
    }

    const events = this._getEvents();
    const c = this._config;
    const bg = this._getBackground();
    const textColor = c.text_color || "#ffffff";
    const accent = this._autoAccent || c.accent_color || "#667eea";
    const accent2 = c.accent_color_2 || "#764ba2";
    const title = c.title || "Sport på TV idag";
    const headerIcon = c.header_icon || this._autoIcon || "mdi:television-classic";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .sg-card {
          ${bg}
          border-radius: 16px;
          padding: ${c.compact ? "16px" : "24px"};
          color: ${textColor};
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .sg-card::before {
          content: '';
          position: absolute;
          top: -50%; right: -50%;
          width: 100%; height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
          pointer-events: none;
        }
        .sg-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: ${c.compact ? "12px" : "20px"};
        }
        .sg-header-icon {
          width: ${c.header_icon_size || 80}px; height: ${c.header_icon_size || 80}px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        .sg-header-icon img {
          width: 100%; height: 100%;
          object-fit: contain;
        }
        .sg-title {
          font-size: ${c.compact ? "1.1em" : "1.3em"};
          font-weight: 700;
          letter-spacing: -0.02em;
          flex: 1;
        }
        .sg-count {
          background: linear-gradient(135deg, ${accent}, ${accent2});
          color: #fff;
          font-size: 0.7em;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          box-shadow: 0 2px 8px ${accent}44;
        }
        .sg-list {
          list-style: none;
          margin: 0; padding: 0;
          display: flex;
          flex-direction: column;
          gap: ${c.compact ? "6px" : "10px"};
        }
        .sg-event {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: ${c.compact ? "10px 12px" : "14px 16px"};
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s ease;
        }
        .sg-event:hover {
          background: rgba(255,255,255,0.09);
          transform: translateX(3px);
          border-color: rgba(255,255,255,0.12);
        }
        .sg-time {
          flex-shrink: 0;
          font-size: ${c.compact ? "0.8em" : "0.9em"};
          font-weight: 700;
          color: ${accent};
          min-width: 44px;
          text-align: center;
          padding: 4px 8px;
          background: ${accent}12;
          border-radius: 8px;
          border: 1px solid ${accent}25;
        }
        .sg-channel-logo {
          flex-shrink: 0;
          width: 36px; height: 36px;
          border-radius: 6px;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          padding: 3px;
          overflow: hidden;
        }
        .sg-channel-logo img {
          width: 100%; height: 100%;
          object-fit: contain;
        }
        .sg-channel-badge {
          flex-shrink: 0;
          font-size: 0.62em;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          max-width: 80px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.01em;
        }
        .sg-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .sg-event-title {
          font-size: ${c.compact ? "0.88em" : "0.95em"};
          font-weight: 600;
          line-height: 1.3;
          word-break: break-word;
        }
        .sg-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .sg-league {
          display: inline-block;
          font-size: 0.65em;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .sg-sport-label {
          font-size: 0.65em;
          opacity: 0.5;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .sg-empty {
          text-align: center;
          padding: 32px 16px;
          opacity: 0.6;
        }
        .sg-empty-icon { font-size: 2.5em; margin-bottom: 8px; }
      </style>
      <div class="sg-card">
        <div class="sg-header">
          ${c.show_header_icon ? `
            <div class="sg-header-icon">
              <img src="/sportguiden/logos/card.png" alt="SportGuiden">
            </div>
          ` : ""}
          <div class="sg-title">${title}</div>
          ${events.length > 0 ? `<div class="sg-count">${events.length}</div>` : ""}
        </div>
        <ul class="sg-list">
          ${events.length === 0 ? `
            <div class="sg-empty">
              <div class="sg-empty-icon">📺</div>
              <div>Ingen sport på TV just nu</div>
            </div>
          ` : events.map((ev) => this._renderEvent(ev)).join("")}
        </ul>
      </div>
    `;
  }

  _getChannelLogo(ch) {
    const parts = ch.split(/\s*[&,/]\s*/).map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      const k = part.toLowerCase().replace(/\s+/g, "");
      for (const [keys, url] of _LOGO_MAP) {
        if (keys.some(key => k.includes(key.replace(/\s+/g, "")))) return url;
      }
    }
    return null;
  }

  _getChannelFallback(ch) {
    const firstPart = ch.split(/\s*[&,/]\s*/)[0].trim();
    const k = firstPart.toLowerCase().replace(/\s+/g, "");
    for (const [key, val] of Object.entries(_CHANNEL_FALLBACK)) {
      if (k.includes(key.replace(/\s+/g, ""))) return val;
    }
    return { bg: "rgba(255,255,255,0.12)", text: "rgba(255,255,255,0.9)" };
  }

  _renderEvent(ev) {
    const c = this._config;
    const time = ev.time || "";
    const title = this._escapeHtml(ev.title || "");
    const league = ev.league || "";
    const sport = ev.sport || "";
    const channel = ev.channel || "";

    // Channel display
    let channelHtml = "";
    if (channel) {
      const showLogo = c.show_channel_logo !== false;
      const showName = c.show_channel_name !== false;
      if (showLogo || showName) {
        const logoUrl = showLogo ? this._getChannelLogo(channel) : null;
        if (logoUrl) {
          channelHtml = `<div class="sg-channel-logo"><img src="${logoUrl}" alt="${this._escapeHtml(channel)}" loading="lazy"></div>`;
        } else if (showName) {
          const displayName = channel.split(/\s*[&,/]\s*/)[0].trim();
          const fb = this._getChannelFallback(channel);
          channelHtml = `<div class="sg-channel-badge" style="background:${fb.bg};color:${fb.text};">${this._escapeHtml(displayName)}</div>`;
        }
      }
    }

    // League badge
    let leagueHtml = "";
    if (c.show_league && league) {
      const cleanLeague = league.replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
      const color = _LEAGUE_COLORS[cleanLeague.toLowerCase()] || "#444";
      leagueHtml = `<span class="sg-league" style="background:${color};color:#fff;">${this._escapeHtml(cleanLeague)}</span>`;
    }

    // Sport label (show if no league)
    let sportHtml = "";
    if (sport && !league) {
      sportHtml = `<span class="sg-sport-label">${this._escapeHtml(sport)}</span>`;
    }

    return `
      <li class="sg-event">
        ${c.show_time && time ? `<div class="sg-time">${time}</div>` : ""}
        ${channelHtml}
        <div class="sg-info">
          <div class="sg-event-title">${title}</div>
          <div class="sg-meta">
            ${leagueHtml}
            ${sportHtml}
          </div>
        </div>
      </li>
    `;
  }

  _escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  _getBackground() {
    const c = this._config;
    const accent = c.accent_color || "#667eea";
    const bgColor = c.card_bg_color || "#0f1923";
    switch (c.background) {
      case "gradient":
        return `background: linear-gradient(135deg, ${bgColor} 0%, ${accent}15 50%, ${bgColor} 100%);`;
      case "glass":
        return `background: rgba(15,25,35,0.85); backdrop-filter: blur(20px);`;
      case "solid":
        return `background: ${bgColor};`;
      case "none":
        return `background: var(--ha-card-background, var(--card-background-color, ${bgColor}));`;
      default:
        return `background: linear-gradient(135deg, ${bgColor} 0%, ${accent}15 50%, ${bgColor} 100%);`;
    }
  }
}

// ─── Visual Editor ─────────────────────────────────────────────────
class SportguidenCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) this._renderEditor();
  }

  setConfig(config) {
    this._config = config;
    this._rendered = false;
    this._renderEditor();
  }

  _renderEditor() {
    if (!this._hass) return;
    this._rendered = true;

    const sportguidenEntities = Object.keys(this._hass.states)
      .filter((e) => e.startsWith("sensor.sportguiden"))
      .sort();

    const allSportSources = [
      { id: "fotboll",    name: "Fotboll" },
      { id: "ishockey",   name: "Ishockey" },
      { id: "tennis",     name: "Tennis" },
      { id: "motorsport", name: "Motorsport" },
      { id: "vintersport",name: "Vintersport" },
      { id: "golf",       name: "Golf" },
      { id: "basket",     name: "Basket" },
      { id: "handboll",   name: "Handboll" },
      { id: "cykling",    name: "Cykling" },
      { id: "ovrigt",    name: "Övrig sport" },
    ];

    const allChannels = ["SVT1","SVT2","SVT Play","TV4","TV4 Play","TV4 Sport","Viaplay","V Sport 1","V Sport 2","V Sport Fotboll","Eurosport 1","Eurosport 2","Discovery+","C More","Max","DAZN","TV3","TV6","TV8","Sportkanalen"];

    const leagues = this._getLeaguesFromData();
    const selSources = this._config.sources || [];
    const selLeagues = this._config.leagues || [];
    const selChannels = this._config.channels || [];

    const sourceTrigger = selSources.length === 0 ? "Alla sporter" : `${selSources.length} valda`;
    const leagueTrigger = selLeagues.length === 0 ? "Alla ligor" : `${selLeagues.length} valda`;
    const channelTrigger = selChannels.length === 0 ? "Alla kanaler" : `${selChannels.length} valda`;

    this.shadowRoot.innerHTML = `
      <style>
        .editor { display:flex; flex-direction:column; gap:12px; padding:12px; }
        .row { display:flex; flex-direction:column; gap:4px; }
        label { font-size:0.85em; font-weight:500; opacity:0.8; }
        input[type=text], input[type=number], select {
          padding:8px 12px; border-radius:8px;
          border:1px solid var(--divider-color,#444);
          background:var(--card-background-color,#1a1a2e);
          color:var(--primary-text-color,#fff); font-size:0.95em; width:100%; box-sizing:border-box;
        }
        .checkbox-row { display:flex; align-items:center; gap:8px; }
        h3 { margin:8px 0 4px; font-size:0.9em; opacity:0.6; text-transform:uppercase; letter-spacing:0.05em; }
        .hint { font-size:0.75em; opacity:0.5; margin-top:2px; }
        .ms-wrap { position:relative; }
        .ms-trigger {
          padding:8px 12px; border-radius:8px; cursor:pointer;
          border:1px solid var(--divider-color,#444);
          background:var(--card-background-color,#1a1a2e);
          color:var(--primary-text-color,#fff); font-size:0.95em;
          display:flex; justify-content:space-between; align-items:center; user-select:none;
        }
        .ms-trigger:hover { border-color: var(--primary-color,#667eea); }
        .ms-dropdown {
          position:absolute; z-index:999; top:calc(100% + 4px); left:0; right:0;
          background:var(--card-background-color,#1e1e2e);
          border:1px solid var(--divider-color,#444); border-radius:8px;
          box-shadow:0 8px 24px rgba(0,0,0,0.4); overflow:hidden;
        }
        .ms-search input {
          border:none; border-bottom:1px solid var(--divider-color,#444);
          border-radius:0; padding:8px 12px; width:100%; box-sizing:border-box;
        }
        .ms-options { max-height:200px; overflow-y:auto; padding:4px 0; }
        .ms-option {
          display:flex; align-items:center; gap:8px;
          padding:6px 12px; cursor:pointer; font-size:0.9em;
        }
        .ms-option:hover { background:rgba(255,255,255,0.06); }
        .ms-option input { width:auto; padding:0; }
        .ms-footer {
          display:flex; gap:8px; padding:6px 12px;
          border-top:1px solid var(--divider-color,#444);
        }
        .ms-footer button {
          flex:1; padding:5px 0; border:none; border-radius:6px; cursor:pointer;
          font-size:0.8em; font-weight:600;
          background:rgba(255,255,255,0.08); color:var(--primary-text-color,#fff);
        }
        .ms-footer button:hover { background:rgba(255,255,255,0.14); }
      </style>
      <div class="editor">
        <div class="row">
          <label>Sensor Entity</label>
          <select id="entity">
            <option value="">-- Välj sensor --</option>
            ${sportguidenEntities.map((e) => `<option value="${e}" ${e === this._config.entity ? "selected" : ""}>${e}</option>`).join("")}
          </select>
        </div>
        <div class="row">
          <label>Sportkategori <span style="opacity:.5;font-weight:400">(tomt = visa alla)</span></label>
          <div class="ms-wrap" id="source-wrap">
            <div class="ms-trigger" id="source-trigger">${sourceTrigger} <span>▾</span></div>
            <div class="ms-dropdown" id="source-dropdown" style="display:none">
              <div class="ms-options" id="source-options">
                ${allSportSources.map(s => `<label class="ms-option"><input type="checkbox" class="source-cb" value="${s.id}" ${selSources.includes(s.id) ? "checked" : ""}><span>${s.name}</span></label>`).join("")}
              </div>
              <div class="ms-footer">
                <button id="source-clear">Rensa alla</button>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <label>Rubrik</label>
          <input id="title" type="text" value="${this._config.title || ""}">
        </div>
        <div class="row">
          <label>Max antal (0 = visa alla)</label>
          <input id="max_items" type="number" min="0" max="100" value="${this._config.max_items || 0}">
        </div>
        <h3>Filter</h3>
        <div class="row">
          <label>Ligafilter <span style="opacity:.5;font-weight:400">(tomt = visa alla)</span></label>
          <div class="ms-wrap" id="league-wrap">
            <div class="ms-trigger" id="league-trigger">${leagueTrigger} <span>▾</span></div>
            <div class="ms-dropdown" id="league-dropdown" style="display:none">
              <div class="ms-search"><input type="text" placeholder="Sök liga…" id="league-search"></div>
              <div class="ms-options" id="league-options">
                ${leagues.length === 0
                  ? `<div style="padding:8px 12px;opacity:.5;font-size:.85em">Inga ligor i datan ännu</div>`
                  : leagues.map(lg => `<label class="ms-option"><input type="checkbox" class="league-cb" value="${lg}" ${selLeagues.includes(lg) ? "checked" : ""}><span>${lg}</span></label>`).join("")}
              </div>
              <div class="ms-footer">
                <button id="league-clear">Rensa alla</button>
              </div>
            </div>
          </div>
        </div>
        <div class="row">
          <label>Kanalfilter <span style="opacity:.5;font-weight:400">(tomt = visa alla)</span></label>
          <div class="ms-wrap" id="channel-wrap">
            <div class="ms-trigger" id="channel-trigger">${channelTrigger} <span>▾</span></div>
            <div class="ms-dropdown" id="channel-dropdown" style="display:none">
              <div class="ms-options" id="channel-options">
                ${allChannels.map(ch => `<label class="ms-option"><input type="checkbox" class="channel-cb" value="${ch}" ${selChannels.includes(ch) ? "checked" : ""}><span>${ch}</span></label>`).join("")}
              </div>
              <div class="ms-footer">
                <button id="channel-clear">Rensa alla</button>
              </div>
            </div>
          </div>
        </div>
        <h3>Utseende</h3>
        <div class="row">
          <label>Bakgrund</label>
          <select id="background">
            <option value="gradient" ${this._config.background === "gradient" ? "selected" : ""}>Gradient</option>
            <option value="glass" ${this._config.background === "glass" ? "selected" : ""}>Glas</option>
            <option value="solid" ${this._config.background === "solid" ? "selected" : ""}>Enfärgad</option>
            <option value="none" ${this._config.background === "none" ? "selected" : ""}>Tema</option>
          </select>
        </div>
        <div class="row">
          <label>Accent-färg</label>
          <input id="accent_color" type="color" value="${this._config.accent_color || "#667eea"}">
        </div>
        <div class="row">
          <label>Accent-färg 2</label>
          <input id="accent_color_2" type="color" value="${this._config.accent_color_2 || "#764ba2"}">
        </div>
        <div class="row">
          <label>Bakgrundsfärg</label>
          <input id="card_bg_color" type="color" value="${this._config.card_bg_color || "#0f1923"}">
        </div>
        <div class="row">
          <label>Textfärg</label>
          <input id="text_color" type="color" value="${this._config.text_color || "#ffffff"}">
        </div>
        <h3>Visa / Dölj</h3>
        <div class="checkbox-row"><input id="show_time" type="checkbox" ${this._config.show_time !== false ? "checked" : ""}><label>Visa tid</label></div>
        <div class="checkbox-row"><input id="show_channel_logo" type="checkbox" ${this._config.show_channel_logo !== false ? "checked" : ""}><label>Visa kanallogga</label></div>
        <div class="checkbox-row"><input id="show_channel_name" type="checkbox" ${this._config.show_channel_name !== false ? "checked" : ""}><label>Visa kanalnamn</label></div>
        <div class="checkbox-row"><input id="show_league" type="checkbox" ${this._config.show_league !== false ? "checked" : ""}><label>Visa liga/turnering</label></div>
        <div class="checkbox-row"><input id="show_header_icon" type="checkbox" ${this._config.show_header_icon !== false ? "checked" : ""}><label>Visa header-ikon</label></div>
        <div class="row">
          <label>Storlek på logga (px)</label>
          <input id="header_icon_size" type="number" min="24" max="200" value="${this._config.header_icon_size || 80}">
        </div>
        <div class="checkbox-row"><input id="compact" type="checkbox" ${this._config.compact ? "checked" : ""}><label>Kompakt läge</label></div>
      </div>
    `;

    // Simple field listeners
    ["entity","title","max_items","header_icon_size","background","accent_color","accent_color_2","card_bg_color","text_color"].forEach((field) => {
      const el = this.shadowRoot.getElementById(field);
      if (el) el.addEventListener("change", (e) => { this._config = {...this._config, [field]: e.target.value}; this._dispatch(); });
    });
    ["show_time","show_channel_logo","show_channel_name","show_league","show_header_icon","compact"].forEach((field) => {
      const el = this.shadowRoot.getElementById(field);
      if (el) el.addEventListener("change", (e) => { this._config = {...this._config, [field]: e.target.checked}; this._dispatch(); });
    });

    // Multi-select: sport sources
    this._setupMultiSelect(
      "source-trigger", "source-dropdown", null, "source-options", "source-cb", "source-clear",
      (vals) => { this._config = {...this._config, sources: vals}; this._dispatch(); this._updateTrigger("source-trigger", vals, "sporter"); }
    );

    // Multi-select: leagues
    this._setupMultiSelect(
      "league-trigger", "league-dropdown", "league-search", "league-options", "league-cb", "league-clear",
      (vals) => { this._config = {...this._config, leagues: vals}; this._dispatch(); this._updateTrigger("league-trigger", vals, "ligor"); }
    );

    // Multi-select: channels
    this._setupMultiSelect(
      "channel-trigger", "channel-dropdown", null, "channel-options", "channel-cb", "channel-clear",
      (vals) => { this._config = {...this._config, channels: vals}; this._dispatch(); this._updateTrigger("channel-trigger", vals, "kanaler"); }
    );
  }

  _setupMultiSelect(triggerId, dropdownId, searchId, optionsId, cbClass, clearId, onChange) {
    const sr = this.shadowRoot;
    const trigger = sr.getElementById(triggerId);
    const dropdown = sr.getElementById(dropdownId);

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display !== "none";
      sr.querySelectorAll(".ms-dropdown").forEach(d => d.style.display = "none");
      dropdown.style.display = isOpen ? "none" : "block";
    });

    // Stop clicks inside dropdown from bubbling to document (which would close it immediately)
    dropdown.addEventListener("click", (e) => { e.stopPropagation(); });

    document.addEventListener("click", () => { dropdown.style.display = "none"; }, { once: false });

    const getVals = () => [...sr.querySelectorAll(`.${cbClass}:checked`)].map(el => el.value);

    sr.querySelectorAll(`.${cbClass}`).forEach(cb => {
      cb.addEventListener("change", () => onChange(getVals()));
    });

    const clearBtn = sr.getElementById(clearId);
    if (clearBtn) clearBtn.addEventListener("click", () => {
      sr.querySelectorAll(`.${cbClass}`).forEach(cb => cb.checked = false);
      onChange([]);
    });

    if (searchId) {
      const searchEl = sr.getElementById(searchId);
      const optionsEl = sr.getElementById(optionsId);
      if (searchEl && optionsEl) {
        searchEl.addEventListener("input", (e) => {
          const q = e.target.value.toLowerCase();
          optionsEl.querySelectorAll(".ms-option").forEach(opt => {
            opt.style.display = opt.textContent.toLowerCase().includes(q) ? "" : "none";
          });
        });
      }
    }
  }

  _updateTrigger(triggerId, vals, noun) {
    const trigger = this.shadowRoot.getElementById(triggerId);
    if (trigger) trigger.innerHTML = (vals.length === 0 ? `Alla ${noun}` : `${vals.length} valda`) + " <span>▾</span>";
  }

  _getLeaguesFromData() {
    const leagues = new Set();
    if (!this._hass || !this._config.entity) return [];
    const attr = (this._hass.states[this._config.entity] || {}).attributes || {};
    let events = [];
    if (attr.sources && this._config.source && attr.sources[this._config.source]) {
      events = attr.sources[this._config.source].events || [];
    } else if (attr.all_events) {
      events = attr.all_events;
    }
    events.forEach(ev => { if (ev.league) leagues.add(ev.league); else if (ev.subtitle) leagues.add(ev.subtitle); });
    return [...leagues].sort();
  }

  _dispatch() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

// ─── Register ──────────────────────────────────────────────────────
// ─── Register elements ────────────────────────────────────────────
(function() {
  function registerCards() {
    try {
      if (!customElements.get("sportguiden-card")) {
        customElements.define("sportguiden-card", SportguidenCard);
      }
      if (!customElements.get("sportguiden-card-editor")) {
        customElements.define("sportguiden-card-editor", SportguidenCardEditor);
      }
    } catch (err) {
      console.error("SportGuiden: failed to register custom elements:", err);
      return;
    }

    window.customCards = window.customCards || [];
    if (!window.customCards.find(c => c.type === "sportguiden-card")) {
      window.customCards.push({
        type: "sportguiden-card",
        name: "SportGuiden",
        description: "Shows today's live sport on TV and streaming (tv.nu)",
        preview: true,
        documentationURL: "https://github.com/ostbergjohan/ha-sportguiden",
      });
    }

    console.info(
      `%c SPORTGUIDEN %c v${SPORTGUIDEN_VERSION} `,
      "background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: 700;",
      "background: #0f1923; color: #667eea; padding: 4px 8px; border-radius: 0 4px 4px 0;"
    );
  }

  // Register immediately
  registerCards();

  // Re-register on HA frontend reconnect events
  window.addEventListener("connection-status", function(e) {
    if (e.detail === "connected") {
      setTimeout(registerCards, 100);
    }
  });
})();
