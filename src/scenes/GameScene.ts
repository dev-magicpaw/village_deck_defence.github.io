import Phaser from 'phaser';
import { PlayerHand } from '../entities/PlayerHand';
import { trackEvent } from '../game';
import { CardRegistry } from '../services/CardRegistry';
import { DeckService } from '../services/DeckService';
import { InvasionService } from '../services/InvasionService';
import { Card } from '../types/game';
import { GameUI } from '../ui/GameUI';
import { PlayerHandRenderer } from '../ui/PlayerHandRenderer';

interface GameConfig {
  starting_cards: Array<Record<string, number>>;
  player_hand_size: number;
  invasion_speed_per_turn: number;
  invasion_distance: number;
  invasion_difficulty: number;
}

export class GameScene extends Phaser.Scene {
  private gameUI!: GameUI;
  private playerDeck!: DeckService<Card>;
  private playerHand!: PlayerHand;
  private playerHandRenderer!: PlayerHandRenderer;
  private invasionService!: InvasionService;
  private gameConfig!: GameConfig;
  private cardRegistry!: CardRegistry;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Load game configuration
    this.load.json('gameConfig', 'config/game.json');
    this.load.json('cardsConfig', 'config/cards.json');
  }

  create(): void {
    // Load configs
    this.loadConfigurations();
    
    // Initialize the invasion service
    this.initializeInvasionService();
    
    // Initialize the deck and hand
    this.initializePlayerDeck();
    
    // Initialize the UI manager
    this.gameUI = new GameUI(this);
    
    // Create UI panels (except player hand which is handled separately)
    this.gameUI.createUI();
    
    // Initialize the player hand UI
    this.initializePlayerHandUI();
    
    // Track scene load for analytics
    trackEvent('scene_enter', {
      event_category: 'navigation',
      event_label: 'game_scene'
    });
  }
  
  /**
   * Load game configurations
   */
  private loadConfigurations(): void {
    // Get the game config
    this.gameConfig = this.cache.json.get('gameConfig');
    
    // Initialize the card registry
    this.cardRegistry = CardRegistry.getInstance();
    this.cardRegistry.loadCards(this.cache.json.get('cardsConfig'));
  }
  
  /**
   * Initialize the invasion service
   */
  private initializeInvasionService(): void {
    this.invasionService = new InvasionService(
      this.gameConfig.invasion_distance,
      this.gameConfig.invasion_speed_per_turn
    );
  }
  
  /**
   * Initialize the player's deck based on game config
   */
  private initializePlayerDeck(): void {
    // Create empty deck service
    this.playerDeck = new DeckService<Card>();
    
    // Populate the deck based on starting_cards in config
    this.gameConfig.starting_cards.forEach(cardEntry => {
      // Each entry is like: {"card_elven_apprentice": 1}
      const cardId = Object.keys(cardEntry)[0];
      const count = cardEntry[cardId];
      
      for (let i = 0; i < count; i++) {
        // Use the new createCardInterface method
        const card = this.cardRegistry.createCardInterface(cardId);
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
    // Get hand panel dimensions from UI manager
    const dimensions = this.gameUI.getHandPanelDimensions();
    
    // Create the hand renderer
    this.playerHandRenderer = new PlayerHandRenderer(
      this,
      this.playerHand,
      dimensions.x,
      dimensions.y,
      dimensions.width,
      dimensions.height,
      this.invasionService
    );
    
    // Initialize and render the hand
    this.playerHandRenderer.init();
    this.playerHandRenderer.render();
  }
} 