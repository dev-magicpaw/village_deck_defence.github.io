
/**
 * Service for managing the tavern building and its functionalities
 */
export class TavernService {
  private static instance: TavernService;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
  }

  /**
   * Get the singleton instance of the TavernService
   */
  public static getInstance(): TavernService {
    if (!TavernService.instance) {
      TavernService.instance = new TavernService();
    }
    return TavernService.instance;
  }

  /**
   * Initialize the tavern service
   */
  public init(): void {
  }
} 