/**
 * Service for managing player resources
 * Tracks invention, construction, and power resources
 */
export class ResourceService {
  private invention: number = 0;
  private construction: number = 0;
  private power: number = 0;

  /**
   * Create a new resource service with initial values set to 0
   */
  constructor() {
    this.resetResources();
  }

  /**
   * Reset all resources to zero
   * Called at the beginning of each turn
   */
  public resetResources(): void {
    this.invention = 0;
    this.construction = 0;
    this.power = 0;
  }

  /**
   * Add invention resource
   * @param amount Amount to add
   */
  public addInvention(amount: number): void {
    if (amount < 0) return;
    this.invention += amount;
  }

  /**
   * Add construction resource
   * @param amount Amount to add
   */
  public addConstruction(amount: number): void {
    if (amount < 0) return;
    this.construction += amount;
  }

  /**
   * Add power resource
   * @param amount Amount to add
   */
  public addPower(amount: number): void {
    if (amount < 0) return;
    this.power += amount;
  }

  /**
   * Consume invention resource
   * @param amount Amount to consume
   * @returns True if consumption was successful, false if not enough resources
   */
  public consumeInvention(amount: number): boolean {
    if (amount < 0 || amount > this.invention) return false;
    this.invention -= amount;
    return true;
  }

  /**
   * Consume construction resource
   * @param amount Amount to consume
   * @returns True if consumption was successful, false if not enough resources
   */
  public consumeConstruction(amount: number): boolean {
    if (amount < 0 || amount > this.construction) return false;
    this.construction -= amount;
    return true;
  }

  /**
   * Consume power resource
   * @param amount Amount to consume
   * @returns True if consumption was successful, false if not enough resources
   */
  public consumePower(amount: number): boolean {
    if (amount < 0 || amount > this.power) return false;
    this.power -= amount;
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
} 