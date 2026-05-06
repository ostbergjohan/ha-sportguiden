# SportGuiden

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

Home Assistant integration that shows today's live sport on TV and streaming in Sweden (via [tv.nu](https://www.tv.nu/sport)). Zero-config – install, pick sports, done!

![SportGuiden](soccer-tv.png)

## Features

- **Zero-config**: Install via HACS → Add integration → pick sports → done. No YAML needed.
- **League & tournament filter**: Filter by Champions League, Allsvenskan, Premier League, SHL, etc. directly in the card
- **Channel filter**: Pick which channels to show (SVT, TV4, Viaplay, Eurosport, Max, DAZN...)
- **Multiple cards, one sensor**: A single integration fetches all data – each card filters by sport, league and channel
- **Channel logos**: Displays real logos for all Swedish sport channels
- **League badges**: Color-coded badges for leagues and tournaments
- **Visual editor**: Full GUI – no YAML knowledge required
- **Themes**: Gradient/glass/solid backgrounds, custom colors, compact mode
- **Auto-config**: Title, icon and accent color auto-populate from selected source

## Installation

### HACS (recommended)

1. Go to HACS → Integrations → ⋮ → **Custom repositories**
2. Add `https://github.com/ostbergjohan/ha-sportguiden` as **Integration**
3. Search for "SportGuiden" and click **Download**
4. Restart Home Assistant
5. Go to **Settings → Devices & Services → Add Integration → SportGuiden**
6. Check which sports to monitor (checkboxes) → Click Submit

Done! The sensor is created automatically and the Lovelace card is registered.

## Add card to dashboard

Go to your dashboard → Edit → Add Card → **Custom: sportguiden-card**

Simplest configuration:

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
```

## Card Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | *required* | Sensor entity ID |
| `source` | string | `""` | Sport source (`fotboll`, `ishockey`, etc.). Empty = all |
| `leagues` | list | `[]` | League filter. E.g. `["Champions League", "Allsvenskan"]`. Empty = show all |
| `channels` | list | `[]` | Channel filter. E.g. `["Viaplay", "TV4"]`. Empty = show all |
| `title` | string | Auto | Card title |
| `max_items` | number | `0` | Max events to show (0 = all) |
| `background` | string | `gradient` | `gradient`, `glass`, `solid`, or `none` |
| `accent_color` | string | Auto | Primary accent color |
| `accent_color_2` | string | `#764ba2` | Secondary gradient color |
| `card_bg_color` | string | `#0f1923` | Card background color |
| `text_color` | string | `#ffffff` | Text color |
| `header_icon` | string | Auto | MDI icon in header |
| `show_time` | boolean | `true` | Show time |
| `show_channel` | boolean | `true` | Show channel logo |
| `show_league` | boolean | `true` | Show league badge |
| `show_header_icon` | boolean | `true` | Show header icon |
| `compact` | boolean | `false` | Compact mode |

## Examples

### Champions League & Premier League on Viaplay

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: fotboll
title: "🏆 European football tonight"
leagues:
  - Champions League
  - Premier League
channels:
  - Viaplay
accent_color: "#1a237e"
```

### All football on free TV (SVT & TV4)

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: fotboll
title: "⚽ Football on free TV"
channels:
  - SVT1
  - SVT2
  - SVT Play
  - TV4
  - TV4 Play
accent_color: "#2e7d32"
```

### Allsvenskan only

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: fotboll
leagues:
  - Allsvenskan
accent_color: "#002f6c"
```

### Ice Hockey – SHL and NHL

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: ishockey
title: "🏒 Hockey tonight"
leagues:
  - SHL
  - NHL
accent_color: "#0288d1"
```

### Tennis

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: tennis
title: "🎾 Tennis"
accent_color: "#00796b"
```

### Streaming only (Max, DAZN, Viaplay)

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
title: "📺 Sport on streaming"
channels:
  - Max
  - DAZN
  - Discovery+
  - Viaplay
background: glass
```

### Motorsport – compact

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: motorsport
title: "🏎️ Motorsport"
compact: true
accent_color: "#d32f2f"
```

### Everything – max 5 events

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
title: "🏆 Sport on TV today"
max_items: 5
```

## Available sport sources

These are selected in the integration config flow (checkboxes):

| Source | Description |
|--------|-------------|
| All sport | Everything on tv.nu/sport |
| Fotboll | All football |
| Champions League | UEFA Champions League |
| Premier League | English Premier League |
| Allsvenskan | Swedish top division |
| Europa League | UEFA Europa League |
| Ishockey | All ice hockey |
| SHL | Swedish Hockey League |
| Tennis | All tennis |
| Motorsport | Formula 1, MotoGP, etc. |
| Vintersport | Skiing, biathlon, etc. |

## Supported channels (with logos)

SVT1, SVT2, SVT Play, TV4, TV4 Play, Viaplay, V Sport 1, V Sport 2, V Sport Football, V Sport Hockey, Eurosport 1, Eurosport 2, Discovery+, C More, Max, DAZN, TV3, TV6, Sportkanalen

## League badges (color-coded)

Champions League, Europa League, Conference League, Premier League, Allsvenskan, Superettan, Damallsvenskan, Bundesliga, La Liga, Serie A, Ligue 1, SHL, Hockeyallsvenskan, NHL, ATP, WTA, PGA Tour

## Changing sources after installation

Go to **Settings → Devices & Services → SportGuiden → Options** and check/uncheck sports.

## Requirements

- Home Assistant 2023.11+
- Internet access to tv.nu

## Data source

All sport data is scraped from [tv.nu/sport](https://www.tv.nu/sport), Sweden's largest TV guide.

## License

MIT
