import Phaser from 'phaser';
import { StickerConfig } from '../entities/Sticker';
import { DeckService } from '../services/DeckService';
import { ResourceService } from '../services/ResourceService';
import { StickerRegistry } from '../services/StickerRegistry';
import { StickerShopService } from '../services/StickerShopService';
import { CardOverlayRenderer } from './CardOverlayRenderer';
import { PlayerHandRenderer, PlayerHandRendererEvents } from './PlayerHandRenderer';
import { ResourcePanelRenderer, ResourceType } from './ResourcePanelRenderer';
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
  private resourceService?: ResourceService; // TODO make not optional
  private stickerShopService: StickerShopService;
  private playerHandRenderer: PlayerHandRenderer;
  private cardOverlayRenderer: CardOverlayRenderer | null = null;
  private deckService: DeckService;
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  private resourcePanelRenderer!: ResourcePanelRenderer;
  
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
    
    // Initialize resource panel renderer
    this.initResourcePanelRenderer();
    
    // Set up event handlers for resource panel events
    this.setupResourcePanelEventHandlers();
  }
  
  /**
   * Initialize the resource panel renderer
   */
  private initResourcePanelRenderer(): void {
    // Create the resource panel renderer
    this.resourcePanelRenderer = new ResourcePanelRenderer(
      this.scene,
      this.playerHandRenderer,
      ResourceType.INVENTION,
      'Purchase',
      () => this.purchaseSticker(),
      this.resourceService as ResourceService
    );
  }
  
  /**
   * Set up event handlers for resource panel events
   */
  private setupResourcePanelEventHandlers(): void {
    // Handle resource panel play cards event
    this.scene.events.on('resourcePanel-playCards', (data: any) => {
      if (data.type === ResourceType.INVENTION) {
        // Add resources to the resource service
        if (this.resourceService) {
          this.resourceService.addInvention(data.value);
        }
        
        // Update sticker affordability
        this.updateStickersAffordability();
      }
    });
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
    // If a sticker is selected, update its affordability based on current selected cards
    if (this.selectedSticker) {
      this.resourcePanelRenderer.setTarget(this.canAffordSticker(), this.selectedSticker.cost);
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
    // Only react to service state changes if they don't match our current state
    // This prevents infinite loops when we update the service in our show/hide methods
    if (isOpen !== this.isVisible) {
      if (isOpen) {
        this.show();
      } else {
        this.hide();
      }
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
        this.hide();
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
    this.displayContainer.add(this.resourcePanelRenderer.getContainer());
    
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
    
    // Update the resource panel target state with sticker cost
    this.resourcePanelRenderer.setTarget(this.canAffordSticker(), stickerConfig.cost);
  }
  
  /**
   * Public method to show the sticker shop
   */
  public show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.displayContainer.setVisible(true);
      
      // Set the shop state in the service to maintain consistency
      this.stickerShopService.setShopState(true);
      
      // Setup Esc key to close the shop
      if (this.scene.input.keyboard) {
        this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        if (this.escKey) {
          // Use a named method instead of an inline arrow function for better cleanup
          this.escKey.on('down', this.handleEscapeKey, this);
        }
      }
      
      // Show and update the resource panel
      this.resourcePanelRenderer.show();
      
      // Update acquired invention value from resource service
      if (this.resourceService) {
        this.resourcePanelRenderer.setAcquiredResourceValue(this.resourceService.getInvention());
      }
      
      // Update sticker affordability based on current resources and selections
      this.updateStickersAffordability();
    }
  }
  
  /**
   * Handle Escape key press to close the shop
   */
  private handleEscapeKey(): void {
    this.hide();
  }
  
  /**
   * Hide the shop UI
   */
  public hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.displayContainer.setVisible(false);
      
      // Set the shop state in the service to maintain consistency
      this.stickerShopService.setShopState(false);
      
      // Remove Esc key listener
      if (this.escKey) {
        this.escKey.removeListener('down', this.handleEscapeKey, this);
        this.escKey = null;
      }
      
      // Hide the resource panel
      this.resourcePanelRenderer.hide();
      
      // Deselect sticker when closing the shop
      this.deselectSticker();
    }
  }
  
  /**
   * Toggle the shop visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
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
    // Remove event listener from sticker shop service
    this.stickerShopService.off(
      StickerShopService.Events.SHOP_STATE_CHANGED, 
      this.onShopStateChanged,
      this
    );
    
    // Remove Esc key listener if active
    if (this.escKey) {
      this.escKey.removeListener('down', this.handleEscapeKey, this);
      this.escKey = null;
    }
    
    // Remove resource panel event listeners
    this.scene.events.off('resourcePanel-playCards');
    
    // Clear all sticker renderers
    this.clearStickerRenderers();
    
    // Destroy the card overlay renderer
    if (this.cardOverlayRenderer) {
      this.cardOverlayRenderer.destroy();
    }
    
    // Destroy the resource panel
    this.resourcePanelRenderer.destroy();
    
    // Destroy all UI elements
    if (this.shopPanel) {
      this.shopPanel.destroy();
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
   * Deselect the currently selected sticker
   */
  private deselectSticker(): void {
    // Deselect the sticker in data
    this.selectedSticker = null;
    
    // Unhighlight all stickers
    this.stickerRenderers.forEach(renderer => {
      renderer.setSelected(false);
    });
    
    // Update the resource panel target with no target and zero cost
    this.resourcePanelRenderer.setTarget(false, 0);
  }
  
  /**
   * Purchase and apply the currently selected sticker
   */
  private purchaseSticker(): void {
    if (!this.selectedSticker || !this.canAffordSticker()) return;

    // Store the selected sticker in a local variable
    const stickerToApply = this.selectedSticker;
    
    // Deduct the sticker cost from ResourceService
    if (this.resourceService) {
      this.resourceService.consumeInvention(stickerToApply.cost);
      
      // Update the acquired resource value in the panel
      this.resourcePanelRenderer.setAcquiredResourceValue(this.resourceService.getInvention());
    }
    
    // Deselect the current sticker from the shop
    this.deselectSticker();
      
    // Set the sticker in the card overlay and show it
    this.cardOverlayRenderer?.setSticker(stickerToApply);
    this.cardOverlayRenderer?.show();
  }
} 