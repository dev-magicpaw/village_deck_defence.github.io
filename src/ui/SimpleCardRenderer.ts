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
  private highlight: Phaser.GameObjects.Image;
  private isSelected: boolean = false;
  
  // Card properties
  private backgroundImageName: string;
  private foregroundImageName: string | null;
  private scaleFactor: number;
  private isSelectable: boolean;
  private callback: Function | null;
  
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
    const width = CARD_WIDTH * this.scaleFactor;
    const height = CARD_HEIGHT * this.scaleFactor;
    
    // Create selection highlight (initially invisible)
    this.highlight = this.scene.add.image(0, 0, 'panel_metal_glow');
    this.highlight.setDisplaySize(width + 10, height + 10);
    this.highlight.setVisible(false);
    this.highlight.setTint(0x00ff00);
    this.highlight.setAlpha(0.3);
    this.container.add(this.highlight);

    
    // Card background using nineslice
    this.background = this.scene.add['nineslice'](
      0, 0,
      this.backgroundImageName,
      undefined,
      width, 
      height,
      10, 10, 10, 10
    );
    this.background.setOrigin(0.5, 0.5);
    
    // Add interactivity if needed
    if (this.isSelectable || this.callback) {
      this.background.setInteractive({ useHandCursor: true });
      
      // Add hover effect for selectable cards
      if (this.isSelectable) {
        this.background.on('pointerover', this.onPointerOver, this);
        this.background.on('pointerout', this.onPointerOut, this);
      }
      
      // Handle click events
      this.background.on('pointerdown', this.onPointerDown, this);
    }
    this.container.add(this.background);
    
    // Add foreground image if provided
    if (this.foregroundImageName) {
      this.foreground = this.scene.add.image(0, -30, this.foregroundImageName);
      this.foreground.setDisplaySize(width - 20, 100);
      this.container.add(this.foreground);
    }    
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