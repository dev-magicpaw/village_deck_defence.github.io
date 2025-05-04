import Phaser from 'phaser';
import { Card } from '../entities/Card';
import { CardRegistry } from './CardRegistry';
import { DeckService } from './DeckService';
import { RecruitCardRegistry } from './RecruitCardRegistry';
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
  private static instance: TavernService;
  private recruitCardRegistry: RecruitCardRegistry;
  private cardRegistry: CardRegistry;
  private resourceService: ResourceService | null = null; // TODO: make not optional
  private adventureOptions: Map<AdventureLevel, AdventureOption[]> = new Map();
  private isOpen: boolean = false;
  private deckService: DeckService<Card> | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    super();
    this.recruitCardRegistry = RecruitCardRegistry.getInstance();
    this.cardRegistry = CardRegistry.getInstance();
    this.initAdventureOptions();
  }

  /**
   * Get the singleton instance of the TavernService
   */
  public static getInstance(): TavernService {
    if (!TavernService.instance) {
      TavernService.instance = new TavernService();
    }
    return TavernService.instance;
  }

  /**
   * Initialize the tavern service
   */
  public init(resourceService?: ResourceService): void {
    if (resourceService) {
      this.resourceService = resourceService;
    }
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
    
    const configs = this.recruitCardRegistry.getAllRecruitCardConfigs();
    configs.forEach(config => {
      // TODO recruitCardRegistry should already return AdventureOption
      const recruitCard = this.recruitCardRegistry.createRecruitCard(config.id);
      if (recruitCard) {
        recruitmentOptions.push({
          id: recruitCard.id,
          level: AdventureLevel.RECRUITMENT,
          name: recruitCard.name,
          description: recruitCard.description || '',
          cost: recruitCard.cost,
          applySuccessEffects: () => recruitCard.applySuccessEffects(),
          applyFailureEffects: () => recruitCard.applyFailureEffects()
        });
      }
    });
    
    this.adventureOptions.set(AdventureLevel.RECRUITMENT, recruitmentOptions);
    
    // Initialize empty arrays for other levels
    // These will be populated with real options in the future
    this.adventureOptions.set(AdventureLevel.IN_TOWN, []);
    this.adventureOptions.set(AdventureLevel.OUTSIDE_TOWN, []);
    this.adventureOptions.set(AdventureLevel.IN_FAR_LANDS, []);
  }

  /**
   * Set the resource service
   */
  public setResourceService(resourceService: ResourceService): void {
    this.resourceService = resourceService;
  }

  /**
   * Set the deck service
   * @param deckService The deck service to use for adding cards
   */
  public setDeckService(deckService: DeckService<Card>): void {
    this.deckService = deckService;
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
    if (!this.resourceService) {
      return false;
    }
    return this.resourceService.getPower() >= option.cost;
  }

  /**
   * Try to start an adventure by consuming resources
   * @param option The adventure option to attempt
   * @returns True if resources were consumed successfully, false otherwise
   */
  public attemptAdventure(option: AdventureOption): boolean {
    if (!this.resourceService) {
      throw new Error('Resource service not initialized');
    }

    // Deduct cost - it's always deducted, even if the adventure fails
    const power = this.resourceService.getPower();
    console.log('power', power);
    console.log('option.cost', option.cost);
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
        // TODO: this should add to the discard instead of the deck
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
    if (!this.deckService) {
      throw new Error('DeckService not initialized. Cannot add cards to discard pile.');
    }
    
    for (let i = 0; i < count; i++) {
      const card = this.cardRegistry.createCardInstance(cardId);
      if (card) {
        this.deckService.discard(card);
        console.log(`Added ${cardId} to discard pile`);
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