import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// centered card with no header, for pages used before logging in
@Component({
  imports: [RouterOutlet],
  selector: 'app-auth-layout',
  styleUrl: './auth-layout.scss',
  templateUrl: './auth-layout.html',
})
export class AuthLayout {}
