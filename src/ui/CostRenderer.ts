import Phaser from 'phaser';
import { ResourceType } from '../entities/Types';

export class CostRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private costText: Phaser.GameObjects.Text;
  private cost: number;
  private isAffordable: boolean = true;

  private costWidth: number = 60;
  private costHeight: number = 22;
  private iconWidth: number = 40;
  private iconHeight: number = 40;
  private iconOffsetX: number = 5;
  private iconOffsetY: number = 10;

  constructor(scene: Phaser.Scene, cost: number, centerX: number, centerY: number, resource: ResourceType) {
    this.scene = scene;
    this.cost = cost;
    
    // Create container
    this.container = this.scene.add.container(centerX, centerY);
    
    // Cost background
    const costBackground = this.scene.add.rectangle(0, 0, this.costWidth, this.costHeight, 0x000000, 0.7);
    costBackground.setOrigin(0.5, 0);
    
    // Cost text (just the number)
    this.costText = this.scene.add.text(0, 2, `${this.cost}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.costText.setOrigin(1, 0);
    
    // Resource icon - use the resource type to get the image key
    const resourceIcon = this.scene.add.image(this.iconOffsetX, this.iconOffsetY, this.getResourceImage(resource));
    resourceIcon.setOrigin(0, 0.5);
    resourceIcon.setDisplaySize(this.iconWidth, this.iconHeight);
    
    // Add all to container
    this.container.add([costBackground, this.costText, resourceIcon]);
  }

  /**
   * Get the image key for a resource type
   * @param resourceType The resource type to get the image for
   * @returns The image key for the resource
   */
  private getResourceImage(resourceType: ResourceType): string {
    switch (resourceType) {
      case ResourceType.Power:
        return 'resource_power';
      case ResourceType.Construction:
        return 'resource_construction';
      case ResourceType.Invention:
        return 'resource_invention';
      default:
        throw new Error(`Unknown resource type: ${resourceType}`);
    }
  }

  public setAffordable(affordable: boolean): void {
    this.isAffordable = affordable;
    this.costText.setColor(affordable ? '#ffffff' : '#ff0000');
  }

  public setCost(cost: number): void {
    this.cost = cost;
    this.costText.setText(`${this.cost}`);
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
} 