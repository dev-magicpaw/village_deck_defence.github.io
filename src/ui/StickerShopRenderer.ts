import Phaser from 'phaser';
import { StickerConfig } from '../entities/Sticker';
import { StickerRegistry } from '../services/StickerRegistry';

/**
 * Renders the sticker shop when the sticker shop building is clicked
 */
export class StickerShopRenderer {
  private scene: Phaser.Scene;
  private stickerRegistry: StickerRegistry;
  private displayContainer: Phaser.GameObjects.Container;
  private isVisible: boolean = false;
  private shopPanel: Phaser.GameObjects.NineSlice | null = null;
  private stickerContainers: Phaser.GameObjects.Container[] = [];
  
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
   */
  constructor(
    scene: Phaser.Scene,
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number
  ) {
    this.scene = scene;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    
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
    
    // Render all stickers
    this.renderStickers();
  }
  
  /**
   * Render all available stickers in a grid layout
   */
  private renderStickers(): void {
    // Clear existing sticker containers
    this.clearStickerContainers();
    
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
      
      // Create sticker display
      const stickerContainer = this.createStickerDisplay(stickerConfig, x, y);
      this.stickerContainers.push(stickerContainer);
      this.displayContainer.add(stickerContainer);
    });
  }
  
  /**
   * Create a visual display for a sticker
   * @param stickerConfig The sticker configuration
   * @param x X position of the sticker
   * @param y Y position of the sticker
   * @returns Container with the sticker display
   */
  private createStickerDisplay(
    stickerConfig: StickerConfig,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    // Create a container for the sticker
    const container = this.scene.add.container(x, y);
    
    // Create the background using round_metal image
    const background = this.scene.add.image(0, 0, 'round_metal');
    background.setDisplaySize(this.stickerSize, this.stickerSize);
    
    // Add sticker image
    const stickerImage = this.scene.add.image(0, -10, stickerConfig.image);
    stickerImage.setScale(0.8);
    
    // Add sticker name
    const nameText = this.scene.add.text(
      0,
      this.stickerSize / 2 - 25,
      stickerConfig.name,
      {
        fontSize: '14px',
        color: '#ffffff',
        align: 'center'
      }
    );
    nameText.setOrigin(0.5, 0.5);
    
    // Add elements to container
    container.add(background);
    container.add(stickerImage);
    container.add(nameText);
    
    // Make sticker interactive
    background.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.onStickerClick(stickerConfig);
      });
    
    // Hover effects
    background.on('pointerover', () => {
      container.setScale(1.1);
    });
    
    background.on('pointerout', () => {
      container.setScale(1);
    });
    
    return container;
  }
  
  /**
   * Handle sticker click
   * @param stickerConfig The clicked sticker configuration
   */
  private onStickerClick(stickerConfig: StickerConfig): void {
    console.log(`Sticker ${stickerConfig.name} clicked`);
    // TODO: Implement sticker purchase logic
  }
  
  /**
   * Show the sticker shop
   */
  public show(): void {
    this.isVisible = true;
    this.displayContainer.setVisible(true);
  }
  
  /**
   * Hide the sticker shop
   */
  public hide(): void {
    this.isVisible = false;
    this.displayContainer.setVisible(false);
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
   * Clear all sticker containers
   */
  private clearStickerContainers(): void {
    this.stickerContainers.forEach(container => {
      container.destroy();
    });
    this.stickerContainers = [];
  }
  
  /**
   * Update the shop when stickers change
   */
  public update(): void {
    // Nothing to update for now
  }
  
  /**
   * Destroy this renderer and all its visual elements
   */
  public destroy(): void {
    this.clearStickerContainers();
    if (this.shopPanel) {
      this.shopPanel.destroy();
    }
    this.displayContainer.destroy();
  }
} 