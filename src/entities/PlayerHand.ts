import Phaser from 'phaser';
import { Card } from '../entities/Card';
import { DeckService } from '../services/DeckService';
import { ResourceService } from '../services/ResourceService';

/**
 * Class representing a player's hand of cards
 */
export class PlayerHand {
  private _cards: Card[] = [];
  private _handLimit: number;
  private _deckService: DeckService<Card>;
  private _resourceService: ResourceService;
  private _events: Phaser.Events.EventEmitter;
  
  /**
   * Event names for PlayerHand
   */
  public static Events = {
    CARDS_CHANGED: 'cards_changed',
    HAND_DISCARDED: 'hand_discarded',
  };
  
  /**
   * Create a new PlayerHand
   * @param deckService The DeckService to draw cards from and discard to
   * @param handLimit Maximum number of cards in hand
   * @param resourceService Service for managing game resources
   */
  constructor(
    deckService: DeckService<Card>, 
    handLimit: number,
    resourceService: ResourceService
  ) {
    this._deckService = deckService;
    this._handLimit = handLimit;
    this._resourceService = resourceService;
    this._events = new Phaser.Events.EventEmitter();
  }
  
  /**
   * Draw cards from the deck up to the hand limit
   * @returns The number of cards drawn
   */
  public drawUpToLimit(): number {
    const cardsNeeded = this._handLimit - this._cards.length;
    if (cardsNeeded <= 0) return 0;
    
    const drawnCards = this._deckService.drawFromDeck(cardsNeeded);
    if (drawnCards.length > 0) {
      this._cards.push(...drawnCards);
      this._events.emit(PlayerHand.Events.CARDS_CHANGED, this._cards);
    }
    
    return drawnCards.length;
  }
  
  /**
   * Discard the entire hand and draw new cards
   * @returns The number of cards drawn
   */
  public discardAndDraw(): number {
    // Discard all cards in hand
    this.discardHand()
    
    // Draw up to the hand limit
    return this.drawUpToLimit();
  }

  /**
   * Discard the entire hand and draw new cards
   * @returns The number of cards drawn
   */
  public discardHand(): void {
    // Discard all cards in hand
    this._cards.forEach(card => {
      this._deckService.discard(card);
    });
    
    const hadCards = this._cards.length > 0;
    this._cards = [];
    
    if (hadCards) {
      this._events.emit(PlayerHand.Events.CARDS_CHANGED, this._cards);
      this._events.emit(PlayerHand.Events.HAND_DISCARDED);
    }

    this._resourceService.resetResourcesHandDiscard();
  }
  
  /**
   * End the day by shuffling discard pile into deck and drawing a new hand
   * @returns The number of cards drawn
   */
  public shuffleDiscardIntoTheDeck(): void {
    // Shuffle discard pile into deck
    this._deckService.shuffleDiscardIntoDeck();
  }
  
  /**
   * Discard a specific card from the hand
   * @param index Index of the card to discard
   * @returns The discarded card or undefined if index is invalid
   */
  public discardCard(index: number): Card | undefined {
    if (index < 0 || index >= this._cards.length) {
      return undefined;
    }
    
    const [discardedCard] = this._cards.splice(index, 1);
    this._deckService.discard(discardedCard);
    
    this._events.emit(PlayerHand.Events.CARDS_CHANGED, this._cards);
    return discardedCard;
  }
  
  /**
   * Play a card from the hand (remove it without discarding)
   * @param index Index of the card to play
   * @returns The played card or undefined if index is invalid
   */
  public playCard(index: number): Card | undefined {
    if (index < 0 || index >= this._cards.length) {
      return undefined;
    }
    
    const [playedCard] = this._cards.splice(index, 1);
    this._events.emit(PlayerHand.Events.CARDS_CHANGED, this._cards);
    return playedCard;
  }
  
  /**
   * Get all cards in the hand
   */
  public getCards(): Card[] {
    return [...this._cards];
  }
  
  /**
   * Get the current hand size
   */
  public getSize(): number {
    return this._cards.length;
  }
  
  /**
   * Get the hand limit
   */
  public getHandLimit(): number {
    return this._handLimit;
  }
  
  /**
   * Set a new hand limit
   * @param limit New hand limit
   */
  public setHandLimit(limit: number): void {
    this._handLimit = limit;
  }

  /**
   * Discard a specific card from the hand by its unique_id
   * @param uniqueId The unique_id of the card to discard
   * @returns The discarded card or undefined if not found
   */
  public discardByUniqueId(uniqueId: string): Card | undefined {
    const index = this._cards.findIndex(card => card.unique_id === uniqueId);
    if (index === -1) return undefined;
    
    return this.discardCard(index);
  }

  /**
   * Add event listener for hand events
   * @param event Event name
   * @param fn Event handler function
   * @param context Context for the event handler
   */
  public on(event: string, fn: Function, context?: any): Phaser.Events.EventEmitter {
    return this._events.on(event, fn, context);
  }
  
  /**
   * Remove event listener
   * @param event Event name
   * @param fn Event handler function
   * @param context Context for the event handler
   */
  public off(event: string, fn?: Function, context?: any): Phaser.Events.EventEmitter {
    return this._events.off(event, fn, context);
  }
} 