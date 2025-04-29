import { BuildingConfig } from '../entities/Building';
import { Building as BuildingInterface } from '../types/game';
import { BuildingRegistry } from './BuildingRegistry';

/**
 * Service for managing buildings in the game
 */
export class BuildingService {
  private buildingRegistry: BuildingRegistry;
  private constructedBuildings: BuildingInterface[] = [];

  /**
   * Create a new BuildingService
   */
  constructor() {
    this.buildingRegistry = BuildingRegistry.getInstance();
  }

  /**
   * Initialize buildings from configuration
   * Immediately constructs buildings that are marked as constructed_from_start
   */
  public initializeBuildings(): void {
    // Get all building IDs
    const buildingIds = this.buildingRegistry.getAllBuildingIds();
    
    // Process all building configs and construct those marked as constructed_from_start
    buildingIds.forEach(buildingId => {
      const buildingConfig = this.buildingRegistry.getBuildingConfig(buildingId);
      if (buildingConfig && buildingConfig.constructed_from_start) {
        this.constructBuilding(buildingId);
      }
    });
  }

  /**
   * Get the list of constructed buildings
   */
  public getConstructedBuildings(): BuildingInterface[] {
    return [...this.constructedBuildings];
  }
  
  /**
   * Check if a building with the given ID is constructed
   */
  public isBuildingConstructed(buildingId: string): boolean {
    return this.constructedBuildings.some(building => building.id === buildingId);
  }
  
  /**
   * Construct a new building
   * @returns true if building was constructed, false if it was already constructed or doesn't exist
   */
  public constructBuilding(buildingId: string): boolean {
    // Check if already constructed
    if (this.isBuildingConstructed(buildingId)) {
      return false;
    }
    
    // Create the building
    const building = this.buildingRegistry.createBuildingInterface(buildingId);
    if (!building) {
      return false;
    }
    
    // Add to constructed buildings
    this.constructedBuildings.push(building);
    return true;
  }

  /**
   * Get a building configuration by ID
   */
  public getBuildingConfig(buildingId: string): BuildingConfig | undefined {
    return this.buildingRegistry.getBuildingConfig(buildingId);
  }

  /**
   * Get all available building IDs
   */
  public getAllBuildingIds(): string[] {
    return this.buildingRegistry.getAllBuildingIds();
  }

  /**
   * Create a building instance from its ID
   */
  public createBuilding(buildingId: string): BuildingInterface | null {
    return this.buildingRegistry.createBuildingInterface(buildingId);
  }
} 