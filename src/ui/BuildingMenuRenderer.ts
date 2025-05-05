import Phaser from 'phaser';
import { BuildingConfig as OriginalBuildingConfig } from '../entities/Building';
import { ResourceType } from '../entities/Types';
import { BuildingService } from '../services/BuildingService';
import { ResourceService } from '../services/ResourceService';
import { CARD_HEIGHT, CARD_WIDTH } from './CardRenderer';
import { PlayerHandRenderer, PlayerHandRendererEvents } from './PlayerHandRenderer';
import { ResourcePanelRenderer } from './ResourcePanelRenderer';

/**
 * Extend the BuildingConfig interface to include cost
 */
interface BuildingConfig extends OriginalBuildingConfig {
  cost?: {
    construction: number;
  };
}

/**
 * Component for rendering the building construction menu
 * Displays when a building slot is clicked
 */
export class BuildingMenuRenderer {
  private scene: Phaser.Scene;
  private buildingService: BuildingService;
  private menuContainer: Phaser.GameObjects.Container;
  private backgroundPanel!: Phaser.GameObjects.NineSlice;
  private inputBlocker!: Phaser.GameObjects.Rectangle;
  private closeButton!: Phaser.GameObjects.Image;
  private buildingButtons: Phaser.GameObjects.Container[] = [];
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private playerHandRenderer: PlayerHandRenderer;
  private resourceService: ResourceService;

  // Resource panel
  private resourcePanelRenderer!: ResourcePanelRenderer;

  private panelMarginX: number = 30;
  private panelMarginY: number = 30;
  private buttonSpacingX: number = 10;
  // Menu dimensions and position
  private menuWidth: number;
  private menuHeight: number;
  private menuX: number;
  private menuY: number;
  private currentSlotUniqueId: string = '';
  private selectedBuildingId: string = '';
  
  /**
   * Create a new building menu renderer
   * @param scene The Phaser scene to render in
   * @param buildingService The building service to interact with
   * @param panelX X position of the panel
   * @param panelY Y position of the panel
   * @param panelWidth Width of the panel (defaults to 400)
   * @param panelHeight Height of the panel (defaults to 500)
   * @param playerHandRenderer The player hand renderer for card selection
   * @param resourceService Resource service for tracking acquired resources
   */
  constructor(
    scene: Phaser.Scene,
    buildingService: BuildingService,
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
    playerHandRenderer: PlayerHandRenderer,
    resourceService: ResourceService
  ) {
    this.scene = scene;
    this.buildingService = buildingService;
    this.playerHandRenderer = playerHandRenderer;
    this.resourceService = resourceService;
    
    this.menuWidth = panelWidth;
    this.menuHeight = panelHeight;
    this.menuX = panelX;
    this.menuY = panelY;
    
    // Create the menu container
    this.menuContainer = this.scene.add.container(0, 0);
    this.menuContainer.setVisible(false);

    this.createInputBlocker(); // keep this first so other elements are on top for input system
    this.createBackgroundPanel();
    this.createResourcePanel();
    
    this.scene.add.existing(this.menuContainer);
    
    // Setup Escape key to close menu
    // TODO make it so that this works only when the menu is visible
    if (this.scene.input && this.scene.input.keyboard) {
      this.escapeKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escapeKey.on('down', this.handleEscapeKey, this);
    }
    
    // Subscribe to player hand card selection changes
    this.playerHandRenderer.on(
      PlayerHandRendererEvents.SELECTION_CHANGED,
      this.onCardSelectionChanged,
      this
    );
  }
  
  /**
   * Creates an input blocker to intercept clicks when the menu is open
   */
  private createInputBlocker(): void {
    // Create an input blocker that matches the size of the menu background
    this.inputBlocker = this.scene.add.rectangle(
      this.menuX, 
      this.menuY, 
      this.menuWidth, 
      this.menuHeight, 
      0x000000, 
      0.01
    );
    this.inputBlocker.setOrigin(0, 0);
    this.inputBlocker.setInteractive();
    
    // No need to check if click is outside since the blocker only covers the menu area
    this.menuContainer.add(this.inputBlocker);
  }
  
  /**
   * Creates the background panel
   */
  private createBackgroundPanel(): void {
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
        this.hide();
      });
    
    // Add elements to container
    this.menuContainer.add(this.backgroundPanel);
    this.menuContainer.add(this.closeButton);
  }
  
  /**
   * Creates the resource panel for card selection
   */
  private createResourcePanel(): void {
    this.resourcePanelRenderer = new ResourcePanelRenderer(
      this.scene,
      this.playerHandRenderer,
      ResourceType.Construction,
      'Construct',
      () => this.constructSelectedBuilding(),
      this.resourceService
    );
    
    this.resourcePanelRenderer.hide();
  }

  /**
   * Set the state of the construct button
   * @param enabled Whether the button should be enabled
   */
  private setConstructButtonState(enabled: boolean): void {
    if (this.selectedBuildingId) {
      const buildingConfig = this.buildingService.getBuildingConfig(this.selectedBuildingId) as BuildingConfig;
      const cost = buildingConfig.cost?.construction || 0;
      this.resourcePanelRenderer.setTarget(enabled, cost);
    } else {
      this.resourcePanelRenderer.setTarget(false, 0);
    }
  }
  
  /**
   * Handler for card selection changes
   */
  private onCardSelectionChanged(): void {
    // Update the construct button state based on selection
    if (this.selectedBuildingId) {
      this.updateConstructButtonState();
    }
  }
  
  /**
   * Update the selection text with the current construction value
   */
  private updateSelectionText(): void {
    // This is handled by the ResourcePanelRenderer
  }
  
  /**
   * Update the acquired resources text
   */
  private updateAcquiredText(): void {
    const acquiredConstruction = this.resourceService.getConstruction();
    this.resourcePanelRenderer.setAcquiredResourceValue(acquiredConstruction);
  }
  
  /**
   * Update construct button state based on whether player can afford the building
   */
  private updateConstructButtonState(): void {
    const canConstruct = this.canAffordBuilding();
    
    if (this.selectedBuildingId) {
      const buildingConfig = this.buildingService.getBuildingConfig(this.selectedBuildingId) as BuildingConfig;
      const cost = buildingConfig.cost?.construction || 0;
      this.resourcePanelRenderer.setTarget(canConstruct, cost);
    } else {
      this.resourcePanelRenderer.setTarget(false, 0);
    }
  }
  
  /**
   * Check if the player can afford the currently selected building
   */
  private canAffordBuilding(): boolean {
    if (!this.selectedBuildingId) return false;
    
    const buildingConfig = this.buildingService.getBuildingConfig(this.selectedBuildingId) as BuildingConfig;
    if (!buildingConfig) return false;
    
    const requiredConstruction = buildingConfig.cost?.construction || 0;
    const selectedConstruction = this.playerHandRenderer.getSelectedConstructionValue();
    const acquiredConstruction = this.resourceService.getConstruction();
    
    return (selectedConstruction + acquiredConstruction) >= requiredConstruction;
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
    
    // Get the building slot data
    const slot = this.buildingService.getBuildingSlotByUniqueId(slotUniqueId);
    if (!slot) {
      throw new Error(`Building slot with unique ID ${slotUniqueId} not found`);
    }

    // Reset selected building
    this.selectedBuildingId = '';
    
    // Clear any existing building buttons
    this.clearBuildingButtons();
    
    // Create buttons for each available building
    this.createBuildingButtons(slot.available_for_construction);
    
    // Update resource panel
    this.updateAcquiredText();
    this.resourcePanelRenderer.show();
    
    // Show the menu
    this.menuContainer.setVisible(true);
    
    // Bring to top to ensure it's above other elements
    this.menuContainer.setDepth(1000);
    
    // Update target construction cost to none initially
    this.resourcePanelRenderer.setTarget(false, 0);
    
    // Notify the building service that the menu is open
    this.buildingService.openMenu(slotUniqueId);
  }
  
  /**
   * Hide the building menu
   */
  public hide(): void {
    this.menuContainer.setVisible(false);
    this.resourcePanelRenderer.hide();
    this.currentSlotUniqueId = '';
    this.selectedBuildingId = '';
    
    // Notify the building service that the menu is closed
    this.buildingService.closeMenu();
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
   * @returns Container with the rendered building option
   */
  private renderBuildingOption(
    buildingId: string,
    index: number
  ): Phaser.GameObjects.Container {
    // Get building config
    const buildingConfig = this.buildingService.getBuildingConfig(buildingId) as BuildingConfig;
    if (!buildingConfig) {
      throw new Error(`Building config with ID ${buildingId} not found`);
    }

    const buttonX = this.menuX + this.panelMarginX + index * (CARD_WIDTH + this.buttonSpacingX);  
    const buttonY = this.menuY + this.menuHeight / 3;
    
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
    
    // Add cost text
    const costText = this.scene.add.text(
      CARD_WIDTH/2,
      CARD_HEIGHT/2 - 20,
      `Cost: ${buildingConfig.cost?.construction || 0}`,
      {
        fontSize: '14px',
        color: '#000000',
        backgroundColor: '#ffffff80',
        padding: { x: 4, y: 2 }
      }
    );
    costText.setOrigin(0.5, 0.5);
    
    // Add elements to container
    buttonContainer.add(buttonBackground);
    buttonContainer.add(buildingImage);
    buttonContainer.add(costText);
    
    return buttonContainer;
  }
  
  /**
   * Called when a building is selected from the menu
   * @param buildingId The ID of the selected building
   */
  private onBuildingSelected(buildingId: string): void {
    console.log(`Building selected: ${buildingId} for slot ${this.currentSlotUniqueId}`);
    
    // Set the selected building
    this.selectedBuildingId = buildingId;
    
    // Update construct button state
    this.updateConstructButtonState();
  }
  
  /**
   * Construct the selected building using selected cards
   */
  private constructSelectedBuilding(): void {
    if (!this.selectedBuildingId || !this.currentSlotUniqueId) {
      return;
    }
    
    // Get selected cards and their construction value
    const selectedCardIds = this.playerHandRenderer.getSelectedCardIds();
    const selectedConstructionValue = this.playerHandRenderer.getSelectedConstructionValue();
    const acquiredConstruction = this.resourceService.getConstruction();
    
    // Get building config to check cost
    const buildingConfig = this.buildingService.getBuildingConfig(this.selectedBuildingId) as BuildingConfig;
    if (!buildingConfig) return;
    
    const requiredConstruction = buildingConfig.cost?.construction || 0;
    
    // Check if player can afford the building
    if ((selectedConstructionValue + acquiredConstruction) < requiredConstruction) {
      return;
    }
    
    // First try to use acquired construction
    let remainingCost = requiredConstruction;
    let spentAcquired = Math.min(acquiredConstruction, remainingCost);
    remainingCost -= spentAcquired;
    
    // Spend acquired construction resources
    if (spentAcquired > 0) {
      this.resourceService.consumeConstruction(spentAcquired);
    }
    
    // If we still need more resources, discard the selected cards
    if (remainingCost > 0) {
      // Discard selected cards
      this.playerHandRenderer.discardCardsByUniqueIds(selectedCardIds);
    }
    
    // Construct the building
    const constructed = this.buildingService.constructBuilding(this.selectedBuildingId, this.currentSlotUniqueId);
    if (constructed) {
      console.log(`Successfully constructed building ${this.selectedBuildingId} in slot ${this.currentSlotUniqueId}`);
      
      // Dispatch an event to notify other components
      const event = new CustomEvent('building:constructed', {
        detail: {
          buildingId: this.selectedBuildingId,
          slotUniqueId: this.currentSlotUniqueId
        }
      });
      window.dispatchEvent(event);
    } else {
      console.error(`Failed to construct building ${this.selectedBuildingId} in slot ${this.currentSlotUniqueId}`);
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
    
    // Destroy the resource panel
    if (this.resourcePanelRenderer) {
      this.resourcePanelRenderer.destroy();
    }
    
    this.menuContainer.destroy();
  }
} 