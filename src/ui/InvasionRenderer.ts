import Phaser from 'phaser';
import { InvasionService } from '../services/InvasionService';

/**
 * Renderer for the invasion progress panel
 */
export class InvasionRenderer {
  private scene: Phaser.Scene;
  private invasionService: InvasionService;
  private invasionTitle!: Phaser.GameObjects.Text;
  private lastKnownDay: number = 1;
  private panel: Phaser.GameObjects.NineSlice;
  
  /**
   * Create a new invasion renderer
   * @param scene The Phaser scene
   * @param invasionService The invasion service
   * @param x X position of the panel
   * @param y Y position of the panel
   * @param width Width of the panel
   * @param height Height of the panel
   */
  constructor(
    scene: Phaser.Scene,
    invasionService: InvasionService,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.scene = scene;
    this.invasionService = invasionService;
    
    // Create the panel background using 9-slice
    this.panel = this.scene.add['nineslice'](
      x,
      y,
      'panel_metal_corners_metal',
      undefined,
      width,
      height,
      20,
      20,
      20,
      20
    );
    
    // Set the origin to the top-left corner
    this.panel.setOrigin(0, 0);
    
    // Add the panel title with current day
    this.lastKnownDay = this.invasionService.getCurrentDay();
    this.invasionTitle = this.scene.add.text(x + width / 2, y + height / 2, `Invasion progress track: day ${this.lastKnownDay}`, {
      fontSize: '24px',
      color: '#ffffff'
    });
    this.invasionTitle.setOrigin(0.5, 0.5);
  }
  
  /**
   * Update the renderer
   */
  public update(): void {
    // Update invasion title if day has changed
    const currentDay = this.invasionService.getCurrentDay();
    if (currentDay !== this.lastKnownDay) {
      this.lastKnownDay = currentDay;
      this.invasionTitle.setText(`Invasion progress track: day ${currentDay}`);
    }
  }
} 