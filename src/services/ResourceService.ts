/**
 * Service for managing player resources
 * Tracks invention, construction, and power resources
 */

import Phaser from 'phaser';
import { ResourceType } from '../entities/Types';

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

  /**
   * Create a new resource service with initial values set to 0
   */
  constructor() {
    super();
    this.resetResources();
  }

  /**
   * Reset all resources to zero
   * Called at the beginning of each turn
   */
  public resetResources(): void {
    const oldInvention = this.invention;
    const oldConstruction = this.construction;
    const oldPower = this.power;
    
    this.invention = 0;
    this.construction = 0;
    this.power = 0;
    
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
   * Add invention resource
   * @param amount Amount to add
   */
  public addInvention(amount: number): void {
    if (amount < 0) throw new Error('Amount of invention to add must be positive');
    const previousAmount = this.invention;
    this.invention += amount;
    console.log(`ResourceService: addInvention. New invention: ${this.invention}`);
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
    console.log(`ResourceService: addConstruction. New construction: ${this.construction}`);
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
    console.log(`ResourceService: addPower. New power: ${this.power}`);
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
    console.log(`getPower. Power: ${this.power}`);
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