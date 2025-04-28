/**
 * Track an event in the analytics system
 * @param eventName Name of the event
 * @param eventParams Optional event parameters
 */
function trackEvent(eventName: string, eventParams?: Record<string, any>): void {
  // In a real implementation, this would send data to an analytics service
  console.log(`Analytics event: ${eventName}`, eventParams);
}

/**
 * Service to track game analytics
 */
export class AnalyticsService {
  /**
   * Track a game start event
   * @param deckSize Size of the starting deck
   */
  public static trackGameStart(deckSize: number): void {
    trackEvent('game_start', { deck_size: deckSize });
  }
  
  /**
   * Track a turn start event
   * @param turnNumber Turn number
   * @param playerCards Number of cards in player's hand
   */
  public static trackTurnStart(turnNumber: number, playerCards: number): void {
    trackEvent('turn_start', { 
      turn_number: turnNumber,
      player_cards: playerCards
    });
  }

  /**
   * Track a sticker application event
   * @param stickerId ID of the sticker applied
   * @param targetCardId ID of the card the sticker was applied to
   * @param slotIndex Index of the slot the sticker was applied to
   * @param turnNumber Turn number of the sticker application
   */
  public static trackStickerApplied(stickerId: string, targetCardId: string, slotIndex: number, turnNumber: number): void {
    trackEvent('sticker_applied', {
      sticker_id: stickerId,
      target_card_id: targetCardId,
      slot_index: slotIndex,
      turn_number: turnNumber
    });
  }
  
  /**
   * Track a card draw event
   * @param cardId ID of the card drawn
   * @param turnNumber Turn number of the card draw
   */
  public static trackCardDrawn(cardId: string, turnNumber: number): void {
    trackEvent('card_drawn', {
      card_id: cardId,
      turn_number: turnNumber
    });
  }
  
  /**
   * Track a game end event
   * @param turnCount Number of turns the game lasted
   * @param result Game result (win/loss/draw)
   */
  public static trackGameEnd(turnCount: number, result: string): void {
    trackEvent('game_end', {
      turn_count: turnCount,
      result: result
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