import Phaser from 'phaser';
import { Building } from '../entities/Building';
import { BuildingService } from '../services/BuildingService';
import { DeckService } from '../services/DeckService';
import { ResourceService } from '../services/ResourceService';
import { StickerShopService } from '../services/StickerShopService';
import { TavernService } from '../services/TavernService';
import { BuildingMenuRenderer } from './BuildingMenuRenderer';
import { PlayerHandRenderer } from './PlayerHandRenderer';
import { StickerShopRenderer } from './StickerShopRenderer';
import { TavernRenderer } from './TavernRenderer';

/**
 * Component that renders the building slots in the main display area
 */
export class BuildingsDisplayRenderer {
  private scene: Phaser.Scene;
  private buildingService: BuildingService;
  private displayContainer: Phaser.GameObjects.Container;
  private constructedBuildings: Building[] = [];
  private buildingSlots: Array<{slot: any, container: Phaser.GameObjects.Container}> = [];
  private stickerShopRenderer: StickerShopRenderer | null = null;
  private tavernRenderer: TavernRenderer | null = null;
  private buildingMenuRenderer: BuildingMenuRenderer | null = null;
  private stickerShopBuildingId: string = '';
  private tavernBuildingId: string = '';
  private resourceService: ResourceService;
  private stickerShopService: StickerShopService;
  private tavernService: TavernService;
  private playerHandRenderer: PlayerHandRenderer;
  private deckService: DeckService;
  
  // Card visual properties
  private cardWidth: number = 150;
  private cardHeight: number = 200;
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
    this.tavernService = TavernService.getInstance();
    this.playerHandRenderer = playerHandRenderer;
    this.deckService = deckService;
    
    // Create a container to hold all building cards
    this.displayContainer = this.scene.add.container(0, 0);
    
    // Manually set the card dimensions to be more appropriate for buildings
    this.cardWidth = 150;
    this.cardHeight = 200;
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
    this.tavernBuildingId = gameConfig.tavern_building_id;
    
    // Make sure the display container is visible and on top
    this.displayContainer.setDepth(10);
    
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
    
    // Create the tavern renderer with the same dimensions
    if (!this.tavernRenderer) {
      this.tavernRenderer = new TavernRenderer(
        this.scene,
        this.panelX,
        this.panelY,
        this.panelWidth,
        this.panelHeight,
        this.playerHandRenderer,
        this.resourceService,
        this.deckService
      );
      this.tavernRenderer.init();
    }
    
    // Create the building menu renderer
    if (!this.buildingMenuRenderer) {
      this.buildingMenuRenderer = new BuildingMenuRenderer(
        this.scene,
        this.buildingService
      );
    }
    
    this.render();
  }
  
  /**
   * Render all building slots
   */
  public render(): void {
    // Clear previous building slots
    this.clearBuildingSlots();
    
    // Get current constructed buildings from service
    this.constructedBuildings = this.buildingService.getConstructedBuildings();
    
    // Get building slots from service
    const slots = this.buildingService.getBuildingSlots();
    const slotLocations = this.buildingService.getBuildingSlotLocations();
    
    console.log('Building slots:', slots);
    console.log('Building slot locations:', slotLocations);
    console.log('Constructed buildings:', this.constructedBuildings);
    
    // Render each building slot
    slots.forEach(slot => {
      // Find the location for this slot
      const location = slotLocations.find(loc => loc.slot_id === slot.id);
      
      if (location) {
        console.log(`Rendering slot ${slot.id} at position (${location.x}, ${location.y})`);
        // Create the slot at the specified location
        const slotContainer = this.createBuildingSlot(slot, location);
        this.buildingSlots.push({ slot, container: slotContainer });
      } else {
        console.warn(`No location found for slot ${slot.id}`);
      }
    });
  }
  
  /**
   * Create a visual representation for a building slot
   * @param slot The building slot data
   * @param location The location data for the slot
   * @returns Container with the building slot
   */
  private createBuildingSlot(slot: any, location: any): Phaser.GameObjects.Container {
    // Position slots relative to the panel
    const x = this.panelX + location.x;
    const y = this.panelY + location.y;
    console.log(`Creating slot ${slot.id} at position (${x}, ${y}), panel at (${this.panelX}, ${this.panelY})`);
    
    const container = this.scene.add.container(x, y);
    
    // Add a debug background to make sure it's visible
    const background = this.scene.add.rectangle(0, 0, this.cardWidth + 10, this.cardHeight + 10, 0x0000ff, 0.3);
    container.add(background);
    
    // Check if there's a constructed building for this slot
    const constructedBuildingId = slot.already_constructed;
    let building: Building | null = null;
    
    if (constructedBuildingId) {
      // Find the building in the constructed buildings
      const foundBuilding = this.constructedBuildings.find(b => b.id === constructedBuildingId);
      if (foundBuilding) {
        building = foundBuilding;
        console.log(`Found constructed building ${foundBuilding.name} for slot ${slot.id}`);
      } else {
        console.warn(`Building ID ${constructedBuildingId} is marked as constructed in slot ${slot.id} but not found in constructed buildings`);
      }
    }
    
    let cardBackground: Phaser.GameObjects.Rectangle | Phaser.GameObjects.NineSlice;
    
    // Verify texture exists before creating the card background
    if (!this.scene.textures.exists('panel_wood_paper')) {
      console.error('Texture "panel_wood_paper" not found for building slot background!');
      // Fallback to a basic rectangle if texture is missing
      cardBackground = this.scene.add.rectangle(0, 0, this.cardWidth, this.cardHeight, 0x999999);
      cardBackground.setOrigin(0.5, 0.5);
      container.add(cardBackground);
    } else {
      // Create the card background
      try {
        cardBackground = this.scene.add['nineslice'](
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
        container.add(cardBackground);
      } catch (error) {
        console.error('Error creating nineslice for building slot:', error);
        // Fallback to a basic rectangle
        cardBackground = this.scene.add.rectangle(0, 0, this.cardWidth, this.cardHeight, 0x999999);
        cardBackground.setOrigin(0.5, 0.5);
        container.add(cardBackground);
      }
    }
    
    // Create title text
    let titleText;
    if (building) {
      // If there's a constructed building, show its name
      titleText = this.scene.add.text(
        0,
        -this.cardHeight / 2 + 30,
        building.name,
        {
          fontSize: '18px',
          color: '#000000',
          align: 'center',
          wordWrap: { width: this.cardWidth - 20 }
        }
      );
    } else {
      // Otherwise, show "Building Slot"
      titleText = this.scene.add.text(
        0,
        -this.cardHeight / 2 + 30,
        'Building to construct',
        {
          fontSize: '18px',
          color: '#000000',
          align: 'center',
          wordWrap: { width: this.cardWidth - 20 }
        }
      );
    }
    titleText.setOrigin(0.5, 0.5);
    container.add(titleText);
    
    // Add an icon or image if needed
    if (building) {
      // TODO: Add building image if available
    }
    
    // Make interactive area
    if (cardBackground instanceof Phaser.GameObjects.GameObject) {
      (cardBackground as any).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.onBuildingSlotClick(slot, building);
        });
      
      // Hover effects
      (cardBackground as any).on('pointerover', () => {
        container.setScale(1.05);
      });
      
      (cardBackground as any).on('pointerout', () => {
        container.setScale(1);
      });
    }
    
    // Add the container to the display container
    this.displayContainer.add(container);
    
    return container;
  }
  
  /**
   * Handle building slot click
   * @param slot The clicked building slot
   * @param building The constructed building in the slot (if any)
   */
  private onBuildingSlotClick(slot: any, building: Building | null): void {
    if (building) {
      // If there's a constructed building, handle special building behavior
      if (building.id === this.stickerShopBuildingId) {
        this.stickerShopService.setShopState(true);
        return;
      } else if (building.id === this.tavernBuildingId) {
        // Show tavern UI
        if (this.tavernRenderer) {
          this.tavernRenderer.show();
        }
        return;
      }
    } else {
      // If there's no building, show the building menu
      if (this.buildingMenuRenderer && slot.available_for_construction.length > 0) {
        this.buildingMenuRenderer.show(slot.id);
      }
    }
  }
  
  /**
   * Clear all building slot visuals
   */
  private clearBuildingSlots(): void {
    this.buildingSlots.forEach(item => {
      item.container.destroy();
    });
    this.buildingSlots = [];
  }
  
  /**
   * Update the component
   */
  public update(): void {
    // Check if any buildings have been constructed since last update
    const currentBuildings = this.buildingService.getConstructedBuildings();
    if (currentBuildings.length !== this.constructedBuildings.length) {
      // Re-render if the number of constructed buildings has changed
      this.render();
    }
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.displayContainer.destroy();
    
    if (this.stickerShopRenderer) {
      this.stickerShopRenderer.destroy();
    }
    
    if (this.tavernRenderer) {
      this.tavernRenderer.destroy();
    }
    
    if (this.buildingMenuRenderer) {
      this.buildingMenuRenderer.destroy();
    }
  }
} 