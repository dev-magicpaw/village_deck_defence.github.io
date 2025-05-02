import Phaser from 'phaser';

/**
 * Service responsible for managing the sticker shop functionality
 */
export class StickerShopService {
  private _isOpen: boolean = false;
  private _events: Phaser.Events.EventEmitter;
  
  /**
   * Event names for StickerShopService
   */
  public static Events = {
    SHOP_STATE_CHANGED: 'shop_state_changed',
  };
  
  /**
   * Create a new sticker shop service
   * @param initialState Initial shop state (open or closed)
   */
  constructor(initialState: boolean = false) {
    this._isOpen = initialState;
    this._events = new Phaser.Events.EventEmitter();
  }
  
  /**
   * Toggle the shop state (open/closed)
   * @returns The new shop state
   */
  public toggleShopState(): boolean {
    this._isOpen = !this._isOpen;
    this._events.emit(StickerShopService.Events.SHOP_STATE_CHANGED, this._isOpen);
    return this._isOpen;
  }
  
  /**
   * Set the shop state directly
   * @param isOpen Whether the shop should be open
   */
  public setShopState(isOpen: boolean): void {
    if (this._isOpen !== isOpen) {
      this._isOpen = isOpen;
      this._events.emit(StickerShopService.Events.SHOP_STATE_CHANGED, this._isOpen);
    }
  }
  
  /**
   * Check if the shop is currently open
   */
  public isShopOpen(): boolean {
    return this._isOpen;
  }
  
  /**
   * Add event listener for shop events
   * @param event Event name
   * @param fn Event handler function
   * @param context Context for the event handler
   */
  public on(event: string, fn: Function, context?: any): Phaser.Events.EventEmitter {
    return this._events.on(event, fn, context);
  }
  
  /**
   * Remove event listener
   * @param event Event name
   * @param fn Event handler function
   * @param context Context for the event handler
   */
  public off(event: string, fn?: Function, context?: any): Phaser.Events.EventEmitter {
    return this._events.off(event, fn, context);
  }
} 