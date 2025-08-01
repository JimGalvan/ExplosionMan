import Phaser from 'phaser';

export class Player {
  public sprite!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private scene: Phaser.Scene;
  private config: any;
  
  constructor(scene: Phaser.Scene, x: number, y: number, config: any) {
    this.scene = scene;
    this.config = config;
    this.create(x, y);
  }

  private create(x: number, y: number): void {
    this.sprite = this.scene.physics.add.sprite(x, y, 'player');
    this.sprite.setScale(this.config.SCALES.player);
    this.sprite.refreshBody();
    this.sprite.setCollideWorldBounds(true);
  }

  public update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, mobileInput: any): void {
    const speed = this.config.GAME_CONFIG.playerSpeed;
    const body = this.sprite.body;

    if (!body) return;
    
    body.setVelocity(0);

    if (cursors.left?.isDown || mobileInput.left) {
      body.setVelocityX(-speed);
    } else if (cursors.right?.isDown || mobileInput.right) {
      body.setVelocityX(speed);
    }

    if (cursors.up?.isDown || mobileInput.up) {
      body.setVelocityY(-speed);
    } else if (cursors.down?.isDown || mobileInput.down) {
      body.setVelocityY(speed);
    }

    // Normalize diagonal movement
    body.velocity.normalize().scale(speed);
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public destroy(): void {
    this.sprite.destroy();
  }

  public getSprite(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    return this.sprite;
  }
}