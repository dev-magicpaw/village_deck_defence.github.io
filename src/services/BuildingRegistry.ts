import { Building, BuildingConfig, convertBuildingJsonToConfig } from '../entities/Building';
import { Building as BuildingInterface } from '../types/game';

/**
 * Global registry for building configurations and instances
 */
export class BuildingRegistry {
  private static _instance: BuildingRegistry;
  private _buildingConfigs: Map<string, BuildingConfig> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): BuildingRegistry {
    if (!this._instance) {
      this._instance = new BuildingRegistry();
    }
    return this._instance;
  }
  
  /**
   * Load building configurations from JSON array
   * @param buildingsJson Array of building configurations from JSON
   */
  public loadBuildings(buildingsJson: any[]): void {
    buildingsJson.forEach(buildingJson => {
      const config = convertBuildingJsonToConfig(buildingJson);
      this._buildingConfigs.set(config.id, config);
    });
  }
  
  /**
   * Get building configuration by ID
   * @param buildingId The building ID
   * @returns The building configuration or undefined if not found
   */
  public getBuildingConfig(buildingId: string): BuildingConfig | undefined {
    return this._buildingConfigs.get(buildingId);
  }
  
  /**
   * Create a new Building instance from a building ID
   * @param buildingId The building ID
   * @returns A new Building instance or null if building ID not found
   */
  public createBuilding(buildingId: string): Building | null {
    const config = this._buildingConfigs.get(buildingId);
    if (!config) {
      console.error(`Building not found in registry: ${buildingId}`);
      return null;
    }
    
    return Building.fromConfig(config);
  }
  
  /**
   * Create a new Building interface compatible object from a building ID
   * @param buildingId The building ID
   * @returns A new Building interface object or null if building ID not found
   */
  public createBuildingInterface(buildingId: string): BuildingInterface | null {
    const building = this.createBuilding(buildingId);
    if (!building) {
      return null;
    }
    
    // Convert Building class to Building interface format
    return this.convertBuildingClassToInterface(building);
  }
  
  /**
   * Convert a Building class instance to Building interface format
   * @param building Building class instance
   * @returns Building interface object
   */
  public convertBuildingClassToInterface(building: Building): BuildingInterface {
    return {
      id: building.id,
      name: building.name,
      description: building.description,
      image: building.image,
      cost: building.cost,
      limit: building.limit,
      effects: building.effects
    };
  }
  
  /**
   * Get all available building IDs
   * @returns Array of building IDs
   */
  public getAllBuildingIds(): string[] {
    return Array.from(this._buildingConfigs.keys());
  }
  
  /**
   * Clear the building registry
   */
  public clear(): void {
    this._buildingConfigs.clear();
  }
} 