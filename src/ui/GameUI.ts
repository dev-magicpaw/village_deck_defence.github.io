import Phaser from 'phaser';

export class GameUI {
  // Panel height proportions
  static readonly INVASION_PANEL_HEIGHT_PROPORTION: number = 0.08;
  static readonly PLAYER_HAND_PANEL_HEIGHT_PROPORTION: number = 0.35;
  // Panel width proportions
  static readonly INFO_PANEL_WIDTH_PROPORTION: number = 0.3;

  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * Create all UI panels
   */
  public createUI(): void {
    this.createInvasionProgressPanel();
    this.createDisplaySpacePanel();
    this.createEntityInfoPanel();
    this.createPlayerHandPanel();
  }
  
  /**
   * Create the invasion progress panel at the top of the screen
   */
  private createInvasionProgressPanel(): void {
    const { width, height } = this.scene.cameras.main;
    const panelHeight = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    
    // Create the panel background using 9-slice
    const invasionPanel = this.scene.add['nineslice'](
      0,
      0,
      'panel_metal_corners_metal',
      undefined,
      width,
      panelHeight,
      20,
      20,
      20,
      20
    );
    
    // Set the origin to the top-left corner
    invasionPanel.setOrigin(0, 0);
    
    // Add the panel title
    const invasionTitle = this.scene.add.text(width / 2, panelHeight / 2, 'Invasion progress track', {
      fontSize: '24px',
      color: '#ffffff'
    });
    invasionTitle.setOrigin(0.5, 0.5);
  }
  
  /**
   * Create the main display space panel
   */
  private createDisplaySpacePanel(): void {
    const { width, height } = this.scene.cameras.main;
    const topPanelHeight = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    const bottomPanelHeight = height * GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION;
    const rightPanelWidth = width * GameUI.INFO_PANEL_WIDTH_PROPORTION;
    
    const panelWidth = width - rightPanelWidth;
    const panelHeight = height - topPanelHeight - bottomPanelHeight;
    const panelX = 0;
    const panelY = topPanelHeight;
    
    // Create the panel background using 9-slice
    const displayPanel = this.scene.add['nineslice'](
      panelX,
      panelY,
      'panel_metal_corners_metal',
      undefined,
      panelWidth,
      panelHeight,
      20,
      20,
      20,
      20
    );
    
    // Set the origin to the top-left corner
    displayPanel.setOrigin(0, 0);
    
    // Add the display space information text
    const displayInfoText = this.scene.add.text(panelX + panelWidth / 2, panelY + panelHeight / 2, 
      'Display space.\nBy default displays the village with all constructed buildings.\nIf an architect is selected, construction options are displayed here.\nIf Workshop is selected, sticker options are displayed here.\nIf Adventure guild is selected, the possible adventures\n(easy/medium/hard) are displayed here.',
      {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }
    );
    displayInfoText.setOrigin(0.5, 0.5);
  }
  
  /**
   * Create the entity info panel on the right side
   */
  private createEntityInfoPanel(): void {
    const { width, height } = this.scene.cameras.main;
    const topPanelHeight = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    const rightPanelWidth = width * GameUI.INFO_PANEL_WIDTH_PROPORTION;
    
    const panelX = width - rightPanelWidth;
    const panelY = topPanelHeight;
    const panelHeight = height - topPanelHeight;
    
    // Create the panel background using 9-slice
    const infoPanel = this.scene.add['nineslice'](
      panelX,
      panelY,
      'panel_metal_corners_metal',
      undefined,
      rightPanelWidth,
      panelHeight,
      20,
      20,
      20,
      20
    );
    
    // Set the origin to the top-left corner
    infoPanel.setOrigin(0, 0);
    
    // Add the entity info panel text
    const infoText = this.scene.add.text(panelX + rightPanelWidth / 2, panelY + panelHeight / 2, 
      'Selected entity info panel. If some entity is selected (like a card in hand or a building on the map), it\'s details are displayed here',
      {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: rightPanelWidth - 40 }
      }
    );
    infoText.setOrigin(0.5, 0.5);
  }
  
  /**
   * Create the player hand panel at the bottom
   */
  private createPlayerHandPanel(): void {
    const { width, height } = this.scene.cameras.main;
    const topPanelHeight = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    const bottomPanelHeight = height * GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION;
    const rightPanelWidth = width * GameUI.INFO_PANEL_WIDTH_PROPORTION;
    
    const panelWidth = width - rightPanelWidth;
    const panelX = 0;
    const panelY = height - bottomPanelHeight;
    
    // Create the panel background using 9-slice
    const handPanel = this.scene.add['nineslice'](
      panelX,
      panelY,
      'panel_metal_corners_metal',
      undefined,
      panelWidth,
      bottomPanelHeight,
      20,
      20,
      20,
      20
    );
    
    // Set the origin to the top-left corner
    handPanel.setOrigin(0, 0);
    
    // Add the hand panel text
    const handText = this.scene.add.text(panelX + panelWidth / 2, panelY + bottomPanelHeight / 2, 
      'Player card hand area with the Card deck on the very left',
      {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }
    );
    handText.setOrigin(0.5, 0.5);
  }
} 