import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, of, switchMap, Subscription } from 'rxjs';
import { Restaurant, CreateRestaurantDto, UpdateRestaurantDto } from '../../../models/restaurant.model';
import { RestaurantService } from '../../../services/restaurant.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading';
// Import Leaflet
import * as L from 'leaflet';

@Component({
  selector: 'app-rest-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './rest-form.component.html',
  styleUrls: ['./rest-form.component.scss']
})
export class RestFormComponent implements OnInit, OnDestroy, AfterViewInit {
  /* 
   * Form e stato
   */
  restaurantForm!: FormGroup;
  isEditMode = false;
  restaurantId?: number;
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  /* 
   * Gestione immagine
   */
  imagePreview: string | null = null;
  selectedFile: File | undefined;
  imageError = '';
  maxFileSize = 5 * 1024 * 1024; // 5MB
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  private map?: L.Map;
  private marker?: L.Marker;
  private mapInitialized = false;
  
  /* 
   * Sottoscrizioni
   */
  private routeSubscription?: Subscription;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private restaurantService: RestaurantService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    /* 
     * Creo il form con le validazioni
     */
    this.createForm();
    
    /* 
     * Verifico se siamo in modalità modifica leggendo l'ID dalla URL.
     */
    this.routeSubscription = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        
        if (id) {
          this.isEditMode = true;
          this.restaurantId = +id;
          this.loading = true;
          this.errorMessage = '';
          
          return this.restaurantService.getRestaurantById(+id).pipe(
            catchError(error => {
              console.error('Errore caricamento ristorante:', error);
              this.errorMessage = 'Errore nel caricamento del ristorante.';
              this.loading = false;
              return of(null);
            })
          );
        }
        
        return of(null);
      })
    ).subscribe(restaurant => {
      if (restaurant) {
        this.populateForm(restaurant);
        
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser || currentUser.id !== restaurant.ownerId) {
          this.errorMessage = '⚠️ Non sei autorizzato a modificare questo ristorante.';
          this.restaurantForm.disable();
        }
      }
      
      this.loading = false;
    });
  }
  
  ngAfterViewInit(): void {
    /* 
     * Inizializzo la mappa dopo che la view è stata caricata
     * Decommentare quando Leaflet è installato
     */
    setTimeout(() => {
      // this.initializeMap();
    }, 100);
  }
  
  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    
    /* 
     * Distruggo la mappa per evitare memory leak
     * Decommentare quando Leaflet è installato
     */
    // if (this.map) {
    //   this.map.remove();
    // }
  }
  
  /* 
   * Inizializza la mappa Leaflet
   * DECOMMENTARE QUANDO LEAFLET È INSTALLATO
   */
  /*
  private initializeMap(): void {
    if (this.mapInitialized) return;
    
    try {
      // Centro mappa sull'Italia
      const defaultLat = 41.9028;
      const defaultLng = 12.4964;
      
      // Crea la mappa
      this.map = L.map('restaurant-map').setView([defaultLat, defaultLng], 6);
      
      // Aggiungi il layer OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.map);
      
      // Gestisci il click sulla mappa
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.onMapClick(e.latlng.lat, e.latlng.lng);
      });
      
      // Se ci sono già coordinate nel form, mostra il marker
      const lat = this.latControl?.value;
      const lng = this.lngControl?.value;
      
      if (lat !== 0 && lng !== 0) {
        this.addMarker(lat, lng);
        this.map.setView([lat, lng], 13);
      }
      
      this.mapInitialized = true;
    } catch (error) {
      console.error('Errore inizializzazione mappa:', error);
    }
  }
  */
  
  /* 
   * Gestisce il click sulla mappa
   * DECOMMENTARE QUANDO LEAFLET È INSTALLATO
   */
  /*
  private onMapClick(lat: number, lng: number): void {
    // Aggiorna il marker
    this.addMarker(lat, lng);
    
    // Aggiorna le coordinate nel form
    this.restaurantForm.patchValue({
      location: {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6))
      }
    });
    
    this.successMessage = '📍 Posizione selezionata sulla mappa';
    setTimeout(() => {
      this.successMessage = '';
    }, 2000);
  }
  */
  
  /* 
   * Aggiunge o aggiorna il marker sulla mappa
   * DECOMMENTARE QUANDO LEAFLET È INSTALLATO
   */
  /*
  private addMarker(lat: number, lng: number): void {
    if (!this.map) return;
    
    // Rimuovi il marker precedente se esiste
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }
    
    // Aggiungi nuovo marker
    this.marker = L.marker([lat, lng], {
      draggable: true
    }).addTo(this.map);
    
    // Gestisci il drag del marker
    this.marker.on('dragend', (e: L.DragEndEvent) => {
      const position = e.target.getLatLng();
      this.onMapClick(position.lat, position.lng);
    });
    
    // Centra la mappa sul marker
    this.map.setView([lat, lng], 13);
  }
  */
  
  private createForm(): void {
    this.restaurantForm = this.fb.group({
      name: [
        '', 
        [
          Validators.required, 
          Validators.minLength(3), 
          Validators.maxLength(100)
        ]
      ],
      description: [
        '', 
        [
          Validators.required, 
          Validators.minLength(20), 
          Validators.maxLength(1000)
        ]
      ],
      location: this.fb.group({
        address: ['', [Validators.required, Validators.minLength(5)]],
        lat: [41.9028, [Validators.required, Validators.min(-90), Validators.max(90)]],
        lng: [12.4964, [Validators.required, Validators.min(-180), Validators.max(180)]]
      })
    });
  }
  
  private populateForm(restaurant: Restaurant): void {
    this.restaurantForm.patchValue({
      name: restaurant.name,
      description: restaurant.description,
      location: {
        address: restaurant.location.address || '',
        lat: restaurant.location.lat,
        lng: restaurant.location.lng
      }
    });
    
    if (restaurant.imageUrl) {
      this.imagePreview = restaurant.imageUrl;
    }
    
    /* 
     * Se la mappa è già inizializzata, aggiorna il marker
     * DECOMMENTARE QUANDO LEAFLET È INSTALLATO
     */
    // if (this.mapInitialized && restaurant.location.lat && restaurant.location.lng) {
    //   this.addMarker(restaurant.location.lat, restaurant.location.lng);
    // }
  }
  
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imageError = '';
    
    if (!input.files || !input.files.length) {
      return;
    }
    
    const file = input.files[0];
    
    if (!this.allowedTypes.includes(file.type)) {
      this.imageError = '⚠️ Formato non valido. Usa JPG, PNG o WEBP.';
      this.removeImage();
      return;
    }
    
    if (file.size > this.maxFileSize) {
      this.imageError = `⚠️ File troppo grande. Massimo ${this.maxFileSize / (1024 * 1024)}MB.`;
      this.removeImage();
      return;
    }
    
    this.selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.onerror = () => {
      this.imageError = '⚠️ Errore nella lettura del file.';
      this.removeImage();
    };
    reader.readAsDataURL(file);
  }
  
  removeImage(): void {
    this.selectedFile = undefined;
    this.imagePreview = null;
    this.imageError = '';
    
    const fileInput = document.getElementById('restaurant-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  updateCoordinates(): void {
    const address = this.restaurantForm.get('location.address')?.value;
    
    if (!address || address.length < 5) {
      return;
    }
    
    /* 
     * Simulazione geocoding - in produzione usare API reale
     * Oppure far cliccare l'utente sulla mappa Leaflet
     */
    const lat = 41.9 + Math.random() * 3; // Italia centro-nord
    const lng = 12.5 + Math.random() * 3;
    
    const finalLat = parseFloat(lat.toFixed(6));
    const finalLng = parseFloat(lng.toFixed(6));
    
    this.restaurantForm.patchValue({
      location: {
        lat: finalLat,
        lng: finalLng
      }
    });
    
    /* 
     * Aggiorna il marker sulla mappa
     * DECOMMENTARE QUANDO LEAFLET È INSTALLATO
     */
    // if (this.mapInitialized) {
    //   this.addMarker(finalLat, finalLng);
    // }
    
    this.successMessage = '📍 Coordinate aggiornate';
    setTimeout(() => {
      this.successMessage = '';
    }, 2000);
  }
  
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (this.restaurantForm.invalid) {
      this.markFormGroupTouched(this.restaurantForm);
      this.errorMessage = '⚠️ Compila tutti i campi obbligatori correttamente.';
      return;
    }
    
    if (!this.isEditMode && !this.selectedFile) {
      this.imageError = '⚠️ Seleziona un\'immagine per il ristorante.';
      return;
    }
    
    this.loading = true;
    const formValue = this.restaurantForm.value;
    
    if (this.isEditMode && this.restaurantId) {
      const updateData: UpdateRestaurantDto = {
        name: formValue.name,
        description: formValue.description,
        location: formValue.location
      };
      
      if (this.selectedFile) {
        updateData.image = this.selectedFile;
      }
      
      this.restaurantService.updateRestaurant(this.restaurantId, updateData).subscribe({
        next: (restaurant) => {
          this.loading = false;
          this.router.navigate(['/restaurants', restaurant.id], {
            queryParams: { updated: 'true' }
          });
        },
        error: (error) => {
          this.errorMessage = `Errore nell'aggiornamento: ${error}`;
          this.loading = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    } else {
      const createData: CreateRestaurantDto = {
        name: formValue.name,
        description: formValue.description,
        location: formValue.location,
        image: this.selectedFile
      };
      
      this.restaurantService.createRestaurant(createData).subscribe({
        next: (restaurant) => {
          this.loading = false;
          this.router.navigate(['/restaurants', restaurant.id], {
            queryParams: { created: 'true' }
          });
        },
        error: (error) => {
          this.errorMessage = `Errore nella creazione: ${error}`;
          this.loading = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  cancel(): void {
    if (this.isEditMode && this.restaurantId) {
      this.router.navigate(['/restaurants', this.restaurantId]);
    } else {
      this.router.navigate(['/restaurants']);
    }
  }
  
  resetForm(): void {
    if (this.isEditMode) {
      const confirmed = confirm('Vuoi davvero annullare le modifiche?');
      if (!confirmed) return;
    }
    
    this.restaurantForm.reset();
    this.removeImage();
    this.errorMessage = '';
    this.successMessage = '';
    this.imageError = '';
  }
  
  get nameControl() { 
    return this.restaurantForm.get('name'); 
  }
  
  get descriptionControl() { 
    return this.restaurantForm.get('description'); 
  }
  
  get addressControl() { 
    return this.restaurantForm.get('location.address'); 
  }
  
  get latControl() { 
    return this.restaurantForm.get('location.lat'); 
  }
  
  get lngControl() { 
    return this.restaurantForm.get('location.lng'); 
  }
  
  get pageTitle(): string {
    return this.isEditMode ? 'Modifica Ristorante' : 'Nuovo Ristorante';
  }
  
  get submitButtonText(): string {
    return this.isEditMode ? 'Salva Modifiche' : 'Crea Ristorante';
  }
  
  get isFormValid(): boolean {
    return this.restaurantForm.valid && (this.isEditMode || !!this.selectedFile);
  }
  
  get descriptionLength(): number {
    return this.descriptionControl?.value?.length || 0;
  }
  
  get nameLength(): number {
    return this.nameControl?.value?.length || 0;
  }
}
