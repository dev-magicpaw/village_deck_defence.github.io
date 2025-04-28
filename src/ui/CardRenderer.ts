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
    
    // Add wooden circle in the middle of the card
    const woodCircle = this.scene.add.image(0, 0, 'round_wood');
    woodCircle.setScale(0.5); // Adjust scale to fit card
    this.container.add(woodCircle);
    
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