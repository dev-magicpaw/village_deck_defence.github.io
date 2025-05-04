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
  private slotToBuildingMap: Record<string, string> = {};

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
    console.log("BuildingService - Initializing buildings");
    
    // Load building slots from the game config
    this.loadBuildingSlotsFromConfig();
    
    console.log("BuildingService - After loading config, slots:", this.buildingSlots);
    console.log("BuildingService - After loading config, locations:", this.buildingSlotLocations);
    
    // First, construct buildings that are already constructed in level config
    this.buildingSlots.forEach(slot => {
      if (slot.already_constructed) {
        console.log(`BuildingService - Constructing building ${slot.already_constructed} from slot ${slot.id}`);
        this.constructBuilding(slot.already_constructed, slot.id);
      }
    });
    
    // Then, construct buildings that are marked as constructed_from_start in the building config
    // but only if they're not already constructed via level config
    const buildingIds = this.buildingRegistry.getAllBuildingIds();
    buildingIds.forEach(buildingId => {
      const buildingConfig = this.buildingRegistry.getBuildingConfig(buildingId);
      if (buildingConfig && buildingConfig.constructed_from_start && !this.isBuildingConstructed(buildingId)) {
        // Find an empty slot for this building if available
        const availableSlot = this.findAvailableSlotForBuilding(buildingId);
        if (availableSlot) {
          this.constructBuilding(buildingId, availableSlot.id);
        } else {
          // If no slot is available, just construct it without a slot
          this.constructBuilding(buildingId);
        }
      }
    });
  }

  /**
   * Find an available slot that can construct the specified building
   * @param buildingId The ID of the building to find a slot for
   * @returns The first available slot that can construct this building, or undefined if none found
   */
  private findAvailableSlotForBuilding(buildingId: string): BuildingSlot | undefined {
    return this.buildingSlots.find(slot => 
      // Slot must not have a building already
      !slot.already_constructed && 
      // Slot must be able to construct this building
      slot.available_for_construction.includes(buildingId) &&
      // Slot must not be mapped to another building
      !this.slotToBuildingMap[slot.id]
    );
  }

  /**
   * Load building slots from the game configuration
   */
  private loadBuildingSlotsFromConfig(): void {
    // Try to get game config from registry
    const game = (window as any).game;
    if (!game || !game.registry) {
      console.error("Game registry not available");
      return;
    }
    
    // First check the merged gameConfig
    const gameConfig = game.registry.get('gameConfig');
    if (gameConfig) {
      console.log("BuildingService - Got gameConfig from registry:", gameConfig);
      
      // Load building slots
      if (gameConfig.building_slots && Array.isArray(gameConfig.building_slots)) {
        console.log("BuildingService - Loading building slots:", gameConfig.building_slots);
        this.buildingSlots = gameConfig.building_slots;
      } else {
        console.warn("BuildingService - No building_slots array in gameConfig");
      }
      
      // Load building slot locations
      if (gameConfig.building_slot_locations && Array.isArray(gameConfig.building_slot_locations)) {
        console.log("BuildingService - Loading building slot locations:", gameConfig.building_slot_locations);
        this.buildingSlotLocations = gameConfig.building_slot_locations;
      } else {
        console.warn("BuildingService - No building_slot_locations array in gameConfig");
      }
      return;
    } else {
      console.warn("BuildingService - No gameConfig in registry");
    }
    
    // For backward compatibility, check for levelConfig
    const levelConfig = game.registry.get('levelConfig');
    if (levelConfig) {
      console.log("BuildingService - Got levelConfig from registry:", levelConfig);
      
      // Load building slots
      if (levelConfig.building_slots && Array.isArray(levelConfig.building_slots)) {
        console.log("BuildingService - Loading building slots from levelConfig:", levelConfig.building_slots);
        this.buildingSlots = levelConfig.building_slots;
      } else {
        console.warn("BuildingService - No building_slots array in levelConfig");
      }
      
      // Load building slot locations
      if (levelConfig.building_slot_locations && Array.isArray(levelConfig.building_slot_locations)) {
        console.log("BuildingService - Loading building slot locations from levelConfig:", levelConfig.building_slot_locations);
        this.buildingSlotLocations = levelConfig.building_slot_locations;
      } else {
        console.warn("BuildingService - No building_slot_locations array in levelConfig");
      }
    } else {
      console.warn("BuildingService - No levelConfig in registry");
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
   * Get the ID of the building constructed in a specific slot
   * @param slotId The ID of the slot to check
   * @returns The ID of the building in this slot, or null if none
   */
  public getBuildingInSlot(slotId: string): string | null {
    return this.slotToBuildingMap[slotId] || null;
  }
  
  /**
   * Construct a new building
   * @param buildingId The ID of the building to construct
   * @param slotId Optional slot ID where the building should be constructed
   * @returns true if building was constructed, false if it was already constructed or doesn't exist
   */
  public constructBuilding(buildingId: string, slotId?: string): boolean {
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
    
    // If a slot was specified, update the slot mapping
    if (slotId) {
      // Get the slot to update its constructed status
      const slotIndex = this.buildingSlots.findIndex(slot => slot.id === slotId);
      if (slotIndex >= 0) {
        // Update the slot's already_constructed property
        this.buildingSlots[slotIndex] = {
          ...this.buildingSlots[slotIndex],
          already_constructed: buildingId
        };
        
        // Update the slot-to-building mapping
        this.slotToBuildingMap[slotId] = buildingId;
      }
    }
    
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

  /**
   * Directly set the building slots and locations
   * This is used to make sure the BuildingService has the correct building data
   * @param buildingSlots Array of building slots
   * @param buildingSlotLocations Array of building slot locations
   */
  public setBuildingSlots(buildingSlots: BuildingSlot[], buildingSlotLocations: BuildingSlotLocation[]): void {
    console.log("BuildingService - Setting slots directly:", buildingSlots);
    console.log("BuildingService - Setting locations directly:", buildingSlotLocations);
    this.buildingSlots = buildingSlots;
    this.buildingSlotLocations = buildingSlotLocations;
  }
} 