import Phaser from 'phaser';
import { BuildingSlot, BuildingSlotLocation } from '../entities/Building';
import { Card } from '../entities/Card';
import { PlayerHand } from '../entities/PlayerHand';
import { trackEvent } from '../game';
import { BuildingRegistry } from '../services/BuildingRegistry';
import { BuildingService } from '../services/BuildingService';
import { CardRegistry } from '../services/CardRegistry';
import { DeckService } from '../services/DeckService';
import { InvasionService } from '../services/InvasionService';
import { RecruitService } from '../services/RecruitService';
import { ResourceService } from '../services/ResourceService';
import { StickerShopService } from '../services/StickerShopService';
import { TavernService } from '../services/TavernService';
import { GameUI } from '../ui/GameUI';
import { PlayerHandRenderer } from '../ui/PlayerHandRenderer';

interface GameConfig {
  // Global game settings
  player_hand_size: number;
  invasion_speed_per_turn: number;
  
  id?: string;
  name?: string;
  description?: string;
  starting_cards: Array<Record<string, number>>;
  invasion_distance: number;
  invasion_difficulty: number;
  building_slot_locations: Array<BuildingSlotLocation>;
  building_slots: Array<BuildingSlot>;
  deck_limit: number;
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
  private recruitService!: RecruitService;
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
    this.load.json('levelsConfig', 'config/levels.json');
  }

  create(): void {
    // Load configs
    this.loadConfigurations();
    
    this.invasionService = this.createInvasionService();
    this.resourceService = this.createResourceService();
    this.buildingService = this.createBuildingsService();
    this.resourceService.setBuildingService(this.buildingService);
    this.playerDeck = this.createPlayerDeck();
    this.tavernService = this.createTavernService();
    this.stickerShopService = new StickerShopService();
    this.recruitService = this.createRecruitService();

    // Initialize the player hand UI
    this.playerHandRenderer = this.createPlayerHandUI();
    
    // Initialize the UI manager with player hand renderer
    this.gameUI = new GameUI(
      this, 
      this.buildingService, 
      this.resourceService, 
      this.stickerShopService,
      this.playerHandRenderer,
      this.playerDeck,
      this.invasionService,
      this.tavernService,
      this.recruitService
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
  private createInvasionService(): InvasionService {
    const invasionService = new InvasionService(
      this.gameConfig.invasion_distance,
      this.gameConfig.invasion_speed_per_turn,
      this.gameConfig.invasion_difficulty
    );

    return invasionService;
  }
  
  /**
   * Initialize the resource service
   */
  private createResourceService(): ResourceService {
    const resourceService = new ResourceService();
    return resourceService;
  }
  
  /**
   * Initialize the player's deck based on level config
   */
  private createPlayerDeck(): DeckService<Card> {
    // Create the player hand first
    this.playerHand = new PlayerHand(
      null as any, // Will be set after deck creation
      this.gameConfig.player_hand_size,
      this.resourceService
    );

    // Create the deck with the hand reference
    const playerDeck = new DeckService<Card>(
      [], 
      true, 
      this.gameConfig.deck_limit,
      this.playerHand
    );
    
    // Set the deck reference in the hand
    this.playerHand['_deckService'] = playerDeck;
    
    const startingCards = this.gameConfig.starting_cards
    startingCards.forEach(cardEntry => {
      const cardId = Object.keys(cardEntry)[0];
      const count = cardEntry[cardId];
      
      for (let i = 0; i < count; i++) {
        const card = this.cardRegistry.createCardInstance(cardId);
        if (card) {
          playerDeck.addToDeck(card, 'bottom');
        }
      }
    });

    // Shuffle the deck
    playerDeck.shuffle();
    
    // Draw initial cards
    this.playerHand.drawUpToLimit();

    return playerDeck;
  }
  
  /**
   * Initialize the player hand UI
   */
  private createPlayerHandUI(): PlayerHandRenderer {
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
    const renderer = new PlayerHandRenderer(
      this,
      this.playerHand,
      dimensions.x,
      dimensions.y,
      dimensions.width,
      dimensions.height,
      this.invasionService,
      this.resourceService,
      this.stickerShopService,
      this.buildingService,
      this.tavernService,
      this.recruitService
    );
    
    // Initialize and render the hand
    renderer.init();

    return renderer;
  }
  
  /**
   * Initialize the tavern service
   */
  private createTavernService(): TavernService {
    const tavernService = new TavernService(
      this.cardRegistry, 
      this.resourceService, 
      this.playerDeck
    );

    return tavernService;
  }
  
  /**
   * Initialize buildings
   */
  private createBuildingsService(): BuildingService {
    // Use the required building slots and locations from config
    const { building_slots, building_slot_locations } = this.gameConfig;
    
    // Create BuildingService with slots and locations
    const buildingService = new BuildingService(
      building_slots, 
      building_slot_locations,
      this.resourceService
    );

    return buildingService;
  }
  
  /**
   * Initialize the recruit service
   */
  private createRecruitService(): RecruitService {
    const recruitService = new RecruitService(
      this.buildingService,
      this.cardRegistry,
      this.playerDeck,
      this.resourceService
    );

    return recruitService;
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