"""Data coordinator for SportGuiden – fetches sport events from tv.nu."""
from __future__ import annotations

import html as _html
import logging
import re
from datetime import date, timedelta

import aiohttp

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator,
    UpdateFailed,
)

from .const import DOMAIN, BASE_URL, DEFAULT_SCAN_INTERVAL

_LOGGER = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
}


def parse_events(html: str, today_str: str) -> list[dict]:
    """Parse sport events from tv.nu HTML (same logic as the standalone scraper)."""
    events: list[dict] = []
    seen: set[str] = set()

    # === Strategy 1: Card view ===
    link_starts = [
        m.start()
        for m in re.finditer(
            r'<a\s+href="/s/[sp]_\d+_' + today_str + r'"', html
        )
    ]

    for start in link_starts:
        block = html[start : start + 2500]
        end_a = block.find("</a>")
        if end_a > 0:
            block = block[:end_a]

        time_match = re.search(
            r'class="_3wy1n"[^>]*>\s*(?:Idag\s+)?(\d{2}:\d{2})', block
        )
        time_str = time_match.group(1) if time_match else ""

        league_match = re.search(r'class="_3P__M"[^>]*>\s*([^<]+)', block)
        subtitle = _html.unescape(league_match.group(1).strip()) if league_match else ""

        title_match = re.search(r'class="_3C8FT"[^>]*>\s*([^<]+)', block)
        title = _html.unescape(title_match.group(1).strip()) if title_match else ""

        if not title:
            aria_match = re.search(
                r'aria-label="Link\s*-\s*(\d{2}:\d{2}),\s*(.+?)"', block
            )
            if aria_match:
                if not time_str:
                    time_str = aria_match.group(1)
                title = _html.unescape(aria_match.group(2).strip())

        if not title:
            continue

        league = ""
        sport = ""
        if subtitle:
            sub_match = re.match(r"(.+?)\s*\([HD]\)\s*,?\s*(\w+.*)", subtitle)
            if sub_match:
                league = sub_match.group(1).strip()
                sport = sub_match.group(2).strip()
            else:
                sport = subtitle

        channel = ""
        chan_match = re.search(
            r"(?:SVT|TV4|Viaplay|Discovery\+|Eurosport|C More|Max|DAZN|Sportkanalen|TV3|TV6|TV8|Kanal 5|Kanal 9|ESPN|V Sport|Cmore)[^<]*",
            block,
            re.IGNORECASE,
        )
        if chan_match:
            channel = _html.unescape(chan_match.group(0).strip())

        key = f"{time_str}_{title}".lower()
        if key in seen:
            continue
        seen.add(key)

        events.append(
            {
                "time": time_str,
                "title": title,
                "subtitle": subtitle,
                "league": league,
                "sport": sport,
                "channel": channel,
            }
        )

    # === Strategy 2: List view (aria-label) ===
    aria_links = re.finditer(
        r'<a[^>]+href="/s/[sp]_\d+_'
        + today_str
        + r'"[^>]*aria-label="Link\s*-\s*(\d{2}:\d{2}),\s*([^"]+)"',
        html,
    )

    for m in aria_links:
        time_str = m.group(1)
        title = _html.unescape(m.group(2).strip())

        if not title or " - " not in title:
            continue

        key = f"{time_str}_{title}".lower()
        if key in seen:
            continue
        seen.add(key)

        block = html[m.start() : m.start() + 2000]
        channel = ""
        chan_patterns = [
            r">\s*(SVT[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(TV4[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(Viaplay[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(Discovery\+[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(Eurosport[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(C More[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(Max[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(DAZN[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(V Sport[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(TV3[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(TV6[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(Sportkanalen[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(SVT Play[^<]*?)(?:\s*<!--|\s*<)",
            r">\s*(TV4 Play[^<]*?)(?:\s*<!--|\s*<)",
        ]
        for pat in chan_patterns:
            chan_m = re.search(pat, block, re.IGNORECASE)
            if chan_m:
                channel = _html.unescape(chan_m.group(1).strip())
                break

        events.append(
            {
                "time": time_str,
                "title": title,
                "subtitle": "",
                "league": "",
                "sport": "",
                "channel": channel,
            }
        )

    events.sort(key=lambda e: e.get("time") or "99:99")
    return events


async def async_fetch_source(
    session: aiohttp.ClientSession,
    source: dict,
    today_str: str,
) -> dict:
    """Fetch events for a single source from tv.nu."""
    url_path = source.get("url", "sport").strip("/")
    if not url_path.startswith("sport"):
        url_path = f"sport/{url_path}"
    url = f"{BASE_URL}/{url_path}"

    timeout = aiohttp.ClientTimeout(total=20)
    try:
        async with session.get(url, headers=_HEADERS, timeout=timeout, ssl=False) as resp:
            if resp.status != 200:
                _LOGGER.warning("SportGuiden: %s returned HTTP %s", url, resp.status)
                return {
                    "name": source.get("name", source["id"]),
                    "events": [],
                    "count": 0,
                    "icon": source.get("icon", "mdi:trophy"),
                    "accent_color": source.get("accent_color", "#667eea"),
                    "url": url,
                }
            html = await resp.text()
    except Exception as err:
        _LOGGER.warning("SportGuiden: error fetching %s: %s", url, err)
        return {
            "name": source.get("name", source["id"]),
            "events": [],
            "count": 0,
            "icon": source.get("icon", "mdi:trophy"),
            "accent_color": source.get("accent_color", "#667eea"),
            "url": url,
        }

    events = parse_events(html, today_str)
    return {
        "name": source.get("name", source["id"]),
        "events": events,
        "count": len(events),
        "icon": source.get("icon", "mdi:trophy"),
        "accent_color": source.get("accent_color", "#667eea"),
        "url": url,
    }


class SportguidenCoordinator(DataUpdateCoordinator):
    """Fetch sport TV listings from tv.nu for all configured sources."""

    def __init__(self, hass: HomeAssistant, sources: list[dict]) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL),
        )
        self.sources = sources
        self.session = async_get_clientsession(hass)

    async def _async_update_data(self) -> dict:
        """Fetch all configured sources from tv.nu."""
        today_str = date.today().strftime("%Y%m%d")

        result_sources: dict[str, dict] = {}
        all_events: list[dict] = []

        for source in self.sources:
            source_id = source["id"]
            data = await async_fetch_source(self.session, source, today_str)
            result_sources[source_id] = data
            all_events.extend(data.get("events", []))

        # Deduplicate all_events
        seen: set[str] = set()
        unique_events: list[dict] = []
        for ev in all_events:
            key = f"{ev.get('time', '')}_{ev.get('title', '')}".lower()
            if key not in seen:
                seen.add(key)
                unique_events.append(ev)
        unique_events.sort(key=lambda e: e.get("time") or "99:99")

        return {
            "sources": result_sources,
            "all_events": unique_events,
            "total_count": len(unique_events),
            "date": str(date.today()),
            "configured_sources": [
                {"id": s["id"], "name": s.get("name", s["id"])} for s in self.sources
            ],
        }
