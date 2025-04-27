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

export interface CardConfig {
    // TODO finish implementation
}

export interface CardTrack {
  type: ResourceType;
  slots: CardSlot[];
}

export interface CardSlot {
  id: number;
  sticker: CardSticker;
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
    this._tracks.push(this.buildTrack(ResourceType.Power,));
    this._tracks.push(this.buildTrack(ResourceType.Construction,));
    this._tracks.push(this.buildTrack(ResourceType.Invention, ));
  }

  private buildTrack(type: ResourceType, maxSlots: number, startingStickers: string[]): CardTrack {
    const track: CardTrack = {
      type,
      slots: []
    };
    for (let i = 0; i < maxSlots; i++) {
      track.slots.push({
        id: i,
        sticker: CardSticker.fromConfig(startingStickers[i]),
        replaceable: false
      });
    }
    return track;
  }

  public static fromConfig(config: CardConfig): Card {
    return new Card(config);
  }
} 