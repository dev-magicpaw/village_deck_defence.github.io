import Phaser from 'phaser';
import { Card } from '../entities/Card';
import { PlayerHand } from '../entities/PlayerHand';
import { trackEvent } from '../game';
import { BuildingRegistry } from '../services/BuildingRegistry';
import { BuildingService } from '../services/BuildingService';
import { CardRegistry } from '../services/CardRegistry';
import { DeckService } from '../services/DeckService';
import { InvasionService } from '../services/InvasionService';
import { RecruitCardRegistry } from '../services/RecruitCardRegistry';
import { ResourceService } from '../services/ResourceService';
import { StickerShopService } from '../services/StickerShopService';
import { TavernService } from '../services/TavernService';
import { GameUI } from '../ui/GameUI';
import { PlayerHandRenderer } from '../ui/PlayerHandRenderer';

// TODO: move this into Building.ts
// TODO: each building slot should have a unique id, uuid4
interface BuildingSlot {
  id: string;
  already_constructed: string | null;
  available_for_construction: string[];
}

// TODO: move this into Building.ts
interface BuildingSlotLocation {
  x: number;
  y: number;
  slot_id: string;
}

interface GameConfig {
  // Global game settings
  player_hand_size: number;
  invasion_speed_per_turn: number;
  
  // Level-specific settings (can be overridden by level config)
  id?: string;
  name?: string;
  description?: string;
  starting_cards: Array<Record<string, number>>;
  invasion_distance: number;
  invasion_difficulty: number;
  building_slot_locations?: Array<BuildingSlotLocation>;
  building_slots?: Array<BuildingSlot>;
}

export class GameScene extends Phaser.Scene {
  private gameUI!: GameUI;
  private playerDeck!: DeckService<Card>;
  private playerHand!: PlayerHand;
  private playerHandRenderer!: PlayerHandRenderer;
  private invasionService!: InvasionService;
  private resourceService!: ResourceService;
  private gameConfig!: GameConfig;
  private cardRegistry!: CardRegistry;
  private buildingRegistry!: BuildingRegistry;
  private buildingService!: BuildingService;
  private tavernService!: TavernService;
  private stickerShopService!: StickerShopService;
  private recruitCardRegistry!: RecruitCardRegistry;
  private levelId: string = 'level_1'; // Default level ID

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { levelId: string }): void {
    if( !data || !data.levelId ) {
      throw new Error('Level ID is required');
    }

    this.levelId = data.levelId;
  }

  preload(): void {
    // Load game configuration
    this.load.json('gameConfig', 'config/game.json');
    this.load.json('cardsConfig', 'config/cards.json');
    this.load.json('buildingsConfig', 'config/buildings.json');
    this.load.json('recruitCardsConfig', 'config/recruit_cards.json');
    this.load.json('levelsConfig', 'config/levels.json');
  }

  create(): void {
    // Load configs
    this.loadConfigurations();
    
    // Initialize the invasion service
    this.initializeInvasionService();
    
    // Initialize the resource service
    this.initializeResourceService();
    
    // Initialize the deck and hand
    this.initializePlayerDeck();
    
    // Initialize buildings
    this.buildingService = new BuildingService();
    
    // Pass the config data directly to ensure it has access to the building slots
    // TODO these should be passed in the BuildingService constructor
    const buildingSlots = this.gameConfig.building_slots || [];
    // TODO these should be passed in the BuildingDisplayRenderer constructor
    const buildingSlotLocations = this.gameConfig.building_slot_locations || [];
    
    // Manually set the building slots before initializing
    this.buildingService.setBuildingSlots(buildingSlots, buildingSlotLocations);
    this.buildingService.initializeBuildings();
    
    // Initialize the tavern service
    this.initializeTavernService();
    
    // Initialize the sticker shop service
    this.stickerShopService = new StickerShopService();
    
    // Initialize the player hand UI first so we can pass it to the UI manager
    this.initializePlayerHandUI();
    
    // Initialize the UI manager with player hand renderer
    this.gameUI = new GameUI(
      this, 
      this.buildingService, 
      this.resourceService, 
      this.stickerShopService,
      this.playerHandRenderer,
      this.playerDeck,
      this.invasionService
    );
    
    // Create UI panels 
    this.gameUI.createUI();
    
    // Track scene load for analytics
    trackEvent('scene_enter', {
      event_category: 'navigation',
      event_label: 'game_scene',
      level_id: this.levelId
    });
  }
  
  /**
   * Load game configurations
   */
  private loadConfigurations(): void {
    // Get the base game config
    this.gameConfig = this.cache.json.get('gameConfig');
    
    // Load and merge the level-specific config
    this.loadLevelConfig();
    
    // Make the complete config available globally
    this.game.registry.set('gameConfig', this.gameConfig);
    
    // Initialize the card registry
    this.cardRegistry = CardRegistry.getInstance();
    this.cardRegistry.loadCards(this.cache.json.get('cardsConfig'));
    
    // Initialize the building registry
    this.buildingRegistry = BuildingRegistry.getInstance();
    this.buildingRegistry.loadBuildings(this.cache.json.get('buildingsConfig'));
    
    // Initialize the recruit card registry
    this.recruitCardRegistry = RecruitCardRegistry.getInstance();
    this.recruitCardRegistry.loadRecruitCards(this.cache.json.get('recruitCardsConfig'));
  }

  /**
   * Load the level configuration and merge it with the game config
   */
  private loadLevelConfig(): void {
    const levelsData = this.cache.json.get('levelsConfig');
    
    // Find the level config with matching ID
    const levelConfig = levelsData.find((level: any) => level.id === this.levelId);
    if (!levelConfig) {
      throw new Error(`Level config not found for level ID: ${this.levelId}`);
    }
  
    // Merge level config with game config (level settings override game settings)
    this.gameConfig = {
      ...this.gameConfig,
      ...levelConfig
    };
    
    // Make sure we're updating the registry with the complete config
    this.game.registry.set('gameConfig', this.gameConfig);
  }

  /**
   * Initialize the invasion service
   */
  private initializeInvasionService(): void {
    this.invasionService = new InvasionService(
      this.gameConfig.invasion_distance,
      this.gameConfig.invasion_speed_per_turn,
      this.gameConfig.invasion_difficulty
    );
  }
  
  /**
   * Initialize the resource service
   */
  private initializeResourceService(): void {
    this.resourceService = new ResourceService();
  }
  
  /**
   * Initialize the player's deck based on level config
   */
  private initializePlayerDeck(): void {
    // Create empty deck service
    this.playerDeck = new DeckService<Card>();
    
    const startingCards = this.gameConfig.starting_cards
    startingCards.forEach(cardEntry => {
      const cardId = Object.keys(cardEntry)[0];
      const count = cardEntry[cardId];
      
      for (let i = 0; i < count; i++) {
        const card = this.cardRegistry.createCardInstance(cardId);
        if (card) {
          this.playerDeck.addToDeck(card, 'bottom');
        }
      }
    });
    
    // Shuffle the deck
    this.playerDeck.shuffle();
    
    // Create the player hand
    this.playerHand = new PlayerHand(this.playerDeck, this.gameConfig.player_hand_size);
    
    // Draw initial cards
    this.playerHand.drawUpToLimit();
  }
  
  /**
   * Initialize the player hand UI
   */
  private initializePlayerHandUI(): void {
    // Get hand panel dimensions 
    const { width, height } = this.cameras.main;
    const panelHeight = height * GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION;
    const dimensions = {
      x: 0,
      y: height - panelHeight,
      width: width,
      height: panelHeight
    };
    
    // Create the hand renderer
    this.playerHandRenderer = new PlayerHandRenderer(
      this,
      this.playerHand,
      dimensions.x,
      dimensions.y,
      dimensions.width,
      dimensions.height,
      this.invasionService,
      this.resourceService,
      this.stickerShopService
    );
    
    // Initialize and render the hand
    this.playerHandRenderer.init();
  }
  
  /**
   * Initialize the tavern service
   */
  private initializeTavernService(): void {
    this.tavernService = TavernService.getInstance();
    this.tavernService.init(this.resourceService);
    this.tavernService.setDeckService(this.playerDeck);
  }
  
  /**
   * Update game state
   */
  update(): void {
    // Update UI components
    if (this.gameUI) {
      this.gameUI.update();
    }
    
    // Update player hand renderer
    if (this.playerHandRenderer) {
      this.playerHandRenderer.update();
    }
  }
} 