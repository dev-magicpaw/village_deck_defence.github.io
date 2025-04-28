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
  private slotSize: number = 40;
  private slotScale: number = 0.5;
  private slotSpacing: number = 5;
  private slotOffset: number = 10;
  
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
    
    // Do not add race text
    
    // Add slots
    this.renderPowerSlots();
    this.renderConstructionSlots();
    this.renderInventionSlots();
    
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
   * Render the power slots on the left side of the card
   */
  private renderPowerSlots(): void {
    // Get the number of power slots from the card
    const powerSlots = this.card.slots?.power || 0;
    
    if (powerSlots <= 0) return;
    
    // Slot configuration
    const totalHeight = (this.slotSize * powerSlots) + (this.slotSpacing * (powerSlots - 1));
    const startY = -(totalHeight / 2) + (this.slotSize / 2);
    const x = -this.cardWidth / 2 + this.slotOffset; // Position at the left side of the card
    
    // Create slots
    for (let i = 0; i < powerSlots; i++) {
      const y = startY + (i * (this.slotSize + this.slotSpacing));
      const slot = this.scene.add.image(x, y, 'round_wood');
      slot.setScale(this.slotScale); // Smaller than the main wooden circle
      this.container.add(slot);
    }
  }
  
  /**
   * Render the construction slots at the bottom of the card
   */
  private renderConstructionSlots(): void {
    // Get the number of construction slots from the card
    const constructionSlots = this.card.slots?.construction || 0;
    console.log('constructionSlots', constructionSlots);
    
    if (constructionSlots <= 0) return;
    
    // Slot configuration
    const totalWidth = (this.slotSize * constructionSlots) + (this.slotSpacing * (constructionSlots - 1));
    const startX = -(totalWidth / 2) + (this.slotSize / 2);
    const y = this.cardHeight / 2 - this.slotOffset; // Position at the bottom of the card
    
    // Create slots
    for (let i = 0; i < constructionSlots; i++) {
      const x = startX + (i * (this.slotSize + this.slotSpacing));
      const slot = this.scene.add.image(x, y, 'round_wood');
      slot.setScale(this.slotScale); // Smaller than the main wooden circle
      this.container.add(slot);
    }
  }
  
  /**
   * Render the invention slots on the right side of the card
   */
  private renderInventionSlots(): void {
    // Get the number of invention slots from the card
    const inventionSlots = this.card.slots?.invention || 0;
    
    if (inventionSlots <= 0) return;
    
    // Slot configuration
    const totalHeight = (this.slotSize * inventionSlots) + (this.slotSpacing * (inventionSlots - 1));
    const startY = -(totalHeight / 2) + (this.slotSize / 2);
    const x = this.cardWidth / 2 - this.slotOffset; // Position at the right side of the card
    
    // Create slots
    for (let i = 0; i < inventionSlots; i++) {
      const y = startY + (i * (this.slotSize + this.slotSpacing));
      const slot = this.scene.add.image(x, y, 'round_wood');
      slot.setScale(this.slotScale); // Smaller than the main wooden circle
      this.container.add(slot);
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