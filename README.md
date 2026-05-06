# SportGuiden

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

Custom Home Assistant card that shows today's live sport on TV and streaming in Sweden (via [tv.nu](https://www.tv.nu/sport)). Supports multiple sports, leagues, and channels with a single sensor.

## Features

- **Multi-source**: Configure football, hockey, tennis, Champions League, Allsvenskan, etc. — all in one config file
- **One sensor, many cards**: A single HA sensor fetches all data; each card filters by source
- **Channel logos**: Shows channel logos (SVT, TV4, Viaplay, Eurosport, Max, DAZN, etc.)
- **Channel filter**: Pick which channels to show per card (checkboxes in the visual editor)
- **League badges**: Color-coded badges for Champions League, Premier League, Allsvenskan, etc.
- **Visual editor**: Full GUI — no YAML needed
- **Themeable**: Gradient/glass/solid backgrounds, custom colors, compact mode
- **Auto-config**: Title, icon, and accent color auto-populate from your source config

## Screenshot

```
┌──────────────────────────────────────────────┐
│  [⚽]  Fotboll idag                      [7] │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ 18:30  [Viaplay]  Häcken - Djurgården│    │
│  │                   DAMALLSVENSKAN      │    │
│  ├──────────────────────────────────────┤    │
│  │ 20:40  [TV4]     Brighton - Arsenal   │    │
│  │                   PREMIER LEAGUE      │    │
│  ├──────────────────────────────────────┤    │
│  │ 21:00  [Viaplay]  Bayern - PSG        │    │
│  │                   CHAMPIONS LEAGUE    │    │
│  └──────────────────────────────────────┘    │
│                          SportGuiden · tv.nu  │
└──────────────────────────────────────────────┘
```

## Installation

### HACS (recommended)

1. Add this repository as a custom repository in HACS
2. Install "SportGuiden"
3. Add the resource and sensor config below

### Manual

1. Copy `dist/sportguiden-card.js` to `/config/www/sportguiden-card.js`
2. Copy `scripts/sportguiden_scraper.py` and `scripts/sportguiden_config.json` to `/config/scripts/`
3. Add the resource in **Settings → Dashboards → Resources**:
   ```
   /local/sportguiden-card.js (JavaScript Module)
   ```

## Configuration

### 1. Configure sources (`sportguiden_config.json`)

Edit this file to choose which sports/leagues to scrape:

```json
{
  "sources": [
    {
      "id": "all",
      "name": "All sport",
      "url": "sport",
      "icon": "mdi:trophy",
      "accent_color": "#667eea"
    },
    {
      "id": "fotboll",
      "name": "Fotboll",
      "url": "sport/fotboll",
      "icon": "mdi:soccer",
      "accent_color": "#4CAF50"
    },
    {
      "id": "champions_league",
      "name": "Champions League",
      "url": "sport/fotboll/liga/champions-league",
      "icon": "mdi:soccer",
      "accent_color": "#1a237e"
    },
    {
      "id": "allsvenskan",
      "name": "Allsvenskan",
      "url": "sport/fotboll/liga/allsvenskan",
      "icon": "mdi:soccer",
      "accent_color": "#002f6c"
    },
    {
      "id": "ishockey",
      "name": "Ishockey",
      "url": "sport/ishockey",
      "icon": "mdi:hockey-puck",
      "accent_color": "#0288d1"
    },
    {
      "id": "tennis",
      "name": "Tennis",
      "url": "sport/tennis",
      "icon": "mdi:tennis",
      "accent_color": "#00796b"
    }
  ]
}
```

Available URL paths (from tv.nu):

| Path | Description |
|------|-------------|
| `sport` | All sports |
| `sport/fotboll` | All football |
| `sport/fotboll/liga/allsvenskan` | Allsvenskan |
| `sport/fotboll/liga/champions-league` | Champions League |
| `sport/fotboll/liga/premier-league` | Premier League |
| `sport/fotboll/liga/europa-league` | Europa League |
| `sport/ishockey` | All ice hockey |
| `sport/ishockey/liga/shl` | SHL |
| `sport/tennis` | Tennis |
| `sport/motorsport` | Motorsport |
| `sport/vintersport` | Winter sports |

### 2. Add sensor to `configuration.yaml`

```yaml
command_line:
  - sensor:
      name: SportGuiden
      unique_id: sportguiden
      command: "python3 /config/scripts/sportguiden_scraper.py --config /config/scripts/sportguiden_config.json"
      value_template: "{{ value_json.total_count }}"
      json_attributes:
        - sources
        - all_events
        - configured_sources
        - date
      scan_interval: 86400
```

> **Note**: `scan_interval: 86400` means once per day (24h). You can also trigger updates at a specific time using an automation with `homeassistant.update_entity`.

### 3. Add card to your dashboard

```yaml
type: custom:sportguiden-card
entity: sensor.sportguiden
source: fotboll
```

That's it! The card auto-detects title, icon, and colors from your config.

## Card Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entity` | string | *required* | Sensor entity ID |
| `source` | string | `""` | Source ID from config (`fotboll`, `champions_league`, etc.). Empty = all events |
| `title` | string | Auto | Card title (auto-populated from source) |
| `channels` | list | `[]` | Channel filter. E.g. `["Viaplay", "TV4 Play"]`. Empty = show all |
| `max_items` | number | `0` | Max events to show (0 = all) |
| `background` | string | `gradient` | `gradient`, `glass`, `solid`, or `none` |
| `accent_color` | string | Auto | Primary accent color |
| `accent_color_2` | string | `#764ba2` | Secondary gradient color |
| `card_bg_color` | string | `#0f1923` | Background color |
| `text_color` | string | `#ffffff` | Text color |
| `header_icon` | string | Auto | MDI icon in header |
| `show_time` | boolean | `true` | Show time column |
| `show_channel` | boolean | `true` | Show channel logo/name |
| `show_league` | boolean | `true` | Show league badge |
| `show_header_icon` | boolean | `true` | Show header icon |
| `compact` | boolean | `false` | Compact mode (smaller padding) |

## Multiple cards example

```yaml
# Card 1: Football only, Viaplay channels
type: custom:sportguiden-card
entity: sensor.sportguiden
source: fotboll
channels:
  - Viaplay

# Card 2: All sport on SVT
type: custom:sportguiden-card
entity: sensor.sportguiden
source: all
title: "Sport på SVT"
channels:
  - SVT1
  - SVT2
  - SVT Play

# Card 3: Champions League
type: custom:sportguiden-card
entity: sensor.sportguiden
source: champions_league
```

## Supported channels

SVT1, SVT2, SVT Play, TV4, TV4 Play, Viaplay, V Sport 1/2/Football/Hockey, Eurosport 1/2, Discovery+, C More, Max, DAZN, TV3, TV6, Sportkanalen

## Requirements

- Home Assistant 2023.11+
- Python 3.9+ with `requests` library (pre-installed in HA)
- Internet access from HA to tv.nu

## Data source

All sport data is scraped from [tv.nu/sport](https://www.tv.nu/sport), Sweden's largest TV guide.

## License

MIT
