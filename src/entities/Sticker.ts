import { ResourceType } from './Types';
export { StickerRegistry } from '../services/StickerRegistry';

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
  cost: number;
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
  cost: number;
  getInventionValue(): number;
  getPowerValue(): number;
  getConstructionValue(): number;
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
      effects: stickerConfig.effects,
      cost: stickerConfig.cost,
      
      getInventionValue(): number {
        for (const effect of stickerConfig.effects) {
          if (effect.type === StickerEffectType.Resource) {
            const resourceEffect = effect as ResourceStickerEffect;
            if (resourceEffect.resourceType === ResourceType.Invention) {
              return resourceEffect.value;
            }
          }
        }
        
        return 0;
      },

      getPowerValue(): number {
        for (const effect of stickerConfig.effects) {
          if (effect.type === StickerEffectType.Resource) {
            const resourceEffect = effect as ResourceStickerEffect;
            if (resourceEffect.resourceType === ResourceType.Power) {
              return resourceEffect.value;
            } 
          }
        }
        
        return 0;
      },

      getConstructionValue(): number {
        for (const effect of stickerConfig.effects) {
          if (effect.type === StickerEffectType.Resource) {
            const resourceEffect = effect as ResourceStickerEffect;
            if (resourceEffect.resourceType === ResourceType.Construction) {  
              return resourceEffect.value;
            }
          }
        }
        
        return 0;
      }
    };
  }
} 