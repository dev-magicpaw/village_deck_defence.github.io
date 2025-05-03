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
  private onStickerClickCallback?: (cardIndex: number, slotIndex: number) => void;
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
  private scale: number;
  private changeScaleOnHover: boolean;
  private stickerChangeScaleOnHover: boolean;
  private selectableSticker: boolean;
  private selectedStickerIndex: number = -1;
  private stickerGlows: Phaser.GameObjects.Graphics[] = [];
  private stickerImages: Phaser.GameObjects.Image[] = [];
  
  /**
   * Create a new card renderer
   * @param scene The Phaser scene to render in
   * @param card Card data to render
   * @param x X position
   * @param y Y position
   * @param index Card index for click handling
   * @param onClickCallback Optional callback for when card is clicked
   * @param scale General scale to be applied to everything
   * @param changeScaleOnHover Whether the card should change scale on hover
   * @param stickerChangeScaleOnHover Whether stickers should change scale on hover
   * @param selectableSticker Whether stickers should be selectable with their own glow
   * @param onStickerClickCallback Optional callback for when a sticker slot is clicked
   */
  constructor(
    scene: Phaser.Scene,
    card: Card,
    x: number,
    y: number,
    index: number,
    onClickCallback?: (index: number) => void,
    scale: number = 1,
    changeScaleOnHover: boolean = true,
    stickerChangeScaleOnHover: boolean = false,
    selectableSticker: boolean = false,
    onStickerClickCallback?: (cardIndex: number, slotIndex: number) => void
  ) {
    this.scene = scene;
    this.card = card;
    this.index = index;
    this.onClickCallback = onClickCallback;
    this.onStickerClickCallback = onStickerClickCallback;
    this.scale = scale;
    this.changeScaleOnHover = changeScaleOnHover;
    this.stickerChangeScaleOnHover = stickerChangeScaleOnHover;
    this.selectableSticker = selectableSticker;

    // Create a container for the card and its elements
    this.container = this.scene.add.container(x, y);
    this.container.setScale(this.scale);
    
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
    
    // Without this simingly useless texture, there is a bug in sticker shop - when selecting excatly 4 cards, the card with the index 4 
    // get rendering bug - it's background texture is partially not rendered.
    // Would be nice to find the root cause and fix it.
    const bgRect = this.scene.add.rectangle(
      0, 
      0, 
      this.cardWidth, 
      this.cardHeight, 
      0x000000 // Light cream/paper color
    );
    bgRect.setOrigin(0.5, 0.5);
    this.container.add(bgRect);
    
    // Card background
    this.cardBackground = this.scene.add['nineslice'](
      0,
      0,
      'panel_wood_paper',
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
    
    // Card portrait/image
    if (this.card.image) {
      const portrait = this.scene.add.image(
        0,
        0, // Center of the card
        this.card.image
      );
      
      // Set the image dimensions to match the card dimensions
      // Leave some padding around the edges
      portrait.setDisplaySize(this.cardWidth - 15, this.cardHeight - 15);
      
      this.container.add(portrait);
    }
    
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
    if (this.changeScaleOnHover) {
      this.cardBackground.on('pointerover', () => {
        this.container.setScale(this.scale * 1.05);
      });
      
      this.cardBackground.on('pointerout', () => {
        this.container.setScale(this.scale);
      });
    }
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
      
      // Create sticker glow (initially invisible) - this goes FIRST (behind the slot)
      if (this.selectableSticker) {
        const stickerGlow = this.scene.add.graphics();
        
        // Draw green glow effect AROUND the slot (so make it larger than the slot)
        // Slot has slotScale applied, so we need to account for that in glow size
        const glowSize = (this.slotSize * this.slotScale) * 1.3; // 30% larger than the slot
        
        stickerGlow.fillStyle(0x00aaff, 0.8); // Light blue
        stickerGlow.fillCircle(x, y, glowSize);
        
        // Add a stroke for additional glow effect
        stickerGlow.lineStyle(2, 0x00aaff, 0.9);
        stickerGlow.strokeCircle(x, y, glowSize);
        
        stickerGlow.setVisible(false);
        this.container.add(stickerGlow);
        this.stickerGlows[i] = stickerGlow;
        this.slotObjects.push(stickerGlow);
        
        // If this slot is already selected, make the glow visible
        if (this.selectedStickerIndex === i) {
          stickerGlow.setVisible(true);
        }
      }
      
      // Create the slot (wooden background) - this goes SECOND (on top of glow)
      const slot = this.scene.add.image(x, y, this.slotImage);
      slot.setScale(this.slotScale);
      this.container.add(slot);
      this.slotObjects.push(slot);
      
      // Add sticker if exists - this goes THIRD (on top of slot)
      this.renderStickerInSlot(i, x, y);
      
      // Make slot interactive if selectable
      if (this.selectableSticker) {
        slot.setInteractive({ useHandCursor: true });
        
        // Click handler for slot selection
        slot.on('pointerdown', (event: Phaser.Input.Pointer) => {
          // Toggle selection
          if (this.selectedStickerIndex === i) {
            this.deselectSticker();
          } else {
            this.selectSticker(i);
          }
          
          // Call the sticker click callback if provided
          if (this.onStickerClickCallback) {
            this.onStickerClickCallback(this.index, i);
          }
          
          // Prevent the card click callback from firing
          event.event.stopPropagation();
        });
        
        // Hover effects for slots
        if (this.stickerChangeScaleOnHover) {
          slot.on('pointerover', () => {
            // Scale up the slot
            slot.setScale(this.slotScale * 1.2);
            
            // Also scale up the sticker if there is one
            if (this.stickerImages[i]) {
              this.stickerImages[i].setScale(this.stickerScale * 1.2);
            }
          });
          
          slot.on('pointerout', () => {
            // Reset the slot scale
            slot.setScale(this.slotScale);
            
            // Also reset the sticker scale if there is one
            if (this.stickerImages[i]) {
              this.stickerImages[i].setScale(this.stickerScale);
            }
          });
        }
      }
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
      
      // Store reference to sticker image for hover effects
      this.stickerImages[slotIndex] = stickerImage;
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
    
    // Clear sticker glows array
    this.stickerGlows = [];
    
    // Clear sticker images array
    this.stickerImages = [];
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
    
    // Clear existing card visuals
    this.container.removeAll(true);
    
    // Recreate the card visual with the new card data
    this.createCardVisual();
    
    // Reset any sticker selection
    this.selectedStickerIndex = -1;
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

  /**
   * Select a specific sticker by its slot index
   * @param slotIndex Index of the slot containing the sticker to select
   */
  public selectSticker(slotIndex: number): void {
    if (!this.selectableSticker) return;
    
    // Deselect current sticker if any
    this.deselectSticker();
    
    if (slotIndex >= 0 && slotIndex < (this.card.slotCount || 0)) {
      this.selectedStickerIndex = slotIndex;
      
      // Make the sticker glow visible
      if (this.stickerGlows[slotIndex]) {
        this.stickerGlows[slotIndex].setVisible(true);
      } else {
        throw new Error('No sticker glow found for slot ' + slotIndex);
      }
    }
  }
  
  /**
   * Deselect the currently selected sticker
   */
  public deselectSticker(): void {
    if (!this.selectableSticker || this.selectedStickerIndex === -1) return;
    
    // Hide the glow for the currently selected sticker
    if (this.stickerGlows[this.selectedStickerIndex]) {
      this.stickerGlows[this.selectedStickerIndex].setVisible(false);
    }
    
    this.selectedStickerIndex = -1;
  }
} 