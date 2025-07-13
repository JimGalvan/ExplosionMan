import {Component} from '@angular/core';
import Phaser, {Game} from 'phaser';
import {GameScene} from '../../game/game-scene'

@Component({
  selector: 'home-page',
  templateUrl: 'homepage.component.html',
  styles: `
    /*#game-container {*/
    /*  !*width: 100%;*!*/
    /*  !*height: 100%;*!*/
    /*  !*display: flex;*!*/
    /*  !*justify-content: center;*!*/
    /*  !*align-items: center;*!*/
    /*  !*overflow: auto;*!*/
    /*}*/

    /*!*canvas {*!*/
    /*!*  display: block;*!*/
    /*!*}*!*/
  `
})
export class HomePageComponent {

  walls: any = [];
  game!: Game;
  width!: number;
  height!: number;
  bombs: any = []


  constructor() {
    this.width = document.getElementById('game-container')?.clientWidth ?? 800;
    this.height = document.getElementById('game-container')?.clientHeight ?? 600;
  }

  ngAfterViewInit(): void {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          debug: true
        }
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: new GameScene(this),
      parent: 'game-container'
    };

    this.game = new Phaser.Game(config);
  }

}
