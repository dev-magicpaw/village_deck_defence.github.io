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
    const background = this.scene.add.image(0, 0, 'round_metal');
    background.setDisplaySize(this.size, this.size);
    
    const stickerImage = this.scene.add.image(0, 0, this.stickerConfig.image);
    this.container.add(background);
    this.container.add(stickerImage);
    
    // Make sticker interactive
    background.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.onClickCallback) {
          this.onClickCallback(this.stickerConfig);
        }
      });
    
    // Hover effects
    background.on('pointerover', () => {
      this.container.setScale(1.1);
    });
    
    background.on('pointerout', () => {
      this.container.setScale(1);
    });
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