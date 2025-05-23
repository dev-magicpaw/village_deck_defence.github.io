/**
 * Interface for building effects
 */
export interface BuildingEffect {
  type: string;
  recruits?: string[];
  [key: string]: any;
}

export interface BuildingConfig {
  id: string;
  name: string;
  description: string;
  image: string;
  cost?: {
    construction: number;
  };
  limit?: number | null;
  effects: BuildingEffect[]; // Always defined, empty array if no effects
}

/**
 * Represents a slot where a building can be constructed
 */
export interface BuildingSlot {
  id: string; // Deprecated - kept for backward compatibility // TODO: Remove
  unique_id: string; // UUID v4 unique identifier
  already_constructed: string | null;
  available_for_construction: string[];
}

/**
 * Represents the position of a building slot on the game board
 */
export interface BuildingSlotLocation {
  x: number;
  y: number;
  slot_id: string; // Deprecated - kept for backward compatibility // TODO: Remove
  slot_unique_id: string; // References the slot's unique_id
}

/**
 * Building entity representing a single building in the village
 */
export class Building {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly image: string;
  public readonly cost?: {
    construction: number;
  };
  public readonly limit?: number | null;
  public readonly effects: BuildingEffect[];

  /**
   * Create a new Building instance
   * @param config Building configuration data
   */
  constructor(config: BuildingConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.image = config.image;
    this.cost = config.cost;
    this.limit = config.limit;
    this.effects = config.effects;
  }

  /**
   * Create a Building from a configuration
   */
  public static fromConfig(config: BuildingConfig): Building {
    return new Building(config);
  }
}

/**
 * Function to convert building JSON data to BuildingConfig
 */
export function convertBuildingJsonToConfig(buildingJson: any): BuildingConfig {
  return {
    id: buildingJson.id,
    name: buildingJson.name,
    description: buildingJson.description,
    image: buildingJson.image,
    cost: buildingJson.cost ? {
      construction: buildingJson.cost.construction || 0
    } : undefined,
    limit: buildingJson.limit,
    effects: buildingJson.effects ? [...buildingJson.effects] : []
  };
} 