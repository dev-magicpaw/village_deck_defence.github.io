import Phaser from 'phaser';
import { Card } from '../entities/Card';
import { StickerConfig } from '../entities/Sticker';
import { DeckService } from '../services/DeckService';
import { CARD_HEIGHT, CARD_WIDTH, CardRenderer } from './CardRenderer';
import { PlayerHandRenderer } from './PlayerHandRenderer';

/**
 * Events emitted by the CardOverlayRenderer
 */
export enum CardOverlayRendererEvents {
  CARD_SELECTED = 'card-selected',
  CLOSED = 'closed'
}

/**
 * Renders a full-screen overlay displaying all player cards
 */
export class CardOverlayRenderer extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private displayContainer: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private isVisible: boolean = false;
  private playerHandRenderer: PlayerHandRenderer;
  private cardRenderers: CardRenderer[] = [];
  private closeButton: Phaser.GameObjects.Image;
  private title: Phaser.GameObjects.Text;
  private selectedSticker: StickerConfig | null = null;
  private onApplyCallback?: (stickerConfig: StickerConfig, card: Card) => void;
  private deckService: DeckService;
  
  // Card dimensions and grid configuration
  private static GRID_COLUMNS = 6;
  private static GRID_ROWS = 3;

  /**
   * Create a new CardOverlayRenderer
   * @param scene The Phaser scene to render in
   * @param playerHandRenderer The player hand renderer to get cards from
   * @param deckService The deck service to get deck and discard cards from
   * @param onApplyCallback Callback when a sticker is applied to a card
   */
  constructor(
    scene: Phaser.Scene,
    playerHandRenderer: PlayerHandRenderer,
    deckService: DeckService,
    onApplyCallback?: (stickerConfig: StickerConfig, card: Card) => void
  ) {
    super();
    
    this.scene = scene;
    this.playerHandRenderer = playerHandRenderer;
    this.deckService = deckService;
    this.onApplyCallback = onApplyCallback;
    
    // Create a container to hold the overlay
    this.displayContainer = this.scene.add.container(0, 0);
    this.displayContainer.setVisible(false);
    
    // Set a very high depth to ensure it renders on top of everything
    this.displayContainer.setDepth(2000);
    
    // Create the background
    const { width, height } = this.scene.cameras.main;
    this.background = this.scene.add.rectangle(0, 0, width, height, 0x222222, 0.9);
    this.background.setOrigin(0, 0);
    
    // Make the background interactive with explicit hit area
    this.background.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    
    // Create a title
    this.title = this.scene.add.text(
      width / 2,
      40,
      'Select Card to Apply Sticker',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    );
    this.title.setOrigin(0.5, 0.5);
    
    // Add close button
    this.closeButton = this.scene.add.image(
      width - 30,
      30,
      'round_metal_cross'
    );
    this.closeButton.setScale(1.2);
    this.closeButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.hide();
        this.emit(CardOverlayRendererEvents.CLOSED);
      });
    
    // Add hover effects for close button
    this.closeButton.on('pointerover', () => {
      this.closeButton.setScale(1.4);
    });
    
    this.closeButton.on('pointerout', () => {
      this.closeButton.setScale(1.2);
    });
    
    // Add elements to the container
    this.displayContainer.add([
      this.background,
      this.title,
      this.closeButton
    ]);
  }
  
  /**
   * Set the sticker to be applied to a card
   * @param sticker The sticker configuration
   */
  public setSticker(sticker: StickerConfig): void {
    this.selectedSticker = sticker;
    
    // Update title to include the sticker name
    if (sticker) {
      this.setTitle(`Select Card to Apply '${sticker.name}' Sticker`);
    }
  }
  
  /**
   * Show the overlay and render all cards
   */
  public show(): void {
    if (!this.isVisible) {
      this.isVisible = true;
      this.displayContainer.setVisible(true);
      this.renderCards();
    }
  }
  
  /**
   * Hide the overlay
   */
  public hide(): void {
    if (this.isVisible) {
      this.isVisible = false;
      this.displayContainer.setVisible(false);
    }
  }
  
  /**
   * Get all player cards from different sources
   */
  private getPlayerCards(): { hand: Card[], discard: Card[], deck: Card[] } {
    // Get cards from the player hand renderer
    const hand = this.playerHandRenderer.getCardsInHand();
    
    // Get deck and discard cards from the deck service
    const deck = this.deckService.getDeck();
    const discard = this.deckService.getDiscardPile();
    
    return { hand, deck, discard };
  }
  
  /**
   * Render all player cards scaled to fit on screen
   */
  private renderCards(): void {
    // Clear existing card renderers
    this.clearCardRenderers();
    
    // Get all player cards
    const { hand, discard, deck } = this.getPlayerCards();
    const allCards = [...hand, ...discard, ...deck];
    
    if (allCards.length === 0) {
      throw new Error('No cards available');
    }
    
    // Calculate optimal card size
    const { width, height } = this.scene.cameras.main;
    const padding = 20;
    const topMargin = 80; // Space for title
    
    // Calculate grid dimensions
    let cols: number;
    let rows: number;
    
    cols = CardOverlayRenderer.GRID_COLUMNS;
    rows = CardOverlayRenderer.GRID_ROWS;
    
    // For now we use a fixed scale
    const scale = 1;
    
    // Calculate actual card dimensions after scaling
    const actualCardWidth = CARD_WIDTH * scale;
    const actualCardHeight = CARD_HEIGHT * scale;
    
    // Calculate starting position
    const startX = padding + (width - padding * 2 - (actualCardWidth * cols) - (padding * (cols - 1))) / 2;
    const startY = topMargin;

    // Render each card
    allCards.forEach((card, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = startX + col * (actualCardWidth + padding)
      const y = startY + row * (actualCardHeight + padding) + actualCardHeight / 2;
      
      // Create card renderer (providing necessary parameters according to the class definition)
      const cardRenderer = new CardRenderer(this.scene, card, x, y, scale);
      
      const container = cardRenderer.getContainer();      
      this.cardRenderers.push(cardRenderer);
      this.displayContainer.add(container);
    });
    
    // Add card source labels
    this.addCardSourceLabels(hand, discard, deck);
  }
  
  /**
   * Add labels showing which pile each card comes from
   */
  private addCardSourceLabels(hand: Card[], discard: Card[], deck: Card[]): void {
    const { width } = this.scene.cameras.main;
    const labelY = 70;
    const spacing = 150;
    
    // Calculate positions
    const centerX = width / 2;
    const handX = centerX - spacing;
    const deckX = centerX;
    const discardX = centerX + spacing;
    
    // Create labels with counts
    const createLabel = (x: number, text: string, count: number) => {
      const label = this.scene.add.text(
        x,
        labelY,
        `${text} (${count})`,
        {
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold'
        }
      );
      label.setOrigin(0.5, 0.5);
      this.displayContainer.add(label);
    };
    
    createLabel(handX, 'Hand', hand.length);
    createLabel(deckX, 'Deck', deck.length);
    createLabel(discardX, 'Discard', discard.length);
  }
  
  /**
   * Clear all card renderers
   */
  private clearCardRenderers(): void {
    this.cardRenderers.forEach(renderer => {
      renderer.destroy();
    });
    this.cardRenderers = [];
  }
  
  /**
   * Set the overlay title
   */
  public setTitle(title: string): void {
    if (this.title) {
      this.title.setText(title);
    }
  }
  
  /**
   * Check if the overlay is currently visible
   */
  public getIsVisible(): boolean {
    return this.isVisible;
  }
  
  /**
   * Destroy this renderer and all its visual elements
   */
  public destroy(): void {
    this.clearCardRenderers();
    this.displayContainer.destroy();
    this.removeAllListeners();
  }
} 