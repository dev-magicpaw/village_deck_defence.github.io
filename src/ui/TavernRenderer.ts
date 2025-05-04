import Phaser from 'phaser';
import { DeckService } from '../services/DeckService';
import { ResourceService } from '../services/ResourceService';
import { AdventureLevel, TavernService } from '../services/TavernService';
import { CARD_HEIGHT, CARD_WIDTH } from './CardRenderer';
import { GameUI } from './GameUI';
import { PlayerHandRenderer, PlayerHandRendererEvents } from './PlayerHandRenderer';

/**
 * Component that renders the tavern interface and adventure selection
 */
export class TavernRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private tavernService: TavernService;
  private resourceService: ResourceService | null = null;
  private deckService: DeckService<any> | null = null;
  private playerHandRenderer: PlayerHandRenderer;
  private visible: boolean = false;
  
  private panelX: number;
  private panelY: number;
  private panelWidth: number;
  private panelHeight: number;
  
  // Adventure level card properties
  private levelCardWidth: number = CARD_WIDTH;
  private levelCardHeight: number = CARD_HEIGHT;
  private levelCardSpacing: number = 20;
  private levelsPerRow: number = 4;
  
  // Currently selected adventure level
  private selectedLevel: AdventureLevel | null = null;
  private levelCards: Map<AdventureLevel, Phaser.GameObjects.Container> = new Map();
  
  // Resource panel elements
  private resourcePanel: Phaser.GameObjects.NineSlice | null = null;
  private acquiredText: Phaser.GameObjects.Text | null = null;
  private selectionText: Phaser.GameObjects.Text | null = null;
  private selectAllButton: Phaser.GameObjects.NineSlice | null = null;
  private selectAllButtonText: Phaser.GameObjects.Text | null = null;
  private playCardsButton: Phaser.GameObjects.NineSlice | null = null;
  private playCardsButtonText: Phaser.GameObjects.Text | null = null;
  private proceedButton: Phaser.GameObjects.NineSlice | null = null;
  private proceedButtonText: Phaser.GameObjects.Text | null = null;
  
  // Keyboard controls
  private escKey: Phaser.Input.Keyboard.Key | null = null;
  
  /**
   * Create a new TavernRenderer
   */
  constructor(
    scene: Phaser.Scene,
    panelX: number,
    panelY: number,
    width: number,
    height: number,
    playerHandRenderer: PlayerHandRenderer,
    resourceService?: ResourceService,
    deckService?: DeckService<any>
  ) {
    this.scene = scene;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelWidth = width;
    this.panelHeight = height;
    this.playerHandRenderer = playerHandRenderer;
    this.resourceService = resourceService || null;
    this.deckService = deckService || null;
    this.tavernService = TavernService.getInstance();
    
    // Create container for all UI elements
    this.container = this.scene.add.container();
    this.container.setVisible(false);
    
    // Set a high depth to ensure it renders on top of other UI elements
    this.container.setDepth(1000);
  }
  
  /**
   * Initialize the tavern renderer
   */
  public init(): void {
    // Pass resource service to tavern service if available
    if (this.resourceService) {
      this.tavernService.setResourceService(this.resourceService);
    }
    
    // Register keyboard controls
    if (this.scene.input && this.scene.input.keyboard) {
      this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escKey.on('down', this.handleEscKey, this);
    }
    
    // Subscribe to player hand card selection changes if available
    this.playerHandRenderer.on(
      PlayerHandRendererEvents.SELECTION_CHANGED,
      this.onCardSelectionChanged,
      this
    );
    
    // Create background panel
    this.createBackgroundPanel();
    
    // Create resource panel
    this.createResourcePanel();
    
    // Render adventure level cards
    this.renderAdventureLevelCards();
  }
  
  /**
   * Create the background panel for the tavern
   */
  private createBackgroundPanel(): void {
    // Create panel background using nineslice
    const background = this.scene.add['nineslice'](
      this.panelX,
      this.panelY,
      'panel_wood_paper',
      undefined,
      this.panelWidth,
      this.panelHeight,
      20, 20, 20, 20
    );
    background.setOrigin(0,0);
    
    // Add title
    const title = this.scene.add.text(
      this.panelX + this.panelWidth / 2,
      this.panelY + 30,
      'Tavern',
      {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#000000',
        align: 'center'
      }
    );
    title.setOrigin(0.5, 0.5);
    
    // Add close button
    const closeButton = this.scene.add.image(
      this.panelX + this.panelWidth - 30,
      this.panelY + 30,
      'round_metal_cross'
    );
    closeButton.setScale(1.2);

    closeButton.setDisplaySize(40, 40);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => {
      this.hide();
    });
    // Add hover effects for close button
    closeButton.on('pointerover', () => {
      closeButton.setScale(1.4);
    });
    
    closeButton.on('pointerout', () => {
      closeButton.setScale(1.2);
    });
    
    // Add all elements to container
    this.container.add([background, title, closeButton]);
  }
  
  /**
   * Create the resource panel that shows power and provides action buttons
   */
  // TODO: this panel should intercept clicks, similar to the the ResourceRenderer in StickerShop
  private createResourcePanel(): void {
    const cardWidth = CARD_WIDTH;
    // Use the player hand panel height dimensions from GameUI class calculation
    const { width, height } = this.scene.cameras.main;
    const panelHeight = height * GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION;
    const marginX = 20;
    const panelWidth = cardWidth + 2 * marginX
    const handPanelY = height - panelHeight;
    
    // Create panel background at the same position as StickerShop's resource panel
    this.resourcePanel = this.scene.add['nineslice'](
      0,
      handPanelY,
      'panel_metal_corners_metal_nice',
      undefined,
      panelWidth,
      panelHeight,
      20, 20, 20, 20
    );
    this.resourcePanel.setOrigin(0, 0);
    this.resourcePanel.setTint(0x666666); // Dark grey tint
    
    // Add acquired power text
    const acquiredY = handPanelY + 50;
    const resourceTextX = panelWidth / 2 - marginX;
    
    this.acquiredText = this.scene.add.text(
      resourceTextX,
      acquiredY,
      'Acquired: 0',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#FFFFFF',
        align: 'center'
      }
    );
    this.acquiredText.setOrigin(0.5, 1);
    
    // Add power resource icon
    const resourceIcon = this.scene.add.image(
      panelWidth - marginX / 2, 
      acquiredY + 5,
      'resource_power'
    );
    resourceIcon.setOrigin(1, 1);
    resourceIcon.setScale(0.6);
    
    // Add selected power text
    const selectedY = handPanelY + 90;
    this.selectionText = this.scene.add.text(
      resourceTextX,
      selectedY,
      'Selected: 0',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#FFFFFF',
        align: 'center'
      }
    );
    this.selectionText.setOrigin(0.5, 1);
    
    // Add power resource icon next to "Selected: X"
    const selectedIcon = this.scene.add.image(
      panelWidth - marginX / 2,
      selectedY + 5,
      'resource_power'
    );
    selectedIcon.setOrigin(1, 1);
    selectedIcon.setScale(0.6);
    
    // Create action buttons
    // Button dimensions and positions
    const buttonWidth = 150;
    const buttonHeight = 35;
    const buttonX = marginX + (cardWidth / 2);
    const buttonSpacingY = 10;
    
    // Select All button
    const selectAllButtonY = handPanelY + 130;
    this.selectAllButton = this.scene.add['nineslice'](
      buttonX,
      selectAllButtonY,
      'panel_wood_corners_metal',
      undefined,
      buttonWidth,
      buttonHeight,
      20, 20, 20, 20
    );
    this.selectAllButton.setOrigin(0.5, 0.5);
    this.selectAllButtonText = this.scene.add.text(
      buttonX,
      selectAllButtonY,
      'Select All',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#FFFFFF',
        align: 'center',
        fontStyle: 'bold'
      }
    );
    this.selectAllButtonText.setOrigin(0.5, 0.5);
    
    // Set hover effects
    this.selectAllButton.setInteractive({ useHandCursor: true });
    this.selectAllButton.on('pointerdown', () => { this.selectAllCards(); });

    this.selectAllButton.on('pointerover', () => {
      this.selectAllButton?.setScale(1.05);
      this.selectAllButtonText?.setScale(1.05);
    });
    
    this.selectAllButton.on('pointerout', () => {
      this.selectAllButton?.setScale(1);
      this.selectAllButtonText?.setScale(1);
    });
    
    // Play Cards button
    const playCardsButtonY = selectAllButtonY + buttonHeight + buttonSpacingY;
    this.playCardsButton = this.scene.add['nineslice'](
      buttonX,
      playCardsButtonY,
      'panel_wood_corners_metal',
      undefined,
      buttonWidth,
      buttonHeight,
      20, 20, 20, 20
    );
    this.playCardsButton.setOrigin(0.5, 0.5);
    this.playCardsButtonText = this.scene.add.text(
      buttonX,
      playCardsButtonY,
      'Play Cards',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#FFFFFF',
        align: 'center',
        fontStyle: 'bold'
      }
    );
    this.playCardsButtonText.setOrigin(0.5, 0.5);
    
    // Set hover effects
    this.playCardsButton.setInteractive({ useHandCursor: true });
    this.playCardsButton.on('pointerdown', () => { this.playSelectedCards(); });

    this.playCardsButton.on('pointerover', () => {
      this.playCardsButton?.setScale(1.05);
      this.playCardsButtonText?.setScale(1.05);
    });
    
    this.playCardsButton.on('pointerout', () => {
      this.playCardsButton?.setScale(1);
      this.playCardsButtonText?.setScale(1);
    });
    
    // Proceed button
    const proceedButtonY = playCardsButtonY + buttonHeight + buttonSpacingY;
    this.proceedButton = this.scene.add['nineslice'](
      buttonX,
      proceedButtonY,
      'panel_wood_corners_metal',
      undefined,
      buttonWidth,
      buttonHeight,
      20, 20, 20, 20
    );
    this.proceedButton.setOrigin(0.5, 0.5);
    this.proceedButtonText = this.scene.add.text(
      buttonX,
      proceedButtonY,
      'Proceed',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#FFFFFF',
        align: 'center',
        fontStyle: 'bold'
      }
    );
    this.proceedButtonText.setOrigin(0.5, 0.5);

    // Set hover effects
    this.proceedButton.setInteractive({ useHandCursor: true });
    this.proceedButton.on('pointerdown', () => { this.proceedWithAdventure(); });

    this.proceedButton.on('pointerover', () => {
      this.proceedButton?.setScale(1.05);
      this.proceedButton?.setScale(1.05);
    });
    
    this.proceedButton.on('pointerout', () => {
      this.proceedButton?.setScale(1);
      this.proceedButton?.setScale(1);
    });

    
    // Set initial button states
    this.setProceedButtonState(false);
    this.setPlayCardsButtonState(false);
    
    // Add all elements to container
    this.container.add([
      this.resourcePanel,
      this.acquiredText,
      resourceIcon,
      this.selectionText,
      selectedIcon,
      this.selectAllButton,
      this.selectAllButtonText,
      this.playCardsButton,
      this.playCardsButtonText,
      this.proceedButton,
      this.proceedButtonText
    ]);
    
    // Update resource displays
    this.updateResourceDisplay();
  }
  
  /**
   * Set the state of the proceed button
   */
  private setProceedButtonState(enabled: boolean): void {
    if (!this.proceedButton || !this.proceedButtonText) return;
    
    if (enabled) {
      this.proceedButton.setTint(0xFFFFFF);
      this.proceedButton.setInteractive({ useHandCursor: true });
      this.proceedButtonText.setColor('#FFFFFF');
    } else {
      this.proceedButton.setTint(0x888888);
      this.proceedButton.disableInteractive();
      this.proceedButtonText.setColor('#888888');
    }
  }
  
  /**
   * Set the state of the play cards button
   */
  private setPlayCardsButtonState(enabled: boolean): void {
    if (!this.playCardsButton || !this.playCardsButtonText) return;
    
    if (enabled) {
      this.playCardsButton.setTint(0xFFFFFF);
      this.playCardsButton.setInteractive({ useHandCursor: true });
      this.playCardsButtonText.setColor('#FFFFFF');
    } else {
      this.playCardsButton.setTint(0x888888);
      this.playCardsButton.disableInteractive();
      this.playCardsButtonText.setColor('#888888');
    }
  }
  
  /**
   * Update the resource display with current values
   */
  private updateResourceDisplay(): void {
    if (!this.acquiredText || !this.selectionText || !this.resourceService) return;
    
    const acquiredPower = this.resourceService.getPower();
    this.acquiredText.setText(`Acquired: ${acquiredPower}`);
    
    // Update the selection text
    this.updateSelectionText();
    
    // Update proceed button state based on level selection and resources
    this.updateProceedButtonState();
  }
  
  /**
   * Update the selection text to show total selected power value
   */
  private updateSelectionText(): void {
    if (this.selectionText) {
      this.selectionText.setText(`Selected: ${this.playerHandRenderer.getSelectedPowerValue()}`);
    }
  }
  
  /**
   * Handle Select All button click
   */
  private playSelectedCards(): void {
    // 1. Get all selected card IDs
    const selectedCardIds = this.playerHandRenderer.getSelectedCardIds();
        
    const selectedPowerValue = this.playerHandRenderer.getSelectedPowerValue();
    
    // 2. Add their invention value to ResourceService
    if (this.resourceService) {
      this.resourceService.addPower(selectedPowerValue);
    }
    
    // 3. Discard all selected cards using PlayerHandRenderer's method
    this.playerHandRenderer.discardCardsByUniqueIds(selectedCardIds);
    
    // 4. Deselect all cards
    this.playerHandRenderer.clearCardSelection();
    
    // 5. Update the acquired text
    this.updateResourceDisplay();
    
    // 6. Disable the play cards button since no cards are selected anymore
    this.setPlayCardsButtonState(false);
  }

  private selectAllCards(): void {
    // Select all cards in the player hand with at least 1 invention value
    // Get all cards from the player hand renderer
    const cards = this.playerHandRenderer['currentCards'];
    const idsToSelect: string[] = [];
    const idsToDeselect: string[] = [];
    
    // Determine which cards to select and deselect based on invention value
    cards.forEach(card => {
      if (card.getPowerValue() >= 1) {
        idsToSelect.push(card.unique_id);
      } else {
        idsToDeselect.push(card.unique_id);
      }
    });
    
    // Pass the IDs to the player hand renderer
    this.playerHandRenderer.selectAndDeselectCardsByIds(idsToSelect, idsToDeselect);   
  }
  
  private updateAcquiredText(): void {
    if (this.acquiredText) {
      const acquiredPower = this.resourceService ? this.resourceService.getPower() : 0;
      this.acquiredText.setText(`Acquired: ${acquiredPower}`);
    }
  }
  
  /**
   * Handle Proceed button click
   */
  private proceedWithAdventure(): void {
    if (!this.selectedLevel) return;

    const option = this.tavernService.getAdventureOption(this.selectedLevel);
    if (!option) throw new Error('No adventure option found');

    // 1. Play any selected cards
    this.playSelectedCards();
    
    // 2. Deduct the sticker cost from ResourceService
    if (this.resourceService) {
      this.resourceService.consumePower(this.resourceService.getPower());
    }

    // 3. Update the acquired text
    this.updateAcquiredText();
    
    // 4. Deselect the level
    this.deselectLevel();
  
    // Attempt the adventure
    const success = this.tavernService.attemptAdventure(option);
    // Process the adventure result
    this.tavernService.processAdventureResult(option, success);
  }
  
  /**
   * Show the tavern interface
   */
  public show(): void {
    this.visible = true;
    this.container.setVisible(true);
    
    // Update tavern open state in service
    this.tavernService.setTavernOpen(true);
    
    // Refresh the display
    this.renderAdventureLevelCards();
    this.updateResourceDisplay();
  }
  
  /**
   * Hide the tavern interface
   */
  public hide(): void {
    this.visible = false;
    this.container.setVisible(false);
    
    // Update tavern open state in service
    this.tavernService.setTavernOpen(false);
  }
  
  /**
   * Toggle tavern visibility
   */
  public toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * Handle ESC key press
   */
  private handleEscKey(): void {
    if (this.visible) {
      this.hide();
    }
  }

  /**
   * Update the tavern renderer (called every frame)
   */
  public update(): void {
    // Only update if visible
    if (!this.visible) {
      return;
    }
    
    // Update resource display
    this.updateResourceDisplay();
  }

  /**
   * Clean up resources when destroying this object
   */
  public destroy(): void {
    // Remove keyboard controls
    if (this.escKey) {
      this.escKey.removeListener('down', this.handleEscKey, this);
      this.escKey.destroy();
      this.escKey = null;
    }
    
    // Remove event listeners
    this.playerHandRenderer.off(
      PlayerHandRendererEvents.SELECTION_CHANGED,
      this.onCardSelectionChanged,
      this
    );
    
    this.container.destroy();
  }

  /**
   * Update the proceed button state based on current selection and resources
   */
  private updateProceedButtonState(): void {
    if (!this.selectedLevel) {
      this.setProceedButtonState(false);
      return;
    }
    
    // For now, just enable if level is selected
    // In the future, check if we have enough power for the adventure
    this.setProceedButtonState(true);
  }
  
  /**
   * Render the adventure level cards
   */
  private renderAdventureLevelCards(): void {
    // Clear existing level cards
    this.levelCards.forEach(card => card.destroy());
    this.levelCards.clear();
    
    // Get available adventure levels
    const levels = this.tavernService.getAvailableAdventureLevels();
    
    // Render each level card
    levels.forEach((level, index) => {
      const row = Math.floor(index / this.levelsPerRow);
      const col = index % this.levelsPerRow;
      
      const cardX = (col + 0.5) * (this.levelCardWidth + this.levelCardSpacing) + 40;
      const cardY = (row + 0.5) * (this.levelCardHeight + this.levelCardSpacing) + 80;
      
      const card = this.createLevelCard(level, cardX, cardY);
      this.levelCards.set(level, card);
      this.container.add(card);
    });
  }

    /**
   * Deselect the currently selected sticker
   */
    private deselectLevel(): void {
      // Deselect the level
      this.selectedLevel = null;
      
      // Disable the proceed button
      this.setProceedButtonState(false);
      
      // Update selection text
      if (this.selectionText) {
        this.selectionText.setText('Selected: 0');
      }
    }
  
  /**
   * Create a visual representation of an adventure level card
   */
  private createLevelCard(
    level: AdventureLevel,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Card background using nineslice
    const background = this.scene.add['nineslice'](
      0, 0,
      'panel_wood_corners_metal',
      undefined,
      this.levelCardWidth, 
      this.levelCardHeight,
      10, 10, 10, 10
    );
    background.setOrigin(0.5, 0.5);
    
    // Set background interactive
    background.setInteractive({ useHandCursor: true });
    background.on('pointerdown', () => {
      this.onLevelCardClicked(level);
    });
    
    // Determine level image and name based on adventure level
    let imageName = 'panel_wood';
    let levelName = '';
    
    switch (level) {
      case AdventureLevel.RECRUITMENT:
        imageName = 'panel_wood';
        levelName = 'Recruitment';
        break;
      case AdventureLevel.IN_TOWN:
        imageName = 'panel_brick';
        levelName = 'In Town';
        break;
      case AdventureLevel.OUTSIDE_TOWN:
        imageName = 'panel_metal';
        levelName = 'Outside Town';
        break;
      case AdventureLevel.IN_FAR_LANDS:
        imageName = 'panel_stone';
        levelName = 'Far Lands';
        break;
    }
    
    // Level image
    const image = this.scene.add.image(0, -30, imageName);
    image.setDisplaySize(this.levelCardWidth - 20, 100);
    
    // Level name
    const name = this.scene.add.text(0, -80, levelName, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#000000',
      align: 'center'
    });
    name.setOrigin(0.5, 0.5);

    
    // Selection highlight (initially invisible)
    const highlight = this.scene.add.image(0, 0, 'panel_metal_glow');
    highlight.setDisplaySize(this.levelCardWidth + 10, this.levelCardHeight + 10);
    highlight.setVisible(false);
    highlight.setTint(0x00ff00);
    highlight.setAlpha(0.3);
    
    // Add all elements to the container
    container.add([highlight, background, image, name]);
    
    // Store highlight for later reference
    container.setData('highlight', highlight);
    
    // If this is the currently selected level, show the highlight
    if (this.selectedLevel === level) {
      highlight.setVisible(true);
    }
    
    return container;
  }
  
  /**
   * Handle level card click
   */
  private onLevelCardClicked(level: AdventureLevel): void {
    // If this level is already selected, deselect it
    if (this.selectedLevel === level) {
      this.selectedLevel = null;
      
      // Hide the highlight on the card
      const card = this.levelCards.get(level);
      if (card) {
        const highlight = card.getData('highlight') as Phaser.GameObjects.Image;
        highlight.setVisible(false);
      }
    } else {
      // Deselect previous level if any
      if (this.selectedLevel !== null) {
        const previousCard = this.levelCards.get(this.selectedLevel);
        if (previousCard) {
          const highlight = previousCard.getData('highlight') as Phaser.GameObjects.Image;
          highlight.setVisible(false);
        }
      }
      
      // Select new level
      this.selectedLevel = level;
      
      // Show highlight on the new card
      const card = this.levelCards.get(level);
      if (card) {
        const highlight = card.getData('highlight') as Phaser.GameObjects.Image;
        highlight.setVisible(true);
      }
    }
    
    // Update proceed button state
    this.updateProceedButtonState();
  }

  /**
   * Handler for card selection changes
   */
  private onCardSelectionChanged(): void {
    this.updateSelectionText();

    // Check if any cards are selected and update play cards button state
    const hasSelectedCards = this.playerHandRenderer.getSelectedCardIds().length > 0;
    this.setPlayCardsButtonState(hasSelectedCards);
  }
} 