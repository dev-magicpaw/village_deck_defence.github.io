import Phaser from 'phaser';
import { PlayerHand } from '../entities/PlayerHand';
import { InvasionService } from '../services/InvasionService';
import { Card } from '../types/game';

/**
 * Renders a player's hand in the UI
 */
export class PlayerHandRenderer {
  private scene: Phaser.Scene;
  private playerHand: PlayerHand;
  private cardObjects: Phaser.GameObjects.Container[] = [];
  private handPanel!: Phaser.GameObjects.NineSlice;
  private discardButton!: Phaser.GameObjects.NineSlice;
  private discardButtonText!: Phaser.GameObjects.Text;
  private endDayButton!: Phaser.GameObjects.NineSlice;
  private endDayButtonText!: Phaser.GameObjects.Text;
  private invasionService?: InvasionService;
  private panelWidth: number;
  private panelHeight: number;
  private panelX: number;
  private panelY: number;
  private panelMarginX: number = 20;
  private cardWidth: number = 150;
  private cardHeight: number = 200;
  private cardSpacing: number = 20;
  private deckHandMargin: number = 50;
  
  /**
   * Create a new player hand renderer
   * @param scene The Phaser scene to render in
   * @param playerHand The player's hand to render
   * @param panelX X position of the panel
   * @param panelY Y position of the panel
   * @param panelWidth Width of the panel
   * @param panelHeight Height of the panel
   * @param invasionService Optional invasion service for day progression
   */
  constructor(
    scene: Phaser.Scene, 
    playerHand: PlayerHand,
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
    invasionService?: InvasionService
  ) {
    this.scene = scene;
    this.playerHand = playerHand;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.invasionService = invasionService;
  }
  
  /**
   * Initialize the hand panel and button
   */
  public init(): void {
    // Create the hand panel
    this.handPanel = this.scene.add['nineslice'](
      this.panelX,
      this.panelY,
      'panel_metal_corners_metal',
      undefined,
      this.panelWidth,
      this.panelHeight,
      20,
      20,
      20,
      20
    );
    this.handPanel.setOrigin(0, 0);
    
    // Create discard and draw button with same dimensions as cards
    this.discardButton = this.scene.add['nineslice'](
      this.panelX + this.panelMarginX,
      this.panelY + this.panelHeight / 2,
      'panel_wood_paper',
      undefined,
      this.cardWidth,
      this.cardHeight,
      20,
      20,
      20,
      20
    );
    this.discardButton.setOrigin(0, 0.5);
    
    // Add button text with deck size
    this.updateDiscardButtonText();
    
    // Make button interactive
    this.discardButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.discardAndDrawNewHand();
      });
      
    // Button hover effects
    this.discardButton.on('pointerover', () => {
      this.discardButton.setScale(1.05);
      this.discardButtonText.setScale(1.05);
    });
    
    this.discardButton.on('pointerout', () => {
      this.discardButton.setScale(1);
      this.discardButtonText.setScale(1);
    });
    
    // Create End the Day button (initially hidden)
    this.endDayButton = this.scene.add['nineslice'](
      this.panelX + this.panelMarginX,
      this.panelY + this.panelHeight / 2,
      'panel_metal_corners_nice',
      undefined,
      this.cardWidth,
      this.cardHeight,
      20,
      20,
      20,
      20
    );
    this.endDayButton.setOrigin(0, 0.5);
    
    // Add End Day button text
    this.endDayButtonText = this.scene.add.text(
      this.panelX + 20 + this.cardWidth / 2,
      this.panelY + this.panelHeight / 2,
      'End\nthe\nday',
      {
        fontSize: '24px',
        color: '#000000',
        align: 'center',
        wordWrap: { width: this.cardWidth - 30 }
      }
    );
    this.endDayButtonText.setOrigin(0.5, 0.5);
    
    // Make End Day button interactive
    this.endDayButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.endDay();
      });
      
    // End Day button hover effects
    this.endDayButton.on('pointerover', () => {
      this.endDayButton.setScale(1.05);
      this.endDayButtonText.setScale(1.05);
    });
    
    this.endDayButton.on('pointerout', () => {
      this.endDayButton.setScale(1);
      this.endDayButtonText.setScale(1);
    });
    
    // Initially hide the End Day button
    this.endDayButton.setVisible(false);
    this.endDayButtonText.setVisible(false);
    
    // Update button visibility based on deck state
    this.updateButtonVisibility();
  }
  
  /**
   * Update the discard button text to show number of cards in deck
   */
  private updateDiscardButtonText(): void {
    const deckService = this.playerHand['_deckService'];
    const cardsInDeck = deckService.getDeckSize();
    
    // Create the text object if it doesn't exist
    if (!this.discardButtonText) {
      this.discardButtonText = this.scene.add.text(
        this.panelX + 20 + this.cardWidth / 2,
        this.panelY + this.panelHeight / 2,
        '',
        {
          fontSize: '18px',
          color: '#000000',
          align: 'center',
          wordWrap: { width: this.cardWidth - 30 }
        }
      );
      this.discardButtonText.setOrigin(0.5, 0.5);
    }
    
    // Update the text
    this.discardButtonText.setText(`Discard\nand draw\n\n${cardsInDeck} cards left`);
  }
  
  /**
   * Render the player's hand cards
   */
  public render(): void {
    // Clear old card objects
    this.clearCardObjects();
    
    // Get cards from player hand
    const cards = this.playerHand.getCards();
    
    // Add +0.5 * cardWidth since card origin is 0.5
    // Add +1 * cardWidth for the discard button
    const startX = this.panelX + this.panelMarginX + this.cardWidth + 0.5 * this.cardWidth + this.deckHandMargin;
    
    // Render each card
    cards.forEach((card, index) => {
      const cardX = startX + index * (this.cardWidth + this.cardSpacing);
      const cardY = this.panelY + this.panelHeight / 2;
      
      this.createCardObject(card, cardX, cardY, index);
    });
  }
  
  /**
   * Create a visual card object
   * @param card Card data to render
   * @param x X position
   * @param y Y position
   * @param index Card index in hand
   */
  private createCardObject(card: Card, x: number, y: number, index: number): void {
    // Create a container for the card and its elements
    const container = this.scene.add.container(x, y);
    
    // Card background
    const cardBackground = this.scene.add['nineslice'](
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
    cardBackground.setOrigin(0.5, 0.5);
    
    // Card name
    const cardName = this.scene.add.text(
      0,
      -this.cardHeight / 2 + 30,
      card.name,
      {
        fontSize: '18px',
        color: '#000000',
        align: 'center',
        wordWrap: { width: this.cardWidth - 20 }
      }
    );
    cardName.setOrigin(0.5, 0.5);
    
    // Add race text if available
    if (card.race) {
      const raceText = this.scene.add.text(
        0,
        -this.cardHeight / 2 + 55,
        card.race,
        {
          fontSize: '14px',
          color: '#333333',
          align: 'center'
        }
      );
      raceText.setOrigin(0.5, 0.5);
      container.add(raceText);
    }
    
    // Add basic track info if available
    if (card.tracks) {
      const tracksY = -this.cardHeight / 2 + 85;
      const trackSpacing = 25;
      
      // Power track
      if (card.tracks.power > 0) {
        const powerIcon = this.scene.add.image(-50, tracksY, 'resource_power');
        powerIcon.setScale(0.4);
        const powerText = this.scene.add.text(-30, tracksY, `${card.tracks.power}`, {
          fontSize: '16px',
          color: '#cc0000'
        });
        powerText.setOrigin(0, 0.5);
        container.add(powerIcon);
        container.add(powerText);
      }
      
      // Construction track
      if (card.tracks.construction > 0) {
        const constructionIcon = this.scene.add.image(-50, tracksY + trackSpacing, 'resource_construction');
        constructionIcon.setScale(0.4);
        const constructionText = this.scene.add.text(-30, tracksY + trackSpacing, `${card.tracks.construction}`, {
          fontSize: '16px',
          color: '#6b4c2a'
        });
        constructionText.setOrigin(0, 0.5);
        container.add(constructionIcon);
        container.add(constructionText);
      }
      
      // Invention track
      if (card.tracks.invention > 0) {
        const inventionIcon = this.scene.add.image(-50, tracksY + trackSpacing * 2, 'resource_invention');
        inventionIcon.setScale(0.4);
        const inventionText = this.scene.add.text(-30, tracksY + trackSpacing * 2, `${card.tracks.invention}`, {
          fontSize: '16px',
          color: '#6666cc'
        });
        inventionText.setOrigin(0, 0.5);
        container.add(inventionIcon);
        container.add(inventionText);
      }
    }
    
    // Make card interactive
    cardBackground.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.onCardClick(index);
      });
    
    // Hover effects
    cardBackground.on('pointerover', () => {
      container.setScale(1.05);
    });
    
    cardBackground.on('pointerout', () => {
      container.setScale(1);
    });
    
    // Add elements to container
    container.add(cardBackground);
    container.add(cardName);
    
    // Add container to tracked objects
    this.cardObjects.push(container);
  }
  
  /**
   * Handle card click
   * @param index Index of the clicked card
   */
  private onCardClick(index: number): void {
    // Here we would implement card selection/play logic
    console.log(`Card ${index} clicked`);
    
    // This could emit an event or call a handler function passed in constructor
  }
  
  /**
   * Remove all card visual objects
   */
  private clearCardObjects(): void {
    this.cardObjects.forEach(container => {
      container.destroy();
    });
    this.cardObjects = [];
  }
  
  /**
   * Update the visibility of buttons based on deck state
   */
  private updateButtonVisibility(): void {
    const deckService = this.playerHand['_deckService'];
    const isDeckEmpty = deckService.isEmpty();
    
    this.discardButton.setVisible(!isDeckEmpty);
    this.discardButtonText.setVisible(!isDeckEmpty);
    
    this.endDayButton.setVisible(isDeckEmpty);
    this.endDayButtonText.setVisible(isDeckEmpty);
    
    // Update the discard button text if it's visible
    if (!isDeckEmpty) {
      this.updateDiscardButtonText();
    }
  }
  
  /**
   * Handle discard and draw new hand button click
   */
  private discardAndDrawNewHand(): void {
    this.playerHand.discardAndDraw();
    this.render();
    this.updateButtonVisibility();
  }
  
  /**
   * Handle End the Day button click
   */
  private endDay(): void {
    // 1. Progress the invasion if service exists
    if (this.invasionService) {
      this.invasionService.progressInvasion();
    }
    
    // 2. Shuffle discard into deck and draw new hand
    this.playerHand.discardHand();
    this.playerHand.shuffleDiscardIntoTheDeck();
    this.playerHand.drawUpToLimit();
    
    // 3. Update UI
    this.render();
    this.updateButtonVisibility();
  }
  
  /**
   * Update the visual representation after hand changes
   */
  public update(): void {
    this.render();
    this.updateButtonVisibility();
  }
} 