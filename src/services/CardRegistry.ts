import { Card, CardConfig, convertCardJsonToConfig } from '../entities/Card';

/**
 * Global registry for card configurations and instances
 */
export class CardRegistry {
  private static _instance: CardRegistry;
  private _cardConfigs: Map<string, CardConfig> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CardRegistry {
    if (!this._instance) {
      this._instance = new CardRegistry();
    }
    return this._instance;
  }
  
  /**
   * Load card configurations from JSON array
   * @param cardsJson Array of card configurations from JSON
   */
  public loadCards(cardsJson: any[]): void {
    cardsJson.forEach(cardJson => {
      const config = convertCardJsonToConfig(cardJson);
      this._cardConfigs.set(config.id, config);
    });
  }
  
  /**
   * Get card configuration by ID
   * @param cardId The card ID
   * @returns The card configuration or undefined if not found
   */
  public getCardConfig(cardId: string): CardConfig | undefined {
    return this._cardConfigs.get(cardId);
  }
  
  /**
   * Get all available card configurations
   * @returns Array of all card configurations
   */
  public getAllCardConfigs(): CardConfig[] {
    return Array.from(this._cardConfigs.values());
  }
  
  /**
   * Create a new Card instance from a card ID
   * @param cardId The card ID
   * @returns A new Card instance or null if card ID not found
   */
  public createCard(cardId: string): Card | null {
    const config = this._cardConfigs.get(cardId);
    if (!config) {
      console.error(`Card not found in registry: ${cardId}`);
      return null;
    }
    
    return Card.fromConfig(config);
  }
  
  /**
   * Create a simplified card instance from a card ID
   * This is used by services that expect the card properties directly
   * @param cardId The card ID
   * @returns A new Card instance or null if card ID not found
   */
  public createCardInstance(cardId: string): Card | null {
    return this.createCard(cardId);
  }
  
  /**
   * Clear the card registry
   */
  public clear(): void {
    this._cardConfigs.clear();
  }
} 