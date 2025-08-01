import Phaser from 'phaser';

export class Explosion {
  public sprite!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  private scene: Phaser.Scene;
  private config: any;

  constructor(scene: Phaser.Scene, x: number, y: number, config: any) {
    this.scene = scene;
    this.config = config;
    this.create(x, y);
    this.startTimer();
  }

  private create(x: number, y: number): void {
    this.sprite = this.scene.physics.add.staticSprite(x, y, 'explosion');
    this.sprite.setScale(this.config.SCALES.explosion);
    this.sprite.refreshBody();
  }

  private startTimer(): void {
    this.scene.time.delayedCall(this.config.TIMINGS.explosionDuration, () => {
      this.destroy();
    });
  }

  public destroy(): void {
    this.sprite.destroy();
  }

  public getSprite(): Phaser.Types.Physics.Arcade.SpriteWithStaticBody {
    return this.sprite;
  }

  public static checkWallCollision(x: number, y: number, walls: Phaser.Physics.Arcade.StaticGroup): boolean {
    return !!walls.getChildren().find(obj => {
      const wall = obj as Phaser.GameObjects.Sprite;
      return wall.getBounds().contains(x, y);
    });
  }

  public static destroyBlocks(explosion: Explosion, blocks: Phaser.Physics.Arcade.StaticGroup): boolean {
    let destroyedAnyBlock = false;
    blocks.getChildren().forEach(obj => {
      const block = obj as Phaser.GameObjects.Sprite;
      const isExplosionTouchingBlock = block.getBounds().contains(explosion.sprite.x, explosion.sprite.y);
      if (isExplosionTouchingBlock) {
        block.destroy();
        destroyedAnyBlock = true;
      }
    });
    return destroyedAnyBlock;
  }
}