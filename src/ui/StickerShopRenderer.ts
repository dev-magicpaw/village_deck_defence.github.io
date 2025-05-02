import Phaser from 'phaser';
import { StickerConfig } from '../entities/Sticker';
import { ResourceService } from '../services/ResourceService';
import { StickerRegistry } from '../services/StickerRegistry';
import { StickerShopService } from '../services/StickerShopService';
import { GameUI } from '../ui/GameUI';
import { CARD_WIDTH } from './CardRenderer';
import { PlayerHandRenderer, PlayerHandRendererEvents } from './PlayerHandRenderer';
import { StickerInShopRenderer } from './StickerInShopRenderer';

/**
 * Renders the sticker shop when the sticker shop building is clicked
 */
export class StickerShopRenderer {
  private scene: Phaser.Scene;
  private stickerRegistry: StickerRegistry;
  private displayContainer: Phaser.GameObjects.Container;
  private isVisible: boolean = false;
  private shopPanel: Phaser.GameObjects.NineSlice | null = null;
  private stickerRenderers: StickerInShopRenderer[] = [];
  private selectedSticker: StickerConfig | null = null;
  private applyButton: Phaser.GameObjects.NineSlice | null = null;
  private applyButtonText: Phaser.GameObjects.Text | null = null;
  private onApplyCallback?: (stickerConfig: StickerConfig) => void;
  private resourceService?: ResourceService;
  private stickerShopService: StickerShopService;
  private playerHandRenderer: PlayerHandRenderer;
  private inventionIcon: Phaser.GameObjects.Image | null = null;
  
  // Selection panel elements
  private resourcePanel: Phaser.GameObjects.NineSlice | null = null;
  private selectionText: Phaser.GameObjects.Text | null = null;
  private acquiredText: Phaser.GameObjects.Text | null = null;
  private selectAllButton: Phaser.GameObjects.NineSlice | null = null;
  private selectAllButtonText: Phaser.GameObjects.Text | null = null;
  
  // Panel dimensions and position
  private panelX: number;
  private panelY: number;
  private panelWidth: number;
  private panelHeight: number;
  
  // Sticker visual properties
  private stickerSize: number = 100;
  private stickerSpacing: number = 20;
  private panelPadding: number = 40; // Single padding value for simplicity
  
  /**
   * Create a new StickerShopRenderer
   * @param scene The Phaser scene to render in
   * @param panelX X position of the panel
   * @param panelY Y position of the panel
   * @param panelWidth Width of the panel
   * @param panelHeight Height of the panel
   * @param resourceService Optional resource service for tracking acquired resources
   * @param onApplyCallback Callback for when a sticker is applied
   * @param stickerShopService Service managing the shop state
   * @param playerHandRenderer The player hand renderer for card selection
   */
  constructor(
    scene: Phaser.Scene,
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
    resourceService: ResourceService,
    onApplyCallback: (stickerConfig: StickerConfig) => void,
    stickerShopService: StickerShopService,
    playerHandRenderer: PlayerHandRenderer
  ) {
    this.scene = scene;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.resourceService = resourceService;
    this.onApplyCallback = onApplyCallback;
    this.stickerShopService = stickerShopService;
    this.playerHandRenderer = playerHandRenderer;
    
    // Get the sticker registry
    this.stickerRegistry = StickerRegistry.getInstance();
    
    // Create a container to hold the sticker shop
    this.displayContainer = this.scene.add.container(0, 0);
    this.displayContainer.setVisible(false);
    
    // Set a high depth to ensure it renders on top of other UI elements
    this.displayContainer.setDepth(1000);
    
    // Subscribe to shop state changes
    this.stickerShopService.on(
      StickerShopService.Events.SHOP_STATE_CHANGED, 
      this.onShopStateChanged,
      this
    );
    
    // Subscribe to player hand card selection changes
    this.playerHandRenderer.on(
      PlayerHandRendererEvents.SELECTION_CHANGED,
      this.onCardSelectionChanged,
      this
    );
  }
  
  /**
   * Handler for card selection changes
   */
  private onCardSelectionChanged(): void {
    this.updateSelectionText();
  }
  
  /**
   * Handler for shop state changes
   */
  private onShopStateChanged(isOpen: boolean): void {
    if (isOpen) {
      this._show();
    } else {
      this._hide();
    }
  }
  
  /**
   * Initialize the shop panel
   */
  public init(): void {
    // Create the shop panel using the specified background
    this.shopPanel = this.scene.add['nineslice'](
      this.panelX,
      this.panelY,
      'panel_metal_corners_metal_nice',
      undefined,
      this.panelWidth,
      this.panelHeight,
      20,
      20,
      20,
      20
    );
    this.shopPanel.setOrigin(0, 0);
    this.shopPanel.setTint(0x666666); // Dark grey tint
    
    // Add title text
    const titleText = this.scene.add.text(
      this.panelX + this.panelWidth / 2,
      this.panelY + 30,
      'Sticker Shop',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    titleText.setOrigin(0.5, 0.5);
    
    // Add close button using round_metal_cross image
    const closeButton = this.scene.add.image(
      this.panelX + this.panelWidth - 30,
      this.panelY + 30,
      'round_metal_cross'
    );
    closeButton.setScale(1.2);
    closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.stickerShopService.setShopState(false);
      });
    
    // Add hover effects for close button
    closeButton.on('pointerover', () => {
      closeButton.setScale(1.4);
    });
    
    closeButton.on('pointerout', () => {
      closeButton.setScale(1.2);
    });
    
    // Add all elements to the display container
    this.displayContainer.add(this.shopPanel);
    this.displayContainer.add(titleText);
    this.displayContainer.add(closeButton);
    
    // Create the resource panel that covers the "Discard and draw" button
    this.createResourcePanel();
    
    // Render all stickers
    this.renderStickers();
  }
  
  /**
   * Create the Apply button at the bottom of the shop
   * @deprecated The apply button is now created in the resource panel
   */
  private createApplyButton(): void {
    // No longer used as the button is now created in the resource panel
  }
  
  /**
   * Set the state of the apply button (enabled/disabled)
   * @param enabled Whether the button should be enabled
   */
  private setApplyButtonState(enabled: boolean): void {
    if (this.applyButton && this.applyButtonText) {
      if (enabled) {
        // Enable the button
        this.applyButton.clearTint();
        this.applyButton.setInteractive({ useHandCursor: true });
        this.applyButtonText.setColor('#ffffff');
      } else {
        // Disable the button
        this.applyButton.setTint(0x555555);
        this.applyButton.disableInteractive();
        this.applyButtonText.setColor('#888888');
      }
    }
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
    const panelWidth = cardWidth + 2 * marginX
    
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
    this.resourcePanel.setTint(0x666666); // Same dark grey tint as main panel
    
    // Add "Selected: X" text with the invention resource icon
    const resourceTextX = panelWidth / 2 - marginX // centered horizontaly. -marginX to give space for the image
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
    
    // Add invention resource icon next to "Selected: X"
    this.inventionIcon = this.scene.add.image(
      panelWidth - marginX / 2,
      selectedY + 5,
      'resource_invention'
    );
    this.inventionIcon.setOrigin(1, 1);
    this.inventionIcon.setScale(0.6);
    
    // Add "Acquired: X" text with invention resource icon
    const acquiredInvention = this.resourceService ? this.resourceService.getInvention() : 0;
    const acquiredY = handPanelY + 50
    this.acquiredText = this.scene.add.text(
      resourceTextX,
      acquiredY,
      `Acquired: ${acquiredInvention}`,
      {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }
    );
    this.acquiredText.setOrigin(0.5,1);
    
    // Add invention resource icon
    const resourceIcon = this.scene.add.image(
      panelWidth - marginX / 2, 
      acquiredY + 5,
      'resource_invention'
    );
    resourceIcon.setOrigin(1, 1);
    resourceIcon.setScale(0.6); // Scale down the icon to fit nicely
    
    // Create "Select All" button
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonX = marginX + (cardWidth - buttonWidth) / 2;
    const buttonY = handPanelY + panelHeight / 2 + 30;
    
    this.selectAllButton = this.scene.add['nineslice'](
      buttonX + buttonWidth / 2,
      buttonY,
      'panel_wood_arrows',
      undefined,
      buttonWidth,
      buttonHeight,
      10,
      10,
      10,
      10
    );
    this.selectAllButton.setOrigin(0.5, 0.5);
    
    // Create button text
    this.selectAllButtonText = this.scene.add.text(
      buttonX + buttonWidth / 2,
      buttonY,
      'Select All',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.selectAllButtonText.setOrigin(0.5, 0.5);
    
    // Make button interactive
    this.selectAllButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        // Select all cards in the player hand with at least 1 invention value
        // TODO: This should decide here, which cards to select / deselect and provide the respective unique_card ids to the playerHandRenderer
        
        // Get all cards from the player hand renderer
        const cards = this.playerHandRenderer['currentCards'];
        const idsToSelect: string[] = [];
        const idsToDeselect: string[] = [];
        
        // Determine which cards to select and deselect based on invention value
        cards.forEach(card => {
          if (card.getInventionValue() >= 1) {
            idsToSelect.push(card.unique_id);
          } else {
            idsToDeselect.push(card.unique_id);
          }
        });
        
        // Pass the IDs to the player hand renderer
        this.playerHandRenderer.selectAndDeselectCardsByIds(idsToSelect, idsToDeselect);        
      });
    
    // Add hover effects
    this.selectAllButton.on('pointerover', () => {
      this.selectAllButton?.setScale(1.05);
      this.selectAllButtonText?.setScale(1.05);
    });
    
    this.selectAllButton.on('pointerout', () => {
      this.selectAllButton?.setScale(1);
      this.selectAllButtonText?.setScale(1);
    });
    
    // Create Apply button below Select All button
    const applyButtonWidth = 120;
    const applyButtonHeight = 40;
    const applyButtonX = marginX + (cardWidth - applyButtonWidth) / 2;
    const applyButtonY = buttonY + buttonHeight + 20; // Position below Select All button
    
    this.applyButton = this.scene.add['nineslice'](
      applyButtonX + applyButtonWidth / 2,
      applyButtonY,
      'panel_wood_arrows',
      undefined,
      applyButtonWidth,
      applyButtonHeight,
      10,
      10,
      10,
      10
    );
    this.applyButton.setOrigin(0.5, 0.5);
    
    // Create apply button text
    this.applyButtonText = this.scene.add.text(
      applyButtonX + applyButtonWidth / 2,
      applyButtonY,
      'Apply',
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
    this.applyButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.selectedSticker && this.onApplyCallback) {
          this.onApplyCallback(this.selectedSticker);
        }
      });
    
    // Add hover effects for apply button
    this.applyButton.on('pointerover', () => {
      if (this.selectedSticker) {
        this.applyButton?.setScale(1.05);
        this.applyButtonText?.setScale(1.05);
      }
    });
    
    this.applyButton.on('pointerout', () => {
      this.applyButton?.setScale(1);
      this.applyButtonText?.setScale(1);
    });
    
    // Add to display container
    this.displayContainer.add(this.resourcePanel);
    this.displayContainer.add(this.selectionText);
    this.displayContainer.add(this.inventionIcon);
    this.displayContainer.add(this.acquiredText);
    this.displayContainer.add(resourceIcon);
    this.displayContainer.add(this.selectAllButton);
    this.displayContainer.add(this.selectAllButtonText);
    this.displayContainer.add(this.applyButton);
    this.displayContainer.add(this.applyButtonText);
  }
  
  /**
   * Render all available stickers in a grid layout
   */
  private renderStickers(): void {
    // Clear existing sticker renderers
    this.clearStickerRenderers();
    
    // Get all sticker configurations from the registry
    const stickerConfigs: StickerConfig[] = [];
    
    // Get stickers from the sticker registry
    // Since there's no direct method to get all stickers, we'll use the following approach
    const stickersData = this.scene.cache.json.get('stickers');
    if (stickersData && Array.isArray(stickersData)) {
      stickersData.forEach(stickerData => {
        const config = this.stickerRegistry.getStickerConfig(stickerData.id);
        if (config) {
          stickerConfigs.push(config);
        }
      });
    }
    
    // Sort stickers by cost (invention price) in ascending order
    stickerConfigs.sort((a, b) => {
      // First sort by cost
      const costDiff = a.cost - b.cost;
      
      // If costs are equal, sort alphabetically by name
      if (costDiff === 0) {
        return a.name.localeCompare(b.name);
      }
      
      return costDiff;
    });
    
    // Calculate layout for grid
    const maxStickersPerRow = Math.floor((this.panelWidth - this.panelPadding * 2) / 
                                         (this.stickerSize + this.stickerSpacing));
    
    const startX = this.panelX + this.panelPadding + this.stickerSize / 2;
    const startY = this.panelY + 70 + this.stickerSize / 2;
    
    // Increased vertical spacing between rows to prevent overlap
    const rowSpacing = this.stickerSize + this.stickerSpacing + 50;
    
    // Render each sticker
    stickerConfigs.forEach((stickerConfig, index) => {
      const row = Math.floor(index / maxStickersPerRow);
      const col = index % maxStickersPerRow;
      
      const x = startX + col * (this.stickerSize + this.stickerSpacing);
      const y = startY + row * rowSpacing;
      
      // Create sticker renderer
      const stickerRenderer = new StickerInShopRenderer(
        this.scene,
        stickerConfig,
        x,
        y,
        this.stickerSize,
        (config) => this.onStickerClick(config)
      );
      
      this.stickerRenderers.push(stickerRenderer);
      this.displayContainer.add(stickerRenderer.getContainer());
    });
  }
  
  /**
   * Handle sticker click
   * @param stickerConfig The clicked sticker configuration
   */
  private onStickerClick(stickerConfig: StickerConfig): void {
    // Select the sticker
    this.selectedSticker = stickerConfig;
    console.log(`Sticker ${stickerConfig.name} selected`);
    
    // Highlight the selected sticker and unhighlight others
    this.stickerRenderers.forEach(renderer => {
      renderer.setSelected(renderer.getStickerConfig().id === stickerConfig.id);
    });
    
    // Enable the apply button
    this.setApplyButtonState(true);
  }
  
  /**
   * Internal method to show the shop UI
   */
  private _show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.displayContainer.setVisible(true);
      
      // Update the selection text when showing the shop
      this.updateSelectionText();
    }
  }
  
  /**
   * Internal method to hide the shop UI
   */
  private _hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.displayContainer.setVisible(false);
      
      // Deselect sticker when closing the shop
      this.deselectSticker();
    }
  }
  
  /**
   * Check if the sticker shop is currently visible
   */
  public getIsVisible(): boolean {
    return this.isVisible;
  }
  
  /**
   * Clear all sticker renderers
   */
  private clearStickerRenderers(): void {
    this.stickerRenderers.forEach(renderer => {
      renderer.destroy();
    });
    this.stickerRenderers = [];
  }
  
  /**
   * Update the shop when stickers change
   */
  public update(): void {
    if (this.isVisible) {
      this.renderStickers();
    }
  }
  
  /**
   * Destroy this renderer and all its visual elements
   */
  public destroy(): void {
    // Remove event listener
    this.stickerShopService.off(
      StickerShopService.Events.SHOP_STATE_CHANGED, 
      this.onShopStateChanged,
      this
    );
    
    // Clear all sticker renderers
    this.clearStickerRenderers();
    
    // Destroy all UI elements
    if (this.shopPanel) {
      this.shopPanel.destroy();
    }
    if (this.applyButton) {
      this.applyButton.destroy();
    }
    if (this.applyButtonText) {
      this.applyButtonText.destroy();
    }
    if (this.resourcePanel) {
      this.resourcePanel.destroy();
    }
    if (this.selectionText) {
      this.selectionText.destroy();
    }
    if (this.acquiredText) {
      this.acquiredText.destroy();
    }
    if (this.selectAllButton) {
      this.selectAllButton.destroy();
    }
    if (this.selectAllButtonText) {
      this.selectAllButtonText.destroy();
    }
    if (this.inventionIcon) {
      this.inventionIcon.destroy();
    }
    this.displayContainer.destroy();
  }
  
  /**
   * Get the currently selected sticker
   */
  public getSelectedSticker(): StickerConfig | null {
    return this.selectedSticker;
  }
  
  /**
   * Update the selection text to show total selected invention value
   */
  private updateSelectionText(): void {
    if (this.selectionText) {
      this.selectionText.setText(`Selected: ${this.playerHandRenderer.getSelectedInventionValue()}`);
    }
  }
  
  /**
   * Deselect the currently selected sticker
   */
  private deselectSticker(): void {
    // Deselect the sticker in data
    this.selectedSticker = null;
    
    // Unhighlight all stickers
    this.stickerRenderers.forEach(renderer => {
      renderer.setSelected(false);
    });
    
    // Disable the apply button
    this.setApplyButtonState(false);
    
    // Update selection text
    if (this.selectionText) {
      this.selectionText.setText('Selected: 0');
    }
  }
} 