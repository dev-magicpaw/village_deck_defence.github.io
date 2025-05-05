import Phaser from 'phaser';
import { CARD_HEIGHT, CARD_WIDTH } from './CardRenderer';

/**
 * Component for rendering simple cards that don't represent specific entities
 */
export class SimpleCardRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.NineSlice;
  private foreground: Phaser.GameObjects.Image | null = null;
  private highlight: Phaser.GameObjects.Graphics;
  private isSelected: boolean = false;
  
  // Card properties
  private backgroundImageName: string;
  private foregroundImageName: string | null;
  private scaleFactor: number;
  private isSelectable: boolean;
  private callback: Function | null;
  private cardWidth: number;
  private cardHeight: number;
  
  /**
   * Create a new SimpleCardRenderer
   */
  constructor(
    scene: Phaser.Scene, 
    x: number, 
    y: number, 
    backgroundImageName: string = 'panel_wood_corners_metal',
    foregroundImageName: string | null = null,
    scaleFactor: number = 1,
    isSelectable: boolean = true,
    callback: Function | null = null
  ) {
    this.scene = scene;
    this.backgroundImageName = backgroundImageName;
    this.foregroundImageName = foregroundImageName;
    this.scaleFactor = scaleFactor;
    this.isSelectable = isSelectable;
    this.callback = callback;
    
    // Create container
    this.container = this.scene.add.container(x, y);
    
    // Calculate card dimensions
    this.cardWidth = CARD_WIDTH * this.scaleFactor;
    this.cardHeight = CARD_HEIGHT * this.scaleFactor;
    
    // Create highlight
    this.highlight = this.createHighlight();
    this.container.add(this.highlight);
    
    // Create background
    this.background = this.createBackground();
    this.container.add(this.background);
    
    // Add foreground image if provided
    if (this.foregroundImageName) {
      this.foreground = this.scene.add.image(0, 0, this.foregroundImageName);
      this.foreground.setDisplaySize(this.cardWidth - 20, this.cardHeight - 20);
      this.container.add(this.foreground);
    }    
  }
  
  /**
   * Create the card background using nineslice
   */
  private createBackground(): Phaser.GameObjects.NineSlice {
    const background = this.scene.add['nineslice'](
      0, 0,
      this.backgroundImageName,
      undefined,
      this.cardWidth, 
      this.cardHeight,
      20, 20, 20, 20
    );
    background.setOrigin(0.5, 0.5);

    // Add interactivity if needed
    if (this.isSelectable || this.callback) {
      background.setInteractive({ useHandCursor: true });
      
      // Add hover effect for selectable cards
      if (this.isSelectable) {
        background.on('pointerover', this.onPointerOver, this);
        background.on('pointerout', this.onPointerOut, this);
      }
      
      // Handle click events
      background.on('pointerdown', this.onPointerDown, this);
    }

    return background;
  }
  
  /**
   * Create the highlight effect for card selection using graphics
   */
  private createHighlight(): Phaser.GameObjects.Graphics {
    // Create selection glow (initially invisible)
    const selectionGlow = this.scene.add.graphics();
    selectionGlow.setVisible(false);
    
    // Draw blue glow effect
    selectionGlow.fillStyle(0x00aaff, 0.3); // Light blue with transparency
    selectionGlow.fillRoundedRect(
      -this.cardWidth/2 - 10, 
      -this.cardHeight/2 - 10, 
      this.cardWidth + 20, 
      this.cardHeight + 20, 
      16
    );
    
    // Add a stroke for additional glow effect
    selectionGlow.lineStyle(3, 0x00aaff, 0.7);
    selectionGlow.strokeRoundedRect(
      -this.cardWidth/2 - 10, 
      -this.cardHeight/2 - 10, 
      this.cardWidth + 20, 
      this.cardHeight + 20, 
      16
    );

    return selectionGlow;
  }
  
  /**
   * Handle pointer over event
   */
  private onPointerOver(): void {
    if (this.isSelectable) {
      this.container.setScale(1.05);
    }
  }
  
  /**
   * Handle pointer out event
   */
  private onPointerOut(): void {
    if (this.isSelectable) {
      this.container.setScale(1.0);
    }
  }
  
  /**
   * Handle pointer down event
   */
  private onPointerDown(): void {
    if (this.isSelectable) {
      this.toggleSelection();
      
      // Emit selected event
      this.scene.events.emit('card-selected', { 
        card: this,
        selected: this.isSelected
      });
    }
    
    // Call callback if provided
    if (this.callback) {
      this.callback(this);
    }
  }
  
  /**
   * Toggle selection state
   */
  private toggleSelection(): void {
    this.isSelected = !this.isSelected;
    this.highlight.setVisible(this.isSelected);
  }
  
  /**
   * Set selection state
   */
  public setSelected(selected: boolean): void {
    if (this.isSelected !== selected) {
      this.isSelected = selected;
      this.highlight.setVisible(this.isSelected);
    }
  }
  
  /**
   * Check if card is selected
   */
  public isCardSelected(): boolean {
    return this.isSelected;
  }
  
  /**
   * Get the container holding the card
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.isSelectable) {
      this.background.off('pointerover', this.onPointerOver, this);
      this.background.off('pointerout', this.onPointerOut, this);
    }
    
    this.background.off('pointerdown', this.onPointerDown, this);
    this.container.destroy();
  }
} 