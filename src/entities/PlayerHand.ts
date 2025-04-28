import { DeckService } from '../services/DeckService';
import { Card } from '../types/game';

/**
 * Class representing a player's hand of cards
 */
export class PlayerHand {
  private _cards: Card[] = [];
  private _handLimit: number;
  private _deckService: DeckService<Card>;
  
  /**
   * Create a new PlayerHand
   * @param deckService The DeckService to draw cards from and discard to
   * @param handLimit Maximum number of cards in hand
   */
  constructor(deckService: DeckService<Card>, handLimit: number) {
    this._deckService = deckService;
    this._handLimit = handLimit;
  }
  
  /**
   * Draw cards from the deck up to the hand limit
   * @returns The number of cards drawn
   */
  public drawUpToLimit(): number {
    const cardsNeeded = this._handLimit - this._cards.length;
    if (cardsNeeded <= 0) return 0;
    
    const drawnCards = this._deckService.drawFromDeck(cardsNeeded);
    this._cards.push(...drawnCards);
    
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
    
    this._cards = [];
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
} 