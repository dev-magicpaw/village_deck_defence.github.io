import Phaser from 'phaser';
import { Card } from '../entities/Card';
import { StickerConfig } from '../entities/Sticker';
import { CardRenderer } from './CardRenderer';

/**
 * Events emitted by the StickerApplicationOverlayRenderer
 */
export enum StickerApplicationOverlayEvents {
  STICKER_APPLIED = 'sticker-applied',
  CANCELLED = 'cancelled'
}

/**
 * Renders an overlay for applying stickers to specific slots on a card
 */
export class StickerApplicationOverlayRenderer extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private displayContainer: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.NineSlice;
  private isVisible: boolean = false;
  private card: Card;
  private sticker: StickerConfig;
  private cardRenderer: CardRenderer | null = null;
  private closeButton: Phaser.GameObjects.Image;
  private title: Phaser.GameObjects.Text;
  private applyButton: Phaser.GameObjects.Container;
  private applyButtonBackground: Phaser.GameObjects.NineSlice = {} as Phaser.GameObjects.NineSlice;
  private applyButtonText: Phaser.GameObjects.Text = {} as Phaser.GameObjects.Text;
  private selectedSlotIndex: number | null = null;
  private slotButtons: Phaser.GameObjects.Image[] = [];
  private slotHighlights: Phaser.GameObjects.Graphics[] = [];
  
  /**
   * Create a new StickerApplicationOverlayRenderer
   * @param scene The Phaser scene to render in
   * @param card The card to apply stickers to
   * @param sticker The sticker configuration to apply
   */
  constructor(
    scene: Phaser.Scene,
    card: Card,
    sticker: StickerConfig
  ) {
    super();
    
    this.scene = scene;
    this.card = card;
    this.sticker = sticker;
    
    // Create a container to hold the overlay
    this.displayContainer = this.scene.add.container(0, 0);
    this.displayContainer.setVisible(false);
    
    // Set a very high depth to ensure it renders on top of everything
    this.displayContainer.setDepth(3000);
    
    // Create the background using 9-slice panel
    const { width, height } = this.scene.cameras.main;
    this.background = this.scene.add['nineslice'](
      0,
      0,
      'panel_metal_corners_metal_nice',
      undefined,
      width,
      height,
      20,
      20,
      20,
      20
    );
    this.background.setOrigin(0, 0);
    this.background.setTint(0x333333); // Dark grey tint
    
    // Make the background interactive to intercept clicks
    this.background.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    
    // Create a title
    this.title = this.scene.add.text(
      width / 2,
      30,
      `Apply "${sticker.name}" Sticker`,
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.title.setOrigin(0.5, 0.5);
    
    // Add close button (X)
    this.closeButton = this.scene.add.image(
      width - 30,
      30,
      'round_metal_cross'
    );
    this.closeButton.setScale(1.2);
    this.closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.hide();
        this.emit(StickerApplicationOverlayEvents.CANCELLED);
      });
    
    // Add hover effects for close button
    this.closeButton.on('pointerover', () => {
      this.closeButton.setScale(1.4);
    });
    
    this.closeButton.on('pointerout', () => {
      this.closeButton.setScale(1.2);
    });
    
    // Create Apply button (initially disabled)
    this.applyButton = this.createApplyButton(width / 2, height - 60);
    
    // Add elements to the container
    this.displayContainer.add([
      this.background,
      this.title,
      this.closeButton,
      this.applyButton
    ]);
  }

  /**
   * Create the Apply button
   */
  private createApplyButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Button background using 9-slice
    this.applyButtonBackground = this.scene.add['nineslice'](
      0,
      0,
      'panel_wood_arrows',
      undefined,
      150,
      50,
      20,
      20,
      20,
      20
    );
    this.applyButtonBackground.setOrigin(0.5, 0.5);
    
    // Button text
    this.applyButtonText = this.scene.add.text(
      0, 
      0, 
      'Apply', 
      {
        fontSize: '18px',
        color: '#cccccc'
      }
    );
    this.applyButtonText.setOrigin(0.5, 0.5);
    
    // Add to container
    container.add([this.applyButtonBackground, this.applyButtonText]);
    
    // Initially disabled
    this.updateApplyButtonState(false);
    
    return container;
  }
  
  /**
   * Update the Apply button state
   * @param enabled Whether the button should be enabled
   */
  private updateApplyButtonState(enabled: boolean): void {
    if (enabled) {
      this.applyButtonBackground.clearTint();
      this.applyButtonText.setColor('#ffffff');
      this.applyButtonBackground.setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.applySticker());
      
      // Add hover effects
      this.applyButtonBackground.on('pointerover', () => {
        this.applyButtonBackground.setTint(0xaaffaa);
      });
      
      this.applyButtonBackground.on('pointerout', () => {
        this.applyButtonBackground.clearTint();
      });
    } else {
      this.applyButtonBackground.setTint(0x666666);
      this.applyButtonText.setColor('#cccccc');
      this.applyButtonBackground.removeInteractive();
      
      // Remove all listeners
      this.applyButtonBackground.removeAllListeners();
    }
  }
  
  /**
   * Apply the sticker to the selected slot
   */
  private applySticker(): void {
    if (this.selectedSlotIndex !== null) {
      this.emit(StickerApplicationOverlayEvents.STICKER_APPLIED, this.sticker, this.card, this.selectedSlotIndex);
      this.hide();
    }
  }
  
  /**
   * Show the overlay
   */
  public show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.displayContainer.setVisible(true);
      this.renderCard();
    }
  }
  
  /**
   * Hide the overlay
   */
  public hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.displayContainer.setVisible(false);
      this.cleanup();
    }
  }
  
  /**
   * Clean up resources when hiding
   */
  private cleanup(): void {
    // Clear selection
    this.selectedSlotIndex = null;
    
    // Clean up card renderer
    if (this.cardRenderer) {
      this.cardRenderer.destroy();
      this.cardRenderer = null;
    }
    
    // Clean up slot highlights
    this.slotHighlights.forEach(highlight => {
      highlight.destroy();
    });
    this.slotHighlights = [];
    
    // Remove slot buttons
    this.slotButtons.forEach(button => {
      button.destroy();
    });
    this.slotButtons = [];
  }
  
  /**
   * Render the card in the overlay
   */
  private renderCard(): void {
    const { width, height } = this.scene.cameras.main;
    
    // Create card renderer (centered at the top portion of the screen)
    const cardScale = 1.5;
    const cardY = 180;
    
    this.cardRenderer = new CardRenderer(
      this.scene,
      this.card,
      width / 2,
      height / 2,
      0,
      undefined, // TODO: add do nothing callback?
      cardScale,
      false,
      true,
      true
    );
    
    // Scale up the card
    this.cardRenderer.getContainer().setScale(cardScale);
    
    // Add to display container
    this.displayContainer.add(this.cardRenderer.getContainer());
  }
  
  /**
   * Select a slot to apply the sticker to
   * @param slotIndex The index of the slot to select
   */
  private selectSlot(slotIndex: number): void {
    // Clear previous selection
    if (this.selectedSlotIndex !== null && this.slotHighlights[this.selectedSlotIndex]) {
      this.slotHighlights[this.selectedSlotIndex].setVisible(false);
    }
    
    // Set new selection
    this.selectedSlotIndex = slotIndex;
    
    // Highlight selected slot
    if (this.slotHighlights[slotIndex]) {
      this.slotHighlights[slotIndex].setVisible(true);
    }
    
    // Enable apply button
    this.updateApplyButtonState(true);
  }
  
  /**
   * Destroy this renderer and all its visual elements
   */
  public destroy(): void {
    this.cleanup();
    this.displayContainer.destroy();
    this.removeAllListeners();
  }
} 