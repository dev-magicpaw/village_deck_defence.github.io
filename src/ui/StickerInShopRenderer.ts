import Phaser from 'phaser';
import { StickerConfig } from '../entities/Sticker';
import { ResourceType } from '../entities/Types';
import { CostRenderer } from './CostRenderer';

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
  private unaffordable: boolean = false;
  private costRenderer!: CostRenderer;
  
  /**
   * Create a new sticker renderer
   * @param scene The Phaser scene to render in
   * @param stickerConfig Sticker configuration to render
   * @param x X position
   * @param y Y position
   * @param size Size of the sticker display
   * @param onClickCallback Optional callback for when sticker is clicked
   * @param unaffordable Whether the sticker is unaffordable
   */
  constructor(
    scene: Phaser.Scene,
    stickerConfig: StickerConfig,
    x: number,
    y: number,
    size: number,
    onClickCallback?: (stickerConfig: StickerConfig) => void,
    unaffordable: boolean = false
  ) {
    this.scene = scene;
    this.stickerConfig = stickerConfig;
    this.size = size;
    this.onClickCallback = onClickCallback;
    this.unaffordable = unaffordable;
      
    this.container = this.scene.add.container(x, y);
    this.createStickerVisual();
  }
  
  /**
   * Create the visual elements of the sticker
   */
  private createStickerVisual(): void {
    this.background = this.scene.add.image(0, 0, 'round_metal');
    this.background.setDisplaySize(this.size, this.size);
    
    const stickerImage = this.scene.add.image(0, 0, this.stickerConfig.image);
    this.container.add(this.background);
    this.container.add(stickerImage);
    
    this.costRenderer = new CostRenderer(
      this.scene, 
      this.stickerConfig.cost, 
      0, 
      this.size/2 + 10, 
      ResourceType.Invention
    );
    
    // Set affordability based on initial state
    this.costRenderer.setAffordable(!this.unaffordable);
    
    this.container.add(this.costRenderer.getContainer());
    
    this.background.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.onClickCallback) {
          this.onClickCallback(this.stickerConfig);
        }
      });
    this.background.on('pointerover', () => { this.container.setScale(1.1); });
    this.background.on('pointerout', () => { this.container.setScale(1); });
  }
  
  /**
   * Set whether this sticker is selected
   * @param selected Whether the sticker should be selected
   */
  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    
    if (selected) {
      this.background.setTint(0x00ffff); // Cyan tint
    } else {
      this.background.clearTint();
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
   * Set whether this sticker is unaffordable
   * @param unaffordable Whether the sticker is unaffordable
   */
  public setUnaffordable(unaffordable: boolean): void {
    if (this.unaffordable === unaffordable) return;
    
    this.unaffordable = unaffordable;
    
    this.costRenderer.setAffordable(!unaffordable);
  }
  
  public destroy(): void {
    this.container.destroy();
  }
} 