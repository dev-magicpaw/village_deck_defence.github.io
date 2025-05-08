/**
 * Service for managing player resources
 * Tracks invention, construction, and power resources
 */

import Phaser from 'phaser';
import { ResourceType } from '../entities/Types';
import { BuildingService } from './BuildingService';

/**
 * Events emitted by the ResourceService
 */
export enum ResourceServiceEvents {
  RESOURCE_CHANGED = 'resource-changed'
}

/**
 * Event data emitted when a resource changes
 */
export interface ResourceChangeEvent {
  type: ResourceType;
  amount: number;
  previousAmount: number;
}

export class ResourceService extends Phaser.Events.EventEmitter {
  private invention: number = 0;
  private construction: number = 0;
  private power: number = 0;
  private buildingService?: BuildingService;

  /**
   * Create a new resource service with initial values set to 0
   */
  constructor() {
    super();
    this.resetResources();
  }

  /**
   * Set the building service
   * @param buildingService The building service to use
   */
  public setBuildingService(buildingService: BuildingService): void {
    this.buildingService = buildingService;
  }

  public resetResourcesEndOfDay(): void {
    this.resetResources();
  }

  public processResourcesFromBuildings(): void {
    this.processBuildingEffects();
  }

  public resetResourcesHandDiscard(): void {
    if (!this.buildingService) {
      throw new Error('Building service not set');
    }

    const hasWarehouse = this.buildingService.isBuildingConstructed('warehouse');
    
    if (hasWarehouse) {
      // Warehouse keeps 50% of resources
      this.resetResources(0.5);
    } else {
      this.resetResources();
    }
  }

  /**
   * Reset all resources to a percentage of their current value (rounded down)
   * @param percent_to_keep Percentage to keep (0-1)
   */
  private resetResources(percent_to_keep: number = 0): void {
    const oldInvention = this.invention;
    const oldConstruction = this.construction;
    const oldPower = this.power;

    // Keep specified percentage of each resource
    this.invention = Math.floor(this.invention * percent_to_keep);
    this.construction = Math.floor(this.construction * percent_to_keep);
    this.power = Math.floor(this.power * percent_to_keep);

    if (percent_to_keep === 1) {
      return;
    }

    if (oldInvention !== 0) {
      this.emitResourceChange(ResourceType.Invention, 0, oldInvention);
    }
    if (oldConstruction !== 0) {
      this.emitResourceChange(ResourceType.Construction, 0, oldConstruction);
    }
    if (oldPower !== 0) {
      this.emitResourceChange(ResourceType.Power, 0, oldPower);
    }
  }

  /**
   * Process effects from all constructed buildings
   * Adds resources based on building effects with 'on_day_start' timing
   */
  private processBuildingEffects(): void {
    if (!this.buildingService) {
      throw new Error('Building service not set');
    }

    const constructedBuildings = this.buildingService.getConstructedBuildings();
    
    constructedBuildings.forEach(building => {
      building.effects?.forEach(effect => {
        if (effect.type === 'add_resource' && effect.when === 'on_day_start') {
          switch (effect.resource) {
            case 'invention':
              this.addInvention(effect.amount);
              break;
            case 'construction':
              this.addConstruction(effect.amount);
              break;
            case 'power':
              this.addPower(effect.amount);
              break;
          }
        }
      });
    });
  }

  /**
   * Add invention resource
   * @param amount Amount to add
   */
  public addInvention(amount: number): void {
    if (amount < 0) throw new Error('Amount of invention to add must be positive');
    const previousAmount = this.invention;
    this.invention += amount;
    this.emitResourceChange(ResourceType.Invention, this.invention, previousAmount);
  }

  /**
   * Add construction resource
   * @param amount Amount to add
   */
  public addConstruction(amount: number): void {
    if (amount < 0) throw new Error('Amount of construction to add must be positive');
    const previousAmount = this.construction;
    this.construction += amount;
    this.emitResourceChange(ResourceType.Construction, this.construction, previousAmount);
  }

  /**
   * Add power resource
   * @param amount Amount to add
   */
  public addPower(amount: number): void {
    if (amount < 0) throw new Error('Amount of power to add must be positive');
    const previousAmount = this.power;
    this.power += amount;
    this.emitResourceChange(ResourceType.Power, this.power, previousAmount);
  }

  /**
   * Consume invention resource
   * @param amount Amount to consume
   * @returns True if consumption was successful, false if not enough resources
   */
  public consumeInvention(amount: number): boolean {
    if (amount < 0) throw new Error('Amount of invention to consume must be positive');
    if (amount > this.invention) return false;
    const previousAmount = this.invention;
    this.invention -= amount;
    this.emitResourceChange(ResourceType.Invention, this.invention, previousAmount);
    return true;
  }

  /**
   * Consume construction resource
   * @param amount Amount to consume
   * @returns True if consumption was successful, false if not enough resources
   */
  public consumeConstruction(amount: number): boolean {
    if (amount < 0) throw new Error('Amount of construction to consume must be positive');
    if (amount > this.construction) return false;
    const previousAmount = this.construction;
    this.construction -= amount;
    this.emitResourceChange(ResourceType.Construction, this.construction, previousAmount);
    return true;
  }

  /**
   * Consume power resource
   * @param amount Amount to consume
   * @returns True if consumption was successful, false if not enough resources
   */
  public consumePower(amount: number): boolean {
    if (amount < 0) throw new Error('Amount of power to consume must be positive');
    if (amount > this.power) return false;
    const previousAmount = this.power;
    this.power -= amount;
    this.emitResourceChange(ResourceType.Power, this.power, previousAmount);
    return true;
  }

  /**
   * Get current invention amount
   * @returns Current invention amount
   */
  public getInvention(): number {
    return this.invention;
  }

  /**
   * Get current construction amount
   * @returns Current construction amount
   */
  public getConstruction(): number {
    return this.construction;
  }

  /**
   * Get current power amount
   * @returns Current power amount
   */
  public getPower(): number {
    return this.power;
  }

  /**
   * Check if player has enough invention
   * @param amount Amount to check
   * @returns True if player has enough, false otherwise
   */
  public hasEnoughInvention(amount: number): boolean {
    return this.invention >= amount;
  }

  /**
   * Check if player has enough construction
   * @param amount Amount to check
   * @returns True if player has enough, false otherwise
   */
  public hasEnoughConstruction(amount: number): boolean {
    return this.construction >= amount;
  }

  /**
   * Check if player has enough power
   * @param amount Amount to check
   * @returns True if player has enough, false otherwise
   */
  public hasEnoughPower(amount: number): boolean {
    return this.power >= amount;
  }

  /**
   * Emit a resource change event
   * @param type Type of resource that changed
   * @param amount New amount
   * @param previousAmount Previous amount
   */
  private emitResourceChange(type: ResourceType, amount: number, previousAmount: number): void {
    const event: ResourceChangeEvent = {
      type,
      amount,
      previousAmount
    };
    
    this.emit(ResourceServiceEvents.RESOURCE_CHANGED, event);
  }
} 