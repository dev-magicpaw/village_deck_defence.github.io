import { v4 as uuidv4 } from 'uuid';
import { BuildingConfig, BuildingSlot, BuildingSlotLocation } from '../entities/Building';
import { Building as BuildingInterface } from '../types/game';
import { BuildingRegistry } from './BuildingRegistry';

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
   * @param buildingSlots Initial building slots
   * @param buildingSlotLocations Initial building slot locations
   */
  constructor(
    buildingSlots: BuildingSlot[],
    buildingSlotLocations: BuildingSlotLocation[]
  ) {
    this.buildingRegistry = BuildingRegistry.getInstance();
    this.buildingSlots = [...buildingSlots];
    this.buildingSlotLocations = [...buildingSlotLocations];

    this.initializeBuildings();
  }

  /**
   * Initialize buildings from configuration
   * Immediately constructs buildings that are defined as already_constructed in the level config
   */
  private initializeBuildings(): void {    
    // Log building slots for debugging
    console.log("BuildingService - After loading config, slots:", this.buildingSlots);
    console.log("BuildingService - After loading config, locations:", this.buildingSlotLocations);
    
    // Construct buildings that are already constructed in level config
    this.buildingSlots.forEach(slot => {
      if (slot.already_constructed) {
        console.log(`BuildingService - Constructing building ${slot.already_constructed} from slot ${slot.id}`);
        this.constructBuilding(slot.already_constructed, slot.id);
      }
    });
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
   * Create a new building slot with a UUID v4 identifier
   * @param already_constructed ID of an already constructed building, or null
   * @param available_for_construction Array of building IDs that can be constructed in this slot
   * @returns A new BuildingSlot with a unique UUID
   */
  public createBuildingSlot(
    already_constructed: string | null,
    available_for_construction: string[]
  ): BuildingSlot {
    return {
      id: uuidv4(),
      already_constructed,
      available_for_construction
    };
  }
} 