# Village deck defence Prototype – Tech Plan

## 1. Tech Stack & Overview

- **Framework**: Phaser 3  
- **Language**: TypeScript  
- **Config**: JSON files for all game data (cards, buildings, stickers, adventures, invasion)  
- **Storage**: `localStorage` for progress (deck state, buildings, stickers, invasion distance)  
- **Analytics**: Google Analytics 4 + Google Tag Manager  

## 2. Project Folder Structure

```
sticker-village/
├─ assets/
│  ├─ images/
│  ├─ spritesheets/
│  └─ ui/
├─ src/
│  ├─ scenes/
│  │  ├─ BootScene.ts
│  │  ├─ LevelSelectScene.ts
│  │  └─ GameScene.ts
│  ├─ config/
│  │  ├─ cards.json
│  │  ├─ buildings.json
│  │  ├─ stickers.json
│  │  ├─ adventures.json
│  │  └─ invasion.json
│  ├─ entities/
│  │  ├─ Card.ts
│  │  ├─ Building.ts
│  │  ├─ Sticker.ts
│  │  └─ Adventure.ts
│  ├─ services/
│  │  ├─ ConfigLoader.ts
│  │  ├─ StorageService.ts
│  │  ├─ AnalyticsService.ts
│  │  ├─ CardDeck.ts
│  │  ├─ ConstructionService.ts
│  │  ├─ InventionService.ts
│  │  └─ AdventureService.ts
│  ├─ ui/
│  │  ├─ HandUI.ts
│  │  ├─ DeckUI.ts
│  │  └─ MenuUI.ts
│  ├─ utils/
│  │  └─ Helpers.ts
│  ├─ game.ts
│  └─ index.html
├─ tsconfig.json
├─ package.json
└─ README.md
```

## 3. JSON Config Example

Below is a sample `cards.json` entry for one card:

```json
[
  {
    "id": "card_001",
    "name": "Elven Archer",
    "race": "Elf",
    "baseTracks": {
      "power": 2,
      "construction": 0,
      "invention": 1
    },
    "startingStickers": {
      "power": ["sticker_slot_dark","sticker_slot_dark","sticker_slot_dark","sticker_slot_dark"],
      "construction": ["sticker_slot_dark","sticker_slot_dark","sticker_slot_dark"],
      "invention": ["sticker_slot_dark","sticker_slot_dark","sticker_slot_dark","sticker_slot_dark"]
    },
    "maxSlots": {
      "power": 4,
      "construction": 3,
      "invention": 4
    }
  }
]
```

## 4. Step-by-Step Implementation Plan

Each step is a discrete feature for the developer to implement, test, then move on.

| Step | Feature                                                                        |
|:----:|:-------------------------------------------------------------------------------|
| 1     | **Project Setup**  
Initialize Phaser 3 + TypeScript project. Install deps (`phaser`, types, GA4/GTM libs). Confirm webpack/parcel build. |
| 2     | **Boot Scene & Config Loader**  
– Create `BootScene.ts` that preloads essential assets (UI textures, sprites).  
– Implement `ConfigLoader` to fetch `*.json` from `/src/config`. |
| 3     | **Level Select Scene**  
– Create `LevelSelectScene.ts`.  
– Display a “Play Game” button that transitions to `GameScene`. |
| 4     | **Game Scene Skeleton**  
– Create `GameScene.ts` stub.  
– On scene start, load configs via `ConfigLoader`. |
| 5     | **Deck & Hand Mechanics**  
– Build `Card` entity class.  
– Load `cards.json` into a `Deck` class.  
– Implement draw (5 cards) and render via `HandUI`. |
| 6     | **Shuffle Button & Cycle**  
– Add “Shuffle” button; disable auto-shuffle.  
– When clicked, move discard→deck, reset discard, increment “day”. |
| 7     | **Resource Tracks**  
– Extend `Card` to expose `power`, `construction`, `invention` values (plus stickers).  
– Render resource totals on UI. |
| 8     | **Play/Discard Cards**  
– Enable player to click a card in hand and choose “Use for X” or “Discard”.  
– On play, deduct from hand → discard, accumulate resource. |
| 9     | **Construction Menu**  
– Load `buildings.json` to `Building` entities.  
– “Architect Bureau” button opens `MenuUI` listing buildings.  
– Allow selecting cards for construction cost and, if enough, build (persist in game state). |
| 10    | **Invention Menu**  
– Load `stickers.json`.  
– “Workshop” opens sticker marketplace.  
– Spend invention resource, then prompt to apply or store (if Storage built). |
| 11    | **Adventure Menu**  
– Load `adventures.json` decks.  
– “Adventure Guild” opens difficulty selector.  
– Select cards, draw random adventure card, compare power, award one reward choice (new cards, invasion delay, stickers). |
| 12    | **Sticker Application**  
– Enforce slot limits from card config.  
– Wild stickers always apply. Overwrite existing sticker slot when re-applied. |
| 13    | **Invasion Tracker**  
– Load `invasion.json` (distance = 100 km, speed = 10 km/day).  
– On shuffle, advance tracker; UI bar showing distance remaining; apply delays from actions. |
| 14    | **Local Storage Save/Load**  
– Serialize deck, discard, buildings, stickers, invasion distance to `localStorage` on scene shutdown.  
– Load on game start. |
| 15    | **Analytics Integration**  
– Hook `AnalyticsService` to send events: card played, building built, sticker applied, adventure completed, shuffle. Configure GA4 via GTM. |
| 16    | **Polish & UI**  
– Add asset placeholders, tooltips, animations.  
– Test across screen sizes. |

## 5. Services Layer

```
src/services/
├─ ConfigLoader.ts
├─ StorageService.ts
├─ AnalyticsService.ts
├─ CardDeck.ts
├─ ConstructionService.ts
├─ InventionService.ts
└─ AdventureService.ts
```

### Service Responsibilities

- **CardDeck.ts**  
  - Initialize deck/discard from `cards.json` + saved state  
  - `drawHand(count)`: remove N cards from deck to hand  
  - `discardCard(card)`: move a card from hand/play into discard  
  - `shuffle()`: shuffle discard into deck, emit “day advanced”  
  - `getCounts()`: expose `deckSize`, `discardSize`  

- **ConstructionService.ts**  
  - `canConstruct(buildingId, selectedCards)`: verify combined construction ≥ cost  
  - `construct(buildingId, selectedCards)`: deduct resources, add building to state  
  - `applyBuildingEffects(building)`: update global modifiers  

- **InventionService.ts**  
  - `canPurchase(stickerId, selectedCards)`: check invention resource  
  - `purchase(stickerId, targetCardId?)`: deduct resource, attach or store sticker  
  - `handleStorage()`: enforce storage-building limits  

- **AdventureService.ts**  
  - `startAdventure(difficulty, selectedCards)`: draw random challenge card  
  - `resolveAdventure(challengeCard, selectedCards)`: compare power, choose reward  
  - `applyReward(reward, target?)`: add new cards, delay invasion, issue stickers  
