import Phaser from 'phaser';
import { GameUI } from './GameUI';

interface InfoTarget {
  image?: string;
  name?: string;
  description?: string;
}

export class InfoPanelRenderer {
  private scene: Phaser.Scene;
  private displayContainer: Phaser.GameObjects.Container;
  private infoPanel!: Phaser.GameObjects.NineSlice;
  private image!: Phaser.GameObjects.Image;
  private nameText!: Phaser.GameObjects.Text;
  private descriptionText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private isVisible: boolean = true;

  private panelWidth: number;
  private panelHeight: number;
  private panelX: number;
  private panelY: number;
  
  private descriptionBackground!: Phaser.GameObjects.Rectangle;
  private nameBackground!: Phaser.GameObjects.Rectangle;
  private descriptionHeightPercent: number = 0.15;
  private nameHeightPercent: number = 0.1;


  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = this.scene.cameras.main;
    this.panelWidth = width * GameUI.INFO_PANEL_WIDTH_PROPORTION;
    this.panelHeight = height * (1 - GameUI.INVASION_PANEL_HEIGHT_PROPORTION - GameUI.PLAYER_HAND_PANEL_HEIGHT_PROPORTION);
    this.panelX = width - this.panelWidth;
    this.panelY = height * GameUI.INVASION_PANEL_HEIGHT_PROPORTION;
    this.displayContainer = this.scene.add.container(this.panelX, this.panelY);
    this.createInfoPanel();
  }

  private createInfoPanel(): void {
    const margin = 20;

    // Create panel in the top-right corner
    this.infoPanel = this.scene.add['nineslice'](
      0,
      0,
      'panel_metal_corners_metal_nice',
      undefined,
      this.panelWidth,
      this.panelHeight,
      20,
      20,
      20,
      20
    );
    this.infoPanel.setOrigin(0, 0);
    this.infoPanel.setTint(0x666666);

    // Create title text
    this.titleText = this.scene.add.text(
      this.panelWidth/2,
      this.panelHeight/2,
      'Info',
      {
        fontSize: '32px',
        color: '#ffffff',
        align: 'center'
      }
    );
    this.titleText.setOrigin(0.5, 0.5);

    // Create image container
    this.image = this.scene.add.image(
      this.panelWidth/2,
      this.panelHeight/2,
      'placeholder'
    );
    this.image.setOrigin(0.5, 0.5);
    this.image.setVisible(false);

    // Create name background
    const descriptionHeight = this.panelHeight * this.descriptionHeightPercent;
    const nameHeight = this.panelHeight * this.nameHeightPercent;
    this.nameBackground = this.scene.add.rectangle(
      this.panelWidth/2,
      this.panelHeight - descriptionHeight - nameHeight/2,
      this.panelWidth - 15,
      nameHeight,
      0x000000,
      0.8
    );
    this.nameBackground.setOrigin(0.5, 0.5);
    this.nameBackground.setVisible(false);

    // Create name text
    this.nameText = this.scene.add.text(
      this.panelWidth/2,
      this.panelHeight - descriptionHeight - nameHeight/2,
      '',
      {
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: this.panelWidth - 40 }
      }
    );
    this.nameText.setOrigin(0.5, 0.5);
    this.nameText.setVisible(false);

    // Create description background
    this.descriptionBackground = this.scene.add.rectangle(
      this.panelWidth/2,
      this.panelHeight - descriptionHeight/2,
      this.panelWidth - 15,
      descriptionHeight,
      0x000000,
      0.8
    );
    this.descriptionBackground.setOrigin(0.5, 0.5);
    this.descriptionBackground.setVisible(false);

    // Create description text
    this.descriptionText = this.scene.add.text(
      this.panelWidth/2,
      this.panelHeight - descriptionHeight/2,
      '',
      {
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: this.panelWidth - 40 }
      }
    );
    this.descriptionText.setOrigin(0.5, 0.5);
    this.descriptionText.setVisible(false);

    // Add all elements to container
    this.displayContainer.add([
      this.infoPanel,
      this.titleText,
      this.image,
      this.nameBackground,
      this.nameText,
      this.descriptionBackground,
      this.descriptionText
    ]);
  }

  public infoTargetSelected(target: InfoTarget): void {
    if (target.image) {
      this.image.setTexture(target.image);
      this.image.setDisplaySize(this.panelWidth - 15, this.panelHeight - 15);
      this.image.setVisible(true);
    } else {
      this.image.setVisible(false);
    }

    if (target.name) {
      this.nameText.setText(target.name);
      this.nameText.setVisible(true);
      this.nameBackground.setVisible(true);
    } else {
      this.nameText.setVisible(false);
      this.nameBackground.setVisible(false);
    }

    if (target.description) {
      this.descriptionText.setText(target.description);
      this.descriptionText.setVisible(true);
      this.descriptionBackground.setVisible(true);
    } else {
      this.descriptionText.setVisible(false);
      this.descriptionBackground.setVisible(false);
    }
  }

  public infoTargetDeselected(): void {
    this.image.setVisible(false);
    this.nameText.setVisible(false);
    this.nameBackground.setVisible(false);
    this.descriptionText.setVisible(false);
    this.descriptionBackground.setVisible(false);
  }

  public destroy(): void {
    const safeDestroy = (obj: any) => {
      if (obj && typeof obj.destroy === 'function') {
        obj.destroy();
      }
    };

    safeDestroy(this.infoPanel);
    safeDestroy(this.titleText);
    safeDestroy(this.image);
    safeDestroy(this.nameText);
    safeDestroy(this.nameBackground);
    safeDestroy(this.descriptionText);
    safeDestroy(this.descriptionBackground);
    safeDestroy(this.displayContainer);
  }
} 