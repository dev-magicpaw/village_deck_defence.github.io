import Phaser from 'phaser';
import { Card } from '../types/game';

/**
 * Renders an individual card in the UI
 */
export class CardRenderer {
  private scene: Phaser.Scene;
  private cardWidth: number = 150;
  private cardHeight: number = 200;
  private container!: Phaser.GameObjects.Container;
  private cardBackground!: Phaser.GameObjects.NineSlice;
  private card: Card;
  private onClickCallback?: (index: number) => void;
  private index: number;
  private slotSize: number = 30;
  private slotScale: number = 0.8;
  private slotSpacing: number = 25;
  private slotImage: string = 'round_wood';
  private slotOffset: number = 10;
  private stickerScale: number = 0.4;
  
  /**
   * Create a new card renderer
   * @param scene The Phaser scene to render in
   * @param card Card data to render
   * @param x X position
   * @param y Y position
   * @param index Card index for click handling
   * @param onClickCallback Optional callback for when card is clicked
   */
  constructor(
    scene: Phaser.Scene,
    card: Card,
    x: number,
    y: number,
    index: number,
    onClickCallback?: (index: number) => void
  ) {
    this.scene = scene;
    this.card = card;
    this.index = index;
    this.onClickCallback = onClickCallback;

    // Create a container for the card and its elements
    this.container = this.scene.add.container(x, y);
    
    // Create the card visual with all its elements
    this.createCardVisual();
  }

  /**
   * Create the visual elements of the card
   */
  private createCardVisual(): void {
    // Card background
    this.cardBackground = this.scene.add['nineslice'](
      0,
      0,
      'panel_wood_paper_damaged',
      undefined,
      this.cardWidth,
      this.cardHeight,
      20,
      20,
      20,
      20
    );
    this.cardBackground.setOrigin(0.5, 0.5);
    
    // Add elements to container - background first
    this.container.add(this.cardBackground);
    
    // Card name
    const cardName = this.scene.add.text(
      0,
      -this.cardHeight / 2 + 30,
      this.card.name,
      {
        fontSize: '18px',
        color: '#000000',
        align: 'center',
        wordWrap: { width: this.cardWidth - 20 }
      }
    );
    cardName.setOrigin(0.5, 0.5);
    this.container.add(cardName);
    
    // Add slots
    this.renderSlots();
    
    // Make card interactive
    this.cardBackground.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (this.onClickCallback) {
          this.onClickCallback(this.index);
        }
      });
    
    // Hover effects
    this.cardBackground.on('pointerover', () => {
      this.container.setScale(1.05);
    });
    
    this.cardBackground.on('pointerout', () => {
      this.container.setScale(1);
    });
  }
  
  /**
   * Render all slots horizontally at the bottom of the card
   */
  private renderSlots(): void {
    // Get the number of slots from the card
    const slotCount = this.card.slotCount || 0;
    
    if (slotCount <= 0) return;
    
    // Slot configuration
    const totalWidth = (this.slotSize * slotCount) + (this.slotSpacing * (slotCount - 1));
    const startX = -(totalWidth / 2) + (this.slotSize / 2);
    const y = this.cardHeight / 2 - this.slotOffset; // Position at the bottom of the card
    
    // Create slots
    for (let i = 0; i < slotCount; i++) {
      const x = startX + (i * (this.slotSize + this.slotSpacing));
      const slot = this.scene.add.image(x, y, this.slotImage);
      slot.setScale(this.slotScale); // Smaller than the main wooden circle
      this.container.add(slot);

      // Add sticker if exists in startingStickers
      this.renderStickerInSlot(i, x, y);
    }
  }

  /**
   * Render a sticker in a specific slot if it exists in startingStickers
   * @param slotIndex Index of the slot
   * @param x X position of the slot
   * @param y Y position of the slot
   */
  private renderStickerInSlot(slotIndex: number, x: number, y: number): void {
    // Check if there are starting stickers for this card
    if (!this.card.startingStickers) return;
    
    // Check if sticker exists at this slot index
    if (slotIndex < this.card.startingStickers.length && this.card.startingStickers[slotIndex]) {
      const stickerId = this.card.startingStickers[slotIndex];
      
      // For the image key, use the sticker ID directly as it matches the loaded asset name
      const stickerImage = this.scene.add.image(x, y, stickerId);
      stickerImage.setScale(this.stickerScale);
      this.container.add(stickerImage);
    }
  }
  
  /**
   * Get the container that holds all card elements
   * @returns The Phaser container for this card
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
  
  /**
   * Destroy the card's visual elements
   */
  public destroy(): void {
    this.container.destroy();
  }
  
  /**
   * Set the card's visibility
   * @param visible Whether the card should be visible
   */
  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }
  
  /**
   * Set the card's position
   * @param x X coordinate
   * @param y Y coordinate
   */
  public setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }
} 