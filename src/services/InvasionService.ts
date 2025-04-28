import { AnalyticsService } from './AnalyticsService';

/**
 * Service responsible for tracking and progressing the invasion
 */
export class InvasionService {
  private invasionDistance: number;
  private invasionSpeedPerTurn: number;
  private currentDistance: number;
  private currentDay: number = 1;
  
  /**
   * Create a new invasion service
   * @param initialDistance Initial distance of the invasion from village
   * @param speedPerTurn How much distance is reduced each turn
   */
  constructor(initialDistance: number, speedPerTurn: number) {
    this.invasionDistance = initialDistance;
    this.invasionSpeedPerTurn = speedPerTurn;
    this.currentDistance = initialDistance;
  }
  
  /**
   * Progress the invasion by one turn/day
   * @returns The new current distance
   */
  public progressInvasion(): number {
    this.currentDistance -= this.invasionSpeedPerTurn;
    this.currentDay += 1;
    
    // Ensure distance doesn't go below zero
    if (this.currentDistance < 0) {
      this.currentDistance = 0;
    }
    
    // Track this in analytics
    AnalyticsService.trackInvasionProgress(this.currentDistance, this.currentDay);
    
    return this.currentDistance;
  }
  
  /**
   * Get the current distance remaining
   */
  public getCurrentDistance(): number {
    return this.currentDistance;
  }
  
  /**
   * Get the current day of the game
   */
  public getCurrentDay(): number {
    return this.currentDay;
  }
  
  /**
   * Delay the invasion by increasing the distance
   * @param amount Amount to delay invasion by
   */
  public delayInvasion(amount: number): void {
    this.currentDistance += amount;
    
    // Cap at initial distance
    if (this.currentDistance > this.invasionDistance) {
      this.currentDistance = this.invasionDistance;
    }
  }
  
  /**
   * Check if the invasion has arrived (distance = 0)
   */
  public hasInvasionArrived(): boolean {
    return this.currentDistance <= 0;
  }
} 