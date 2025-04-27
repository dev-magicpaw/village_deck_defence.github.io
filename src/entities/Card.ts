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
    // Use enum for keys
    startingStickers: {
        power: string[];
        construction: string[];
        invention: string[];
    };
    // Use enum for keys
    maxSlots: { 
        power: number;
        construction: number;
        invention: number;
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
  public readonly race: string;
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
      config.maxSlots.power, 
      config.startingStickers.power
    ));
    this._tracks.push(this.buildTrack(
      ResourceType.Construction, 
      config.maxSlots.construction, 
      config.startingStickers.construction
    ));
    this._tracks.push(this.buildTrack(
      ResourceType.Invention, 
      config.maxSlots.invention, 
      config.startingStickers.invention
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
        sticker: i < startingStickers.length ? this.getStickerFromId(startingStickers[i]) : null,
        replaceable: false
      });
    }
    return track;
  }

  private getStickerFromId(stickerId: string): CardSticker | null {
    // This would typically fetch the sticker from a game state or service
    // For now, return a placeholder until sticker loading is implemented
    return null;
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

    const effects = stickerConfig.effects.map((effectConfig: any) => {
      if (effectConfig.type === 'Resource') {
        const resourceTypeMap: Record<string, ResourceType> = {
          'Power': ResourceType.Power,
          'Construction': ResourceType.Construction,
          'Invention': ResourceType.Invention
        };

        const effect: ResourceStickerEffect = {
          type: StickerEffectType.Resource,
          resourceType: resourceTypeMap[effectConfig.resourceType],
          value: effectConfig.value,
          effect: () => {
            // Implementation of effect application would go here
          }
        };
        return effect;
      }
      return null;
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