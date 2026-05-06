"""SportGuiden HACS Integration – shows today's sport on TV (tv.nu)."""
from __future__ import annotations

import logging
import pathlib

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv

from .const import DOMAIN, AVAILABLE_SOURCES
from .coordinator import SportguidenCoordinator

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

_CARD_URL = f"/{DOMAIN}/sportguiden-card.js"
_LOGOS_URL = f"/{DOMAIN}/logos"
_CARD_VERSION = "9"


# ─── Frontend helpers ──────────────────────────────────────────────


async def _register_card(hass: HomeAssistant) -> None:
    """Register the Lovelace JS card as a static path + frontend resource."""
    www_dir = pathlib.Path(__file__).parent / "www"
    js_path = str(www_dir / "sportguiden-card.js")

    _LOGGER.warning("SportGuiden: registering card from %s", js_path)

    registered = False
    try:
        from homeassistant.components.http import StaticPathConfig

        logos_dir = str(www_dir / "logos")
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(_CARD_URL, js_path, True),
                StaticPathConfig(_LOGOS_URL, logos_dir, True),
            ]
        )
        registered = True
    except (ImportError, AttributeError):
        try:
            hass.http.register_static_path(_CARD_URL, js_path, True)
            hass.http.register_static_path(_LOGOS_URL, logos_dir, True)
            registered = True
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("SportGuiden: failed to register static path (legacy): %s", err)
    except Exception as err:  # noqa: BLE001
        _LOGGER.error("SportGuiden: failed to register static path: %s", err)

    if not registered:
        _LOGGER.error("SportGuiden: static path registration failed – card will NOT load")
        return

    url = f"{_CARD_URL}?v={_CARD_VERSION}"
    add_extra_js_url(hass, url)
    _LOGGER.warning("SportGuiden: card registered at %s", url)


# ─── WebSocket API ─────────────────────────────────────────────────


@websocket_api.websocket_command(
    {vol.Required("type"): "sportguiden/get_sources"}
)
@websocket_api.async_response
async def ws_get_sources(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Return list of available sources."""
    connection.send_result(msg["id"], AVAILABLE_SOURCES)


# ─── Setup ─────────────────────────────────────────────────────────


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up SportGuiden (called early for frontend registration)."""
    _LOGGER.warning("SportGuiden: async_setup called")
    hass.data.setdefault(DOMAIN, {})

    # Register card FIRST (most important)
    await _register_card(hass)

    # Register WS command
    try:
        websocket_api.async_register_command(hass, ws_get_sources)
    except Exception:  # noqa: BLE001
        pass

    hass.data[DOMAIN]["_cards_done"] = True
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up SportGuiden from a config entry."""
    _LOGGER.warning("SportGuiden: async_setup_entry called")
    hass.data.setdefault(DOMAIN, {})

    # Fallback: if async_setup was skipped, register card here
    if not hass.data[DOMAIN].get("_cards_done"):
        _LOGGER.warning("SportGuiden: async_setup was skipped, registering in entry")
        await _register_card(hass)
        try:
            websocket_api.async_register_command(hass, ws_get_sources)
        except Exception:  # noqa: BLE001
            pass
        hass.data[DOMAIN]["_cards_done"] = True

    # Always fetch all available sources
    coordinator = SportguidenCoordinator(hass, AVAILABLE_SOURCES)
    await coordinator.async_config_entry_first_refresh()

    hass.data[DOMAIN][entry.entry_id] = {
        "coordinator": coordinator,
        "sources": sources,
    }

    # Set up sensor platform
    await hass.config_entries.async_forward_entry_setups(entry, ["sensor"])

    # Listen for options updates
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))

    return True


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update – reload integration."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, ["sensor"])
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok
