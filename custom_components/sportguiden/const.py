"""Constants for SportGuiden integration."""

DOMAIN = "sportguiden"

BASE_URL = "https://www.tv.nu"

CONF_SOURCES = "sources"

DEFAULT_SCAN_INTERVAL = 86400  # 24 hours fallback (nightly refresh at 04:00 is primary)

# Available sources to scrape from tv.nu
# Only broad sport categories here – league filtering is done in the card
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
        "id": "ishockey",
        "name": "Ishockey",
        "url": "sport/ishockey",
        "icon": "mdi:hockey-puck",
        "accent_color": "#0288d1",
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
    {
        "id": "golf",
        "name": "Golf",
        "url": "sport/golf",
        "icon": "mdi:golf",
        "accent_color": "#388e3c",
    },
    {
        "id": "basket",
        "name": "Basket",
        "url": "sport/basket",
        "icon": "mdi:basketball",
        "accent_color": "#e65100",
    },
    {
        "id": "handboll",
        "name": "Handboll",
        "url": "sport/handboll",
        "icon": "mdi:handball",
        "accent_color": "#6a1b9a",
    },
    {
        "id": "cykling",
        "name": "Cykling",
        "url": "sport/cykling",
        "icon": "mdi:bike",
        "accent_color": "#f57f17",
    },
    {
        "id": "ovrigt",
        "name": "Övrig sport",
        "url": "sport/ovrigt",
        "icon": "mdi:medal",
        "accent_color": "#78909c",
    },
]
