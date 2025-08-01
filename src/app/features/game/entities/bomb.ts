import Phaser from 'phaser';

export class Bomb {
  public sprite!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  private scene: Phaser.Scene;
  private config: any;
  private onExplode: (bomb: Bomb) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, config: any, onExplode: (bomb: Bomb) => void) {
    this.scene = scene;
    this.config = config;
    this.onExplode = onExplode;
    this.create(x, y);
    this.startTimer();
  }

  private create(x: number, y: number): void {
    this.sprite = this.scene.physics.add.staticSprite(x, y, 'bomb');
    this.sprite.setScale(this.config.SCALES.bomb);
    this.sprite.refreshBody();
  }

  private startTimer(): void {
    this.scene.time.delayedCall(this.config.TIMINGS.bombExplosionDelay, () => {
      this.onExplode(this);
    });
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  public destroy(): void {
    this.sprite.destroy();
  }

  public getSprite(): Phaser.Types.Physics.Arcade.SpriteWithStaticBody {
    return this.sprite;
  }

  public static checkOverlap(playerPos: { x: number; y: number }, bombs: Bomb[], overlapDistance: number): Bomb | null {
    return bombs.find(bomb => {
      const distance = Phaser.Math.Distance.Between(
        playerPos.x, playerPos.y,
        bomb.sprite.x, bomb.sprite.y
      );
      return distance < overlapDistance;
    }) || null;
  }
}