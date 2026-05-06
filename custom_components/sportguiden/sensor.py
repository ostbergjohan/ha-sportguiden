"""Sensor platform for SportGuiden integration."""
from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import SportguidenCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up SportGuiden sensor from a config entry."""
    data = hass.data[DOMAIN][entry.entry_id]
    coordinator: SportguidenCoordinator = data["coordinator"]

    async_add_entities([SportguidenSensor(coordinator, entry)])


class SportguidenSensor(CoordinatorEntity, SensorEntity):
    """Sensor that holds all SportGuiden data as attributes."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: SportguidenCoordinator,
        entry: ConfigEntry,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._entry = entry
        self._attr_unique_id = f"{DOMAIN}_{entry.entry_id}"
        self._attr_name = "SportGuiden"
        self._attr_icon = "mdi:trophy"

    @property
    def native_value(self) -> int | None:
        """Return total number of events as the sensor value."""
        if self.coordinator.data:
            return self.coordinator.data.get("total_count", 0)
        return 0

    @property
    def extra_state_attributes(self) -> dict:
        """Return all sport data as attributes for the Lovelace card."""
        if not self.coordinator.data:
            return {}
        return {
            "sources": self.coordinator.data.get("sources", {}),
            "all_events": self.coordinator.data.get("all_events", []),
            "configured_sources": self.coordinator.data.get("configured_sources", []),
            "date": self.coordinator.data.get("date", ""),
        }

    @property
    def device_info(self):
        """Return device info so it shows up under Devices & Services."""
        return {
            "identifiers": {(DOMAIN, self._entry.entry_id)},
            "name": "SportGuiden",
            "manufacturer": "tv.nu",
            "model": "Sport TV Listings",
            "entry_type": "service",
        }
