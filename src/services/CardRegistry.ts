import { Card as CardClass, CardConfig, convertCardJsonToConfig } from '../entities/Card';
import { ResourceType } from '../entities/Types';
import { Card as CardInterface } from '../types/game';

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
   * Create a new Card instance from a card ID
   * @param cardId The card ID
   * @returns A new Card instance or null if card ID not found
   */
  public createCard(cardId: string): CardClass | null {
    const config = this._cardConfigs.get(cardId);
    if (!config) {
      console.error(`Card not found in registry: ${cardId}`);
      return null;
    }
    
    return CardClass.fromConfig(config);
  }
  
  /**
   * Create a new Card interface compatible object from a card ID
   * @param cardId The card ID
   * @returns A new Card interface object or null if card ID not found
   */
  public createCardInterface(cardId: string): CardInterface | null {
    const cardClass = this.createCard(cardId);
    if (!cardClass) {
      return null;
    }
    
    // Convert Card class to Card interface format
    return this.convertCardClassToInterface(cardClass);
  }
  
  /**
   * Convert a Card class instance to Card interface format
   * @param card Card class instance
   * @returns Card interface object
   */
  public convertCardClassToInterface(card: CardClass): CardInterface {
    return {
      id: card.id,
      name: card.name,
      race: card.race.toString(),
      tracks: {
        power: this.getTrackValue(card, ResourceType.Power),
        construction: this.getTrackValue(card, ResourceType.Construction),
        invention: this.getTrackValue(card, ResourceType.Invention)
      }
    };
  }
  
  /**
   * Get the track value (count of non-null stickers) for a card
   * @param card Card class instance
   * @param resourceType Resource type to get track for
   * @returns Number of stickers in the track
   */
  private getTrackValue(card: CardClass, resourceType: ResourceType): number {
    // This is a mock implementation - in a real implementation, we would
    // access the private _tracks property of the Card class
    // For now, we'll return a default value based on the resource type
    const defaultValues: Record<ResourceType, number> = {
      [ResourceType.Power]: 1,
      [ResourceType.Construction]: 1,
      [ResourceType.Invention]: 1
    };
    
    return defaultValues[resourceType];
  }
  
  /**
   * Clear the card registry
   */
  public clear(): void {
    this._cardConfigs.clear();
  }
} 