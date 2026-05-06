"""Constants for SportGuiden integration."""

DOMAIN = "sportguiden"

BASE_URL = "https://www.tv.nu"

CONF_SOURCES = "sources"

DEFAULT_SCAN_INTERVAL = 3600  # 1 hour

# Available sources to scrape from tv.nu
AVAILABLE_SOURCES = [
    {
        "id": "all",
        "name": "All sport",
        "url": "sport",
        "icon": "mdi:trophy",
        "accent_color": "#667eea",
    },
    {
        "id": "fotboll",
        "name": "Fotboll",
        "url": "sport/fotboll",
        "icon": "mdi:soccer",
        "accent_color": "#4CAF50",
    },
    {
        "id": "champions_league",
        "name": "Champions League",
        "url": "sport/fotboll/liga/champions-league",
        "icon": "mdi:soccer",
        "accent_color": "#1a237e",
    },
    {
        "id": "premier_league",
        "name": "Premier League",
        "url": "sport/fotboll/liga/premier-league",
        "icon": "mdi:soccer",
        "accent_color": "#3d195b",
    },
    {
        "id": "allsvenskan",
        "name": "Allsvenskan",
        "url": "sport/fotboll/liga/allsvenskan",
        "icon": "mdi:soccer",
        "accent_color": "#002f6c",
    },
    {
        "id": "europa_league",
        "name": "Europa League",
        "url": "sport/fotboll/liga/europa-league",
        "icon": "mdi:soccer",
        "accent_color": "#f57c00",
    },
    {
        "id": "ishockey",
        "name": "Ishockey",
        "url": "sport/ishockey",
        "icon": "mdi:hockey-puck",
        "accent_color": "#0288d1",
    },
    {
        "id": "shl",
        "name": "SHL",
        "url": "sport/ishockey/liga/shl",
        "icon": "mdi:hockey-puck",
        "accent_color": "#1565c0",
    },
    {
        "id": "tennis",
        "name": "Tennis",
        "url": "sport/tennis",
        "icon": "mdi:tennis",
        "accent_color": "#00796b",
    },
    {
        "id": "motorsport",
        "name": "Motorsport",
        "url": "sport/motorsport",
        "icon": "mdi:car-sports",
        "accent_color": "#d32f2f",
    },
    {
        "id": "vintersport",
        "name": "Vintersport",
        "url": "sport/vintersport",
        "icon": "mdi:snowflake",
        "accent_color": "#4fc3f7",
    },
]
