import Phaser from 'phaser';
import { Card, CardEvents } from '../entities/Card';
import { PlayerHand } from '../entities/PlayerHand';
import { BuildingService, BuildingServiceEvents } from '../services/BuildingService';
import { InvasionService } from '../services/InvasionService';
import { RecruitService, RecruitServiceEvents } from '../services/RecruitService';
import { ResourceService } from '../services/ResourceService';
import { StickerShopService } from '../services/StickerShopService';
import { TavernService, TavernServiceEvents } from '../services/TavernService';
import { CARD_HEIGHT, CARD_WIDTH, CardRenderer } from './CardRenderer';

/**
 * Events emitted by the PlayerHandRenderer
 */
export enum PlayerHandRendererEvents {
  SELECTION_CHANGED = 'selection-changed'
}

/**
 * Renders a player's hand in the UI
 */
export class PlayerHandRenderer extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private playerHand: PlayerHand;
  private cardRenderers: CardRenderer[] = [];
  private handPanel!: Phaser.GameObjects.NineSlice;
  private discardButton!: Phaser.GameObjects.NineSlice;
  private discardButtonText!: Phaser.GameObjects.Text;
  private endDayButton!: Phaser.GameObjects.NineSlice;
  private endDayButtonText!: Phaser.GameObjects.Text;
  private invasionService: InvasionService;
  private resourceService: ResourceService;
  private stickerShopService: StickerShopService;
  private tavernService: TavernService;
  private buildingService: BuildingService;
  private recruitService: RecruitService;
  private panelWidth: number;
  private panelHeight: number;
  private panelX: number;
  private panelY: number;
  private panelMarginX: number = 20;
  private cardWidth: number = CARD_WIDTH;
  private cardHeight: number = CARD_HEIGHT;
  private cardSpacing: number = 30;
  private deckHandMargin: number = 60;
  private currentCards: Card[] = [];
  private selectedCards: Set<string> = new Set(); // Track selected cards by unique_id
  private isShopOpen: boolean = false; // Track if sticker shop is open
  private isTavernOpen: boolean = false; // Track if tavern is open
  private isBuildingMenuOpen: boolean = false; // Track if building menu is open
  private isRecruitAgencyOpen: boolean = false; // Track if recruit agency is open
  
  /**
   * Create a new player hand renderer
   * @param scene The Phaser scene to render in
   * @param playerHand The player's hand to render
   * @param panelX X position of the panel
   * @param panelY Y position of the panel
   * @param panelWidth Width of the panel
   * @param panelHeight Height of the panel
   * @param invasionService Invasion service for day progression
   * @param resourceService Resource service for resetting resources
   * @param stickerShopService Sticker shop service for shop state
   * @param buildingService Building service for building menu state
   * @param tavernService Tavern service for tavern state
   * @param recruitService Recruit service for recruit agency state
   */
  constructor(
    scene: Phaser.Scene, 
    playerHand: PlayerHand,
    panelX: number,
    panelY: number,
    panelWidth: number,
    panelHeight: number,
    invasionService: InvasionService,
    resourceService: ResourceService,
    stickerShopService: StickerShopService,
    buildingService: BuildingService,
    tavernService: TavernService,
    recruitService: RecruitService
  ) {
    super();
    this.scene = scene;
    this.playerHand = playerHand;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = panelWidth;
    this.panelHeight = panelHeight;
    this.invasionService = invasionService;
    this.resourceService = resourceService;
    this.stickerShopService = stickerShopService;
    this.tavernService = tavernService;
    this.buildingService = buildingService;
    this.recruitService = recruitService;
    
    // Get initial cards from hand
    this.currentCards = playerHand.getCards();
    
    // Subscribe to the hand's change events
    this.playerHand.on(PlayerHand.Events.CARDS_CHANGED, this.onCardsChanged, this);
    
    // Subscribe to events from initial cards
    this.updateCardEventSubscriptions(this.currentCards);
    
    // Initial rendering of cards (this must happen after the scene is fully created,
    // so it will be done in init() instead)
    
    // Subscribe to sticker shop state changes if service is provided
    if (this.stickerShopService) {
      this.stickerShopService.on(
        StickerShopService.Events.SHOP_STATE_CHANGED,
        this.onShopStateChanged,
        this
      );
    }
    
    // Subscribe to tavern state changes
    this.tavernService.on(
      TavernServiceEvents.TAVERN_STATE_CHANGED,
      this.onTavernStateChanged,
      this
    );
    
    // Subscribe to building menu state changes
    this.buildingService.on(
      BuildingServiceEvents.MENU_STATE_CHANGED,
      this.onBuildingMenuStateChanged,
      this
    );
    
    // Subscribe to recruit agency state changes
    this.recruitService.on(
      RecruitServiceEvents.AGENCY_STATE_CHANGED,
      this.onRecruitAgencyStateChanged,
      this
    );
  }
  
  /**
   * Handler for sticker shop state changes
   * @param isOpen Whether the shop is open
   */
  private onShopStateChanged(isOpen: boolean): void {
    this.isShopOpen = isOpen;
    
    // If shop is closing, deselect all cards
    if (!isOpen) {
      this.clearCardSelection();
    }
    this.updateButtonVisibility();
  }

  /**
   * Handler for tavern state changes
   * @param isOpen Whether the tavern is open
   */
    private onTavernStateChanged(isOpen: boolean): void {
      this.isTavernOpen = isOpen;
      
      // If tavern is closing, deselect all cards
      if (!isOpen) {
        this.clearCardSelection();
      }
      this.updateButtonVisibility();
    }
  
  /**
   * Handler for when cards in the hand change
   * @param cards Updated cards array
   */
  private onCardsChanged(cards: Card[]): void {
    // Update the UI to reflect the new cards
    this.renderCards();
    this.updateButtonVisibility();
    
    // Update card event subscriptions
    this.updateCardEventSubscriptions(cards);
  }
  
  /**
   * Subscribe to events from all cards in the hand
   * @param cards Cards to subscribe to events from
   */
  private updateCardEventSubscriptions(cards: Card[]): void {
    // First, remove any existing event listeners from old cards
    this.currentCards.forEach(card => {
      card.off(CardEvents.STICKER_APPLIED, this.onCardStickerApplied, this);
    });
    
    // Then add event listeners to the new cards
    cards.forEach(card => {
      card.on(CardEvents.STICKER_APPLIED, this.onCardStickerApplied, this);
    });
  }
  
  /**
   * Handler for when a sticker is applied to a card
   */
  private onCardStickerApplied(): void {
    // Re-render all cards to reflect the new sticker - force render since the card object itself hasn't changed
    this.renderCards(true);
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
    
    this.discardButton.on('pointerdown', () => {
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
    
    this.endDayButton.on('pointerdown', () => {
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
    
    this.updateButtonVisibility();
    
    // Do initial render of cards - force render even if data hasn't changed
    this.renderCards(true);
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
   * @deprecated Use renderCards() instead, which is more efficient
   */
  public render(): void {
    this.renderCards();
  }
  
  /**
   * Efficiently render the player's hand cards by minimizing object creation/destruction
   * @param forceRender If true, renders cards even if the data hasn't changed
   */
  private renderCards(forceRender: boolean = false): void {
    // Get cards from player hand
    const newCards = this.playerHand.getCards();
    
    // Check if the cards have actually changed, unless forceRender is true
    if (!forceRender && this.areCardsEqual(this.currentCards, newCards)) {
      return;
    }
    
    // Update current cards
    this.currentCards = [...newCards];
    
    // Add +0.5 * cardWidth since card origin is 0.5
    // Add +1 * cardWidth for the discard button
    const startX = this.panelX + this.panelMarginX + this.cardWidth + 0.5 * this.cardWidth + this.deckHandMargin;
    
    // Determine how many renderers we need to create or remove
    const currentCount = this.cardRenderers.length;
    const newCount = newCards.length;
    
    // If we have more renderers than we need, destroy the excess ones
    if (currentCount > newCount) {
      for (let i = newCount; i < currentCount; i++) {
        this.cardRenderers[i].destroy();
      }
      // Remove the destroyed renderers from the array
      this.cardRenderers.splice(newCount, currentCount - newCount);
    }
    
    // Update existing renderers and create new ones as needed
    for (let i = 0; i < newCount; i++) {
      const cardX = startX + i * (this.cardWidth + this.cardSpacing);
      const cardY = this.panelY + this.panelHeight / 2;
      
      if (i < currentCount) {
        // Update existing card renderer position
        this.cardRenderers[i].setPosition(cardX, cardY);
        
        // Update the card data if it's different from the current one
        this.cardRenderers[i].updateCard(newCards[i], i);
        
        // Update selection state
        const isSelected = this.selectedCards.has(newCards[i].unique_id);
        this.cardRenderers[i].setSelected(isSelected);
      } else {
        // Create new card renderer
        const cardRenderer = new CardRenderer(
          this.scene,
          newCards[i],
          cardX,
          cardY,
          i,
          (cardIndex) => this.onCardClick(cardIndex),
          1, // default scale
          true, // change scale on hover
          false, // don't change sticker scale on hover
          false, // not selectable sticker
          undefined, // no sticker click callback
          false // not in discard pile
        );
        
        // Set initial selection state
        const isSelected = this.selectedCards.has(newCards[i].unique_id);
        cardRenderer.setSelected(isSelected);
        
        this.cardRenderers.push(cardRenderer);
      }
    }
  }
  
  /**
   * Compare two arrays of cards to see if they are equal
   * @param cards1 First array of cards
   * @param cards2 Second array of cards
   * @returns True if the arrays contain the same cards in the same order
   */
  private areCardsEqual(cards1: Card[], cards2: Card[]): boolean {
    if (cards1.length !== cards2.length) {
      return false;
    }
    
    // For now, just check if the arrays have the same length and cards have the same IDs
    // This could be expanded to do a more detailed comparison if needed
    for (let i = 0; i < cards1.length; i++) {
      if (cards1[i].id !== cards2[i].id) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Handle card click
   * @param index Index of the clicked card
   */
  private onCardClick(index: number): void {
    if (index < 0 || index >= this.currentCards.length) {
      throw new Error(`Invalid card index: ${index}`);
    }

    if (this.isShopOpen || this.isTavernOpen || this.isBuildingMenuOpen || this.isRecruitAgencyOpen) {
      const card = this.currentCards[index];
      const uniqueId = card.unique_id;
      
      // Toggle selection state
      if (this.selectedCards.has(uniqueId)) {
        this.selectedCards.delete(uniqueId);
        this.cardRenderers[index].setSelected(false);
      } else {
        this.selectedCards.add(uniqueId);
        this.cardRenderers[index].setSelected(true);
      }
      
      // Emit event that selection has changed - don't pass the value
      this.emit(PlayerHandRendererEvents.SELECTION_CHANGED);
    } else {
      // Default behavior when no menu is open
      console.log(`Card ${index} clicked`);
    }
  }
  
  /**
   * Calculate the total invention value of selected cards
   * @returns The total invention value of selected cards
   */
  public getSelectedInventionValue(): number {
    let total = 0;
    
    this.currentCards.forEach(card => {
      if (this.selectedCards.has(card.unique_id)) {
        total += card.getInventionValue();
      }
    });
    
    return total;
  }

  public getSelectedPowerValue(): number {
    let total = 0;
    
    this.currentCards.forEach(card => {
      if (this.selectedCards.has(card.unique_id)) {
        total += card.getPowerValue();
      }
    });
    
    return total;
  }

  public getSelectedConstructionValue(): number {
    let total = 0;
    
    this.currentCards.forEach(card => {
      if (this.selectedCards.has(card.unique_id)) {
        total += card.getConstructionValue();
      }
    });
    
    return total;
  }
  
  
  
  
  /**
   * Clear selection from all cards
   */
  public clearCardSelection(): void {
    this.selectedCards.clear();
    
    // Update visual state of all card renderers
    this.cardRenderers.forEach(renderer => {
      renderer.setSelected(false);
    });
    
    // Emit event that selection has changed
    this.emit(PlayerHandRendererEvents.SELECTION_CHANGED);
  }
  
  /**
   * Get array of selected card unique IDs
   */
  public getSelectedCardIds(): string[] {
    return Array.from(this.selectedCards);
  }
  
  /**
   * Get the current cards in the player's hand
   */
  public getCardsInHand(): Card[] {
    return [...this.currentCards];
  }
  
  /**
   * Select and deselect cards by their unique IDs
   * @param idsToSelect Array of card unique IDs to select
   * @param idsToDeselect Array of card unique IDs to deselect
   */
  public selectAndDeselectCardsByIds(idsToSelect: string[], idsToDeselect: string[]): void {
    // Create Set for faster lookups
    const selectSet = new Set(idsToSelect);
    const deselectSet = new Set(idsToDeselect);
    
    // Remove cards to deselect from selection
    deselectSet.forEach(id => {
      this.selectedCards.delete(id);
    });
    
    // Add cards to select to selection
    selectSet.forEach(id => {
      this.selectedCards.add(id);
    });
    
    // Update visual state of all card renderers
    this.currentCards.forEach((card, index) => {
      const isSelected = this.selectedCards.has(card.unique_id);
      this.cardRenderers[index].setSelected(isSelected);
    });
    
    // Emit selection changed event
    this.emit(PlayerHandRendererEvents.SELECTION_CHANGED);
  }
  
  /**
   * Remove all card visual objects
   */
  private clearCardObjects(): void {
    this.cardRenderers.forEach(renderer => {
      renderer.destroy();
    });
    this.cardRenderers = [];
    this.currentCards = [];
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
    
    this.discardButton.disableInteractive();
    this.endDayButton.disableInteractive();
    
    // Only make buttons interactive if they're visible AND all menus are closed
    if (!this.isShopOpen && !this.isTavernOpen && !this.isBuildingMenuOpen && !this.isRecruitAgencyOpen) {
      if (!isDeckEmpty) {
        this.discardButton.setInteractive({ useHandCursor: true });
      } else {
        this.endDayButton.setInteractive({ useHandCursor: true });
      }
    }
  }
  
  /**
   * Handle discard and draw new hand button click
   */
  private discardAndDrawNewHand(): void {
    this.playerHand.discardAndDraw();
    // The rendering will be handled by the onCardsChanged event handler
    this.updateButtonVisibility();
  }
  
  /**
   * Handle End the Day button click
   */
  private endDay(): void {
    // 0. Reset all resources if service exists
    if (this.resourceService) {
      this.resourceService.resetResources();
    }
    
    // 1. Progress the invasion if service exists
    if (this.invasionService) {
      this.invasionService.progressInvasion();
    }
    
    // 2. Shuffle discard into deck and draw new hand
    this.playerHand.discardHand();
    this.playerHand.shuffleDiscardIntoTheDeck();
    this.playerHand.drawUpToLimit();
    
    // 3. The updating of UI is handled by events now
    this.updateButtonVisibility();
  }
  
  /**
   * Update only what's necessary (button visibility)
   */
  public update(): void {
    this.updateButtonVisibility();
  }
  
  /**
   * Discard cards from the hand by their unique_ids
   * @param uniqueIds Array of unique_ids to discard
   */
  public discardCardsByUniqueIds(uniqueIds: string[]): void {    
    // Discard each card by its unique_id
    uniqueIds.forEach(uniqueId => {
      this.playerHand.discardByUniqueId(uniqueId);
    });
  }
  
  /**
   * Clean up resources when the renderer is no longer needed
   */
  public destroy(): void {
    // Unsubscribe from events
    this.playerHand.off(PlayerHand.Events.CARDS_CHANGED, this.onCardsChanged, this);
    
    // Unsubscribe from sticker shop events if service exists
    if (this.stickerShopService) {
      this.stickerShopService.off(
        StickerShopService.Events.SHOP_STATE_CHANGED,
        this.onShopStateChanged,
        this
      );
    }
    
    // Unsubscribe from tavern events
    this.tavernService.off(
      TavernServiceEvents.TAVERN_STATE_CHANGED,
      this.onTavernStateChanged,
      this
    );
    
    // Unsubscribe from building menu events
    this.buildingService.off(
      BuildingServiceEvents.MENU_STATE_CHANGED,
      this.onBuildingMenuStateChanged,
      this
    );
    
    // Unsubscribe from recruit agency events
    this.recruitService.off(
      RecruitServiceEvents.AGENCY_STATE_CHANGED,
      this.onRecruitAgencyStateChanged,
      this
    );
    
    // Unsubscribe from all card events
    this.currentCards.forEach(card => {
      card.off(CardEvents.STICKER_APPLIED, this.onCardStickerApplied, this);
    });
    
    // Clear card objects
    this.clearCardObjects();
    
    // Destroy UI elements
    this.handPanel.destroy();
    this.discardButton.destroy();
    this.discardButtonText.destroy();
    this.endDayButton.destroy();
    this.endDayButtonText.destroy();
  }

  /**
   * Handler for building menu state changes
   * @param isOpen Whether the building menu is open
   */
  private onBuildingMenuStateChanged(isOpen: boolean): void {
    this.isBuildingMenuOpen = isOpen;
    
    // If menu is closing, deselect all cards
    if (!isOpen) {
      this.clearCardSelection();
    }
    
    this.updateButtonVisibility();
  }

  /**
   * Handler for recruit agency state changes
   * @param isOpen Whether the recruit agency is open
   */
  private onRecruitAgencyStateChanged(isOpen: boolean): void {
    this.isRecruitAgencyOpen = isOpen;
    
    // If recruit agency is closing, deselect all cards
    if (!isOpen) {
      this.clearCardSelection();
    }
    this.updateButtonVisibility();
  }
} 