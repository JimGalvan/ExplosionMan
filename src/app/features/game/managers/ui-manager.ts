import Phaser from 'phaser';

export class UIManager {
  private scene: Phaser.Scene;
  private restartUI: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public showGameOverDialog(onRestart: () => void): void {
    // Clear any existing UI
    this.clearUI();

    // Dialog background box
    const dialog = this.scene.add.rectangle(
      0,
      this.scene.cameras.main.y,
      300,
      200,
      0xffffff,
      1
    );
    dialog.setStrokeStyle(2, 0x000000);

    // Game Over text
    const text = this.scene.add.text(
      0,
      0,
      'Game Over',
      { fontSize: '32px', color: '#000' }
    ).setOrigin(0.5);

    // Restart button
    const restartBtn = this.scene.add.text(
      0,
      40,
      'Restart',
      {
        fontSize: '24px',
        backgroundColor: '#000',
        color: '#fff',
        padding: { x: 20, y: 10 },
      }
    )
      .setOrigin(0.5)
      .setInteractive();

    restartBtn.on('pointerdown', () => {
      onRestart();
    });

    // Store UI elements for cleanup
    this.restartUI = [dialog, text, restartBtn];
  }

  public clearUI(): void {
    this.restartUI.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.restartUI = [];
  }

  public destroy(): void {
    this.clearUI();
  }
}