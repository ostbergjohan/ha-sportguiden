"""Config flow for SportGuiden integration."""
from __future__ import annotations

import voluptuous as vol

from homeassistant import config_entries
import homeassistant.helpers.config_validation as cv

from .const import DOMAIN, AVAILABLE_SOURCES, CONF_SOURCES


class SportguidenConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for SportGuiden."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Show a form where the user picks which sports to scrape."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            selected = user_input.get(CONF_SOURCES, [])
            if not selected:
                selected = ["all"]
            return self.async_create_entry(
                title="SportGuiden",
                data={CONF_SOURCES: selected},
            )

        # Build multi-select options: {id: name}
        source_options = {s["id"]: s["name"] for s in AVAILABLE_SOURCES}

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_SOURCES,
                    default=["all"],
                ): cv.multi_select(source_options),
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
        )

    @staticmethod
    def async_get_options_flow(config_entry):
        """Return the options flow handler."""
        return SportguidenOptionsFlow(config_entry)


class SportguidenOptionsFlow(config_entries.OptionsFlow):
    """Handle options for SportGuiden (reconfigure sources)."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        """Manage the SportGuiden options."""
        if user_input is not None:
            selected = user_input.get(CONF_SOURCES, [])
            if not selected:
                selected = ["all"]
            self.hass.config_entries.async_update_entry(
                self.config_entry,
                data={**self.config_entry.data, CONF_SOURCES: selected},
            )
            await self.hass.config_entries.async_reload(self.config_entry.entry_id)
            return self.async_create_entry(title="", data={})

        current = self.config_entry.data.get(CONF_SOURCES, ["all"])
        source_options = {s["id"]: s["name"] for s in AVAILABLE_SOURCES}

        schema = vol.Schema(
            {
                vol.Required(
                    CONF_SOURCES,
                    default=current,
                ): cv.multi_select(source_options),
            }
        )

        return self.async_show_form(
            step_id="init",
            data_schema=schema,
        )
