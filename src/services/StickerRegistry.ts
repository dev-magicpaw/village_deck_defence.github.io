import {
    ResourceStickerEffect,
    StickerConfig,
    StickerEffectType,
    StickerType
} from '../entities/Sticker';
import { ResourceType } from '../entities/Types';

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