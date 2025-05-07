import Phaser from 'phaser';
import { BuildingConfig as OriginalBuildingConfig } from '../entities/Building';
import { ResourceType } from '../entities/Types';
import { BuildingService } from '../services/BuildingService';
import { ResourceService } from '../services/ResourceService';
import { CARD_HEIGHT, CARD_SPACING_X, CARD_WIDTH } from './CardRenderer';
import { CostRenderer } from './CostRenderer';
import { CountLimitRenderer } from './CountLimitRenderer';
import { PlayerHandRenderer, PlayerHandRendererEvents } from './PlayerHandRenderer';
import { ResourcePanelRenderer } from './ResourcePanelRenderer';
import { SimpleCardRenderer } from './SimpleCardRenderer';

/**
 * Extend the BuildingConfig interface to include cost
 */
// TODO this should be merged with BuildingConfig
interface BuildingConfig extends OriginalBuildingConfig {
  cost?: {
    construction: number;
  };
  limit?: number | null;
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
  private buildingCards: SimpleCardRenderer[] = [];
  private buildingCostRenderers: CostRenderer[] = [];
  private buildingCountRenderers: CountLimitRenderer[] = [];
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private playerHandRenderer: PlayerHandRenderer;
  private resourceService: ResourceService;

  // Resource panel
  private resourcePanelRenderer!: ResourcePanelRenderer;

  private panelMarginX: number = 30;
  private buttonSpacingX: number = CARD_SPACING_X;
  // Menu dimensions and position
  private menuWidth: number;
  private menuHeight: number;
  private menuX: number;
  private menuY: number;
  private currentSlotUniqueId: string = '';
  private selectedBuildingId: string = '';
  private selectedBuildingRenderer: SimpleCardRenderer | null = null;
  
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
    this.createEscapeKeyHandler();
    this.scene.add.existing(this.menuContainer);
    
    // Subscribe to player hand card selection changes
    this.playerHandRenderer.on(PlayerHandRendererEvents.SELECTION_CHANGED, this.onCardSelectionChanged, this);
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
   * Handler for card selection changes
   */
  private onCardSelectionChanged(): void {
    // Update the cost label colors for all building options
    this.updateBuildingOptionCostColors();
  }
  
  /**
   * Update the cost label colors for all building options based on affordability
   */
  private updateBuildingOptionCostColors(): void {
    const totalAvailable = this.resourcePanelRenderer.totalAvailable();
    
    // Update each building card
    this.buildingCards.forEach((card, index) => {
      // Get the building ID for this card
      const buildingIds = this.buildingService.getBuildingSlotByUniqueId(this.currentSlotUniqueId)?.available_for_construction;
      if (!buildingIds || index >= buildingIds.length) return;
      
      const buildingId = buildingIds[index];
      const buildingConfig = this.buildingService.getBuildingConfig(buildingId) as BuildingConfig;
      if (!buildingConfig) return;
      
      const cost = buildingConfig.cost?.construction || 0;
      const isAffordable = totalAvailable >= cost;
      
      // Update cost renderer affordability directly
      if (index < this.buildingCostRenderers.length) {
        this.buildingCostRenderers[index].setAffordable(isAffordable);
      }
    });
  }

  /**
   * Create the escape key handler
   */
  private createEscapeKeyHandler(): void {
    // Setup Escape key to close menu
    if (this.scene.input && this.scene.input.keyboard) {
      this.escapeKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escapeKey.on('down', () => {
        this.handleEscapeKey();
      });
    }
  }

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
    const buttonX = this.menuX + this.panelMarginX + index * (CARD_WIDTH + this.buttonSpacingX);  
    const buttonY = this.menuY + this.menuHeight / 3;

    const buildingConfig = this.buildingService.getBuildingConfig(buildingId) as BuildingConfig;
    const buildingLimitNotReached = !this.buildingService.reachedConstructedBuildingLimit(buildingId);
    const onBuildingSelected = buildingLimitNotReached ? (renderer: SimpleCardRenderer) => { this.onBuildingSelected(buildingId, renderer); } : undefined;

    // Create a simple card for the building option
    const buildingCard = new SimpleCardRenderer(
      this.scene, 
      buttonX + CARD_WIDTH/2, 
      buttonY,
      'panel_wood_paper',
      buildingConfig.image,
      1,
      buildingLimitNotReached,
      onBuildingSelected
    );

    // Add count limit renderer above the cost renderer
    const currentBuildingCount = this.buildingService.getConstructedBuildingCount(buildingId);
    const countLimitRenderer = new CountLimitRenderer(
      this.scene,
      0,
      CARD_HEIGHT/2 + 20,
      currentBuildingCount,
      buildingConfig.limit || undefined
    );
    buildingCard.getContainer().add(countLimitRenderer.getContainer());
    this.buildingCountRenderers.push(countLimitRenderer);
    
    // Use CostRenderer for the cost display
    let costRenderer: CostRenderer | null = null;
    if (buildingLimitNotReached) {
      const cost = buildingConfig.cost?.construction || 0;
      costRenderer = new CostRenderer(
        this.scene,
        cost,
        0,
        CARD_HEIGHT/2 + 50,
        ResourceType.Construction
      );
      // Initialize with default affordability (will be updated in updateBuildingOptionCostColors)
      const initiallyAffordable = this.resourcePanelRenderer.totalAvailable() >= cost;
      costRenderer.setAffordable(initiallyAffordable);
      // Add to the card container
      buildingCard.getContainer().add(costRenderer.getContainer());
      this.buildingCostRenderers.push(costRenderer);
    }
    
    // Add to tracking arrays
    this.buildingCards.push(buildingCard);
    
    return buildingCard.getContainer();
  }
  
  /**
   * Called when a building is selected from the menu
   * @param buildingId The ID of the selected building
   */
  private onBuildingSelected(buildingId: string, renderer: SimpleCardRenderer): void {    
    // If the building is already selected, deselect it
    if (this.selectedBuildingId === buildingId) {
      this.selectedBuildingId = '';
      this.selectedBuildingRenderer?.setSelected(false);
      this.selectedBuildingRenderer = null;
      this.resourcePanelRenderer.setTarget(false, 0);
      return;
    }
    
    // Deselect previously selected building if any
    if (this.selectedBuildingRenderer) {
      this.selectedBuildingRenderer.setSelected(false);
    }
    
    // Set the selected building
    this.selectedBuildingId = buildingId;
    this.selectedBuildingRenderer = renderer;
    this.resourcePanelRenderer.setTarget(true, this.buildingService.getBuildingConfig(buildingId)?.cost?.construction || 0);
    renderer.setSelected(true);
  }
  
  /**
   * Construct the selected building using selected cards
   */
  private constructSelectedBuilding(): void { 
    const constructed = this.buildingService.constructBuilding(this.selectedBuildingId, this.currentSlotUniqueId);
    
    // Hide the menu
    this.hide();
  }
  
  /**
   * Clear all building buttons
   */
  private clearBuildingButtons(): void {
    // Destroy cost renderers
    this.buildingCostRenderers.forEach(costRenderer => {
      costRenderer.destroy();
    });
    
    // Destroy count limit renderers
    this.buildingCountRenderers.forEach(countRenderer => {
      countRenderer.destroy();
    });
    
    this.buildingCards.forEach(card => {
      card.destroy();
    });
    
    this.buildingCards = [];
    this.buildingButtons = [];
    this.buildingCostRenderers = [];
    this.buildingCountRenderers = [];
  }

  public destroy(): void {
    // Remove keyboard listener
    if (this.escapeKey) {
      this.escapeKey.removeAllListeners();
    }
    
    // Destroy all cards and cost renderers
    this.buildingCards.forEach(card => {
      card.destroy();
    });
    
    this.buildingCostRenderers.forEach(costRenderer => {
      costRenderer.destroy();
    });
    
    // Destroy count limit renderers
    this.buildingCountRenderers.forEach(countRenderer => {
      countRenderer.destroy();
    });
    
    // Destroy the resource panel
    if (this.resourcePanelRenderer) {
      this.resourcePanelRenderer.destroy();
    }
    
    this.menuContainer.destroy();
  }
} 