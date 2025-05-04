import { RecruitCard, RecruitCardConfig, convertRecruitCardJsonToConfig } from '../entities/RecruitCard';

/**
 * Global registry for recruit card configurations and instances
 */
export class RecruitCardRegistry {
  private static _instance: RecruitCardRegistry;
  private _recruitCardConfigs: Map<string, RecruitCardConfig> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): RecruitCardRegistry {
    if (!this._instance) {
      this._instance = new RecruitCardRegistry();
    }
    return this._instance;
  }
  
  /**
   * Load recruit card configurations from JSON array
   * @param recruitCardsJson Array of recruit card configurations from JSON
   */
  public loadRecruitCards(recruitCardsJson: any[]): void {
    recruitCardsJson.forEach(cardJson => {
      const config = convertRecruitCardJsonToConfig(cardJson);
      this._recruitCardConfigs.set(config.id, config);
    });
  }
  
  /**
   * Get recruit card configuration by ID
   * @param cardId The recruit card ID
   * @returns The recruit card configuration or undefined if not found
   */
  public getRecruitCardConfig(cardId: string): RecruitCardConfig | undefined {
    return this._recruitCardConfigs.get(cardId);
  }
  
  /**
   * Get all available recruit card configurations
   * @returns Array of all recruit card configurations
   */
  public getAllRecruitCardConfigs(): RecruitCardConfig[] {
    return Array.from(this._recruitCardConfigs.values());
  }
  
  /**
   * Create a new RecruitCard instance from a recruit card ID
   * @param cardId The recruit card ID
   * @returns A new RecruitCard instance or null if card ID not found
   */
  public createRecruitCard(cardId: string): RecruitCard | null {
    const config = this._recruitCardConfigs.get(cardId);
    if (!config) {
      console.error(`Recruit card not found in registry: ${cardId}`);
      return null;
    }
    
    return RecruitCard.fromConfig(config);
  }
  
  /**
   * Clear the recruit card registry
   */
  public clear(): void {
    this._recruitCardConfigs.clear();
  }
} 