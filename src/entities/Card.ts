export enum ResourceType {
    Power,
    Construction,
    Invention
}

export enum StickerType {
    Power,
    Construction,
    Invention,
    Wild
}

export enum StickerEffectType {
    Resource
}

export enum Race {
    Elf,
    Dwarf,
    Human,
    Gnome
}

export interface CardConfig {
    id: string;
    name: string;
    description: string;
    image: string;
    race: Race;
    startingStickers: {
        [ResourceType.Power]: string[];
        [ResourceType.Construction]: string[];
        [ResourceType.Invention]: string[];
    };
    maxSlots: { 
        [ResourceType.Power]: number;
        [ResourceType.Construction]: number;
        [ResourceType.Invention]: number;
    };
}

export interface CardTrack {
  type: ResourceType;
  slots: CardSlot[];
}

export interface CardSlot {
  id: number;
  sticker: CardSticker | null;
  replaceable: boolean;
}

export interface CardSticker {
  id: string;
  name: string;
  description: string;
  image: string;
  type: StickerType;
  effects: StickerEffect[];
}

export interface StickerEffect {
  type: StickerEffectType;
  effect(): void;
}

export interface ResourceStickerEffect extends StickerEffect {
  type: StickerEffectType.Resource;
  resourceType: ResourceType;
  value: number;
}

/**
 * Card entity representing a single card in the game
 */
export class Card {
  public readonly id: string;
  public readonly name: string;
  public readonly race: Race;
  private _tracks: CardTrack[];

  /**
   * Create a new Card instance
   * @param config Card configuration data
   */
  constructor(config: CardConfig) {
    this.id = config.id;
    this.name = config.name;
    this.race = config.race;
    this._tracks = [];
    this._tracks.push(this.buildTrack(
      ResourceType.Power, 
      config.maxSlots[ResourceType.Power], 
      config.startingStickers[ResourceType.Power]
    ));
    this._tracks.push(this.buildTrack(
      ResourceType.Construction, 
      config.maxSlots[ResourceType.Construction], 
      config.startingStickers[ResourceType.Construction]
    ));
    this._tracks.push(this.buildTrack(
      ResourceType.Invention, 
      config.maxSlots[ResourceType.Invention], 
      config.startingStickers[ResourceType.Invention]
    ));
  }

  private buildTrack(type: ResourceType, maxSlots: number, startingStickers: string[]): CardTrack {
    const track: CardTrack = {
      type,
      slots: []
    };
    for (let i = 0; i < maxSlots; i++) {
      track.slots.push({
        id: i,
        // TODO get sticker config by sticker id (in startingStickers) and use sticker factory fromConfig here
        sticker: i < startingStickers.length ? this.getStickerFromId(startingStickers[i]) : null,
        replaceable: false
      });
    }
    return track;
  }

  public static fromConfig(config: CardConfig): Card {
    return new Card(config);
  }
}

/**
 * Helper class to create CardSticker instances from config
 */
export class StickerFactory {
  public static fromConfig(stickerConfig: any): CardSticker {
    const typeMap: Record<string, StickerType> = {
      'Power': StickerType.Power,
      'Construction': StickerType.Construction,
      'Invention': StickerType.Invention,
      'Wild': StickerType.Wild
    };
    const resourceTypeMap: Record<string, ResourceType> = {
      'Power': ResourceType.Power,
      'Construction': ResourceType.Construction,
      'Invention': ResourceType.Invention
    };
    const effects = stickerConfig.effects.map((effectConfig: any) => {
      if (effectConfig.type === 'Resource') {
        

        const effect: ResourceStickerEffect = {
          type: StickerEffectType.Resource,
          resourceType: resourceTypeMap[effectConfig.resourceType],
          value: effectConfig.value,
          effect: () => {
            // Resource stickers don't have special effects
          }
        };
        return effect;
      } else {
        throw new Error(`Unknown effect type: ${effectConfig.type}`);
      }
    }).filter((e: unknown) => e !== null) as StickerEffect[];

    return {
      id: stickerConfig.id,
      name: stickerConfig.name,
      description: stickerConfig.description,
      image: stickerConfig.image,
      type: typeMap[stickerConfig.type],
      effects
    };
  }
}

/**
 * Helper function to convert string race to Race enum
 */
export function stringToRace(raceStr: string): Race {
  const raceMap: Record<string, Race> = {
    'Elf': Race.Elf,
    'Dwarf': Race.Dwarf,
    'Human': Race.Human,
    'Gnome': Race.Gnome
  };
  
  return raceMap[raceStr] || Race.Human; // Default to Human if not found
}

/**
 * Function to convert card JSON data to CardConfig
 */
export function convertCardJsonToConfig(cardJson: any): CardConfig {
  return {
    id: cardJson.id,
    name: cardJson.name,
    description: cardJson.description,
    image: cardJson.image,
    race: stringToRace(cardJson.race),
    startingStickers: {
      [ResourceType.Power]: cardJson.startingStickers.power || [],
      [ResourceType.Construction]: cardJson.startingStickers.construction || [],
      [ResourceType.Invention]: cardJson.startingStickers.invention || []
    },
    maxSlots: {
      [ResourceType.Power]: cardJson.maxSlots.power || 0,
      [ResourceType.Construction]: cardJson.maxSlots.construction || 0,
      [ResourceType.Invention]: cardJson.maxSlots.invention || 0
    }
  };
} 