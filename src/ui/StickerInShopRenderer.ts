import Phaser from 'phaser';
import { StickerConfig } from '../entities/Sticker';

/**
 * Renders an individual sticker in the sticker shop
 */
export class StickerInShopRenderer {
  private scene: Phaser.Scene;
  private stickerConfig: StickerConfig;
  private container: Phaser.GameObjects.Container;
  private size: number;
  private onClickCallback?: (stickerConfig: StickerConfig) => void;
  private background!: Phaser.GameObjects.Image;
  private isSelected: boolean = false;
  
  /**
   * Create a new sticker renderer
   * @param scene The Phaser scene to render in
   * @param stickerConfig Sticker configuration to render
   * @param x X position
   * @param y Y position
   * @param size Size of the sticker display
   * @param onClickCallback Optional callback for when sticker is clicked
   */
  constructor(
    scene: Phaser.Scene,
    stickerConfig: StickerConfig,
    x: number,
    y: number,
    size: number,
    onClickCallback?: (stickerConfig: StickerConfig) => void
  ) {
    this.scene = scene;
    this.stickerConfig = stickerConfig;
    this.size = size;
    this.onClickCallback = onClickCallback;
    
    // Create a container for the sticker and its elements
    this.container = this.scene.add.container(x, y);
    
    // Create the sticker visual with all its elements
    this.createStickerVisual();
  }
  
  /**
   * Create the visual elements of the sticker
   */
  private createStickerVisual(): void {
    // Create the background using round_metal image
    this.background = this.scene.add.image(0, 0, 'round_metal');
    this.background.setDisplaySize(this.size, this.size);
    
    const stickerImage = this.scene.add.image(0, 0, this.stickerConfig.image);
    this.container.add(this.background);
    this.container.add(stickerImage);
    
    // Add cost display with both text and invention resource icon
    const costContainer = this.scene.add.container(0, this.size/2 + 10);
    
    // Cost background
    const costBackground = this.scene.add.rectangle(0, 0, 60, 22, 0x000000, 0.7);
    costBackground.setOrigin(0.5, 0);
    
    // Cost text (just the number)
    const costText = this.scene.add.text(0, 2, `${this.stickerConfig.cost}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    costText.setOrigin(1, 0);
    
    // Invention resource icon
    const resourceIcon = this.scene.add.image(5, 10, 'resource_invention');
    resourceIcon.setOrigin(0, 0.5);
    resourceIcon.setScale(0.5); // Scale down the icon to fit nicely
    
    // Add elements to the cost container
    costContainer.add(costBackground);
    costContainer.add(costText);
    costContainer.add(resourceIcon);
    
    // Add cost container to the main container
    this.container.add(costContainer);
    
    // Make sticker interactive
    this.background.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.onClickCallback) {
          this.onClickCallback(this.stickerConfig);
        }
      });
    
    // Hover effects
    this.background.on('pointerover', () => {
      if (!this.isSelected) {
        this.container.setScale(1.1);
      }
    });
    
    this.background.on('pointerout', () => {
      if (!this.isSelected) {
        this.container.setScale(1);
      }
    });
  }
  
  /**
   * Set whether this sticker is selected
   * @param selected Whether the sticker should be selected
   */
  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    
    if (selected) {
      // Apply selection visual effect
      this.background.setTint(0x00ffff); // Cyan tint to indicate selection
      this.container.setScale(1.15); // Slightly larger scale
    } else {
      // Remove selection visual effect
      this.background.clearTint();
      this.container.setScale(1); // Normal scale
    }
  }
  
  /**
   * Get the sticker configuration
   */
  public getStickerConfig(): StickerConfig {
    return this.stickerConfig;
  }
  
  /**
   * Get the container that holds the sticker elements
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
  
  /**
   * Destroy the sticker renderer and its elements
   */
  public destroy(): void {
    this.container.destroy();
  }
} 