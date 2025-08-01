import Phaser from 'phaser';

export class MobileButtonManager {
  private scene: Phaser.Scene;
  private mobileInput: any;
  
  // Button references
  private upButton!: Phaser.GameObjects.Image;
  private downButton!: Phaser.GameObjects.Image;
  private leftButton!: Phaser.GameObjects.Image;
  private rightButton!: Phaser.GameObjects.Image;
  private bombButton!: Phaser.GameObjects.Image;
  
  // Scale configuration
  private buttonScale: number = 0.16;

  constructor(scene: Phaser.Scene, mobileInput: any) {
    this.scene = scene;
    this.mobileInput = mobileInput;
  }

  createMobileButtons() {
    const {width, height} = this.scene.scale;
    const buttonSize = this.buttonScale;

    // Responsive button positioning
    const isLandscape = width > height;
    const margin = isLandscape ? 60 : 80;
    const buttonSpacing = isLandscape ? 100 : 120;

    // Create movement buttons (left side)
    // Up button
    this.upButton = this.scene.add.image(margin + buttonSpacing, height - margin - buttonSpacing * 2, 'up_button')
      .setScale(buttonSize)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.7);

    // Down button
    this.downButton = this.scene.add.image(margin + buttonSpacing, height - margin - 20, 'down_button')
      .setScale(buttonSize)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.7);

    // Left button
    this.leftButton = this.scene.add.image(margin, height - margin - buttonSpacing, 'left_button')
      .setScale(buttonSize)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.7);

    // Right button
    this.rightButton = this.scene.add.image(margin + buttonSpacing * 2, height - margin - buttonSpacing, 'right_button')
      .setScale(buttonSize)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.7);

    // Bomb button (right side) - adjusted for landscape
    const bombButtonX = width - margin - (isLandscape ? 40 : 60);
    this.bombButton = this.scene.add.image(bombButtonX, height - margin - buttonSpacing, 'place_bomb_button')
      .setScale(buttonSize)
      .setInteractive()
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.7);

    // Add button event listeners
    this.setupButtonEvents();
  }

  updateButtonPositions() {
    if (!this.upButton) return; // Exit if buttons haven't been created yet

    const {width, height} = this.scene.scale;
    const isLandscape = width > height;
    const margin = isLandscape ? 60 : 80;
    const buttonSpacing = isLandscape ? 100 : 120;

    // Update movement buttons positions
    this.upButton.setPosition(margin + buttonSpacing, height - margin - buttonSpacing * 2);
    this.downButton.setPosition(margin + buttonSpacing, height - margin - 20);
    this.leftButton.setPosition(margin, height - margin - buttonSpacing);
    this.rightButton.setPosition(margin + buttonSpacing * 2, height - margin - buttonSpacing);

    // Update bomb button position
    const bombButtonX = width - margin - (isLandscape ? 40 : 60);
    this.bombButton.setPosition(bombButtonX, height - margin - buttonSpacing);
  }

  private setupButtonEvents() {
    // Movement buttons
    this.upButton.on('pointerdown', () => {
      this.mobileInput.up = true;
      this.upButton.setTint(0xcccccc).setAlpha(0.9);
    });
    this.upButton.on('pointerup', () => {
      this.mobileInput.up = false;
      this.upButton.clearTint().setAlpha(0.7);
    });
    this.upButton.on('pointerout', () => {
      this.mobileInput.up = false;
      this.upButton.clearTint().setAlpha(0.7);
    });

    this.downButton.on('pointerdown', () => {
      this.mobileInput.down = true;
      this.downButton.setTint(0xcccccc).setAlpha(0.9);
    });
    this.downButton.on('pointerup', () => {
      this.mobileInput.down = false;
      this.downButton.clearTint().setAlpha(0.7);
    });
    this.downButton.on('pointerout', () => {
      this.mobileInput.down = false;
      this.downButton.clearTint().setAlpha(0.7);
    });

    this.leftButton.on('pointerdown', () => {
      this.mobileInput.left = true;
      this.leftButton.setTint(0xcccccc).setAlpha(0.9);
    });
    this.leftButton.on('pointerup', () => {
      this.mobileInput.left = false;
      this.leftButton.clearTint().setAlpha(0.7);
    });
    this.leftButton.on('pointerout', () => {
      this.mobileInput.left = false;
      this.leftButton.clearTint().setAlpha(0.7);
    });

    this.rightButton.on('pointerdown', () => {
      this.mobileInput.right = true;
      this.rightButton.setTint(0xcccccc).setAlpha(0.9);
    });
    this.rightButton.on('pointerup', () => {
      this.mobileInput.right = false;
      this.rightButton.clearTint().setAlpha(0.7);
    });
    this.rightButton.on('pointerout', () => {
      this.mobileInput.right = false;
      this.rightButton.clearTint().setAlpha(0.7);
    });

    // Bomb button
    this.bombButton.on('pointerdown', () => {
      this.mobileInput.bomb = true;
      this.bombButton.setTint(0xcccccc).setAlpha(0.9);
    });
    this.bombButton.on('pointerup', () => {
      this.mobileInput.bomb = false;
      this.bombButton.clearTint().setAlpha(0.7);
    });
    this.bombButton.on('pointerout', () => {
      this.mobileInput.bomb = false;
      this.bombButton.clearTint().setAlpha(0.7);
    });
  }
} 