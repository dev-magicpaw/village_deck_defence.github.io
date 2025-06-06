import Phaser from 'phaser';
import { Card } from '../entities/Card';
import { StickerConfig } from '../entities/Sticker';
import { DeckService } from '../services/DeckService';
import { CARD_HEIGHT, CARD_WIDTH, CardRenderer } from './CardRenderer';
import { PlayerHandRenderer } from './PlayerHandRenderer';
import { StickerApplicationOverlayEvents, StickerApplicationOverlayRenderer } from './StickerApplicationOverlayRenderer';

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
  private background: Phaser.GameObjects.NineSlice;
  private isVisible: boolean = false;
  private playerHandRenderer: PlayerHandRenderer;
  private cardRenderers: CardRenderer[] = [];
  private closeButton: Phaser.GameObjects.Image;
  private title: Phaser.GameObjects.Text;
  private selectedSticker: StickerConfig | null = null;
  private onApplyCallback?: (stickerConfig: StickerConfig, card: Card) => void;
  private deckService: DeckService;
  private stickerApplicationOverlay: StickerApplicationOverlayRenderer | null = null;
  
  // Card dimensions and grid configuration
  private GRID_COLUMNS = 7;
  private GRID_ROWS = 3;
  private PADDING = 20;
  private TOP_MARGIN = 60;
  private LEFT_MARGIN = 55;

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
    
    // Create the background using 9-slice
    const { width, height } = this.scene.cameras.main;
    
    // Use 9-slice panel with metal corners instead of a rectangle
    this.background = this.scene.add.nineslice(
      0, 0,                              // position x, y
      'panel_metal_corners_metal_nice',  // texture key 
      undefined,                         // frame
      width, height,                     // width, height
      20, 20,                            // leftWidth, rightWidth
      20, 20                             // topHeight, bottomHeight
    );
    this.background.setOrigin(0, 0);
    this.background.setTint(0x333333); // Dark grey tint
    
    // Make the background interactive with explicit hit area
    this.background.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    
    // Create a title
    this.title = this.scene.add.text(
      width / 2,
      30,
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
    
    // Order: discard pile first, then hand, then deck
    const allCards = [...discard, ...hand, ...deck];
    
    if (allCards.length === 0) {
      throw new Error('No cards available');
    }
    
    // Calculate grid dimensions
    let cols: number;
    let rows: number;
    
    cols = this.GRID_COLUMNS;
    rows = this.GRID_ROWS;
    
    // For now we use a fixed scale
    const scale = 1;
    
    // Calculate actual card dimensions after scaling
    const actualCardWidth = CARD_WIDTH * scale;
    const actualCardHeight = CARD_HEIGHT * scale;
    
    // Calculate starting position
    const startX = this.LEFT_MARGIN + actualCardWidth/2;
    const startY = this.TOP_MARGIN;

    // Create sets for faster lookups
    const discardSet = new Set(discard.map(card => card.unique_id));

    // Render each card
    allCards.forEach((card, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const x = startX + col * (actualCardWidth + this.PADDING)
      const y = startY + row * (actualCardHeight + this.PADDING) + actualCardHeight / 2;
      
      // Check if the card is in the discard pile
      const isInDiscard = discardSet.has(card.unique_id);
      
      // Create card renderer with click callback
      const cardRenderer = new CardRenderer(
        this.scene, 
        card, 
        x, 
        y, 
        index, 
        (cardIndex) => {
          this.onCardClicked(allCards[cardIndex]);
        },
        scale,
        true,
        false,
        false,
        undefined,
        isInDiscard
      );
      
      const container = cardRenderer.getContainer();      
      this.cardRenderers.push(cardRenderer);
      this.displayContainer.add(container);
    });
  }
  
  /**
   * Handle a card being clicked
   * @param card The card that was clicked
   */
  private onCardClicked(card: Card): void {
    if (!this.selectedSticker) return;
    
    // Create sticker application overlay
    if (this.stickerApplicationOverlay) {
      this.stickerApplicationOverlay.destroy();
    }
    
    this.stickerApplicationOverlay = new StickerApplicationOverlayRenderer(
      this.scene,
      card,
      this.selectedSticker
    );
    
    // Set up event handlers
    this.stickerApplicationOverlay.on(
      StickerApplicationOverlayEvents.STICKER_APPLIED,
      (sticker: StickerConfig, targetCard: Card, slotIndex: number) => {
        if (this.onApplyCallback) {
          this.onApplyCallback(sticker, targetCard);
        }
        
        // Hide this overlay to return to sticker shop
        this.hide();
      }
    );
    
    // Listen for the CLOSED event to close this overlay too
    this.stickerApplicationOverlay.on(
      CardOverlayRendererEvents.CLOSED,
      () => {
        // Hide this overlay to return to sticker shop
        this.hide();
      }
    );
    
    // TODO remove ?
    this.stickerApplicationOverlay.on(
      StickerApplicationOverlayEvents.CANCELLED,
      () => {
        // Nothing special to do when cancelled
      }
    );
    
    // Show the overlay
    this.stickerApplicationOverlay.show();
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
    
    if (this.stickerApplicationOverlay) {
      this.stickerApplicationOverlay.destroy();
      this.stickerApplicationOverlay = null;
    }
    
    this.displayContainer.destroy();
    this.removeAllListeners();
  }
} 