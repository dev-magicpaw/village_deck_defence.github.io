import Phaser from 'phaser';
import { BuildingConfig as OriginalBuildingConfig } from '../entities/Building';
import { Card } from '../entities/Card';
import { BuildingService } from '../services/BuildingService';
import { ResourceService } from '../services/ResourceService';
import { CARD_HEIGHT, CARD_WIDTH } from './CardRenderer';
import { PlayerHandRenderer, PlayerHandRendererEvents } from './PlayerHandRenderer';

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
  private backgroundPanel: Phaser.GameObjects.NineSlice;
  private closeButton: Phaser.GameObjects.Image;
  private buildingButtons: Phaser.GameObjects.Container[] = [];
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private playerHandRenderer: PlayerHandRenderer;
  private resourceService: ResourceService;

  // Resource panel elements
  private resourcePanel: Phaser.GameObjects.NineSlice | null = null;
  private selectionText: Phaser.GameObjects.Text | null = null;
  private acquiredText: Phaser.GameObjects.Text | null = null;
  private selectAllButton: Phaser.GameObjects.NineSlice | null = null;
  private selectAllButtonText: Phaser.GameObjects.Text | null = null;
  private constructButton: Phaser.GameObjects.NineSlice | null = null;
  private constructButtonText: Phaser.GameObjects.Text | null = null;

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
        this.hide();
      });
    
    // Add elements to container
    this.menuContainer.add(this.backgroundPanel);
    this.menuContainer.add(this.closeButton);
    
    // Create the resource panel that shows card selection info
    this.createResourcePanel();
    
    // Add the container to the scene
    this.scene.add.existing(this.menuContainer);
    
    // Setup Escape key to close menu
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
   * Creates the resource panel for card selection
   */
  private createResourcePanel(): void {
    const marginX = 20;
    const marginY = 20;
    
    // Calculate panel dimensions and position (at the bottom of the main panel)
    const cardWidth = CARD_WIDTH * 1.2;
    const cardHeight = CARD_HEIGHT * 0.6;
    const panelWidth = this.menuWidth - 2 * this.panelMarginX;
    const panelHeight = cardHeight + 2 * marginY;
    const panelX = this.menuX + this.panelMarginX;
    const panelY = this.menuY + this.menuHeight - panelHeight - this.panelMarginY;
    
    // Create selection panel
    this.resourcePanel = this.scene.add['nineslice'](
      panelX,
      panelY,
      'panel_metal_sheet',
      undefined,
      panelWidth,
      panelHeight,
      10, 10, 10, 10
    );
    
    this.resourcePanel.setOrigin(0, 0);
    this.resourcePanel.setTint(0x666666); // Same dark grey tint as main panel
    
    // Add "Selected: X" text with the construction resource icon
    const resourceTextX = panelWidth / 2 - marginX - 30; // centered horizontally. -marginX to give space for the image
    this.selectionText = this.scene.add.text(
      panelX + resourceTextX,
      panelY + marginY + 5,
      `Selected: 0`,
      {
        fontSize: '16px',
        color: '#ffffff'
      }
    );
    this.selectionText.setOrigin(1, 0);
    
    // Add construction resource icon next to "Selected: X"
    const resourceIcon = this.scene.add.image(
      panelX + resourceTextX + 5,
      panelY + marginY + 12,
      'resource_construction'
    );
    resourceIcon.setOrigin(0, 0.5);
    resourceIcon.setScale(0.6);
    
    // Add "Acquired: X" text with construction resource icon
    const acquiredConstruction = this.resourceService ? this.resourceService.getConstruction() : 0;
    this.acquiredText = this.scene.add.text(
      panelX + resourceTextX,
      panelY + marginY + 35,
      `Acquired: ${acquiredConstruction}`,
      {
        fontSize: '16px',
        color: '#ffffff'
      }
    );
    this.acquiredText.setOrigin(1, 0);
    
    // Add construction resource icon
    const acquiredIcon = this.scene.add.image(
      panelX + resourceTextX + 5,
      panelY + marginY + 42,
      'resource_construction'
    );
    acquiredIcon.setOrigin(0, 0.5);
    acquiredIcon.setScale(0.6);
    
    // Add "Select All" button on the left side
    this.selectAllButton = this.scene.add['nineslice'](
      panelX + marginX,
      panelY + panelHeight / 2,
      'button_metal_slim_corners_orange',
      undefined,
      120,
      40,
      10, 10, 10, 10
    );
    this.selectAllButton.setOrigin(0, 0.5);
    this.selectAllButton.setInteractive({ useHandCursor: true });
    this.selectAllButton.on('pointerdown', () => { this.selectAllCardsWithConstruction(); });
    
    this.selectAllButtonText = this.scene.add.text(
      panelX + marginX + 60,
      panelY + panelHeight / 2,
      'Select All',
      {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.selectAllButtonText.setOrigin(0.5, 0.5);
    
    // Add "Construct" button on the right side
    this.constructButton = this.scene.add['nineslice'](
      panelX + panelWidth - marginX - 120,
      panelY + panelHeight / 2,
      'button_metal_slim_corners_orange',
      undefined,
      120,
      40,
      10, 10, 10, 10
    );
    this.constructButton.setOrigin(0, 0.5);
    this.constructButton.setInteractive({ useHandCursor: true });
    this.constructButton.on('pointerdown', () => { this.constructSelectedBuilding(); });
    
    this.constructButtonText = this.scene.add.text(
      panelX + panelWidth - marginX - 60,
      panelY + panelHeight / 2,
      'Construct',
      {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.constructButtonText.setOrigin(0.5, 0.5);
    
    // Add elements to the container
    this.menuContainer.add(this.resourcePanel);
    this.menuContainer.add(this.selectionText);
    this.menuContainer.add(this.acquiredText);
    this.menuContainer.add(resourceIcon);
    this.menuContainer.add(acquiredIcon);
    this.menuContainer.add(this.selectAllButton);
    this.menuContainer.add(this.selectAllButtonText);
    this.menuContainer.add(this.constructButton);
    this.menuContainer.add(this.constructButtonText);
    
    // Disable construct button initially
    this.setConstructButtonState(false);
  }

  /**
   * Set the state of the construct button
   * @param enabled Whether the button should be enabled
   */
  private setConstructButtonState(enabled: boolean): void {
    if (this.constructButton && this.constructButtonText) {
      if (enabled) {
        this.constructButton.clearTint();
        this.constructButtonText.setColor('#ffffff');
        this.constructButton.setInteractive({ useHandCursor: true });
      } else {
        this.constructButton.setTint(0x666666);
        this.constructButtonText.setColor('#999999');
        this.constructButton.disableInteractive();
      }
    }
  }
  
  /**
   * Handler for card selection changes
   */
  private onCardSelectionChanged(): void {
    this.updateSelectionText();
    
    // Update the construct button state based on selection
    if (this.selectedBuildingId) {
      this.updateConstructButtonState();
    }
  }
  
  /**
   * Update the selection text with the current construction value
   */
  private updateSelectionText(): void {
    if (this.selectionText) {
      this.selectionText.setText(`Selected: ${this.playerHandRenderer.getSelectedConstructionValue()}`);
    }
  }
  
  /**
   * Update the acquired resources text
   */
  private updateAcquiredText(): void {
    if (this.acquiredText) {
      const acquiredConstruction = this.resourceService.getConstruction();
      this.acquiredText.setText(`Acquired: ${acquiredConstruction}`);
    }
  }
  
  /**
   * Update construct button state based on whether player can afford the building
   */
  private updateConstructButtonState(): void {
    const canConstruct = this.canAffordBuilding();
    this.setConstructButtonState(canConstruct);
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
   * Selects all cards in the player's hand that have at least 1 construction value
   */
  private selectAllCardsWithConstruction(): void {
    const cards = this.playerHandRenderer.getCardsInHand();
    const idsToSelect: string[] = [];
    const idsToDeselect: string[] = [];
    
    cards.forEach((card: Card) => {
      if (card.getConstructionValue() > 0) {
        idsToSelect.push(card.unique_id);
      } else {
        idsToDeselect.push(card.unique_id);
      }
    });
    
    // Select and deselect cards based on their construction value
    this.playerHandRenderer.selectAndDeselectCardsByIds(idsToSelect, idsToDeselect);
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
    
    // Update resource panel texts
    this.updateSelectionText();
    this.updateAcquiredText();
    
    // Show the menu
    this.menuContainer.setVisible(true);
    
    // Bring to top to ensure it's above other elements
    this.menuContainer.setDepth(1000);
    
    // Disable the construct button initially
    this.setConstructButtonState(false);
    
    // Notify the building service that the menu is open
    this.buildingService.openMenu(slotUniqueId);
  }
  
  /**
   * Hide the building menu
   */
  public hide(): void {
    this.menuContainer.setVisible(false);
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
    
    // Remove card selection listener
    this.playerHandRenderer.off(
      PlayerHandRendererEvents.SELECTION_CHANGED,
      this.onCardSelectionChanged,
      this
    );
    
    this.menuContainer.destroy();
  }
} 