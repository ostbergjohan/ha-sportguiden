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
    """Parse sport events from tv.nu HTML.

    tv.nu renders two sections for today:
      - Card view  (class landscapeCard): title + time, NO channel info
      - List view  (class _2sEf9):        title + time + ALL channels

    We parse list-view links only so we always get channel data.
    Card-view links for the same event appear earlier in the HTML and would
    shadow the list-view entries if processed first.
    """
    events: list[dict] = []
    seen: set[str] = set()

    # Find all list-view event links (_2sEf9 class) for today
    link_re = re.compile(
        r'<a\s[^>]*href="/s/[sp]_\d+_' + today_str + r'"[^>]*>'
    )

    for m in link_re.finditer(html):
        tag = m.group(0)
        # Skip card-view (landscapeCard) – they have no channel info and will be
        # duplicated by the list-view entry below.
        if "landscapeCard" in tag:
            continue

        start = m.start()
        end = html.find("</a>", start)
        if end < 0:
            continue
        block = html[start : end + 4]

        # ── Time ──────────────────────────────────────────────────────────────
        time_str = ""
        t = re.search(r'<time[^>]*>(\d{2}:\d{2})', block)
        if t:
            time_str = t.group(1)
        if not time_str:
            t = re.search(r'aria-label="Link\s*-\s*(\d{2}:\d{2})', block)
            if t:
                time_str = t.group(1)

        # ── Title ─────────────────────────────────────────────────────────────
        title = ""
        for cls in ("_2WKUG", "_3C8FT"):
            t = re.search(rf'class="{cls}"[^>]*>\s*([^<]+)', block)
            if t:
                title = _html.unescape(t.group(1).strip())
                break
        if not title:
            t = re.search(r'aria-label="Link\s*-\s*\d{2}:\d{2},\s*([^"]+)"', block)
            if t:
                title = _html.unescape(t.group(1).strip())
        if not title:
            continue

        # ── Channels ──────────────────────────────────────────────────────────
        # Channel names are text nodes wrapped in React comment markers: <!-- -->Name<!-- -->
        # Each channel airing gets its own _3O72C / _2kIHd block.
        raw_channels = re.findall(r'<!--\s*-->\s*([^<\n]+?)\s*<!--\s*-->', block)
        channel_names = list(dict.fromkeys(  # deduplicate, preserve order
            _html.unescape(c.strip()) for c in raw_channels if c.strip()
        ))
        channel = " & ".join(channel_names)

        # ── League / sport ────────────────────────────────────────────────────
        subtitle = ""
        league = ""
        sport = ""

        # List view: text sits after the empty _2HFK6 div
        lm = re.search(r'class="_2HFK6"[^>]*></div>\s*([^<]+)', block)
        if lm:
            subtitle = _html.unescape(lm.group(1).strip())
        else:
            # Card view fallback
            lm = re.search(r'class="_3P__M"[^>]*>\s*([^<]+)', block)
            if lm:
                subtitle = _html.unescape(lm.group(1).strip())

        if subtitle:
            parts = [p.strip() for p in subtitle.split(",")]
            sport_words = {
                "fotboll", "ishockey", "tennis", "motorsport", "golf",
                "basket", "handboll", "cykling", "vintersport", "simning",
                "friidrott", "rugby", "boxning", "atletik",
            }
            if parts[0].lower() in sport_words:
                # List-view format: "Sport, League (D/H), Round"
                sport = parts[0]
                if len(parts) > 1:
                    league = re.sub(r"\s*\([DH]\)\s*$", "", parts[1]).strip()
            else:
                # Card-view format: "League (D/H), sport"
                sub_m = re.match(r"(.+?)\s*\([HD]\)\s*,?\s*(\w+.*)", subtitle)
                if sub_m:
                    league = sub_m.group(1).strip()
                    sport = sub_m.group(2).strip()
                else:
                    sport = subtitle

        key = f"{time_str}_{title}".lower()
        if key in seen:
            continue
        seen.add(key)

        events.append({
            "time": time_str,
            "title": title,
            "subtitle": subtitle,
            "league": league,
            "sport": sport,
            "channel": channel,
        })

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
