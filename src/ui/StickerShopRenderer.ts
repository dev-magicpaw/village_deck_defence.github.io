import Phaser from 'phaser';
import { StickerConfig } from '../entities/Sticker';
import { DeckService } from '../services/DeckService';
import { ResourceService } from '../services/ResourceService';
import { StickerRegistry } from '../services/StickerRegistry';
import { StickerShopService } from '../services/StickerShopService';
import { GameUI } from '../ui/GameUI';
import { CardOverlayRenderer } from './CardOverlayRenderer';
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
  private purchaseButton: Phaser.GameObjects.NineSlice | null = null;
  private purchaseButtonText: Phaser.GameObjects.Text | null = null;
  private playCardsButton: Phaser.GameObjects.NineSlice | null = null;
  private playCardsButtonText: Phaser.GameObjects.Text | null = null;
  private resourceService?: ResourceService;
  private stickerShopService: StickerShopService;
  private playerHandRenderer: PlayerHandRenderer;
  private inventionIcon: Phaser.GameObjects.Image | null = null;
  private cardOverlayRenderer: CardOverlayRenderer | null = null;
  private deckService: DeckService;
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  
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
   * @param deckService Service for managing the deck and discard pile
   */
  constructor(
    scene: Phaser.Scene,
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
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.resourceService = resourceService;
    this.stickerShopService = stickerShopService;
    this.playerHandRenderer = playerHandRenderer;
    this.deckService = deckService;
    
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
   * Check if the player can afford the currently selected sticker
   * @returns True if the player has enough resources, false otherwise
   */
  private canAffordSticker(): boolean {
    if (!this.selectedSticker) return false;
    
    const acquiredInvention = this.resourceService ? this.resourceService.getInvention() : 0;
    const selectedInvention = this.playerHandRenderer.getSelectedInventionValue();
    const stickerCost = this.selectedSticker.cost;
    
    // Check if the total available invention value is enough to purchase the sticker
    const canAfford = (acquiredInvention + selectedInvention) >= stickerCost;    
    return canAfford;
  }
  
  /**
   * Handler for card selection changes
   */
  private onCardSelectionChanged(): void {
    this.updateSelectionText();
    
    // Check if any cards are selected and update play cards button state
    const hasSelectedCards = this.playerHandRenderer.getSelectedCardIds().length > 0;
    this.setPlayCardsButtonState(hasSelectedCards);
    
    // If a sticker is selected, check if we still have enough resources
    if (this.selectedSticker) {
      this.setPurchaseButtonState(this.canAffordSticker());
    }
    
    // Update affordability status for all stickers
    this.updateStickersAffordability();
  }
  
  /**
   * Update the affordability status of all stickers based on current resources and selections
   */
  private updateStickersAffordability(): void {
    // Calculate total available invention (acquired + selected)
    const acquiredInvention = this.resourceService ? this.resourceService.getInvention() : 0;
    const selectedInvention = this.playerHandRenderer.getSelectedInventionValue();
    const totalAvailable = acquiredInvention + selectedInvention;
    
    // Update each sticker renderer
    this.stickerRenderers.forEach(renderer => {
      const stickerCost = renderer.getStickerConfig().cost;
      const isUnaffordable = stickerCost > totalAvailable;
      renderer.setUnaffordable(isUnaffordable);
    });
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
    
    // Initialize card overlay renderer
    this.initCardOverlayRenderer();
    
    // Render all stickers
    this.renderStickers();
  }
  
  /**
   * Initialize the card overlay renderer
   */
  private initCardOverlayRenderer(): void {
    // Initialize the card overlay renderer with the player hand renderer and a callback
    this.cardOverlayRenderer = new CardOverlayRenderer(
      this.scene,
      this.playerHandRenderer,
      this.deckService,
      undefined,
    );
  }
  
  /**
   * Set the state of the apply button (enabled/disabled)
   * @param enabled Whether the button should be enabled
   */
  private setPurchaseButtonState(enabled: boolean): void {
    if (this.purchaseButton && this.purchaseButtonText) {
      if (enabled) {
        // Enable the button
        this.purchaseButton.clearTint();
        this.purchaseButton.setInteractive({ useHandCursor: true });
        this.purchaseButtonText.setColor('#ffffff');
      } else {
        // Disable the button
        this.purchaseButton.setTint(0x555555);
        this.purchaseButton.disableInteractive();
        this.purchaseButtonText.setColor('#888888');
      }
    }
  }
  
  /**
   * Set the state of the play cards button (enabled/disabled)
   * @param enabled Whether the button should be enabled
   */
  private setPlayCardsButtonState(enabled: boolean): void {
    if (this.playCardsButton && this.playCardsButtonText) {
      if (enabled) {
        // Enable the button
        this.playCardsButton.clearTint();
        this.playCardsButton.setInteractive({ useHandCursor: true });
        this.playCardsButtonText.setColor('#ffffff');
      } else {
        // Disable the button
        this.playCardsButton.setTint(0x555555);
        this.playCardsButton.disableInteractive();
        this.playCardsButtonText.setColor('#888888');
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
    console.log('handPanelY', handPanelY);
    console.log('panelHeight', panelHeight);
    
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
    resourceIcon.setScale(0.6);
    
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
        // TODO this should be refactored into a method
        // Select all cards in the player hand with at least 1 invention value
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
    
    this.selectAllButton.on('pointerover', () => {
      this.selectAllButton?.setScale(1.05);
      this.selectAllButtonText?.setScale(1.05);
    });
    
    this.selectAllButton.on('pointerout', () => {
      this.selectAllButton?.setScale(1);
      this.selectAllButtonText?.setScale(1);
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
      this.playCardsButton?.setScale(1.05);
      this.playCardsButtonText?.setScale(1.05);
    });
    
    this.playCardsButton.on('pointerout', () => {
      this.playCardsButton?.setScale(1);
      this.playCardsButtonText?.setScale(1);
    });

    // Create Purchase button
    const purchaseButtonY = playCardsButtonY + buttonHeight + buttonSpacingY;

    this.purchaseButton = this.scene.add['nineslice'](
      buttonX,
      purchaseButtonY,
      'panel_wood_corners_metal',
      undefined,
      buttonWidth,
      buttonHeight,
      20,
      20,
      20,
      20
    );
    this.purchaseButton.setOrigin(0.5, 0.5);
    
    // Create purchase button text
    this.purchaseButtonText = this.scene.add.text(
      buttonX,
      purchaseButtonY,
      'Purchase',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.purchaseButtonText.setOrigin(0.5, 0.5);
    
    // Initially disable the purchase button
    this.setPurchaseButtonState(false);
    
    // Make purchase button interactive
    this.purchaseButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.purchaseSticker();
      });
    
    // Add hover effects for purchase button
    this.purchaseButton.on('pointerover', () => {
      if (this.selectedSticker && this.canAffordSticker()) {
        this.purchaseButton?.setScale(1.05);
        this.purchaseButtonText?.setScale(1.05);
      }
    });
    
    this.purchaseButton.on('pointerout', () => {
      this.purchaseButton?.setScale(1);
      this.purchaseButtonText?.setScale(1);
    });
    
    // Add to display container
    this.displayContainer.add(this.resourcePanel);
    this.displayContainer.add(this.selectionText);
    this.displayContainer.add(this.inventionIcon);
    this.displayContainer.add(this.acquiredText);
    this.displayContainer.add(resourceIcon);
    this.displayContainer.add(this.selectAllButton);
    this.displayContainer.add(this.selectAllButtonText);
    this.displayContainer.add(this.playCardsButton);
    this.displayContainer.add(this.playCardsButtonText);
    this.displayContainer.add(this.purchaseButton);
    this.displayContainer.add(this.purchaseButtonText);
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
    
    // Calculate the maximum potential invention value from all cards in player's hand
    let maxPotentialInvention = 0;
    if (this.resourceService) {
      // Include already acquired invention
      maxPotentialInvention = this.resourceService.getInvention();
    }
    
    // Add invention value from all cards in hand
    const cards = this.playerHandRenderer['currentCards'];
    if (cards && Array.isArray(cards)) {
      cards.forEach(card => {
        if (card.getInventionValue() > 0) {
          maxPotentialInvention += card.getInventionValue();
        }
      });
    }
    
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
      
      // Check if this sticker is unaffordable based on maximum potential invention
      const isUnaffordable = stickerConfig.cost > maxPotentialInvention;
      
      // Create sticker renderer
      const stickerRenderer = new StickerInShopRenderer(
        this.scene,
        stickerConfig,
        x,
        y,
        this.stickerSize,
        (config) => this.onStickerClick(config),
        isUnaffordable
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
    this.stickerRenderers.forEach(renderer => {
      renderer.setSelected(renderer.getStickerConfig().id === stickerConfig.id);
    });
    
    this.setPurchaseButtonState(this.canAffordSticker());
  }
  
  /**
   * Internal method to show the shop UI
   */
  private _show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.displayContainer.setVisible(true);
      
      // Setup Esc key to close the shop
      if (this.scene.input.keyboard) {
        this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        if (this.escKey) {
          this.escKey.on('down', () => {
            this.stickerShopService.setShopState(false);
          });
        }
      }
      
      // Update the selection text when showing the shop
      this.updateSelectionText();
      
      // Update acquired invention value from resource service
      this.updateAcquiredText();
      
      // Initialize play cards button state based on card selection
      const hasSelectedCards = this.playerHandRenderer.getSelectedCardIds().length > 0;
      this.setPlayCardsButtonState(hasSelectedCards);
      
      // Update sticker affordability based on current resources and selections
      this.updateStickersAffordability();
    }
  }
  
  /**
   * Internal method to hide the shop UI
   */
  private _hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.displayContainer.setVisible(false);
      
      // Remove Esc key listener
      if (this.escKey) {
        this.escKey.off('down');
        this.escKey = null;
      }
      
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
    
    // Remove Esc key listener if active
    if (this.escKey) {
      this.escKey.off('down');
      this.escKey = null;
    }
    
    // Clear all sticker renderers
    this.clearStickerRenderers();
    
    // Destroy the card overlay renderer
    if (this.cardOverlayRenderer) {
      this.cardOverlayRenderer.destroy();
    }
    
    // Destroy all UI elements
    if (this.shopPanel) {
      this.shopPanel.destroy();
    }
    if (this.purchaseButton) {
      this.purchaseButton.destroy();
    }
    if (this.purchaseButtonText) {
      this.purchaseButtonText.destroy();
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
    if (this.playCardsButton) {
      this.playCardsButton.destroy();
    }
    if (this.playCardsButtonText) {
      this.playCardsButtonText.destroy();
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
    this.setPurchaseButtonState(false);
    
    // Update selection text
    if (this.selectionText) {
      this.selectionText.setText('Selected: 0');
    }
  }
  
  /**
   * Purchase and apply the currently selected sticker
   */
  private purchaseSticker(): void {
    // Only proceed if a sticker is selected AND we can afford it
    if (this.selectedSticker && this.canAffordSticker()) {
      // Store the selected sticker in a local variable
      const stickerToApply = this.selectedSticker;

      // 1. Play any selected cards
      this.playSelectedCards();
      
      // 2. Deduct the sticker cost from ResourceService
      if (this.resourceService) {
        this.resourceService.consumeInvention(stickerToApply.cost);
      }

      // 3. Update the acquired text
      this.updateAcquiredText();
      
      // 4. Deselect the current sticker from the shop
      this.deselectSticker();
      
      // 5. Set the sticker in the card overlay and show it
      this.cardOverlayRenderer?.setSticker(stickerToApply);
      this.cardOverlayRenderer?.show();
    }
  }
  
  /**
   * Update the acquired text to show the current invention value
   */
  private updateAcquiredText(): void {
    if (this.acquiredText) {
      const acquiredInvention = this.resourceService ? this.resourceService.getInvention() : 0;
      this.acquiredText.setText(`Acquired: ${acquiredInvention}`);
      
      // Update purchase button state when acquired resources change
      if (this.selectedSticker) {
        this.setPurchaseButtonState(this.canAffordSticker());
      }
      
      // Update sticker affordability
      this.updateStickersAffordability();
    }
  }
  
  /**
   * Play selected cards from the player's hand
   */
  private playSelectedCards(): void {
    // 1. Get all selected card IDs
    const selectedCardIds = this.playerHandRenderer.getSelectedCardIds();
    
    const selectedInventionValue = this.playerHandRenderer.getSelectedInventionValue();
    
    // 2. Add their invention value to ResourceService
    if (this.resourceService) {
      this.resourceService.addInvention(selectedInventionValue);
    }
    
    // 3. Discard all selected cards using PlayerHandRenderer's method
    this.playerHandRenderer.discardCardsByUniqueIds(selectedCardIds);
    
    // 4. Deselect all cards
    this.playerHandRenderer.clearCardSelection();
    
    // 5. Update the acquired text
    this.updateAcquiredText();
    
    // 6. Disable the play cards button since no cards are selected anymore
    this.setPlayCardsButtonState(false);
  }
} 