import Phaser from 'phaser';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface representing an effect of a recruit card
 */
export interface RecruitCardEffect {
  type: string;
  [key: string]: any;
}

/**
 * Interface representing the configuration for a recruit card
 */
export interface RecruitCardConfig {
  id: string;
  name: string;
  description: string;
  image: string;
  cost: number;
  success_effects: RecruitCardEffect[];
  failure_effects: RecruitCardEffect[];
}

/**
 * Events emitted by the RecruitCard entity
 */
export enum RecruitCardEvents {
  CARD_USED = 'card-used'
}

/**
 * RecruitCard entity representing a card used to recruit new units
 */
export class RecruitCard extends Phaser.Events.EventEmitter {
  public readonly id: string;
  public readonly unique_id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly image: string;
  public readonly cost: number;
  public readonly success_effects: RecruitCardEffect[];
  public readonly failure_effects: RecruitCardEffect[];

  /**
   * Create a new RecruitCard instance
   * @param config RecruitCard configuration data
   */
  constructor(config: RecruitCardConfig) {
    super();
    this.id = config.id;
    this.unique_id = uuidv4();
    this.name = config.name;
    this.description = config.description;
    this.image = config.image;
    this.cost = config.cost;
    this.success_effects = [...config.success_effects];
    this.failure_effects = [...config.failure_effects];
  }

  /**
   * Process a successful recruit and trigger its effects
   * @returns The effects that were applied
   */
  public applySuccessEffects(): RecruitCardEffect[] {
    this.emit(RecruitCardEvents.CARD_USED, this, true);
    return this.success_effects;
  }
  
  /**
   * Process a failed recruit and trigger its effects (if any)
   * @returns The effects that were applied
   */
  public applyFailureEffects(): RecruitCardEffect[] {
    this.emit(RecruitCardEvents.CARD_USED, this, false);
    return this.failure_effects;
  }

  /**
   * Create a RecruitCard instance from config
   * @param config RecruitCard configuration
   * @returns A new RecruitCard instance
   */
  public static fromConfig(config: RecruitCardConfig): RecruitCard {
    return new RecruitCard(config);
  }
}

/**
 * Function to convert recruit card JSON data to RecruitCardConfig
 */
export function convertRecruitCardJsonToConfig(cardJson: any): RecruitCardConfig {
  return {
    id: cardJson.id,
    name: cardJson.name,
    description: cardJson.description,
    image: cardJson.image,
    cost: cardJson.cost,
    success_effects: [...cardJson.success_effects],
    failure_effects: [...cardJson.failure_effects]
  };
} 