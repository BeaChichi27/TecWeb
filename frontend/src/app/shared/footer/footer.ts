import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {
  currentYear: number = new Date().getFullYear();
  
  constructor() {
    // Easter egg nascosto - visibile solo nella console del browser
    console.log("ABBASSO GLOVO");
  }
}