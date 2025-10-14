import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container">
      <div class="spinner"></div>
      <p>Caricamento in corso...</p>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(0, 123, 255, 0.1);
      border-radius: 50%;
      border-top-color: #007bff;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    p {
      color: #666;
      font-size: 1.1rem;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class LoadingSpinnerComponent {}