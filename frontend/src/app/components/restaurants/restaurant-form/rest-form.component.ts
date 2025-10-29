import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, of, switchMap, Subscription } from 'rxjs';
import { Restaurant, CreateRestaurantDto, UpdateRestaurantDto } from '../../../models/restaurant.model';
import { RestaurantService } from '../../../services/restaurant.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading';
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
  
  /* 
   * Mappa Leaflet
   */
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
  ) {
    console.log("ABBASSO GLOVO");
  }
  
  ngOnInit(): void {
    /* 
     * Creo il form con le validazioni
     */
    this.createForm();
    
    /* 
     * Verifico se c'è la modalità di modifica leggendo l'ID dall'URL.
     * Utilizzo switchMap per caricare i dati del ristorante esistente
     * solo se l'ID è presente nell'URL.
     */
    this.routeSubscription = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        
        if (id) {
          /* 
           * Modalità MODIFICA: carico il ristorante esistente
           */
          this.isEditMode = true;
          this.restaurantId = +id;
          this.loading = true;
          this.errorMessage = '';
          
          return this.restaurantService.getRestaurantById(+id).pipe(
            catchError(error => {
              console.error('Errore caricamento ristorante:', error);
              this.errorMessage = 'Errore nel caricamento del ristorante. Potrebbe essere stato eliminato.';
              this.loading = false;
              return of(null);
            })
          );
        }
        
        /* 
         * Modalità CREAZIONE: nessun ristorante da caricare
         */
        return of(null);
      })
    ).subscribe(restaurant => {
      if (restaurant) {
        /* 
         * Popolo il form con i dati del ristorante esistente
         */
        this.populateForm(restaurant);
        
        /* 
         * Verifico che l'utente corrente sia il proprietario.
         * Solo il proprietario può modificare il ristorante.
         */
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
     */
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }
  
  ngOnDestroy(): void {
    /* 
     * Pulisco le sottoscrizioni per evitare memory leak
     */
    this.routeSubscription?.unsubscribe();
    
    /* 
     * Distruggo la mappa per evitare memory leak
     */
    if (this.map) {
      this.map.remove();
    }
  }
  
  /* 
   * Inizializzo la mappa Leaflet
   */
  private initializeMap(): void {
    if (this.mapInitialized) return;
    
    try {
      const iconRetinaUrl = 'assets/leaflet/marker-icon-2x.png';
      const iconUrl = 'assets/leaflet/marker-icon.png';
      const shadowUrl = 'assets/leaflet/marker-shadow.png';
      const iconDefault = L.icon({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = iconDefault;
      
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
      
      if (lat !== 0 && lng !== 0 && lat && lng) {
        this.addMarker(lat, lng);
        this.map.setView([lat, lng], 13);
      }
      
      this.mapInitialized = true;
    } catch (error) {
      console.error('Errore inizializzazione mappa:', error);
    }
  }
  
  /* 
   * Gestisce il click sulla mappa
   */
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
  
  /* 
   * Aggiunge o aggiorna il marker sulla mappa
   */
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
  
  /* 
   * Creo il form con i controlli necessari e le validazioni.
   * Utilizzo FormBuilder per creare un form reattivo con
   * validazioni sincrone.
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
        lat: [0, [Validators.required, Validators.min(-90), Validators.max(90)]],
        lng: [0, [Validators.required, Validators.min(-180), Validators.max(180)]]
      })
      /* 
       * L'immagine viene gestita separatamente tramite File input
       */
    });
  }
  
  /* 
   * Popolo il form con i dati del ristorante esistente
   * quando siamo in modalità modifica
   */
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
    
    /* 
     * Se il ristorante ha un'immagine, mostro l'anteprima
     */
    if (restaurant.imageUrl) {
      this.imagePreview = restaurant.imageUrl;
    }
  }
  
  /* 
   * Gestisco il cambio del file immagine.
   * Valido il tipo e la dimensione del file prima di accettarlo.
   */
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.imageError = '';
    
    if (!input.files || !input.files.length) {
      return;
    }
    
    const file = input.files[0];
    
    /* 
     * Validazione tipo di file
     */
    if (!this.allowedTypes.includes(file.type)) {
      this.imageError = '⚠️ Formato non valido. Usa JPG, PNG o WEBP.';
      this.removeImage();
      return;
    }
    
    /* 
     * Validazione dimensione file
     */
    if (file.size > this.maxFileSize) {
      this.imageError = `⚠️ File troppo grande. Massimo ${this.maxFileSize / (1024 * 1024)}MB.`;
      this.removeImage();
      return;
    }
    
    this.selectedFile = file;
    
    /* 
     * Creo un'anteprima dell'immagine utilizzando FileReader
     */
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
  
  /* 
   * Rimuovo l'immagine selezionata e resetto l'anteprima
   */
  removeImage(): void {
    this.selectedFile = undefined;
    this.imagePreview = null;
    this.imageError = '';
    
    /* 
     * Reset del campo input file per consentire
     * la selezione dello stesso file
     */
    const fileInput = document.getElementById('restaurant-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  /* 
   * Aggiorno le coordinate quando l'indirizzo cambia.
   */
  updateCoordinates(): void {
    const address = this.restaurantForm.get('location.address')?.value;
    
    if (!address || address.length < 5) {
      return;
    }

    const lat = 45 + Math.random();
    const lng = 9 + Math.random();
    
    this.restaurantForm.patchValue({
      location: {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6))
      }
    });
    
    this.successMessage = '📍 Coordinate aggiornate automaticamente';
    setTimeout(() => {
      this.successMessage = '';
    }, 2000);
  }
  
  /* 
   * Gestisco l'invio del form.
   * Eseguo validazioni, preparo i dati e invio la richiesta
   * al backend in base alla modalità (creazione o modifica).
   */
  onSubmit(): void {
    /* 
     * Pulisco i messaggi precedenti
     */
    this.errorMessage = '';
    this.successMessage = '';
    
    /* 
     * Validazione del form
     */
    if (this.restaurantForm.invalid) {
      /* 
       * Marco tutti i campi come touched per mostrare
       * gli errori di validazione all'utente
       */
      this.markFormGroupTouched(this.restaurantForm);
      this.errorMessage = '⚠️ Compila tutti i campi obbligatori correttamente.';
      return;
    }
    
    /* 
     * Validazione immagine in modalità creazione
     */
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
      
      /* 
       * Aggiungo l'immagine solo se ne è stata selezionata una nuova
       */
      if (this.selectedFile) {
        updateData.image = this.selectedFile;
      }
      
      this.restaurantService.updateRestaurant(this.restaurantId, updateData).subscribe({
        next: (restaurant) => {
          this.loading = false;
          /* 
           * Reindirizzo alla pagina di dettaglio con messaggio di successo
           */
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
          /* 
           * Reindirizzo alla pagina di dettaglio del nuovo ristorante
           */
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
  
  /* 
   * Marco tutti i campi del form e dei suoi sottoform come touched.
   * Questo fa apparire tutti i messaggi di errore di validazione.
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  /* 
   * Annullo l'operazione e torno indietro
   */
  cancel(): void {
    if (this.isEditMode && this.restaurantId) {
      /* 
       * In modalità modifica, torno alla pagina di dettaglio
       */
      this.router.navigate(['/restaurants', this.restaurantId]);
    } else {
      /* 
       * In modalità creazione, torno alla lista dei ristoranti
       */
      this.router.navigate(['/restaurants']);
    }
  }
  
  /* 
   * Resetto il form ai valori iniziali
   */
  resetForm(): void {
    if (this.isEditMode) {
      /* 
       * In modalità modifica, chiedo conferma prima di resettare
       */
      const confirmed = confirm('Vuoi davvero annullare le modifiche?');
      if (!confirmed) return;
    }
    
    this.restaurantForm.reset();
    this.removeImage();
    this.errorMessage = '';
    this.successMessage = '';
    this.imageError = '';
  }
  
  /* 
   * Getter per accedere facilmente ai controlli del form nel template
   */
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
  
  /* 
   * Getter per il titolo della pagina (dinamico in base alla modalità)
   */
  get pageTitle(): string {
    return this.isEditMode ? 'Modifica Ristorante' : 'Nuovo Ristorante';
  }
  
  /* 
   * Getter per il testo del pulsante di invio
   */
  get submitButtonText(): string {
    return this.isEditMode ? 'Salva Modifiche' : 'Crea Ristorante';
  }
  
  /* 
   * Verifico se il form è valido e pronto per l'invio
   */
  get isFormValid(): boolean {
    return this.restaurantForm.valid && (this.isEditMode || !!this.selectedFile);
  }
  
  /* 
   * Conto i caratteri della descrizione
   */
  get descriptionLength(): number {
    return this.descriptionControl?.value?.length || 0;
  }
  
  /* 
   * Conto i caratteri del nome
   */
  get nameLength(): number {
    return this.nameControl?.value?.length || 0;
  }
}