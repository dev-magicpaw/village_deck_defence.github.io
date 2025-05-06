import Phaser from 'phaser';

export class CountLimitRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private countText: Phaser.GameObjects.Text;
  private count: number;
  private limit: number | undefined;
  
  private bgWidth: number = 70;
  private bgHeight: number = 25;

  constructor(scene: Phaser.Scene, centerX: number, centerY: number, count: number, limit?: number) {
    this.scene = scene;
    this.count = count;
    this.limit = limit;
    
    // Create container
    this.container = this.scene.add.container(centerX, centerY);
    
    // Background
    const background = this.scene.add.rectangle(0, 0, this.bgWidth, this.bgHeight, 0x000000, 0.7);
    background.setOrigin(0.5, 0.5);
    
    // Count/limit text
    this.countText = this.scene.add.text(0, 0, this.getDisplayText(), {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.countText.setOrigin(0.5, 0.5);
    
    // Add all to container
    this.container.add([background, this.countText]);
  }

  /**
   * Get the text to display based on count and limit
   */
  private getDisplayText(): string {
    if (this.limit !== undefined && this.count >= this.limit) {
      return "MAX";
    } else if (this.limit !== undefined) {
      return `${this.count}/${this.limit}`;
    } else {
      return `${this.count}/∞`;
    }
  }

  /**
   * Update the count and refresh display
   */
  public setCount(count: number): void {
    this.count = count;
    this.updateDisplay();
  }

  /**
   * Update the limit and refresh display
   */
  public setLimit(limit: number | undefined): void {
    this.limit = limit;
    this.updateDisplay();
  }

  /**
   * Update the display text
   */
  private updateDisplay(): void {
    this.countText.setText(this.getDisplayText());
  }

  /**
   * Get the container
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /**
   * Destroy the container and all its contents
   */
  public destroy(): void {
    this.container.destroy();
  }
} 