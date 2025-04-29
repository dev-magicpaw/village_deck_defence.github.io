export interface BuildingConfig {
  id: string;
  name: string;
  description: string;
  image: string;
  constructed_from_start: boolean;
}

/**
 * Building entity representing a single building in the village
 */
export class Building {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly image: string;

  /**
   * Create a new Building instance
   * @param config Building configuration data
   */
  constructor(config: BuildingConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.image = config.image;
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
    constructed_from_start: buildingJson.constructed_from_start
  };
} 