declare module 'phaser3-nineslice' {
  export class Plugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager: Phaser.Plugins.PluginManager);
    boot(): void;
  }

  // The plugin extends Phaser.Scene.Systems.add with this method
  namespace Phaser.GameObjects.GameObjectFactory {
    interface GameObjectFactory {
      nineslice(
        x: number,
        y: number,
        texture: string,
        frame?: string | number,
        width?: number,
        height?: number,
        leftWidth?: number,
        rightWidth?: number,
        topHeight?: number,
        bottomHeight?: number
      ): Phaser.GameObjects.GameObject;
    }
  }
} 