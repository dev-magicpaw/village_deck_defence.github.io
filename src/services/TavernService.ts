import Phaser from 'phaser';
import { Card } from '../entities/Card';
import { CardRegistry } from './CardRegistry';
import { DeckService } from './DeckService';
import { ResourceService } from './ResourceService';

/**
 * Enum representing different adventure levels available in the tavern
 */
export enum AdventureLevel {
  RECRUITMENT = 'recruitment',
  IN_TOWN = 'in_town',
  OUTSIDE_TOWN = 'outside_town',
  IN_FAR_LANDS = 'in_far_lands'
}

/**
 * Interface representing an adventure option
 */
export interface AdventureOption {
  id: string;
  level: AdventureLevel;
  name: string;
  description: string;
  cost: number;
  applySuccessEffects: () => AdventureEffect[];
  applyFailureEffects: () => AdventureEffect[];
}

/**
 * Interface for effects that can be applied after a successful adventure
 */
export interface AdventureEffect {
  type: string;
  cardType?: string;
  count?: number;
}

/**
 * Events emitted by the TavernService
 */
export enum TavernServiceEvents {
  ADVENTURE_LEVELS_UPDATED = 'adventure-levels-updated',
  ADVENTURE_SUCCESS = 'adventure-success',
  ADVENTURE_FAILURE = 'adventure-failure',
  TAVERN_STATE_CHANGED = 'tavern-state-changed',
}

/**
 * Service for managing the tavern building and its functionalities
 */
export class TavernService extends Phaser.Events.EventEmitter {
  private cardRegistry: CardRegistry;
  private resourceService: ResourceService;
  private adventureOptions: Map<AdventureLevel, AdventureOption[]> = new Map();
  private isOpen: boolean = false;
  private deckService: DeckService<Card>;

  public constructor(
    cardRegistry: CardRegistry,
    resourceService: ResourceService,
    deckService: DeckService<Card>
  ) {
    super();
    this.cardRegistry = cardRegistry;
    this.resourceService = resourceService;
    this.deckService = deckService;
    this.initAdventureOptions();
  }

  /**
   * Initialize the tavern service
   */
  public init(): void {
    this.initAdventureOptions();
  }

  /**
   * Set the tavern open state
   * @param isOpen Whether the tavern is open
   */
  public setTavernOpen(isOpen: boolean): void {
    if (this.isOpen !== isOpen) {
      this.isOpen = isOpen;
      this.emit(TavernServiceEvents.TAVERN_STATE_CHANGED, isOpen);
    }
  }

  /**
   * Get the current tavern open state
   * @returns Whether the tavern is currently open
   */
  public isTavernOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Initialize available adventure options for each level
   * Currently only implementing recruitment level
   */
  private initAdventureOptions(): void {
    // Clear existing options
    this.adventureOptions.clear();
    
    // Initialize recruitment level options
    const recruitmentOptions: AdventureOption[] = [];
    
    // Find recruit cards in the card registry
    const allCards = this.cardRegistry.getAllCardConfigs();
    const recruitCards = allCards.filter(card => card.id === 'recruit_card');
    
    // TODO note, this should use adventure cards, not player cards. For now adventure cards don't exist. To be done later.
    recruitCards.forEach(config => {
      const cardConfig = config as any; // Use any to handle additional properties in recruit card
      recruitmentOptions.push({
        id: cardConfig.id,
        level: AdventureLevel.RECRUITMENT,
        name: cardConfig.name,
        description: cardConfig.description || '',
        cost: cardConfig.cost || 0,
        applySuccessEffects: () => cardConfig.success_effects || [],
        applyFailureEffects: () => cardConfig.failure_effects || []
      });
    });
    
    this.adventureOptions.set(AdventureLevel.RECRUITMENT, recruitmentOptions);
    
    // Initialize empty arrays for other levels
    // These will be populated with real options in the future
    this.adventureOptions.set(AdventureLevel.IN_TOWN, []);
    this.adventureOptions.set(AdventureLevel.OUTSIDE_TOWN, []);
    this.adventureOptions.set(AdventureLevel.IN_FAR_LANDS, []);
  }

  /**
   * Get all available adventure levels
   */
  public getAvailableAdventureLevels(): AdventureLevel[] {
    return Array.from(this.adventureOptions.keys()).filter(level => {
      const options = this.adventureOptions.get(level);
      return options && options.length > 0;
    });
  }

  /**
   * Get an adventure option for the selected level
   * @param level The adventure level to get an option from
   * @returns An adventure option
   */
  public getAdventureOption(level: AdventureLevel): AdventureOption | null {
    const options = this.adventureOptions.get(level);
    if (!options || options.length === 0) {
      throw new Error(`No adventure options available for level: ${level}`);
    }
    
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  }

  /**
   * Check if there are enough resources to afford an adventure
   * @param option The adventure option to check
   * @returns True if the player can afford the adventure
   */
  public canAffordAdventure(option: AdventureOption): boolean {
    return this.resourceService.getPower() >= option.cost;
  }

  /**
   * Try to start an adventure by consuming resources
   * @param option The adventure option to attempt
   * @returns True if resources were consumed successfully, false otherwise
   */
  public attemptAdventure(option: AdventureOption): boolean {
    // Deduct cost - it's always deducted, even if the adventure fails
    const power = this.resourceService.getPower();
    console.log(`Attempting adventure: ${option.name}, cost: ${option.cost}, power: ${power}`);
    if (option.cost > power) {
      this.resourceService.consumePower(power);
      this.onAdventureFailure(option);
      return false;
    }

    this.resourceService.consumePower(option.cost);
    this.onAdventureSuccess(option);
    return true;
  }

  /**
   * Process the results of an adventure
   * @param option The adventure option that was attempted
   * @param success Whether the adventure was successful
   */
  public processAdventureResult(option: AdventureOption, success: boolean): void {
    // Apply the appropriate effects based on success or failure
    const effects = success ? option.applySuccessEffects() : option.applyFailureEffects();
    
    // Process the effects
    effects.forEach(effect => {
      if (effect.type === 'Card' && effect.cardType) {
        // Add cards to the player's deck based on the effect
        this.addCardsToDiscard(effect.cardType, effect.count || 1);
      }
    });
  }

  /**
   * Add cards to the player's discard pile
   * @param cardId The card type to add
   * @param count Number of cards to add
   */
  private addCardsToDiscard(cardId: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const card = this.cardRegistry.createCardInstance(cardId);
      if (card) {
        this.deckService.discard(card);
      } else {
        throw new Error(`Failed to create card instance for ${cardId}`);
      }
    }
    
    this.emit(TavernServiceEvents.ADVENTURE_SUCCESS, { cardId, count });
  }

  /**
   * Emit event when an adventure succeeds
   */
  private onAdventureSuccess(option: AdventureOption): void {
    console.log(`Successfully completed adventure: ${option.name}`);
    this.emit(TavernServiceEvents.ADVENTURE_SUCCESS, option);
  }
  
  /**
   * Emit event when an adventure fails
   */
  private onAdventureFailure(option: AdventureOption): void {
    console.log(`Failed to complete adventure: ${option.name}`);
    this.emit(TavernServiceEvents.ADVENTURE_FAILURE, option);
  }
} 