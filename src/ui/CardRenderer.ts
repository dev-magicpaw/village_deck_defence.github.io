import Phaser from 'phaser';
import { Card } from '../entities/Card';

/**
 * Card dimensions constants
 */
export const CARD_WIDTH = 150;
export const CARD_HEIGHT = 200;

/**
 * Renders an individual card in the UI
 */
export class CardRenderer {
  private scene: Phaser.Scene;
  private cardWidth: number = CARD_WIDTH;
  private cardHeight: number = CARD_HEIGHT;
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
  private stickerScale: number = 0.6;
  private nameText?: Phaser.GameObjects.Text;
  private slotObjects: Phaser.GameObjects.GameObject[] = [];
  private selectionGlow?: Phaser.GameObjects.Graphics;
  private isSelected: boolean = false;
  
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
    // Create selection glow (initially invisible)
    this.selectionGlow = this.scene.add.graphics();
    this.selectionGlow.setVisible(false);
    
    // Draw blue glow effect
    this.selectionGlow.fillStyle(0x00aaff, 0.3); // Light blue with transparency
    this.selectionGlow.fillRoundedRect(
      -this.cardWidth/2 - 10, 
      -this.cardHeight/2 - 10, 
      this.cardWidth + 20, 
      this.cardHeight + 20, 
      16
    );
    
    // Add a stroke for additional glow effect
    this.selectionGlow.lineStyle(3, 0x00aaff, 0.7);
    this.selectionGlow.strokeRoundedRect(
      -this.cardWidth/2 - 10, 
      -this.cardHeight/2 - 10, 
      this.cardWidth + 20, 
      this.cardHeight + 20, 
      16
    );
    
    this.container.add(this.selectionGlow);
    
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
    this.nameText = this.scene.add.text(
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
    this.nameText.setOrigin(0.5, 0.5);
    this.container.add(this.nameText);
    
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
   * Set whether this card is selected
   * @param selected Whether the card should be selected
   */
  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    
    // Show/hide the selection glow
    if (this.selectionGlow) {
      this.selectionGlow.setVisible(selected);
    }
  }
  
  /**
   * Check if the card is currently selected
   * @returns True if the card is selected
   */
  public isCardSelected(): boolean {
    return this.isSelected;
  }
  
  /**
   * Render all slots horizontally at the bottom of the card
   */
  private renderSlots(): void {
    // Clear any existing slot objects before rendering
    this.clearSlotObjects();
    
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
      this.slotObjects.push(slot);

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
    // Check if there are slots for this card and a sticker in this slot
    if (!this.card.slots || slotIndex >= this.card.slots.length) return;
    
    const slot = this.card.slots[slotIndex];
    if (slot && slot.sticker) {
      // For the image key, use the sticker ID
      const stickerId = slot.sticker.id;
      
      // Create sticker image
      const stickerImage = this.scene.add.image(x, y, stickerId);
      stickerImage.setScale(this.stickerScale);
      this.container.add(stickerImage);
      this.slotObjects.push(stickerImage);
    }
  }
  
  /**
   * Clear all slot objects
   */
  private clearSlotObjects(): void {
    // Remove all slot objects from the container and destroy them
    this.slotObjects.forEach(obj => {
      this.container.remove(obj);
      obj.destroy();
    });
    this.slotObjects = [];
  }
  
  /**
   * Update the card data and refresh the visual without destroying it
   * @param card New card data
   * @param index New index for the card
   */
  public updateCard(card: Card, index: number): void {
    // Update the card data and index
    this.card = card;
    this.index = index;
    
    // Update card name text
    if (this.nameText) {
      this.nameText.setText(this.card.name);
    }
    
    // Re-render the slots with the new card data
    this.renderSlots();
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