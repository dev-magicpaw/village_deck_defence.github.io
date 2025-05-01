import Phaser from 'phaser';
import { StickerConfig } from '../entities/Sticker';
import { StickerRegistry } from '../services/StickerRegistry';
import { GameUI } from './GameUI';
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
  
  // Selection panel elements
  private resourcePanel: Phaser.GameObjects.NineSlice | null = null;
  private selectionText: Phaser.GameObjects.Text | null = null;
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
   * @param onApplyCallback Callback for when a sticker is applied
   */
  constructor(
    scene: Phaser.Scene,
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
    onApplyCallback?: (stickerConfig: StickerConfig) => void
  ) {
    this.scene = scene;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.onApplyCallback = onApplyCallback;
    
    // Get the sticker registry
    this.stickerRegistry = StickerRegistry.getInstance();
    
    // Create a container to hold the sticker shop
    this.displayContainer = this.scene.add.container(0, 0);
    this.displayContainer.setVisible(false);
    
    // Set a high depth to ensure it renders on top of other UI elements
    this.displayContainer.setDepth(1000);
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

    // Create apply button
    this.createApplyButton();
    
    // Create the resource panel that covers the "Discard and draw" button
    this.createResourcePanel();
    
    // Render all stickers
    this.renderStickers();
  }
  
  /**
   * Create the Apply button at the bottom of the shop
   */
  private createApplyButton(): void {
    // Create the apply button using panel_wood_arrows texture with 9-slice scaling
    const buttonWidth = 150;
    const buttonHeight = 50;
    const buttonX = this.panelX + (this.panelWidth - buttonWidth) / 2;
    const buttonY = this.panelY + this.panelHeight - buttonHeight - 30;
    
    this.applyButton = this.scene.add['nineslice'](
      buttonX + buttonWidth / 2,
      buttonY + buttonHeight / 2,
      'panel_wood_arrows',
      undefined,
      buttonWidth,
      buttonHeight,
      10,
      10,
      10,
      10
    );
    this.applyButton.setOrigin(0.5, 0.5);
    
    // Create button text
    this.applyButtonText = this.scene.add.text(
      buttonX + buttonWidth / 2,
      buttonY + buttonHeight / 2,
      'Apply',
      {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.applyButtonText.setOrigin(0.5, 0.5);
    
    // Initially disable the button
    this.setApplyButtonState(false);
    
    // Make button interactive
    this.applyButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.selectedSticker && this.onApplyCallback) {
          this.onApplyCallback(this.selectedSticker);
          this.hide();
        }
      });
    
    // Add hover effects
    this.applyButton.on('pointerover', () => {
      if (this.selectedSticker) {
        this.applyButton?.setScale(1.05);
        this.applyButtonText?.setScale(1.1);
      }
    });
    
    this.applyButton.on('pointerout', () => {
      this.applyButton?.setScale(1);
      this.applyButtonText?.setScale(1);
    });
    
    // Add to display container
    this.displayContainer.add(this.applyButton);
    this.displayContainer.add(this.applyButtonText);
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
    // Standard card dimensions from PlayerHandRenderer
    const cardWidth = 150;
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
    
    // Add "Selected: X" text
    this.selectionText = this.scene.add.text(
      marginX + cardWidth / 2,
      handPanelY + panelHeight / 2 - 30,
      'Selected: 0',
      {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }
    );
    this.selectionText.setOrigin(0.5, 0.5);
    
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
        // Currently does nothing per requirements
        console.log('Select All button clicked');
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
    
    // Add to display container
    this.displayContainer.add(this.resourcePanel);
    this.displayContainer.add(this.selectionText);
    this.displayContainer.add(this.selectAllButton);
    this.displayContainer.add(this.selectAllButtonText);
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
    
    // Calculate layout for grid
    const maxStickersPerRow = Math.floor((this.panelWidth - this.panelPadding * 2) / 
                                         (this.stickerSize + this.stickerSpacing));
    
    const startX = this.panelX + this.panelPadding + this.stickerSize / 2;
    const startY = this.panelY + 70 + this.stickerSize / 2;
    
    // Render each sticker
    stickerConfigs.forEach((stickerConfig, index) => {
      const row = Math.floor(index / maxStickersPerRow);
      const col = index % maxStickersPerRow;
      
      const x = startX + col * (this.stickerSize + this.stickerSpacing);
      const y = startY + row * (this.stickerSize + this.stickerSpacing);
      
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
    
    // Update selection text
    if (this.selectionText) {
      this.selectionText.setText('Selected: 1');
    }
  }
  
  /**
   * Show the sticker shop
   */
  public show(): void {
    this.isVisible = true;
    this.displayContainer.setVisible(true);
    
    // Update the selection text when showing the shop
    if (this.selectionText) {
      this.selectionText.setText(`Selected: ${this.selectedSticker ? '1' : '0'}`);
    }
  }
  
  /**
   * Hide the sticker shop and deselect any selected sticker
   */
  public hide(): void {
    this.isVisible = false;
    this.displayContainer.setVisible(false);
    
    // Deselect sticker when closing the shop
    this.deselectSticker();
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
  
  /**
   * Toggle the visibility of the sticker shop
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
    this.clearStickerRenderers();
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
    if (this.selectAllButton) {
      this.selectAllButton.destroy();
    }
    if (this.selectAllButtonText) {
      this.selectAllButtonText.destroy();
    }
    this.displayContainer.destroy();
  }
  
  /**
   * Get the currently selected sticker
   */
  public getSelectedSticker(): StickerConfig | null {
    return this.selectedSticker;
  }
} 