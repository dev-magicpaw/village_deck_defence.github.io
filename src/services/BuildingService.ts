import { BuildingConfig } from '../entities/Building';
import { Building as BuildingInterface } from '../types/game';
import { BuildingRegistry } from './BuildingRegistry';

interface BuildingSlot {
  id: string;
  already_constructed: string | null;
  available_for_construction: string[];
}

interface BuildingSlotLocation {
  x: number;
  y: number;
  slot_id: string;
}

/**
 * Service for managing buildings in the game
 */
export class BuildingService {
  private buildingRegistry: BuildingRegistry;
  private constructedBuildings: BuildingInterface[] = [];
  private buildingSlots: BuildingSlot[] = [];
  private buildingSlotLocations: BuildingSlotLocation[] = [];

  /**
   * Create a new BuildingService
   */
  constructor() {
    this.buildingRegistry = BuildingRegistry.getInstance();
  }

  /**
   * Initialize buildings from configuration
   * Immediately constructs buildings that are marked as constructed_from_start 
   * or are defined as already_constructed in the level config
   */
  public initializeBuildings(): void {
    // Load building slots from the game config
    this.loadBuildingSlotsFromConfig();
    
    // First, construct buildings that are already constructed in level config
    this.buildingSlots.forEach(slot => {
      if (slot.already_constructed) {
        this.constructBuilding(slot.already_constructed);
      }
    });
    
    // Then, construct buildings that are marked as constructed_from_start in the building config
    // but only if they're not already constructed via level config
    const buildingIds = this.buildingRegistry.getAllBuildingIds();
    buildingIds.forEach(buildingId => {
      const buildingConfig = this.buildingRegistry.getBuildingConfig(buildingId);
      if (buildingConfig && buildingConfig.constructed_from_start && !this.isBuildingConstructed(buildingId)) {
        this.constructBuilding(buildingId);
      }
    });
  }

  /**
   * Load building slots from the game configuration
   */
  private loadBuildingSlotsFromConfig(): void {
    // Try to get game config from registry
    const game = (window as any).game;
    if (!game || !game.registry) {
      return;
    }
    
    // First check the merged gameConfig
    const gameConfig = game.registry.get('gameConfig');
    if (gameConfig) {
      // Load building slots
      if (gameConfig.building_slots && Array.isArray(gameConfig.building_slots)) {
        this.buildingSlots = gameConfig.building_slots;
      }
      
      // Load building slot locations
      if (gameConfig.building_slot_locations && Array.isArray(gameConfig.building_slot_locations)) {
        this.buildingSlotLocations = gameConfig.building_slot_locations;
      }
      return;
    }
    
    // For backward compatibility, check for levelConfig
    const levelConfig = game.registry.get('levelConfig');
    if (levelConfig) {
      // Load building slots
      if (levelConfig.building_slots && Array.isArray(levelConfig.building_slots)) {
        this.buildingSlots = levelConfig.building_slots;
      }
      
      // Load building slot locations
      if (levelConfig.building_slot_locations && Array.isArray(levelConfig.building_slot_locations)) {
        this.buildingSlotLocations = levelConfig.building_slot_locations;
      }
    }
  }

  /**
   * Get all building slots from the level configuration
   */
  public getBuildingSlots(): BuildingSlot[] {
    return [...this.buildingSlots];
  }

  /**
   * Get all building slot locations from the level configuration
   */
  public getBuildingSlotLocations(): BuildingSlotLocation[] {
    return [...this.buildingSlotLocations];
  }

  /**
   * Get a specific building slot by ID
   */
  public getBuildingSlotById(slotId: string): BuildingSlot | undefined {
    return this.buildingSlots.find(slot => slot.id === slotId);
  }

  /**
   * Get the location for a specific building slot
   */
  public getBuildingSlotLocation(slotId: string): BuildingSlotLocation | undefined {
    return this.buildingSlotLocations.find(location => location.slot_id === slotId);
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