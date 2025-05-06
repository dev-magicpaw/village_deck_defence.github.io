import { BuildingEffect } from '../entities/Building';
import { BuildingService, BuildingServiceEvents } from './BuildingService';

/**
 * Service for managing recruit mechanics in the game
 */
export class RecruitService {
  private buildingService: BuildingService;
  private availableRecruits: string[] = [];

  /**
   * Create a new RecruitService
   * @param buildingService Service for managing buildings
   */
  constructor(buildingService: BuildingService) {
    this.buildingService = buildingService;
    
    // Initialize available recruits from already constructed buildings
    this.initializeAvailableRecruits();
    
    // Subscribe to building construction events
    this.buildingService.on(
      BuildingServiceEvents.BUILDING_CONSTRUCTED, 
      this.onBuildingConstructed.bind(this)
    );
  }

  /**
   * Initialize available recruits based on already constructed buildings
   */
  private initializeAvailableRecruits(): void {
    const constructedBuildings = this.buildingService.getConstructedBuildings();
    
    constructedBuildings.forEach(building => {
        this.onBuildingConstructed(building.id);
    });
  }

  /**
   * Handle building construction event
   * @param buildingId ID of the constructed building
   */
  private onBuildingConstructed(buildingId: string): void {
    const buildingConfig = this.buildingService.getBuildingConfig(buildingId);
    
    buildingConfig.effects.forEach((effect: BuildingEffect) => {
      if (effect.type === 'make_recruitable' && effect.recruits) {
        // Add each recruit from the effect to the available recruits list
        effect.recruits.forEach((recruitId: string) => {
          if (!this.availableRecruits.includes(recruitId)) {
            this.availableRecruits.push(recruitId);
          }
        });
      }
    });
  }

  /**
   * Check if a recruit is available for recruitment
   * @param recruitId ID of the recruit to check
   * @returns true if the recruit is available, false otherwise
   */
  public isRecruitable(recruitId: string): boolean {
    return this.availableRecruits.includes(recruitId);
  }

  /**
   * Get the list of all available recruits
   * @returns Array of available recruit IDs
   */
  public getAvailableRecruits(): string[] {
    return [...this.availableRecruits];
  }
} 