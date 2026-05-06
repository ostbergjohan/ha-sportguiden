# SportGuiden

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

Home Assistant-integration som visar dagens sport på TV och streaming i Sverige (via [tv.nu](https://www.tv.nu/sport)). Zero-config – installera, välj sporter, klart!

![SportGuiden](soccer-tv.png)

## Funktioner

- **Zero-config**: Installera via HACS → Lägg till integration → välj sporter → klart. Ingen YAML.
- **Liga- & turneringsfilter**: Filtrera på Champions League, Allsvenskan, Premier League, SHL etc. direkt i kortet
- **Kanalfilter**: Välj vilka kanaler som visas (SVT, TV4, Viaplay, Eurosport, Max, DAZN...)
- **Flera kort, en sensor**: En integration hämtar all data – varje kort filtrerar efter sport, liga och kanal
- **Kanallogotyper**: Visar riktiga logotyper för alla svenska sportkanaler
- **Liga-badges**: Färgkodade badges för ligor och turneringar
- **Visuell editor**: Komplett GUI – inga YAML-kunskaper krävs
- **Teman**: Gradient/glas/enfärgad bakgrund, anpassade färger, kompakt läge
- **Auto-config**: Titel, ikon och accentfärg sätts automatiskt från vald källa

## Hur kortet ser ut

```html
<div class="sg-card" style="background: linear-gradient(135deg, #0f1923, #1a2a3a); border-radius: 16px; padding: 24px; color: #fff;">
  <!-- Header -->
  <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
    <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#4CAF50,#2E7D32);display:flex;align-items:center;justify-content:center;">⚽</div>
    <span style="font-size:1.3em;font-weight:700;">Fotboll idag</span>
    <span style="background:linear-gradient(135deg,#4CAF50,#2E7D32);color:#fff;padding:4px 10px;border-radius:20px;font-size:0.7em;font-weight:700;">5</span>
  </div>

  <!-- Event row -->
  <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.05);margin-bottom:10px;">
    <div style="color:#4CAF50;font-weight:700;min-width:44px;text-align:center;padding:4px 8px;border-radius:8px;background:rgba(76,175,80,0.1);">18:30</div>
    <div style="width:32px;height:32px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;padding:4px;">
      <img src="https://img.tv.nu/img-tvnu/channellogos/viaplay.svg" style="width:100%;height:100%;object-fit:contain;">
    </div>
    <div style="flex:1;">
      <div style="font-weight:600;">Häcken - Djurgården</div>
      <span style="font-size:0.65em;font-weight:600;padding:2px 7px;border-radius:8px;background:#002f6c;color:#fff;text-transform:uppercase;">ALLSVENSKAN</span>
    </div>
  </div>

  <!-- Event row -->
  <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.05);margin-bottom:10px;">
    <div style="color:#4CAF50;font-weight:700;min-width:44px;text-align:center;padding:4px 8px;border-radius:8px;background:rgba(76,175,80,0.1);">20:45</div>
    <div style="width:32px;height:32px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;padding:4px;">
      <img src="https://img.tv.nu/img-tvnu/channellogos/tv4.svg" style="width:100%;height:100%;object-fit:contain;">
    </div>
    <div style="flex:1;">
      <div style="font-weight:600;">Brighton - Arsenal</div>
      <span style="font-size:0.65em;font-weight:600;padding:2px 7px;border-radius:8px;background:#38003c;color:#fff;text-transform:uppercase;">PREMIER LEAGUE</span>
    </div>
  </div>

  <!-- Event row -->
  <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.05);">
    <div style="color:#4CAF50;font-weight:700;min-width:44px;text-align:center;padding:4px 8px;border-radius:8px;background:rgba(76,175,80,0.1);">21:00</div>
    <div style="width:32px;height:32px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;padding:4px;">
      <img src="https://img.tv.nu/img-tvnu/channellogos/viaplay.svg" style="width:100%;height:100%;object-fit:contain;">
    </div>
    <div style="flex:1;">
      <div style="font-weight:600;">Bayern München - PSG</div>
      <span style="font-size:0.65em;font-weight:600;padding:2px 7px;border-radius:8px;background:#1a237e;color:#fff;text-transform:uppercase;">CHAMPIONS LEAGUE</span>
    </div>
  </div>

  <div style="margin-top:12px;text-align:right;font-size:0.65em;opacity:0.3;">SportGuiden · tv.nu</div>
</div>
```

## Installation

### HACS (rekommenderat)

1. Gå till HACS → Integrations → ⋮ → **Custom repositories**
2. Lägg till `https://github.com/ostbergjohan/ha-sportguiden` som **Integration**
3. Sök efter "SportGuiden" och klicka **Download**
4. Starta om Home Assistant
5. Gå till **Inställningar → Enheter & Tjänster → Lägg till integration → SportGuiden**
6. Välj vilka sporter du vill bevaka (checkboxar) → Klicka Skicka

Klart! Sensorn skapas automatiskt och Lovelace-kortet registreras.

## Lägg till kort på dashboard

Gå till din dashboard → Redigera → Lägg till kort → **Custom: sportguiden-card**

Enklaste konfigurationen:

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
```

## Kortinställningar

| Option | Typ | Standard | Beskrivning |
|--------|-----|----------|-------------|
| `entity` | string | *krävs* | Sensor-entity |
| `source` | string | `""` | Sportkälla (`fotboll`, `ishockey`, etc.). Tom = alla |
| `leagues` | list | `[]` | Ligafilter. T.ex. `["Champions League", "Allsvenskan"]`. Tom = visa alla |
| `channels` | list | `[]` | Kanalfilter. T.ex. `["Viaplay", "TV4"]`. Tom = visa alla |
| `title` | string | Auto | Korttitel |
| `max_items` | number | `0` | Max antal matcher (0 = alla) |
| `background` | string | `gradient` | `gradient`, `glass`, `solid`, eller `none` |
| `accent_color` | string | Auto | Primär accentfärg |
| `accent_color_2` | string | `#764ba2` | Sekundär gradientfärg |
| `card_bg_color` | string | `#0f1923` | Bakgrundsfärg |
| `text_color` | string | `#ffffff` | Textfärg |
| `header_icon` | string | Auto | MDI-ikon i headern |
| `show_time` | boolean | `true` | Visa tid |
| `show_channel` | boolean | `true` | Visa kanallogo |
| `show_league` | boolean | `true` | Visa liga-badge |
| `show_header_icon` | boolean | `true` | Visa header-ikon |
| `compact` | boolean | `false` | Kompakt läge |

## Exempel

### Bara Champions League och Premier League på Viaplay

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: fotboll
title: "🏆 Europafotboll ikväll"
leagues:
  - Champions League
  - Premier League
channels:
  - Viaplay
accent_color: "#1a237e"
```

### All fotboll på SVT & TV4 (gratis-TV)

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: fotboll
title: "⚽ Fotboll på fri TV"
channels:
  - SVT1
  - SVT2
  - SVT Play
  - TV4
  - TV4 Play
accent_color: "#2e7d32"
```

### Bara Allsvenskan

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: fotboll
leagues:
  - Allsvenskan
accent_color: "#002f6c"
```

### Ishockey – SHL och NHL

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: ishockey
title: "🏒 Hockey ikväll"
leagues:
  - SHL
  - NHL
accent_color: "#0288d1"
```

### Tennis – bara Grand Slam

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: tennis
title: "🎾 Tennis"
accent_color: "#00796b"
```

### All sport på Max & DAZN (streaming)

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
title: "📺 Sport på streaming"
channels:
  - Max
  - DAZN
  - Discovery+
  - Viaplay
background: glass
```

### Motorsport – kompakt

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: motorsport
title: "🏎️ Motorsport"
compact: true
accent_color: "#d32f2f"
```

### Allt – max 5 matcher

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
title: "🏆 Sport på TV idag"
max_items: 5
```

## Tillgängliga sportkällor

Dessa väljs i integrationens config flow (checkboxar):

| Källa | Beskrivning |
|-------|-------------|
| All sport | Allt som visas på tv.nu/sport |
| Fotboll | All fotboll |
| Champions League | UEFA Champions League |
| Premier League | Engelska ligan |
| Allsvenskan | Svenska högstaligan |
| Europa League | UEFA Europa League |
| Ishockey | All ishockey |
| SHL | Svenska Hockey Ligan |
| Tennis | All tennis |
| Motorsport | Formel 1, MotoGP, etc. |
| Vintersport | Skidor, skidskytte, etc. |

## Kanaler med logotyper

SVT1, SVT2, SVT Play, TV4, TV4 Play, Viaplay, V Sport 1, V Sport 2, V Sport Football, V Sport Hockey, Eurosport 1, Eurosport 2, Discovery+, C More, Max, DAZN, TV3, TV6, Sportkanalen

## Liga-badges (färgkodade)

Champions League, Europa League, Conference League, Premier League, Allsvenskan, Superettan, Damallsvenskan, Bundesliga, La Liga, Serie A, Ligue 1, SHL, Hockeyallsvenskan, NHL, ATP, WTA, PGA Tour

## Ändra källor efter installation

Gå till **Inställningar → Enheter & Tjänster → SportGuiden → Alternativ** och kryssa i/ur sporter.

## Krav

- Home Assistant 2023.11+
- Internetåtkomst till tv.nu

## Datakälla

All sportdata hämtas från [tv.nu/sport](https://www.tv.nu/sport), Sveriges största TV-guide.

## Licens

MIT
