
# Sticker Village / Village Deck Defence Prototype Project Plan

## Tech Overview

- **Framework:** Phaser 3 + TypeScript
- **Configuration:** JSON files for all game entities (cards, buildings, adventures, stickers, settings)
- **Storage:** `localStorage` via a wrapper utility
- **Analytics:** GA4 & Google Tag Manager snippets in `index.html`
- **Hosting:** GitHub Pages (deploy to `gh-pages` branch via CI)

---

## Example JSON Config

```json
// src/config/cards.json
[
  {
    "id": "card_elf_scout",
    "name": "Elf Scout",
    "race": "Elf",
    "tracks": { "power": 2, "construction": 0, "invention": 1 },
    "slots": { "power": 4, "construction": 3, "invention": 4 },
    "startingStickers": [
      { "type": "Power", "value": 1, "slotIndex": 0 }
    ]
  },
  {
    "id": "card_dwarf_builder",
    "name": "Dwarf Builder",
    "race": "Dwarf",
    "tracks": { "power": 1, "construction": 3, "invention": 0 },
    "slots": { "power": 4, "construction": 3, "invention": 4 },
    "startingStickers": []
  }
]
```

---

## Project Folder Structure

```
sticker-village/
│
├─ public/
│   └─ index.html                # HTML shell + GTM/GA4 snippets
│
├─ src/
│   ├─ assets/
│   │   ├─ images/
│   │   └─ sprites/
│   │
│   ├─ config/                   # JSON game data
│   │   ├─ cards.json
│   │   ├─ buildings.json
│   │   ├─ adventures.json
│   │   ├─ stickers.json
│   │   └─ settings.json         # invasion distances, steps
│   │
│   ├─ scenes/
│   │   ├─ BootScene.ts
│   │   ├─ LevelSelectScene.ts
│   │   └─ GameScene.ts
│   │
│   ├─ ui/                       # reusable UI components
│   │   ├─ Button.ts
│   │   └─ Modal.ts
│   │
│   ├─ utils/
│   │   ├─ Storage.ts            # localStorage wrapper
│   │   ├─ Analytics.ts          # GA4/GTM helper
│   │   └─ ConfigLoader.ts       # JSON loader
│   │
│   ├─ types/
│   │   └─ game.d.ts             # TS interfaces for Card, Building, Adventure, Sticker
│   │
│   ├─ index.ts                  # bootstraps Phaser game
│   └─ phaser.d.ts               # Phaser typings
│
├─ tsconfig.json
├─ package.json
└─ README.md
```

---

## Step-by-Step Implementation Plan

1. **Project Setup**  
   - `npm init` + configure TypeScript (`tsconfig.json`)  
   - Install Phaser 3 and types (`npm install phaser @types/phaser`)  
   - Scaffold `public/index.html` with canvas container and GA4/GTM snippets

2. **BootScene & Asset Loading**  
   - Create `BootScene.ts`  
   - Load JSON configs via `ConfigLoader`  
   - Preload UI sprites and button assets

3. **Level Select Scene**  
   - Implement `LevelSelectScene.ts` with a “Play Game” button  
   - Wire button to start `GameScene`

4. **GameScene Skeleton**  
   - Initialize game state (deck, discard, invasion tracker) from `settings.json`  
   - Render UI layers: hand zone, action bar, invasion progress

5. **Type Definitions & Config Loader**  
   - Define interfaces in `game.d.ts` for all entities  
   - Implement `ConfigLoader.ts` to fetch and parse JSON files

6. **Deck & Hand Mechanics**  
   - Load `cards.json` into `deck: Card[]`  
   - Shuffle & draw initial 5 cards into `hand: Card[]`  
   - Render cards in hand zone as interactive sprites  
   - Add “Shuffle” button to reshuffle discard into deck and advance invasion

7. **Card Track UI**  
   - Overlay each card with its Power, Construction, Invention values and slot indicators

8. **Construction Action**  
   - Load `buildings.json` and render in Architect Bureau modal  
   - Allow selecting cards from hand, check total Construction ≥ cost  
   - On construct: discard used cards, add building to game state

9. **Invention Action**  
   - Load `stickers.json` in Workshop modal  
   - Select cards, verify Invention ≥ cost  
   - Purchase: if Storage built & free → choice to store or apply  
   - Apply: attach sticker data to chosen card slot

10. **Adventure Action**  
    - Load `adventures.json` (decks & rewards)  
    - Adventure Guild modal: choose difficulty + cards  
    - Draw random adventure card, compare against cards’ Power sum  
    - On win: present reward options (cards, stickers, invasion delay) and process selection

11. **Sticker Rules Enforcement**  
    - Track-specific vs wild slot logic  
    - Highlight valid slots/UI during apply  
    - Allow trashing new stickers

12. **Invasion Tracker**  
    - Visual bar from 0 → threshold (e.g., 100 km)  
    - Advance per shuffle by `settings.invasionStepKm`; delays subtract (min 0)

13. **Endgame / Final Battle**  
    - Trigger when invasion ≥ threshold  
    - Calculate total Power from deck + stickers  
    - Show victory or defeat outcome

14. **Save & Load**  
    - Implement `Storage.ts` to serialize `gameState` after each turn  
    - On boot: detect existing save → prompt Resume or New Game

15. **Analytics Integration**  
    - Use `Analytics.ts` to send events: shuffle, construct, adventure, sticker apply  
    - Verify dataLayer pushes for GTM

16. **Polish & Deployment**  
    - Responsive scaling, UI/UX touches, optimize assets  
    - Configure GitHub Actions to build and deploy to `gh-pages`

---

*End of plan.*
