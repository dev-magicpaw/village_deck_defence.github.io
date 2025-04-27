export interface ConfigLoadOptions {
  basePath?: string;
  cacheResponse?: boolean;
}

/**
 * Service for loading JSON configuration files
 */
export class ConfigLoader {
  private static configCache: Map<string, any> = new Map();
  private static readonly DEFAULT_OPTIONS: ConfigLoadOptions = {
    basePath: 'config/',
    cacheResponse: true
  };

  /**
   * Load a configuration file
   * @param fileName The name of the configuration file to load (without path)
   * @param options Loading options
   * @returns Promise that resolves to the loaded configuration
   */
  public static async load<T>(fileName: string, options?: ConfigLoadOptions): Promise<T> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const filePath = `${mergedOptions.basePath}${fileName}`;
    
    // Check cache first if caching is enabled
    if (mergedOptions.cacheResponse && this.configCache.has(filePath)) {
      return this.configCache.get(filePath) as T;
    }
    
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${filePath} (${response.status} ${response.statusText})`);
      }
      
      const config = await response.json();
      
      // Cache the result if caching is enabled
      if (mergedOptions.cacheResponse) {
        this.configCache.set(filePath, config);
      }
      
      return config as T;
    } catch (error) {
      console.error(`Error loading config file ${filePath}:`, error);
      throw error;
    }
  }
  
  /**
   * Clear the configuration cache
   * @param fileName Optional specific file to clear from cache
   */
  public static clearCache(fileName?: string): void {
    if (fileName) {
      const filePath = `${this.DEFAULT_OPTIONS.basePath}${fileName}`;
      this.configCache.delete(filePath);
    } else {
      this.configCache.clear();
    }
  }
} 