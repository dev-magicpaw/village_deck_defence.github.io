import { trackEvent } from '../game';

/**
 * Service for tracking analytics events
 */
export class AnalyticsService {
  /**
   * Track a card play event
   * @param cardId ID of the card played
   * @param resource Resource the card was used for (power, construction, invention)
   * @param turnNumber Turn number of the card play 
   */
  public static trackCardPlayed(cardId: string, resource: string, turnNumber: number): void {
    trackEvent('card_played', {
      card_id: cardId,
      resource: resource,
      turn_number: turnNumber
    });
  }

  /**
   * Track a building construction event
   * @param buildingId ID of the building constructed
   * @param turnNumber Turn number of the building construction
   */
  public static trackBuildingBuilt(buildingId: string, turnNumber: number): void {
    trackEvent('building_built', {
      building_id: buildingId,
      turn_number: turnNumber
    });
  }

  /**
   * Track a sticker application event
   * @param stickerId ID of the sticker applied
   * @param targetCardId ID of the card the sticker was applied to
   * @param trackType Track type the sticker was applied to
   * @param turnNumber Turn number of the sticker application
   */
  public static trackStickerApplied(stickerId: string, targetCardId: string, trackType: string, turnNumber: number): void {
    trackEvent('sticker_applied', {
      sticker_id: stickerId,
      target_card_id: targetCardId,
      track_type: trackType,
      turn_number: turnNumber
    });
  }

  /**
   * Track an adventure completion event
   * @param adventureId ID of the adventure completed
   * @param difficulty Difficulty level of the adventure
   * @param success Whether the adventure was successful
   * @param rewardChosen Reward chosen (if successful)
   * @param turnNumber Turn number of the adventure completion
   */
  public static trackAdventureCompleted(
    adventureId: string, 
    difficulty: string, 
    success: boolean, 
    turnNumber: number,
    rewardChosen?: string
  ): void {
    trackEvent('adventure_completed', {
      adventure_id: adventureId,
      difficulty,
      success,
      reward_chosen: rewardChosen || 'none',
      turn_number: turnNumber
    });
  }

  /**
   * Track a deck shuffle event
   * @param dayNumber Current day number after shuffle
   * @param deckSize Number of cards in deck after shuffle
   * @param cardsDiscarded Number of cards in discard pile before shuffle
   * @param turnNumber Turn number of the deck shuffle
   */
  public static trackShuffle(dayNumber: number, deckSize: number, cardsDiscarded: number, turnNumber: number): void {
    trackEvent('deck_shuffled', {
      day_number: dayNumber,
      deck_size: deckSize,
      cards_discarded: cardsDiscarded,
      turn_number: turnNumber
    });
  }

  /**
   * Track invasion progress
   * @param distanceRemaining Distance remaining until invasion
   * @param currentDay Current day number
   */
  public static trackInvasionProgress(distanceRemaining: number, currentDay: number): void {
    trackEvent('invasion_progress', {
      distance_remaining: distanceRemaining,
      current_day: currentDay
    });
  }
} 