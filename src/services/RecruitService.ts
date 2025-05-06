import Phaser from 'phaser';
import { BuildingEffect } from '../entities/Building';
import { Card } from '../entities/Card';
import { BuildingService, BuildingServiceEvents } from './BuildingService';
import { CardRegistry } from './CardRegistry';
import { DeckService } from './DeckService';

/**
 * Events emitted by the RecruitService
 */
export enum RecruitServiceEvents {
  AGENCY_STATE_CHANGED = 'recruit_agency_state_changed'
}

/**
 * Service for managing recruit mechanics in the game
 */
export class RecruitService extends Phaser.Events.EventEmitter {
  private buildingService: BuildingService;
  private availableRecruits: string[] = [];
  private cardRegistry: CardRegistry;
  private playerDeck: DeckService<Card>;
  private menuOpen: boolean = false;

  /**
   * Create a new RecruitService
   * @param buildingService Service for managing buildings
   * @param cardRegistry Registry for creating card instances
   * @param playerDeck Player's deck service
   */
  constructor(
    buildingService: BuildingService, 
    cardRegistry: CardRegistry,
    playerDeck: DeckService<Card>
  ) {
    super();
    this.buildingService = buildingService;
    this.cardRegistry = cardRegistry;
    this.playerDeck = playerDeck;
    
    // Initialize available recruits from already constructed buildings
    this.initializeAvailableRecruits();
    
    // Subscribe to building construction events
    this.buildingService.on(
      BuildingServiceEvents.BUILDING_CONSTRUCTED, 
      this.onBuildingConstructed.bind(this)
    );
  }

  /**
   * Initialize available recruits based on already constructed buildings
   */
  private initializeAvailableRecruits(): void {
    const constructedBuildings = this.buildingService.getConstructedBuildings();
    
    constructedBuildings.forEach(building => {
        this.onBuildingConstructed(building.id);
    });
  }

  /**
   * Handle building construction event
   * @param buildingId ID of the constructed building
   */
  private onBuildingConstructed(buildingId: string): void {
    const buildingConfig = this.buildingService.getBuildingConfig(buildingId);
    
    buildingConfig.effects.forEach((effect: BuildingEffect) => {
      if (effect.type === 'make_recruitable' && effect.recruits) {
        // Add each recruit from the effect to the available recruits list
        effect.recruits.forEach((recruitId: string) => {
          if (!this.availableRecruits.includes(recruitId)) {
            this.availableRecruits.push(recruitId);
          }
        });
      }
    });
  }

  /**
   * Recruit a card with the given ID and add it to the player's discard pile
   * @param cardId ID of the card to recruit
   * @returns The recruited card or undefined if the card ID is invalid
   */
  public recruit(cardId: string): Card {
    // Create a new card instance with the given ID
    const card = this.cardRegistry.createCardInstance(cardId);
    if (!card) { throw new Error(`Card with ID ${cardId} not found`); }
    this.playerDeck.discard(card);
    return card;
  }

  /**
   * Notify that the recruit menu has been opened
   */
  public openMenu(): void {
    this.menuOpen = true;
    this.emit(RecruitServiceEvents.AGENCY_STATE_CHANGED, true);
  }

  /**
   * Notify that the recruit menu has been closed
   */
  public closeMenu(): void {
    this.menuOpen = false;
    this.emit(RecruitServiceEvents.AGENCY_STATE_CHANGED, false);
  }

  /**
   * Check if the recruit menu is currently open
   * @returns true if the menu is open, false otherwise
   */
  public isMenuOpen(): boolean {
    return this.menuOpen;
  }

  /**
   * Check if a recruit is available for recruitment
   * @param recruitId ID of the recruit to check
   * @returns true if the recruit is available, false otherwise
   */
  public isRecruitable(recruitId: string): boolean {
    return this.availableRecruits.includes(recruitId);
  }

  /**
   * Get the list of all available recruits
   * @returns Array of available recruit IDs
   */
  public getAvailableRecruits(): string[] {
    return [...this.availableRecruits];
  }
} 