import { Card } from '../entities/Card';

/**
 * A generic service for managing card decks in the game
 * Handles drawing, discarding, shuffling and other deck operations
 */
export class DeckService<T extends Card = Card> {
  private deck: T[] = [];
  private discardPile: T[] = [];
  
  /**
   * Create a new deck service
   * @param cards Optional initial cards to populate the deck
   * @param shuffle Whether to shuffle the initial deck
   */
  constructor(cards: T[] = [], shuffle: boolean = true) {
    this.deck = [...cards];
    if (shuffle && this.deck.length > 0) {
      this.shuffle();
    }
  }
  
  /**
   * Add a card to the deck
   * @param card The card to add
   * @param position 'top' or 'bottom' of the deck
   */
  addToDeck(card: T, position: 'top' | 'bottom' = 'top'): void {
    if (position === 'top') {
      this.deck.unshift(card);
    } else {
      this.deck.push(card);
    }
  }
  
  /**
   * Add multiple cards to the deck
   * @param cards The cards to add
   * @param position 'top' or 'bottom' of the deck
   */
  addCardsToDeck(cards: T[], position: 'top' | 'bottom' = 'top'): void {
    cards.forEach(card => {
      this.addToDeck(card, position);
    });
  }
  
  /**
   * Remove a specific card from the deck
   * @param cardId ID of the card to remove
   * @returns The removed card or undefined if not found
   */
  removeFromDeck(cardId: string): T | undefined {
    const index = this.deck.findIndex(card => card.id === cardId);
    if (index === -1) return undefined;
    
    return this.deck.splice(index, 1)[0];
  }
  
  /**
   * Draw cards from the top of the deck
   * @param count Number of cards to draw
   * @returns Array of drawn cards
   */
  drawFromDeck(count: number = 1): T[] {
    const drawnCards: T[] = [];
    
    for (let i = 0; i < count; i++) {
      if (this.isEmpty()) break;
      const card = this.deck.shift()!;
      drawnCards.push(card);
    }
    
    return drawnCards;
  }
  
  /**
   * Move a card directly to the discard pile
   * @param card The card to discard
   */
  discard(card: T): void {
    this.discardPile.push(card);
  }
  
  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }
  
  /**
   * Move all cards from discard pile back to deck and shuffle
   */
  shuffleDiscardIntoDeck(): void {
    this.deck = [...this.deck, ...this.discardPile];
    this.discardPile = [];
    this.shuffle();
  }
  
  /**
   * Check if the deck is empty
   */
  isEmpty(): boolean {
    return this.deck.length === 0;
  }
  
  /**
   * Get the current number of cards in the deck
   */
  getDeckSize(): number {
    return this.deck.length;
  }
  
  /**
   * Get the current number of cards in the discard pile
   */
  getDiscardSize(): number {
    return this.discardPile.length;
  }
  
  /**
   * Get all cards currently in the deck
   */
  getDeck(): T[] {
    return [...this.deck];
  }
  
  /**
   * Get all cards currently in the discard pile
   */
  getDiscardPile(): T[] {
    return [...this.discardPile];
  }
} 