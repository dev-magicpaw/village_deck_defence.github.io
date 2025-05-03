import Phaser from 'phaser';
import { Building } from '../entities/Building';
import { PlayerHand } from '../entities/PlayerHand';
import { BuildingService } from '../services/BuildingService';
import { DeckService } from '../services/DeckService';
import { ResourceService } from '../services/ResourceService';
import { StickerShopService } from '../services/StickerShopService';
import { CARD_HEIGHT, CARD_WIDTH } from './CardRenderer';
import { PlayerHandRenderer } from './PlayerHandRenderer';
import { StickerShopRenderer } from './StickerShopRenderer';

/**
 * Component that renders the constructed buildings in the main display area
 */
export class BuildingsDisplayRenderer {
  private scene: Phaser.Scene;
  private buildingService: BuildingService;
  private displayContainer: Phaser.GameObjects.Container;
  private buildings: Building[] = [];
  private buildingCards: Phaser.GameObjects.Container[] = [];
  private stickerShopRenderer: StickerShopRenderer | null = null;
  private stickerShopBuildingId: string = '';
  private resourceService: ResourceService;
  private stickerShopService: StickerShopService;
  private playerHandRenderer: PlayerHandRenderer;
  private deckService: DeckService;
  
  // Card visual properties
  private cardWidth: number = CARD_WIDTH;
  private cardHeight: number = CARD_HEIGHT;
  private cardSpacing: number = 30;
  private panelMarginX: number = 30;
  private panelMarginY: number = 30;
  
  // Panel dimensions and position
  private panelX: number;
  private panelY: number;
  private panelWidth: number;
  private panelHeight: number;
  
  /**
   * Create a new buildings display renderer
   * @param scene The Phaser scene to render in
   * @param buildingService The building service to get buildings from
   * @param panelX X position of the panel
   * @param panelY Y position of the panel
   * @param panelWidth Width of the panel
   * @param panelHeight Height of the panel
   * @param resourceService Resource service for tracking resources
   * @param stickerShopService Sticker shop service for managing the shop state
   * @param playerHandRenderer Player hand renderer for card selection
   * @param deckService Deck service for managing the player's deck
   */
  constructor(
    scene: Phaser.Scene,
    buildingService: BuildingService,
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
    resourceService: ResourceService,
    stickerShopService: StickerShopService,
    playerHandRenderer: PlayerHandRenderer,
    deckService: DeckService
  ) {
    this.scene = scene;
    this.buildingService = buildingService;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.resourceService = resourceService;
    this.stickerShopService = stickerShopService;
    this.playerHandRenderer = playerHandRenderer;
    this.deckService = deckService;
    
    // Create a container to hold all building cards
    this.displayContainer = this.scene.add.container(0, 0);
  }
  
  /**
   * Helper function to get PlayerHand from the PlayerHandRenderer
   */
  private getPlayerHandFromRenderer(): PlayerHand | null {
    if (this.playerHandRenderer && 'playerHand' in this.playerHandRenderer) {
      return (this.playerHandRenderer as any).playerHand;
    }
    return null;
  }

  /**
   * Initialize the component and load the shop if needed
   */
  public init(): void {
    // Try to get the game config from the registry
    let gameConfig = this.scene.game.registry.get('gameConfig');
    if (!gameConfig) {
      throw new Error('Game config not found in registry');
    }
        
    this.stickerShopBuildingId = gameConfig.sticker_shop_building_id;
    
    // Create the sticker shop renderer with exact same dimensions
    if (!this.stickerShopRenderer) {
      this.stickerShopRenderer = new StickerShopRenderer(
        this.scene,
        this.panelX,
        this.panelY,
        this.panelWidth,
        this.panelHeight,
        this.resourceService,
        this.stickerShopService,
        this.playerHandRenderer,
        this.deckService
      );
      this.stickerShopRenderer.init();
    } 
    
    this.render();
  }
  
  /**
   * Render all constructed buildings
   */
  public render(): void {
    // Clear previous building cards
    this.clearBuildingCards();
    
    // Get current buildings from service
    this.buildings = this.buildingService.getConstructedBuildings();
    
    // Calculate the layout parameters
    const maxCardsPerRow = Math.floor((this.panelWidth - 2 * this.panelMarginX) / (this.cardWidth + this.cardSpacing));
    const startX = this.panelX + this.panelMarginX + this.cardWidth / 2;
    const startY = this.panelY + this.panelMarginY + this.cardHeight / 2;
    
    // Render each building as a card
    this.buildings.forEach((building, index) => {
      // Calculate position in grid layout
      const row = Math.floor(index / maxCardsPerRow);
      const col = index % maxCardsPerRow;
      
      const x = startX + col * (this.cardWidth + this.cardSpacing);
      const y = startY + row * (this.cardHeight + this.cardSpacing);
      
      // Create the building card
      const buildingCard = this.createBuildingCard(building, x, y);
      this.buildingCards.push(buildingCard);
    });
  }
  
  /**
   * Create a visual card for a building
   * @param building The building to render
   * @param x X position of the card
   * @param y Y position of the card
   * @returns Container with the building card
   */
  private createBuildingCard(building: Building, x: number, y: number): Phaser.GameObjects.Container {
    // Create a container for the building card
    const container = this.scene.add.container(x, y);
    
    // Create the card background (same as used for cards)
    const cardBackground = this.scene.add['nineslice'](
      0,
      0,
      'panel_wood_paper', // Same background as cards
      undefined,
      this.cardWidth,
      this.cardHeight,
      20,
      20,
      20,
      20
    );
    cardBackground.setOrigin(0.5, 0.5);
    
    // Create text for building name
    const buildingName = this.scene.add.text(
      0,
      0,
      building.name,
      {
        fontSize: '18px',
        color: '#000000',
        align: 'center',
        wordWrap: { width: this.cardWidth - 20 }
      }
    );
    buildingName.setOrigin(0.5, 0.5);
    
    // Add elements to container
    container.add(cardBackground);
    container.add(buildingName);
    
    // Make card interactive (clickable)
    cardBackground.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.onBuildingClick(building);
      });
    
    // Hover effects
    cardBackground.on('pointerover', () => {
      container.setScale(1.05);
    });
    
    cardBackground.on('pointerout', () => {
      container.setScale(1);
    });
    
    return container;
  }
  
  /**
   * Handle building card click
   * @param building The clicked building
   */
  private onBuildingClick(building: Building): void {    
    // Check if this is the sticker shop building
    if (building.id === this.stickerShopBuildingId) {
      this.stickerShopService.setShopState(true);
    }
  }
  
  /**
   * Clear all building card visuals
   */
  private clearBuildingCards(): void {
    this.buildingCards.forEach(container => {
      container.destroy();
    });
    this.buildingCards = [];
  }
  
  /**
   * Update the display when buildings change
   */
  public update(): void {
    const currentBuildings = this.buildingService.getConstructedBuildings();
    
    // Only re-render if the buildings have changed
    if (JSON.stringify(currentBuildings) !== JSON.stringify(this.buildings)) {
      this.render();
    }
  }
  
  /**
   * Destroy this renderer and all its visual elements
   */
  public destroy(): void {
    this.clearBuildingCards();
    if (this.stickerShopRenderer) {
      this.stickerShopRenderer.destroy();
    }
    this.displayContainer.destroy();
  }
} 