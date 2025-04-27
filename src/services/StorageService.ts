/**
 * Service for managing localStorage operations
 */
export class StorageService {
  private static readonly PREFIX = 'sticker_village_';

  /**
   * Save data to localStorage with the game's prefix
   * @param key Storage key (without prefix)
   * @param data Data to store
   */
  public static save(key: string, data: any): void {
    try {
      const prefixedKey = `${this.PREFIX}${key}`;
      const serializedData = JSON.stringify(data);
      localStorage.setItem(prefixedKey, serializedData);
    } catch (error) {
      console.error(`Error saving data to localStorage (key: ${key}):`, error);
    }
  }

  /**
   * Load data from localStorage
   * @param key Storage key (without prefix)
   * @param defaultValue Value to return if key doesn't exist
   * @returns The loaded data or defaultValue if key doesn't exist
   */
  public static load<T>(key: string, defaultValue: T): T {
    try {
      const prefixedKey = `${this.PREFIX}${key}`;
      const data = localStorage.getItem(prefixedKey);
      return data ? JSON.parse(data) as T : defaultValue;
    } catch (error) {
      console.error(`Error loading data from localStorage (key: ${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * Check if a key exists in localStorage
   * @param key Storage key (without prefix)
   * @returns boolean indicating if the key exists
   */
  public static exists(key: string): boolean {
    const prefixedKey = `${this.PREFIX}${key}`;
    return localStorage.getItem(prefixedKey) !== null;
  }

  /**
   * Remove a key from localStorage
   * @param key Storage key (without prefix)
   */
  public static remove(key: string): void {
    const prefixedKey = `${this.PREFIX}${key}`;
    localStorage.removeItem(prefixedKey);
  }

  /**
   * Clear all game data from localStorage (only keys with the game's prefix)
   */
  public static clearAll(): void {
    const keysToRemove: string[] = [];
    
    // Collect all keys with our prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all collected keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
} 