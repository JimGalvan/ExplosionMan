import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HomePageComponent} from './features/home/pages/homepage.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HomePageComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Maze');
}
