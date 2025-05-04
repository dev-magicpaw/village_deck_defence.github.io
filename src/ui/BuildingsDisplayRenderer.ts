import Phaser from 'phaser';
import { Building, BuildingSlot, BuildingSlotLocation } from '../entities/Building';
import { BuildingService } from '../services/BuildingService';
import { DeckService } from '../services/DeckService';
import { ResourceService } from '../services/ResourceService';
import { StickerShopService } from '../services/StickerShopService';
import { TavernService } from '../services/TavernService';
import { BuildingMenuRenderer } from './BuildingMenuRenderer';
import { CARD_WIDTH } from './CardRenderer';
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
  private buildingSlots: Array<{slot: BuildingSlot, container: Phaser.GameObjects.Container}> = [];
  private stickerShopRenderer: StickerShopRenderer;
  private tavernRenderer: TavernRenderer;
  private buildingMenuRenderer: BuildingMenuRenderer;
  private stickerShopBuildingId: string = '';
  private tavernBuildingId: string = '';
  private resourceService: ResourceService;
  private stickerShopService: StickerShopService;
  private tavernService: TavernService;
  private playerHandRenderer: PlayerHandRenderer;
  private deckService: DeckService;
  
  // Card visual properties
  private cardWidth: number = CARD_WIDTH;
  private cardHeight: number = CARD_WIDTH; //for building display cards are squared
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
   * @param stickerShopRenderer Sticker shop renderer for showing the sticker shop
   * @param tavernRenderer Tavern renderer for showing the tavern
   * @param buildingMenuRenderer Building menu renderer for showing the building menu
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
    deckService: DeckService,
    stickerShopRenderer: StickerShopRenderer,
    tavernRenderer: TavernRenderer,
    buildingMenuRenderer: BuildingMenuRenderer
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
    this.stickerShopRenderer = stickerShopRenderer;
    this.tavernRenderer = tavernRenderer;
    this.buildingMenuRenderer = buildingMenuRenderer;
    
    // Create a container to hold all building cards
    this.displayContainer = this.scene.add.container(0, 0);
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
    slotLocations.forEach(location => {
      // Find the slot for this location using unique_id
      const slot = slots.find(s => s.unique_id === location.slot_unique_id);
      if (!slot) {
        throw new Error(`No slot found for location with slot_unique_id ${location.slot_unique_id}`);
      }
            
      let slotContainer: Phaser.GameObjects.Container;
      if (slot.already_constructed) {
        // Find the constructed building for this slot
        const building = this.constructedBuildings.find(b => b.id === slot.already_constructed);
        if (!building) {
          throw new Error(`Building ID ${slot.already_constructed} is marked as constructed in slot ${slot.unique_id} but not found in constructed buildings`);
        }
        slotContainer = this.createConstructedBuildingSlot(slot, location, building);
      } else {
        slotContainer = this.createEmptyBuildingSlot(slot, location);
      }
      
      this.buildingSlots.push({ slot, container: slotContainer });      
    });
  }
  
  /**
   * Create a visual representation for an empty building slot
   * @param slot The building slot data
   * @param location The location data for the slot
   * @returns Container with the empty building slot
   */
  private createEmptyBuildingSlot(slot: BuildingSlot, location: BuildingSlotLocation): Phaser.GameObjects.Container {
    const x = this.panelX + location.x + this.panelMarginX;
    const y = this.panelY + location.y + this.panelMarginY;
    const container = this.scene.add.container(x, y);
    
    // // Add a debug background
    // const background = this.scene.add.rectangle(0, 0, this.cardWidth + 10, this.cardHeight + 10, 0x0000ff, 0.3);
    // container.add(background);
    

    // Create the card background
    const cardBackground = this.scene.add.image(
      this.cardWidth / 2,
      this.cardHeight / 2,
      'round_wood_cross'
    );
    cardBackground.setDisplaySize(this.cardWidth, this.cardHeight);
    cardBackground.setRotation(Math.PI / 4); // turn it 45 degrees
    cardBackground.setScale(5);
    cardBackground.setOrigin(0.5,0.5);
    
    cardBackground.setInteractive({ useHandCursor: true });
    cardBackground.on('pointerdown', () => { this.onBuildingSlotClick(slot, null); });
    cardBackground.on('pointerover', () => { container.setScale(1.05); });
    cardBackground.on('pointerout', () => { container.setScale(1); });
    
    container.add(cardBackground);
    
    // Add the container to the display container
    this.displayContainer.add(container);
    
    return container;
  }
  
  /**
   * Create a visual representation for a constructed building slot
   * @param slot The building slot data
   * @param location The location data for the slot
   * @param building The building constructed on this slot
   * @returns Container with the constructed building
   */
  private createConstructedBuildingSlot(slot: BuildingSlot, location: BuildingSlotLocation, building: Building): Phaser.GameObjects.Container {
    const x = this.panelX + location.x + this.panelMarginX;
    const y = this.panelY + location.y + this.panelMarginY;
    const container = this.scene.add.container(x, y);
    
    // Create the card background
    const cardBackground = this.scene.add['nineslice'](
      this.cardWidth / 2,
      this.cardHeight / 2,
      'panel_wood_paper',
      undefined,
      this.cardWidth,
      this.cardHeight,
      20, 20, 20, 20
    );
    cardBackground.setOrigin(0.5,0.5);

    cardBackground.setInteractive({ useHandCursor: true });
    cardBackground.on('pointerdown', () => { this.onBuildingSlotClick(slot, building); });
    cardBackground.on('pointerover', () => { container.setScale(1.05); });
    cardBackground.on('pointerout', () => { container.setScale(1); });
    
    container.add(cardBackground);
    
    // Create title text with building name
    const titleText = this.scene.add.text(
      this.cardWidth / 2,
      this.cardHeight / 2,
      building.name,
      {
        fontSize: '18px',
        color: '#000000',
        align: 'center',
        wordWrap: { width: this.cardWidth - 20 }
      }
    );
    titleText.setOrigin(0.5, 0.5);
    container.add(titleText);
    
    // Add the container to the display container
    this.displayContainer.add(container);
    
    return container;
  }
  
  /**
   * Handle clicking on a building slot
   * @param slot The building slot data
   * @param building The building in the slot, or null if empty
   */
  private onBuildingSlotClick(slot: BuildingSlot, building: Building | null): void {
    console.log(`Slot clicked: ${slot.unique_id}`);
    
    // If we have a building, check if it's a special building
    if (building) {
      if (building.id === this.stickerShopBuildingId) {
        console.log('Opening sticker shop');
        // Hide the buildings display and show the sticker shop
        this.displayContainer.setVisible(false);
        this.stickerShopRenderer.show();
        return;
      }
      
      if (building.id === this.tavernBuildingId) {
        console.log('Opening tavern');
        // Hide the buildings display and show the tavern
        this.displayContainer.setVisible(false);
        this.tavernRenderer.show();
        return;
      }
      
      console.log(`Building ${building.id} clicked, but it doesn't have special handling`);
      return;
    }
    
    // If there's no building, show the building menu
    if (slot.available_for_construction.length > 0) {
      this.buildingMenuRenderer.show(slot.unique_id);
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
    
    this.stickerShopRenderer.destroy();
    
    this.tavernRenderer.destroy();
    
    this.buildingMenuRenderer.destroy();
  }
} 