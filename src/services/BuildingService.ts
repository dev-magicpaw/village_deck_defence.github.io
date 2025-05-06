import Phaser from 'phaser';
import { v4 as uuidv4 } from 'uuid';
import { BuildingConfig, BuildingSlot, BuildingSlotLocation } from '../entities/Building';
import { Building as BuildingInterface } from '../types/game';
import { BuildingRegistry } from './BuildingRegistry';
import { ResourceService } from './ResourceService';

/**
 * Events emitted by the BuildingService
 */
export enum BuildingServiceEvents {
  MENU_STATE_CHANGED = 'menu-state-changed',
  BUILDING_CONSTRUCTED = 'building-constructed'
}

/**
 * Service for managing buildings in the game
 */
export class BuildingService extends Phaser.Events.EventEmitter {
  private buildingRegistry: BuildingRegistry;
  private constructedBuildings: BuildingInterface[] = [];
  private buildingSlots: BuildingSlot[] = [];
  private buildingSlotLocations: BuildingSlotLocation[] = [];
  private slotToBuildingMap: Record<string, string> = {};
  private isMenuOpen: boolean = false;
  private currentSlotId: string | null = null;
  private resourceService: ResourceService;

  /**
   * Create a new BuildingService
   * @param buildingSlotsConfig Initial building slots from config (will get unique_ids assigned)
   * @param buildingSlotLocations Initial building slot locations from config (will be mapped to slots)
   * @param resourceService Service for managing game resources
   */
  constructor(
    buildingSlotsConfig: BuildingSlot[],
    buildingSlotLocations: BuildingSlotLocation[],
    resourceService: ResourceService
  ) {
    super();
    this.buildingRegistry = BuildingRegistry.getInstance();
    this.resourceService = resourceService;
    
    this.initializeBuildingSlots(buildingSlotsConfig, buildingSlotLocations);
    this.initializeBuildings();
  }

  /**
   * Initialize building slots and their locations
   * Generates unique IDs for slots and maps locations to slots
   */
  private initializeBuildingSlots(
    buildingSlotsConfig: BuildingSlot[],
    buildingSlotLocations: BuildingSlotLocation[]
  ): void {
    // Generate and assign unique_id to each slot
    this.buildingSlots = buildingSlotLocations.map(location => {
      // Find the matching slot config from the input
      const slotConfig = buildingSlotsConfig.find(slot => slot.id === location.slot_id);
      if (!slotConfig) {
        throw new Error(`No matching slot config found for location with slot_id ${location.slot_id}`);
      }
      
      // Create a building slot with a unique ID
      return {
        ...slotConfig,
        unique_id: uuidv4()
      };
    });
    
    // Map locations to slots by array index and assign slot_unique_id
    this.buildingSlotLocations = buildingSlotLocations.map((location, index) => {
      const slotUniqueId = this.buildingSlots[index].unique_id;
      
      if (!slotUniqueId) {
        throw new Error(`No matching slot found for location with slot_id ${location.slot_id}`);
      }
      
      return {
        ...location,
        slot_unique_id: slotUniqueId
      };
    });
  }

  /**
   * Initialize buildings from configuration
   * Immediately constructs buildings that are defined as already_constructed in the level config
   */
  private initializeBuildings(): void {    
    this.buildingSlots.forEach(slot => {
      if (slot.already_constructed) {
        this.constructBuilding(slot.already_constructed, slot.unique_id);
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
   * Get a specific building slot by its unique ID
   */
  public getBuildingSlotByUniqueId(uniqueId: string): BuildingSlot | undefined {
    return this.buildingSlots.find(slot => slot.unique_id === uniqueId);
  }

  /**
   * Get a specific building slot by its legacy ID (deprecated)
   */
  public getBuildingSlotById(slotId: string): BuildingSlot | undefined {
    return this.buildingSlots.find(slot => slot.id === slotId);
  }

  /**
   * Get the location for a specific building slot
   */
  public getBuildingSlotLocationByUniqueId(slotUniqueId: string): BuildingSlotLocation | undefined {
    return this.buildingSlotLocations.find(location => location.slot_unique_id === slotUniqueId);
  }

  /**
   * Get the location for a specific building slot by legacy ID (deprecated)
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
   * @param slotUniqueId The unique ID of the slot to check
   * @returns The ID of the building in this slot, or null if none
   */
  public getBuildingInSlot(slotUniqueId: string): string | null {
    return this.slotToBuildingMap[slotUniqueId] || null;
  }
  
  /**
   * Get the count of constructed buildings with the given ID
   * @param buildingId The building ID to count
   * @returns The number of buildings with this ID that have been constructed
   */
  public getConstructedBuildingCount(buildingId: string): number {
    return this.constructedBuildings.filter(b => b.id === buildingId).length;
  }

  /**
   * Check if the constructed building limit has been reached for a specific building
   * @param buildingId The ID of the building to check
   * @returns true if the limit has been reached, false otherwise
   */
  public reachedConstructedBuildingLimit(buildingId: string): boolean {
    const building = this.getBuildingConfig(buildingId);
    return this.getConstructedBuildingCount(buildingId) >= (building.limit || 0);
  }

  public getBuildingConfig(buildingId: string): BuildingConfig {
    const building = this.buildingRegistry.getBuildingConfig(buildingId);
    if (!building) { throw new Error(`Building config with ID ${buildingId} not found`); }
    return building;
  }
  
  /**
   * Construct a new building
   * @param buildingId The ID of the building to construct
   * @param slotUniqueId Optional unique ID of the slot where the building should be constructed
   * @returns true if building was constructed, false if it was already constructed or doesn't exist
   */
  public constructBuilding(buildingId: string, slotUniqueId?: string): boolean {
    if (this.reachedConstructedBuildingLimit(buildingId)) {
      return false;
    }
    
    const building = this.getBuildingConfig(buildingId);
    const requiredConstruction = building.cost?.construction || 0;
    const availableConstruction = this.resourceService.getConstruction();

    // Check if player can afford the building
    if (availableConstruction < requiredConstruction) {
      return false;
    }

    // Add to constructed buildings
    this.constructedBuildings.push(building);
    
    this.resourceService.consumeConstruction(requiredConstruction);
    
    // If a slot was specified, update the slot mapping
    if (slotUniqueId) {
      // Get the slot to update its constructed status
      const slotIndex = this.buildingSlots.findIndex(slot => slot.unique_id === slotUniqueId);
      if (slotIndex >= 0) {
        // Update the slot's already_constructed property
        this.buildingSlots[slotIndex] = {
          ...this.buildingSlots[slotIndex],
          already_constructed: buildingId
        };
        
        // Update the slot-to-building mapping
        this.slotToBuildingMap[slotUniqueId] = buildingId;
      }
    }
    
    // Emit building constructed event with building ID and slot ID
    this.emit(BuildingServiceEvents.BUILDING_CONSTRUCTED, buildingId, slotUniqueId || null);
    
    return true;
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
    const id = uuidv4(); // Generate new ID for both fields
    return {
      id, // Use same ID for both fields for newly created slots
      unique_id: id,
      already_constructed,
      available_for_construction
    };
  }

  /**
   * Get the current state of the building menu
   * @returns Whether the building menu is open
   */
  public isMenuVisible(): boolean {
    return this.isMenuOpen;
  }

  /**
   * Open the building menu for a specific slot
   * @param slotUniqueId The unique ID of the slot to open the menu for
   */
  public openMenu(slotUniqueId: string): void {
    this.isMenuOpen = true;
    this.currentSlotId = slotUniqueId;
    this.emit(BuildingServiceEvents.MENU_STATE_CHANGED, true, slotUniqueId);
  }

  /**
   * Close the building menu
   */
  public closeMenu(): void {
    this.isMenuOpen = false;
    this.currentSlotId = null;
    this.emit(BuildingServiceEvents.MENU_STATE_CHANGED, false, null);
  }
} 