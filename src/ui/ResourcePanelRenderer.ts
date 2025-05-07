import Phaser from 'phaser';
import { ResourceType } from '../entities/Types';
import { ResourceService } from '../services/ResourceService';
import { GameUI } from '../ui/GameUI';
import { CARD_WIDTH } from './CardRenderer';
import { PlayerHandRenderer } from './PlayerHandRenderer';

/**
 * Renders a resource panel that allows the player to select cards,
 * see acquired and selected resource values, and perform an action with them
 */
export class ResourcePanelRenderer {
  private scene: Phaser.Scene;
  private playerHandRenderer: PlayerHandRenderer;
  private displayContainer: Phaser.GameObjects.Container;
  private resourcePanel!: Phaser.GameObjects.NineSlice;
  private selectionText!: Phaser.GameObjects.Text;
  private acquiredText!: Phaser.GameObjects.Text;
  private selectAllButton!: Phaser.GameObjects.NineSlice;
  private selectAllButtonText!: Phaser.GameObjects.Text;
  private playCardsButton!: Phaser.GameObjects.NineSlice;
  private playCardsButtonText!: Phaser.GameObjects.Text;
  private applyButton!: Phaser.GameObjects.NineSlice;
  private applyButtonText!: Phaser.GameObjects.Text;
  private resourceIcon!: Phaser.GameObjects.Image;
  private selectedResourceIcon!: Phaser.GameObjects.Image;
  
  private resourceType: ResourceType;
  private applyButtonLabel: string;
  private applyCallback: () => void;
  private hasTarget: boolean = false;
  private targetCost: number = 0;
  private resourceService: ResourceService;
  private isSubscribedToResourceEvents: boolean = false;

  /**
   * Create a new ResourcePanelRenderer
   * @param scene The Phaser scene to render in
   * @param playerHandRenderer The player hand renderer for card selection
   * @param resourceType The type of resource to track (power/construction/invention)
   * @param applyButtonLabel Label for the apply button (e.g., "Purchase", "Construct")
   * @param applyCallback Callback function when apply button is clicked
   * @param resourceService Resource service for managing resources
   */
  constructor(
    scene: Phaser.Scene,
    playerHandRenderer: PlayerHandRenderer,
    resourceType: ResourceType,
    applyButtonLabel: string,
    applyCallback: () => void,
    resourceService: ResourceService
  ) {
    this.scene = scene;
    this.playerHandRenderer = playerHandRenderer;
    this.resourceType = resourceType;
    this.applyButtonLabel = applyButtonLabel;
    this.applyCallback = applyCallback;
    this.resourceService = resourceService;
    
    // Create container to hold all panel elements
    this.displayContainer = this.scene.add.container(0, 0);
    
    // Create the resource panel
    this.createResourcePanel();
    
    // Subscribe to player hand card selection changes
    this.playerHandRenderer.on(
      'selection-changed',
      this.onCardSelectionChanged,
      this
    );

    // Subscribe to resource service events
    this.subscribeToResourceEvents();
  }
  
  /**
   * Creates the resource panel that covers the "Discard and draw" button
   */
  private createResourcePanel(): void {
    const cardWidth = CARD_WIDTH;
    // Use the player hand panel height dimensions from GameUI class calculation
    const { width, height } = this.scene.cameras.main;
    const panelHeight = height * GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION;
    const marginX = 20;
    const panelWidth = cardWidth + 2 * marginX;
    
    // Calculate the position based on the player hand panel
    const handPanelY = height - panelHeight;
    
    // Create selection panel with the same dimensions as the discard button
    this.resourcePanel = this.scene.add['nineslice'](
      0,
      handPanelY,
      'panel_metal_corners_metal_nice',
      undefined,
      panelWidth,
      panelHeight,
      20,
      20,
      20,
      20
    );
    this.resourcePanel.setOrigin(0, 0);
    this.resourcePanel.setTint(0x666666); // Dark grey tint
    
    // Add "Selected: X" text with the resource icon
    const resourceTextX = panelWidth / 2 - marginX // centered horizontally. -marginX to give space for the image
    const selectedY = handPanelY + 90;
    this.selectionText = this.scene.add.text(
      resourceTextX,
      selectedY,
      'Selected: 0',
      {
        fontSize: '18px', 
        color: '#ffffff',
        align: 'center'
      }
    );
    this.selectionText.setOrigin(0.5, 1);
    
    // Add resource icon next to "Selected: X"
    const resourceIconKey = this.getResourceIconKey();
    this.selectedResourceIcon = this.scene.add.image(
      panelWidth - marginX / 2,
      selectedY + 5,
      resourceIconKey
    );
    this.selectedResourceIcon.setOrigin(1, 1);
    this.selectedResourceIcon.setScale(0.6);
    
    // Add "Acquired: X" text with resource icon
    const acquiredY = handPanelY + 50;
    this.acquiredText = this.scene.add.text(
      resourceTextX,
      acquiredY,
      `Acquired: ${this.getAcquiredResourceValue()}`,
      {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }
    );
    this.acquiredText.setOrigin(0.5, 1);
    
    // Add resource icon
    this.resourceIcon = this.scene.add.image(
      panelWidth - marginX / 2, 
      acquiredY + 5,
      resourceIconKey
    );
    this.resourceIcon.setOrigin(1, 1);
    this.resourceIcon.setScale(0.6);
    
    // Create "Select All" button
    const buttonWidth = 150;
    const buttonHeight = 35;
    const buttonX = marginX + (cardWidth / 2);
    const buttonY = handPanelY + 130;
    const buttonSpacingY = 10;
    
    this.selectAllButton = this.scene.add['nineslice'](
      buttonX,
      buttonY,
      'panel_wood_corners_metal',
      undefined,
      buttonWidth,
      buttonHeight,
      20,
      20,
      20,
      20
    );
    this.selectAllButton.setOrigin(0.5, 0.5);
    
    // Create button text
    this.selectAllButtonText = this.scene.add.text(
      buttonX,
      buttonY,
      'Select All',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.selectAllButtonText.setOrigin(0.5, 0.5);
    
    this.selectAllButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.selectAllCardsWithResource();
      });
    
    this.selectAllButton.on('pointerover', () => {
      this.selectAllButton.setScale(1.05);
      this.selectAllButtonText.setScale(1.05);
    });
    
    this.selectAllButton.on('pointerout', () => {
      this.selectAllButton.setScale(1);
      this.selectAllButtonText.setScale(1);
    });
    
    // Create Play Cards button
    const playCardsButtonY = buttonY + buttonHeight + buttonSpacingY;
    
    this.playCardsButton = this.scene.add['nineslice'](
      buttonX,
      playCardsButtonY,
      'panel_wood_corners_metal',
      undefined,
      buttonWidth,
      buttonHeight,
      20,
      20,
      20,
      20
    );
    this.playCardsButton.setOrigin(0.5, 0.5);
    
    // Create play cards button text
    this.playCardsButtonText = this.scene.add.text(
      buttonX,
      playCardsButtonY,
      'Play Cards',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.playCardsButtonText.setOrigin(0.5, 0.5);
    
    // Make play cards button interactive
    this.playCardsButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playSelectedCards();
      });
    
    // Add hover effects for play cards button
    this.playCardsButton.on('pointerover', () => {
      this.playCardsButton.setScale(1.05);
      this.playCardsButtonText.setScale(1.05);
    });
    
    this.playCardsButton.on('pointerout', () => {
      this.playCardsButton.setScale(1);
      this.playCardsButtonText.setScale(1);
    });

    // Create Apply button (Purchase, Construct, etc.)
    const applyButtonY = playCardsButtonY + buttonHeight + buttonSpacingY;

    this.applyButton = this.scene.add['nineslice'](
      buttonX,
      applyButtonY,
      'panel_wood_corners_metal',
      undefined,
      buttonWidth,
      buttonHeight,
      20,
      20,
      20,
      20
    );
    this.applyButton.setOrigin(0.5, 0.5);
    
    // Create apply button text
    this.applyButtonText = this.scene.add.text(
      buttonX,
      applyButtonY,
      this.applyButtonLabel,
      {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.applyButtonText.setOrigin(0.5, 0.5);
    
    // Initially disable the apply button
    this.setApplyButtonState(false);
    
    // Make apply button interactive
    this.applyButton.setInteractive({ useHandCursor: true });
    this.applyButton.on('pointerdown', () => { this.onApplyButtonClicked(); });
    
    // Add hover effects for apply button
    this.applyButton.on('pointerover', () => {
      if (this.canAfford()) {
        this.applyButton.setScale(1.05);
        this.applyButtonText.setScale(1.05);
      }
    });
    
    this.applyButton.on('pointerout', () => {
      this.applyButton.setScale(1);
      this.applyButtonText.setScale(1);
    });
    
    // Add all elements to the display container
    this.displayContainer.add(this.resourcePanel);
    this.displayContainer.add(this.selectionText);
    this.displayContainer.add(this.selectedResourceIcon);
    this.displayContainer.add(this.acquiredText);
    this.displayContainer.add(this.resourceIcon);
    this.displayContainer.add(this.selectAllButton);
    this.displayContainer.add(this.selectAllButtonText);
    this.displayContainer.add(this.playCardsButton);
    this.displayContainer.add(this.playCardsButtonText);
    this.displayContainer.add(this.applyButton);
    this.displayContainer.add(this.applyButtonText);
    
    // Initialize the buttons state
    this.updateButtonStates();
  }
  
  /**
   * Get the resource icon key based on the resource type
   */
  private getResourceIconKey(): string {
    switch (this.resourceType) {
      case ResourceType.Power:
        return 'resource_power';
      case ResourceType.Construction:
        return 'resource_construction';
      case ResourceType.Invention:
        return 'resource_invention';
      default:
        throw new Error(`Unknown resource type: ${this.resourceType}`);
    }
  }
  
  /**
   * Handler for card selection changes
   */
  private onCardSelectionChanged(): void {
    this.updateSelectionText();
    this.updateButtonStates();
  }
  
  /**
   * Update all button states based on current selections
   */
  private updateButtonStates(): void {
    // Check if any cards are selected and update play cards button state
    const hasSelectedCards = this.playerHandRenderer.getSelectedCardIds().length > 0;
    this.setPlayCardsButtonState(hasSelectedCards);
    
    // Update apply button state
    this.setApplyButtonState(this.hasTarget && this.canAfford());
  }
  
  /**
   * Set the apply button state to enabled or disabled
   * @param enabled Whether the button should be enabled
   */
  private setApplyButtonState(enabled: boolean): void {
    // Safety checks to ensure all objects still exist
    if (!this.applyButton || !this.applyButton.scene || !this.applyButton.scene.sys) {
      return;
    }
    
    if (enabled) {
      this.applyButton.setTint(0xffffff);
      this.applyButtonText.setTint(0xffffff);
      this.applyButton.setInteractive({ useHandCursor: true });
    } else {
      this.applyButton.setTint(0x999999);
      this.applyButtonText.setTint(0x999999);
      this.applyButton.disableInteractive();
    }
  }
  
  /**
   * Set the play cards button state to enabled or disabled
   * @param enabled Whether the button should be enabled
   */
  private setPlayCardsButtonState(enabled: boolean): void {
    // Safety checks to ensure all objects still exist
    if (!this.playCardsButton || !this.playCardsButton.scene || !this.playCardsButton.scene.sys) {
      return;
    }
    
    if (enabled) {
      this.playCardsButton.setTint(0xffffff);
      this.playCardsButtonText.setTint(0xffffff);
      this.playCardsButton.setInteractive({ useHandCursor: true });
    } else {
      this.playCardsButton.setTint(0x999999);
      this.playCardsButtonText.setTint(0x999999);
      this.playCardsButton.disableInteractive();
    }
  }
  
  /**
   * Update the selection text to show total selected resource value
   */
  private updateSelectionText(): void {
    const selectedValue = this.getSelectedResourceValue();
    this.selectionText.setText(`Selected: ${selectedValue}`);
  }
  
  /**
   * Get the selected resource value based on resource type
   */
  private getSelectedResourceValue(): number {
    switch (this.resourceType) {
      case ResourceType.Power:
        return this.playerHandRenderer.getSelectedPowerValue();
      case ResourceType.Construction:
        return this.playerHandRenderer.getSelectedConstructionValue();
      case ResourceType.Invention:
        return this.playerHandRenderer.getSelectedInventionValue();
      default:
        throw new Error(`Unknown resource type: ${this.resourceType}`);
    }
  }
  
  /**
   * Selects all cards in the player's hand that have resource value
   */
  private selectAllCardsWithResource(): void {
    // Get all cards from the player hand renderer
    // TODO this should use a method on the player hand renderer
    const cards = this.playerHandRenderer['currentCards'];
    const idsToSelect: string[] = [];
    const idsToDeselect: string[] = [];
    
    // Determine which cards to select and deselect based on resource value
    cards.forEach(card => {
      let resourceValue = 0;
      
      switch (this.resourceType) {
        case ResourceType.Power:
          resourceValue = card.getPowerValue();
          break;
        case ResourceType.Construction:
          resourceValue = card.getConstructionValue();
          break;
        case ResourceType.Invention:
          resourceValue = card.getInventionValue();
          break;
      }
      
      if (resourceValue >= 1) {
        idsToSelect.push(card.unique_id);
      } else {
        idsToDeselect.push(card.unique_id);
      }
    });
    
    // Pass the IDs to the player hand renderer
    this.playerHandRenderer.selectAndDeselectCardsByIds(idsToSelect, idsToDeselect);
  }
  
  /**
   * Play selected cards from the player's hand
   */
  private playSelectedCards(): void {
    // 1. Get all selected card IDs
    const selectedCardIds = this.playerHandRenderer.getSelectedCardIds();
    
    // 2. Get the selected resource value
    const selectedResourceValue = this.getSelectedResourceValue();
    
    // 3. Emit an event with selected resource value to be handled by parent
    this.scene.events.emit('resourcePanel-playCards', {
      type: this.resourceType,
      value: selectedResourceValue,
      cardIds: selectedCardIds
    });
    
    // 4. Discard all selected cards using PlayerHandRenderer's method
    this.playerHandRenderer.discardCardsByUniqueIds(selectedCardIds);
    
    // 5. Deselect all cards
    this.playerHandRenderer.clearCardSelection();
    
    // 6. Add resources to the resource service
    // TODO move this to a method
    switch (this.resourceType) {
      case ResourceType.Power:
        this.resourceService.addPower(selectedResourceValue);
        break;
      case ResourceType.Construction:
        this.resourceService.addConstruction(selectedResourceValue);
        break;
      case ResourceType.Invention:
        this.resourceService.addInvention(selectedResourceValue);
        break;
    }
    
    // 7. Update the acquired text display
    this.updateAcquiredText();
    
    // 8. Update button states
    this.updateButtonStates();
  }
  
  /**
   * Check if the player can afford the targeted item
   */
  private canAfford(): boolean {
    if (!this.hasTarget) return false;
    
    return this.totalAvailable() >= this.targetCost;
  }
  
  /**
   * Returns the total available resources (acquired + selected)
   * @returns The sum of acquired and selected resources
   */
  public totalAvailable(): number {
    const selectedValue = this.getSelectedResourceValue();
    const acquiredValue = this.getAcquiredResourceValue();
    return acquiredValue + selectedValue;
  }
  
  /**
   * Set the target item that will be purchased/constructed/etc.
   * @param hasTarget Whether there is a valid target selected
   * @param cost The cost of the target item
   */
  public setTarget(hasTarget: boolean, cost: number = 0): void {
    this.hasTarget = hasTarget;
    this.targetCost = hasTarget ? cost : 0;
    this.updateButtonStates();
  }
  
  /**
   * Update the acquired text to show the current resource value
   */
  public updateAcquiredText(): void {
    if (this.acquiredText) {
      const acquiredValue = this.getAcquiredResourceValue();
      this.acquiredText.setText(`Acquired: ${acquiredValue}`);
    }
  }
  
  /**
   * Get the acquired resource value from the resource service
   */
  private getAcquiredResourceValue(): number {
    switch (this.resourceType) {
      case ResourceType.Power:
        return this.resourceService.getPower();
      case ResourceType.Construction:
        return this.resourceService.getConstruction();
      case ResourceType.Invention:
        return this.resourceService.getInvention();
      default:
        throw new Error(`Unknown resource type: ${this.resourceType}`);
    }
  }
  
  /**
   * Get the container that holds all panel elements
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.displayContainer;
  }
  
  /**
   * Subscribe to resource changed events from the resource service
   */
  private subscribeToResourceEvents(): void {
    if (!this.isSubscribedToResourceEvents) {
      this.resourceService.on('resource-changed', this.onResourceChanged, this);
      this.isSubscribedToResourceEvents = true;
    }
  }

  /**
   * Unsubscribe from resource changed events
   */
  private unsubscribeFromResourceEvents(): void {
    if (this.isSubscribedToResourceEvents) {
      this.resourceService.off('resource-changed', this.onResourceChanged, this);
      this.isSubscribedToResourceEvents = false;
    }
  }

  /**
   * Handler for resource change events
   */
  private onResourceChanged(): void {
    this.updateAcquiredText();
    this.updateButtonStates();
  }
  
  /**
   * Show the resource panel
   */
  public show(): void {
    this.displayContainer.setVisible(true);
    this.subscribeToResourceEvents();
    this.updateSelectionText();
    this.updateAcquiredText();
    this.updateButtonStates();
  }
  
  /**
   * Hide the resource panel
   */
  public hide(): void {
    this.displayContainer.setVisible(false);
    this.unsubscribeFromResourceEvents();
  }
  
  /**
   * Clean up resources when destroying this renderer
   */
  public destroy(): void {
    // Remove event listeners first
    this.playerHandRenderer.off('selection-changed', this.onCardSelectionChanged, this);
    this.unsubscribeFromResourceEvents();
    
    // Safety check - make sure we have valid references before destroying
    const safeDestroy = (obj: any) => {
      if (obj && obj.scene && obj.scene.sys) {
        obj.destroy();
      }
    };
    
    // Destroy all UI elements
    safeDestroy(this.resourcePanel);
    safeDestroy(this.selectionText);
    safeDestroy(this.acquiredText);
    safeDestroy(this.selectAllButton);
    safeDestroy(this.selectAllButtonText);
    safeDestroy(this.playCardsButton);
    safeDestroy(this.playCardsButtonText);
    safeDestroy(this.applyButton);
    safeDestroy(this.applyButtonText);
    safeDestroy(this.resourceIcon);
    safeDestroy(this.selectedResourceIcon);
    
    // Make sure container is destroyed last and only if valid
    if (this.displayContainer && this.displayContainer.scene && this.displayContainer.scene.sys) {
      this.displayContainer.destroy();
    }
    
    // Clear references
    this.scene = null as any; // Force clear the reference
  }
  
  /**
   * Handle apply button click
   */
  private onApplyButtonClicked(): void {
    this.playSelectedCards();
    this.applyCallback();
  }
  
  /**
   * Set a new acquired resource value and update the UI
   * This is now only for backward compatibility and shouldn't be used.
   * Resources should be managed through ResourceService.
   * @deprecated Use ResourceService directly instead
   * @param value The new acquired resource value
   */
  public setAcquiredResourceValue(value: number): void {
    // This method is maintained for backward compatibility
    // Set the value in the resource service instead
    switch (this.resourceType) {
      case ResourceType.Power:
        // Reset existing power and add new value
        this.resourceService.consumePower(this.resourceService.getPower());
        this.resourceService.addPower(value);
        break;
      case ResourceType.Construction:
        // Reset existing construction and add new value
        this.resourceService.consumeConstruction(this.resourceService.getConstruction());
        this.resourceService.addConstruction(value);
        break;
      case ResourceType.Invention:
        // Reset existing invention and add new value
        this.resourceService.consumeInvention(this.resourceService.getInvention());
        this.resourceService.addInvention(value);
        break;
    }
    
    this.updateAcquiredText();
    this.updateButtonStates();
  }
} 