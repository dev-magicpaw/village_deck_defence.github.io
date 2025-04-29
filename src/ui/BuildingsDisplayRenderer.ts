import Phaser from 'phaser';
import { BuildingService } from '../services/BuildingService';
import { Building } from '../types/game';

/**
 * Renders constructed buildings in the display panel
 */
export class BuildingsDisplayRenderer {
  private scene: Phaser.Scene;
  private buildingService: BuildingService;
  private displayContainer: Phaser.GameObjects.Container;
  private buildings: Building[] = [];
  private buildingCards: Phaser.GameObjects.Container[] = [];
  
  // Building card visual properties
  private cardWidth: number = 150;
  private cardHeight: number = 200;
  private cardSpacing: number = 30;
  private panelMarginX: number = 30;
  private panelMarginY: number = 30;
  
  // Panel dimensions
  private panelX: number;
  private panelY: number;
  private panelWidth: number;
  private panelHeight: number;
  
  /**
   * Create a new BuildingsDisplayRenderer
   * @param scene The Phaser scene to render in
   * @param buildingService The building service to get buildings from
   * @param panelX X position of the panel
   * @param panelY Y position of the panel
   * @param panelWidth Width of the panel
   * @param panelHeight Height of the panel
   */
  constructor(
    scene: Phaser.Scene,
    buildingService: BuildingService,
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number
  ) {
    this.scene = scene;
    this.buildingService = buildingService;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    
    // Create a container to hold all building cards
    this.displayContainer = this.scene.add.container(0, 0);
  }
  
  /**
   * Initialize the renderer
   */
  public init(): void {
    // Nothing specific to initialize here
    // We'll render buildings when render() is called
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
      'panel_wood_paper_damaged', // Same background as cards
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
    // For now, just log that building was clicked
    console.log(`Building ${building.name} clicked`);
    // Future functionality can be added here
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
    this.displayContainer.destroy();
  }
} 