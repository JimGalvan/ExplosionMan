import Phaser from 'phaser';
import { Bomb } from '../entities/bomb';
import { Explosion } from '../entities/explosion';

export class ExplosionManager {
  private scene: Phaser.Scene;
  private config: any;
  private explosions: Explosion[] = [];

  constructor(scene: Phaser.Scene, config: any) {
    this.scene = scene;
    this.config = config;
  }

  public createExplosions(
    bomb: Bomb,
    walls: Phaser.Physics.Arcade.StaticGroup,
    blocks: Phaser.Physics.Arcade.StaticGroup,
    explosionsGroup: Phaser.Physics.Arcade.StaticGroup
  ): void {
    const bombPos = bomb.getPosition();
    let canExplodeRight = true;
    let canExplodeLeft = true;
    let canExplodeUp = true;
    let canExplodeDown = true;
    
    const explosionPos = (i: number) => (this.config.GAME_CONFIG.gridSize / 1.5) * i;

    for (let i = 1; i <= this.config.GAME_CONFIG.explosionRange; i++) {
      // Create center explosion
      if (i === 1) {
        this.createExplosion(bombPos.x, bombPos.y, walls, blocks, explosionsGroup);
      }

      // Create horizontal explosions
      if (canExplodeRight) {
        const xPos = bombPos.x + explosionPos(i);
        const created = this.createExplosion(xPos, bombPos.y, walls, blocks, explosionsGroup);
        if (!created) canExplodeRight = false;
      }

      if (canExplodeLeft) {
        const xPos = bombPos.x - explosionPos(i);
        const created = this.createExplosion(xPos, bombPos.y, walls, blocks, explosionsGroup);
        if (!created) canExplodeLeft = false;
      }

      // Create vertical explosions
      if (canExplodeDown) {
        const yPos = bombPos.y + explosionPos(i);
        const created = this.createExplosion(bombPos.x, yPos, walls, blocks, explosionsGroup);
        if (!created) canExplodeDown = false;
      }

      if (canExplodeUp) {
        const yPos = bombPos.y - explosionPos(i);
        const created = this.createExplosion(bombPos.x, yPos, walls, blocks, explosionsGroup);
        if (!created) canExplodeUp = false;
      }
    }
  }

  private createExplosion(
    x: number,
    y: number,
    walls: Phaser.Physics.Arcade.StaticGroup,
    blocks: Phaser.Physics.Arcade.StaticGroup,
    explosionsGroup: Phaser.Physics.Arcade.StaticGroup
  ): boolean {
    // Check if explosion position collides with wall
    if (Explosion.checkWallCollision(x, y, walls)) {
      return false;
    }

    const explosion = new Explosion(this.scene, x, y, this.config);
    explosionsGroup.add(explosion.getSprite());
    this.explosions.push(explosion);

    // Handle block destruction
    const destroyedAnyBlock = Explosion.destroyBlocks(explosion, blocks);

    // Remove explosion from tracking when it's destroyed
    this.scene.time.delayedCall(this.config.TIMINGS.explosionDuration, () => {
      const index = this.explosions.indexOf(explosion);
      if (index > -1) {
        this.explosions.splice(index, 1);
      }
    });

    return !destroyedAnyBlock;
  }

  public getExplosions(): Explosion[] {
    return this.explosions;
  }

  public destroy(): void {
    this.explosions.forEach(explosion => explosion.destroy());
    this.explosions = [];
  }
}