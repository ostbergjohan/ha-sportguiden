# Home Assistant Custom Card Registration – Komplett Guide

## Problem
Custom Lovelace cards hittas inte i Home Assistant (visar inte i typ-sökfältet när du lägger till kort).

**Symptom:**
- Kortet är installerat i `custom_components/*/www/`
- Frontend-resursen är registrerad i Python
- Men kortet syns inte när du försöker lägga till det i Lovelace

## Orsak
Custom elements registreras bara vid första sidladdningen. Om Home Assistant frontend reconnectar (t.ex. efter nätverksglipp, uppdatering, eller systemkollisioner), försvinner registreringen och kortet kan inte hittas längre.

## Fullständig Implementering

### Steg 1: Python Backend (`__init__.py`)

Så här registrerar du frontend-resursen i Python:

```python
"""Min Integration – Setup and registration."""
from __future__ import annotations

import logging
import pathlib

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

# Definierar URL-pathsen för kortet
_CARD_URL = f"/{DOMAIN}/mein-card.js"
_CARD_VERSION = "1"  # Öka versionen när du uppdaterar JS-filen


# ─── Frontend helpers ──────────────────────────────────────────────

async def _register_card(hass: HomeAssistant) -> None:
    """Registrera kortet som en statisk resurs och lägg till i frontend."""
    
    # Sökväg till www-mappen
    www_dir = pathlib.Path(__file__).parent / "www"
    js_path = str(www_dir / "mein-card.js")

    _LOGGER.warning("Registrerar kort från %s", js_path)

    registered = False
    
    # Try modern HA version (2023.11+)
    try:
        from homeassistant.components.http import StaticPathConfig

        await hass.http.async_register_static_paths(
            [StaticPathConfig(_CARD_URL, js_path, True)]
        )
        registered = True
    except (ImportError, AttributeError):
        # Fallback för äldre HA versioner
        try:
            hass.http.register_static_path(_CARD_URL, js_path, True)
            registered = True
        except Exception as err:
            _LOGGER.error("Registrering misslyckades (äldre API): %s", err)
    except Exception as err:
        _LOGGER.error("Registrering misslyckades: %s", err)

    if not registered:
        _LOGGER.error("Frontend-registrering misslyckades – kortet laddas INTE!")
        return

    # Lägg till i frontend med versionsnummer för cache-busting
    url = f"{_CARD_URL}?v={_CARD_VERSION}"
    add_extra_js_url(hass, url)
    _LOGGER.warning("Kort registrerat: %s", url)


# ─── Setup ─────────────────────────────────────────────────────────

async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """
    Initialisering av integrationen (kallas tidigt).
    Här registrerar vi frontend-resursen FÖRST.
    """
    _LOGGER.warning("async_setup() kallades")
    hass.data.setdefault(DOMAIN, {})

    # Registrera kortet innan config_entries
    await _register_card(hass)
    
    hass.data[DOMAIN]["_cards_done"] = True
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """
    Setup från config entry.
    Fallback om async_setup inte anropades.
    """
    _LOGGER.warning("async_setup_entry() kallades")
    hass.data.setdefault(DOMAIN, {})

    # Om async_setup inte kördes, gör det nu
    if not hass.data[DOMAIN].get("_cards_done"):
        _LOGGER.warning("async_setup skippades – registrerar i entry istället")
        await _register_card(hass)
        hass.data[DOMAIN]["_cards_done"] = True

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload entry."""
    return True
```

**Viktiga punkter i Python:**
- `_register_card()` är en async funktion som gör det tunga arbetet
- Försöker först moderna API:er, sedan fallback för gamla HA versioner
- `add_extra_js_url()` lägger till JS-filen i frontend
- Version-nummer (`?v=1`) tvingar cachning att uppdateras

---

### Steg 2: JavaScript Frontend (`www/mein-card.js`)

Så här registrerar du custom elements i JavaScript:

```javascript
/**
 * Mein Card – Custom Lovelace Card
 * Registrering av custom elements med support för HA reconnect
 */

// Definierar dina klasser här
class MeinCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  // ... resten av din card implementation
}

class MeinCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  // ... resten av din editor implementation
}

// ─── VIKTIGT: Registrera med IIFE + reconnect listener ──────────────

(function() {
  function registerCards() {
    // Registrera custom elements
    try {
      if (!customElements.get("mein-card")) {
        customElements.define("mein-card", MeinCard);
      }
      if (!customElements.get("mein-card-editor")) {
        customElements.define("mein-card-editor", MeinCardEditor);
      }
    } catch (err) {
      console.error("Mein: Registrering av custom elements misslyckades:", err);
      return;
    }

    // Registrera i HA:s custom cards registry
    window.customCards = window.customCards || [];
    if (!window.customCards.find(c => c.type === "mein-card")) {
      window.customCards.push({
        type: "mein-card",           // Måste matcha custom element name
        name: "Mein Card",           // Visas i UI
        description: "Min kort",     // Visas i UI
        preview: true,               // Visar förhandsvisning
        documentationURL: "https://github.com/example/mein-card",
      });
    }

    console.info(
      "%c MEIN-CARD %c v1.0 loaded",
      "color:white;background:#667eea;font-weight:700;padding:2px 6px",
      ""
    );
  }

  // Registrera när sidan laddar
  registerCards();

  // RE-REGISTRERA när HA frontend reconnectar
  window.addEventListener("connection-status", function(e) {
    if (e.detail === "connected") {
      // Liten delay för att låta HA frontend starta upp helt
      setTimeout(registerCards, 100);
    }
  });
})();
```

**Viktiga punkter i JavaScript:**

1. **IIFE (Omedelbar funktion)**: `(function() { ... })()`
   - Skapar egen scope så du inte pollerar global namespace
   - Undviker konflikter med andra kort

2. **Separat `registerCards()` funktion**
   - Kan anropas flera gånger
   - Anropas både vid första laddningen OCH vid reconnect

3. **`connection-status` event listener**
   ```javascript
   window.addEventListener("connection-status", function(e) {
     if (e.detail === "connected") {
       setTimeout(registerCards, 100);
     }
   });
   ```
   - Fires när HA frontend reconnectar
   - Timeout på 100ms för att undvika race conditions

4. **`window.customCards` array**
   - HA använder denna för att hitta dina kort
   - Måste finnas även vid reconnect

---

## Lösning

### ✅ Rätt sätt att registrera custom elements

Slut på detta pattern:
```javascript
// ❌ DÅLIGT - Registreras bara vid första laddningen
try {
  if (!customElements.get("mein-card")) {
    customElements.define("mein-card", MeinCard);
  }
} catch (err) {
  console.error("Failed to register:", err);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === "mein-card")) {
  window.customCards.push({
    type: "mein-card",
    name: "Mein Card",
    description: "...",
  });
}
```

Börja med detta pattern istället:

```javascript
// ✅ RÄTT - Registreras vid start OCH vid reconnect
(function() {
  function registerCards() {
    try {
      if (!customElements.get("mein-card")) {
        customElements.define("mein-card", MeinCard);
      }
      if (!customElements.get("mein-card-editor")) {
        customElements.define("mein-card-editor", MeinCardEditor);
      }
    } catch (err) {
      console.error("Failed to register custom elements:", err);
      return;
    }

    window.customCards = window.customCards || [];
    if (!window.customCards.find(c => c.type === "mein-card")) {
      window.customCards.push({
        type: "mein-card",
        name: "Mein Card",
        description: "Min beskrivning",
        preview: true,
        documentationURL: "https://github.com/example/mein-card",
      });
    }

    console.info("✅ mein-card v1.0 loaded");
  }

  // Registrera omedelbar
  registerCards();

  // RE-REGISTRERA vid HA frontend reconnect
  window.addEventListener("connection-status", function(e) {
    if (e.detail === "connected") {
      // Liten delay för att låta HA frontend starta upp
      setTimeout(registerCards, 100);
    }
  });
})();
```

## Key Points

1. **IIFE (Omedelbar funktion)**: Wrappa koden i `(function() { ... })()`
   - Skapar egen scope
   - Undviker globala variabelkonflikter

2. **Separate function**: Extrakt registreringen till `registerCards()`
   - Kan anropas flera gånger
   - Gör koden DRY (Don't Repeat Yourself)

3. **Connection-status event**: Lyssna på `window.addEventListener("connection-status", ...)`
   - Fires när HA frontend reconnectar
   - Omregistrera kortet för att det ska hittas igen

4. **Timeout**: Använd `setTimeout(registerCards, 100)` på reconnect
   - Låter HA frontend slutföra sin setup först
   - Undviker race conditions

## Checklista för din integration

- [ ] Kortet är inslaget i en IIFE `(function() { ... })()`
- [ ] Registreringen är i en separat `registerCards()` funktion
- [ ] `connection-status` event listener är tillagd
- [ ] Båda kortet OCH editorn registreras
- [ ] `window.customCards` push-logiken är med
- [ ] `preview: true` är satt (visar förhandsvisning vid val)
- [ ] Dokumentation URL är med (länk till GitHub)

## Testing

Efter att du implementerat detta:

1. Installera/uppdatera integrationen i Home Assistant
2. Gå till ett dashboard
3. Klicka "+ Lägg till kort"
4. Sök på ditt korts namn
5. Det bör synas i listan

Om det inte syns:
- Öppna Browser DevTools (F12)
- Kolla Console för errors
- Kontrollera att filen faktiskt laddar (Network tab)
- Starta om browsern/HA

## Exempel från fungerade integrations

Se dessa i repositoriet för referens:
- `fotbollstabeller-card.js` - Fungerar korrekt med connection-status listener
- `sportguiden-card.js` - Uppdaterad med samma pattern
