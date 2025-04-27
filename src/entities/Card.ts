export interface CardTracks {
  power: number;
  construction: number;
  invention: number;
}

export interface CardSlots {
  power: string[];
  construction: string[];
  invention: string[];
}

export interface CardConfig {
  id: string;
  name: string;
  race: string;
  baseTracks: CardTracks;
  startingStickers: CardSlots;
  maxSlots: CardTracks;
}

/**
 * Card entity representing a single card in the game
 */
export class Card {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _race: string;
  private readonly _baseTracks: CardTracks;
  private _stickers: CardSlots;
  private readonly _maxSlots: CardTracks;

  /**
   * Create a new Card instance
   * @param config Card configuration data
   */
  constructor(config: CardConfig) {
    this._id = config.id;
    this._name = config.name;
    this._race = config.race;
    this._baseTracks = { ...config.baseTracks };
    this._stickers = {
      power: [...config.startingStickers.power],
      construction: [...config.startingStickers.construction],
      invention: [...config.startingStickers.invention]
    };
    this._maxSlots = { ...config.maxSlots };
  }

  // Getters

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get race(): string {
    return this._race;
  }

  get baseTracks(): CardTracks {
    return { ...this._baseTracks };
  }

  get stickers(): CardSlots {
    return {
      power: [...this._stickers.power],
      construction: [...this._stickers.construction],
      invention: [...this._stickers.invention]
    };
  }

  get maxSlots(): CardTracks {
    return { ...this._maxSlots };
  }

  /**
   * Get the total effective value for a specific track
   * @param trackType Track type to get the value for
   * @returns The calculated value considering base value and stickers
   */
  public getTrackValue(trackType: keyof CardTracks): number {
    // In a full implementation, this would calculate the sticker effects
    // For now, just return the base value
    return this._baseTracks[trackType];
  }

  /**
   * Apply a sticker to a specific track
   * @param stickerId ID of the sticker to apply
   * @param trackType Track to apply the sticker to
   * @param slotIndex Index position to place the sticker (replaces existing)
   * @returns Boolean indicating success
   */
  public applySticker(stickerId: string, trackType: keyof CardSlots, slotIndex: number): boolean {
    const trackSlots = this._stickers[trackType];
    
    // Check if the slot index is valid
    if (slotIndex < 0 || slotIndex >= this._maxSlots[trackType]) {
      return false;
    }
    
    // If the slot doesn't exist yet, expand the array
    while (trackSlots.length <= slotIndex) {
      trackSlots.push('sticker_slot_dark');
    }
    
    // Apply the sticker to the slot
    trackSlots[slotIndex] = stickerId;
    return true;
  }

  /**
   * Create a Card from a CardConfig object
   * @param config Card configuration
   * @returns New Card instance
   */
  public static fromConfig(config: CardConfig): Card {
    return new Card(config);
  }

  /**
   * Serialize the card to a plain object
   * @returns Plain object representation of the card
   */
  public toJSON(): CardConfig {
    return {
      id: this._id,
      name: this._name,
      race: this._race,
      baseTracks: { ...this._baseTracks },
      startingStickers: {
        power: [...this._stickers.power],
        construction: [...this._stickers.construction],
        invention: [...this._stickers.invention]
      },
      maxSlots: { ...this._maxSlots }
    };
  }
} 