"""Config flow for SportGuiden integration."""
from __future__ import annotations

from homeassistant import config_entries

from .const import DOMAIN


class SportguidenConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for SportGuiden."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Single-step setup — no configuration needed."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            return self.async_create_entry(title="SportGuiden", data={})

        return self.async_show_form(step_id="user")
