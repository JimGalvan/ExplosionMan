import Phaser from 'phaser';
import { GameUtils } from '../../../game-utils';

export class Enemy {
  public sprite!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private scene: Phaser.Scene;
  private config: any;

  constructor(scene: Phaser.Scene, x: number, y: number, config: any) {
    this.scene = scene;
    this.config = config;
    this.create(x, y);
  }

  private create(x: number, y: number): void {
    this.sprite = this.scene.physics.add.sprite(x, y, 'enemy');
    this.sprite.setVelocityX(100);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.onWorldBounds = true;
    this.sprite.setScale(this.config.SCALES.enemy);
    this.sprite.refreshBody();
  }

  public handleWallCollision(wall: any): void {
    const enemyBounds = this.sprite.getBounds();
    const wallBounds = wall.getBounds();

    const isCollisionOnLeft = this.isCollisionOnSide(enemyBounds, wallBounds, 'left');
    const isCollisionOnRight = this.isCollisionOnSide(enemyBounds, wallBounds, 'right');

    if (isCollisionOnLeft) {
      this.sprite.setVelocityX(100);
    } else if (isCollisionOnRight) {
      this.sprite.setVelocityX(-100);
    }
  }

  private isCollisionOnSide(enemyBounds: Phaser.Geom.Rectangle, wallBounds: Phaser.Geom.Rectangle, side: 'left' | 'right'): boolean {
    if (side === 'left') {
      return GameUtils.rangesOverlap(enemyBounds.top, enemyBounds.bottom, wallBounds.right, wallBounds.bottom);
    } else {
      return GameUtils.rangesOverlap(enemyBounds.top, enemyBounds.bottom, wallBounds.left, wallBounds.bottom);
    }
  }

  public getSprite(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    return this.sprite;
  }
}