import Phaser from 'phaser';
import { BuildingService } from '../services/BuildingService';
import { CARD_HEIGHT, CARD_WIDTH } from './CardRenderer';

/**
 * Component for rendering the building construction menu
 * Displays when a building slot is clicked
 */
export class BuildingMenuRenderer {
  private scene: Phaser.Scene;
  private buildingService: BuildingService;
  private menuContainer: Phaser.GameObjects.Container;
  private backgroundPanel: Phaser.GameObjects.NineSlice;
  private closeButton: Phaser.GameObjects.Image;
  private buildingButtons: Phaser.GameObjects.Container[] = [];
  private escapeKey?: Phaser.Input.Keyboard.Key;

  private panelMarginX: number = 30;
  private panelMarginY: number = 30;
  private buttonSpacingX: number = 10;
  // Menu dimensions and position
  private menuWidth: number;
  private menuHeight: number;
  private menuX: number;
  private menuY: number;
  private currentSlotUniqueId: string = '';
  
  /**
   * Create a new building menu renderer
   * @param scene The Phaser scene to render in
   * @param buildingService The building service to interact with
   * @param panelX X position of the panel
   * @param panelY Y position of the panel
   * @param panelWidth Width of the panel (defaults to 400)
   * @param panelHeight Height of the panel (defaults to 500)
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
    
    // Set menu dimensions
    this.menuWidth = panelWidth;
    this.menuHeight = panelHeight;
    
    // Set menu position
    this.menuX = panelX;
    this.menuY = panelY;
    
    // Create the menu container
    this.menuContainer = this.scene.add.container(0, 0);
    this.menuContainer.setVisible(false);
    
    // Create the background panel
    this.backgroundPanel = this.scene.add['nineslice'](
      this.menuX,
      this.menuY,
      'panel_metal_corners_metal_nice',
      undefined,
      this.menuWidth,
      this.menuHeight,
      20, 20, 20, 20
    );
    this.backgroundPanel.setOrigin(0, 0);
    this.backgroundPanel.setTint(0x666666);

    // Create close button
    this.closeButton = this.scene.add.image(
      this.menuX + this.menuWidth - 30,
      this.menuY + 30,
      'round_metal_cross'
    );
    this.closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.hide(); // TODO this should call closeMenu method in buildingService
      });
    
    // Add elements to container
    this.menuContainer.add(this.backgroundPanel);
    this.menuContainer.add(this.closeButton);
    
    // Add the container to the scene
    this.scene.add.existing(this.menuContainer);
    
    // Setup Escape key to close menu
    if (this.scene.input && this.scene.input.keyboard) {
      this.escapeKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escapeKey.on('down', this.handleEscapeKey, this);
    }
  }
  
  /**
   * Handle Escape key press to close the menu
   */
  private handleEscapeKey(): void {
    if (this.menuContainer.visible) {
      this.hide();
    }
  }
  
  /**
   * Show the building menu for a specific slot
   * @param slotUniqueId The unique ID of the building slot to display the menu for
   */
  public show(slotUniqueId: string): void {
    this.currentSlotUniqueId = slotUniqueId;
    
    // // Get the building slot data
    const slot = this.buildingService.getBuildingSlotByUniqueId(slotUniqueId);
    if (!slot) {
      throw new Error(`Building slot with unique ID ${slotUniqueId} not found`);
    }

    // Clear any existing building buttons
    this.clearBuildingButtons();
    
    // Create buttons for each available building
    this.createBuildingButtons(slot.available_for_construction);
    
    // Show the menu
    this.menuContainer.setVisible(true);
    
    // Bring to top to ensure it's above other elements
    this.menuContainer.setDepth(1000);
  }
  
  /**
   * Hide the building menu
   */
  public hide(): void {
    this.menuContainer.setVisible(false);
    this.currentSlotUniqueId = '';
  }
  
  /**
   * Create buttons for each available building
   * @param availableBuildingIds Array of building IDs available for construction
   */
  private createBuildingButtons(availableBuildingIds: string[]): void {
    if (!availableBuildingIds || availableBuildingIds.length === 0) {
      throw new Error('No buildings available for construction');
    }
    
    // Create a button for each available building
    availableBuildingIds.forEach((buildingId, index) => {
      const buttonContainer = this.renderBuildingOption(
        buildingId,
        index
      );
      
      // Add button container to menu container
      this.menuContainer.add(buttonContainer);
      
      // Save reference to button container
      this.buildingButtons.push(buttonContainer);
    });
  }
  
  /**
   * Render a single building option button
   * @param buildingId ID of the building to render
   * @param index Index of the button in the list
   * @param buttonWidth Width of the button
   * @param buttonHeight Height of the button
   * @param buttonSpacing Spacing between buttons
   * @returns Container with the rendered building option
   */
  private renderBuildingOption(
    buildingId: string,
    index: number
  ): Phaser.GameObjects.Container {
    // Get building config
    const buildingConfig = this.buildingService.getBuildingConfig(buildingId);
    if (!buildingConfig) {
      throw new Error(`Building config with ID ${buildingId} not found`);
    }

    const buttonX = this.menuX + this.panelMarginX + index * (CARD_WIDTH + this.buttonSpacingX);  
    const buttonY = this.menuY + this.menuHeight / 2 + this.panelMarginY;
    
    // Create a container for the button
    const buttonContainer = this.scene.add.container(
      buttonX,
      buttonY
    );
    
    // Create button background
    const buttonBackground = this.scene.add['nineslice'](
      0,
      0,
      'panel_wood_paper',
      undefined,
      CARD_WIDTH,
      CARD_HEIGHT,
      10, 10, 10, 10
    );
    buttonBackground.setOrigin(0, 0.5);
    
    // Make button interactive
    buttonBackground.setInteractive({ useHandCursor: true });
    buttonBackground.on('pointerdown', () => { this.onBuildingSelected(buildingId); });
    buttonBackground.on('pointerover', () => {buttonBackground.setTint(0xcccccc); });
    buttonBackground.on('pointerout', () => { buttonBackground.clearTint(); });
    
    // Create image for building
    const buildingImage = this.scene.add.image(
      CARD_WIDTH/2,
      0,
      buildingConfig.image
    );
    buildingImage.setOrigin(0.5, 0.5);
    buildingImage.setDisplaySize(CARD_WIDTH-15, CARD_HEIGHT-15);
    
    // Add elements to container
    buttonContainer.add(buttonBackground);
    buttonContainer.add(buildingImage);
    
    return buttonContainer;
  }
  
  /**
   * Called when a building is selected from the menu
   * @param buildingId The ID of the selected building
   */
  private onBuildingSelected(buildingId: string): void {
    console.log(`Building selected: ${buildingId} for slot ${this.currentSlotUniqueId}`);
    
    // Construct the building in the selected slot
    if (this.currentSlotUniqueId) {
      const constructed = this.buildingService.constructBuilding(buildingId, this.currentSlotUniqueId);
      if (constructed) {
        console.log(`Successfully constructed building ${buildingId} in slot ${this.currentSlotUniqueId}`);
        
        // Dispatch an event to notify other components
        const event = new CustomEvent('building:constructed', {
          detail: {
            buildingId,
            slotUniqueId: this.currentSlotUniqueId
          }
        });
        window.dispatchEvent(event);
      } else {
        console.error(`Failed to construct building ${buildingId} in slot ${this.currentSlotUniqueId}`);
      }
    }
    
    // Hide the menu
    this.hide();
  }
  
  /**
   * Clear all building buttons
   */
  private clearBuildingButtons(): void {
    this.buildingButtons.forEach(container => {
      container.destroy();
    });
    this.buildingButtons = [];
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    // Remove keyboard listener
    if (this.escapeKey) {
      this.escapeKey.removeAllListeners();
    }
    this.menuContainer.destroy();
  }
} 