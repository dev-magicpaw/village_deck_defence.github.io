import { ResourceType } from './Types';

export enum StickerType {
    Power,
    Construction,
    Invention,
    Wild
}

export enum StickerEffectType {
    Resource
}

export interface StickerConfig {
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

export interface CardSticker {
  id: string;
  name: string;
  description: string;
  image: string;
  type: StickerType;
  effects: StickerEffect[];
}

/**
 * Global registry for sticker configurations
 */
export class StickerRegistry {
  private static _instance: StickerRegistry;
  private _stickerConfigs: Map<string, StickerConfig> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of StickerRegistry
   */
  public static getInstance(): StickerRegistry {
    if (!StickerRegistry._instance) {
      StickerRegistry._instance = new StickerRegistry();
    }
    return StickerRegistry._instance;
  }

  /**
   * Load sticker configurations from JSON array
   * @param stickersJson Array of sticker configurations from JSON
   */
  public loadStickers(stickersJson: any[]): void {
    stickersJson.forEach(stickerJson => {
      const config = this.convertStickerJsonToConfig(stickerJson);
      this._stickerConfigs.set(config.id, config);
    });
  }

  /**
   * Convert raw JSON sticker data to typed StickerConfig
   */
  private convertStickerJsonToConfig(stickerJson: any): StickerConfig {
    const typeMap: Record<string, StickerType> = {
      'Power': StickerType.Power,
      'Construction': StickerType.Construction,
      'Invention': StickerType.Invention,
      'Wild': StickerType.Wild
    };

    const effects = stickerJson.effects.map((effectJson: any) => {
      if (effectJson.type === 'Resource') {
        const resourceTypeMap: Record<string, ResourceType> = {
          'Power': ResourceType.Power,
          'Construction': ResourceType.Construction,
          'Invention': ResourceType.Invention
        };

        const effect: ResourceStickerEffect = {
          type: StickerEffectType.Resource,
          resourceType: resourceTypeMap[effectJson.resourceType],
          value: effectJson.value,
          effect: () => {
            // Resource stickers don't have special effects
          }
        };
        return effect;
      } else {
        throw new Error(`Unknown effect type: ${effectJson.type}`);
      }
    });

    return {
      id: stickerJson.id,
      name: stickerJson.name,
      description: stickerJson.description,
      image: stickerJson.image,
      type: typeMap[stickerJson.type],
      effects
    };
  }

  /**
   * Get a sticker configuration by ID
   * @param stickerId The ID of the sticker to get
   * @returns The sticker configuration or undefined if not found
   */
  public getStickerConfig(stickerId: string): StickerConfig | undefined {
    return this._stickerConfigs.get(stickerId);
  }
}

/**
 * Helper class to create CardSticker instances from config
 */
export class StickerFactory {
  public static fromConfig(stickerConfig: StickerConfig): CardSticker {
    return {
      id: stickerConfig.id,
      name: stickerConfig.name,
      description: stickerConfig.description,
      image: stickerConfig.image,
      type: stickerConfig.type,
      effects: stickerConfig.effects
    };
  }
} 