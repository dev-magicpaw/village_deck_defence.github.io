import Phaser from 'phaser';
import { TavernService } from '../services/TavernService';

/**
 * Renderer for the tavern building UI
 */
export class TavernRenderer {
  private scene: Phaser.Scene;
  private tavernService: TavernService;
  private container: Phaser.GameObjects.Container;
  private panelX: number;
  private panelY: number;
  private panelWidth: number;
  private panelHeight: number;
  private isVisible: boolean = false;
  
  /**
   * Create a new tavern renderer
   * @param scene The Phaser scene to render in
   * @param panelX X position of the panel
   * @param panelY Y position of the panel
   * @param panelWidth Width of the panel
   * @param panelHeight Height of the panel
   */
  constructor(
    scene: Phaser.Scene,
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number
  ) {
    this.scene = scene;
    this.tavernService = TavernService.getInstance();
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    
    // Create a container to hold all UI elements
    this.container = this.scene.add.container(this.panelX, this.panelY);
    this.container.setVisible(false);
  }
  
  /**
   * Initialize the tavern renderer
   */
  public init(): void {
    // Initialize layout will be added later
  }
  
  /**
   * Show the tavern UI
   */
  private _show(): void {
    if (!this.isVisible) {
      this.container.setVisible(true);
      this.isVisible = true;
    }
  }
  
  /**
   * Hide the tavern UI
   */
  private _hide(): void {
    if (this.isVisible) {
      this.container.setVisible(false);
      this.isVisible = false;
    }
  }
  
  /**
   * Set the visibility of the tavern UI
   * @param visible Whether the UI should be visible
   */
  public setVisibility(visible: boolean): void {
    if (visible) {
      this._show();
    } else {
      this._hide();
    }
  }
  
  /**
   * Toggle visibility of the tavern UI
   */
  public toggleVisibility(): void {
    this.setVisibility(!this.isVisible);
  }
  
  /**
   * Check if the tavern UI is currently visible
   */
  public isCurrentlyVisible(): boolean {
    return this.isVisible;
  }
  
  /**
   * Update the tavern UI
   */
  public update(): void {
    // Update UI will be added later
  }
  
  /**
   * Destroy this renderer and all its visual elements
   */
  public destroy(): void {
    this.container.destroy();
  }
} 