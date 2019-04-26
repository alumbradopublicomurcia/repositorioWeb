import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
// Angular Translator
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDatepickerModule} from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatSnackBarModule, MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule } from '@angular/material/table';
// Google Map - Autocomplete
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';
// Angular Firebase
import { AngularFireModule } from 'angularfire2';
import { FirestoreSettingsToken, AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';
// Angular Bootstap MDB
import { MDBBootstrapModule } from 'angular-bootstrap-md';

// Servicio
import { ConexionService } from './services/conexion.service';
import { AutenticacionService } from './services/autenticacion.service';
import { GuardianService } from './services/guardian.service';
// Componentes propios
import { NavbarComponent } from './components/navbar/navbar.component';
import { InicioComponent } from './components/inicio/inicio.component';
import { IncidenciaComponent } from './components/incidencia/incidencia.component';
import { IncidenciasComponent } from './components/incidencias/incidencias.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { CuentaComponent } from './components/cuenta/cuenta.component';
import { NuevoUsuarioComponent } from './components/usuarios/nuevo-usuario.component';
import { environment } from 'src/environments/environment';
import { IngresoComponent } from './components/ingreso/ingreso.component';
import { RegistroComponent } from './components/registro/registro.component';
import { NuevaIncidenciaComponent } from './components/nueva-incidencia/nueva-incidencia.component';
import { PieComponent } from './components/pie/pie.component';
import { AvisosComponent } from './components/avisos/avisos.component';
import { ProteccionDatosComponent } from './components/proteccion-datos/proteccion-datos.component';
import { SomosComponent } from './components/somos/somos.component';
import { ActividadComponent } from './components/actividad/actividad.component';
import { BuzonComponent } from './components/buzon/buzon.component';
import { BajaUsuarioComponent } from './components/cuenta/baja-usuario/baja-usuario.component';
import { EsperaComponent } from './components/espera/espera.component';
import { InformacionComponent } from './components/informacion/informacion.component';
// Captcha
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha';

// AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient);
}

@NgModule({
  entryComponents: [
    NuevoUsuarioComponent, IncidenciaComponent, BajaUsuarioComponent
  ],
  declarations: [
    AppComponent,
    NavbarComponent,
    InicioComponent,
    IncidenciaComponent,
    IncidenciasComponent,
    NuevaIncidenciaComponent,
    UsuariosComponent,
    CuentaComponent,
    NuevoUsuarioComponent,
    IngresoComponent,
    RegistroComponent,
    PieComponent,
    AvisosComponent,
    ProteccionDatosComponent,
    SomosComponent,
    ActividadComponent,
    BuzonComponent,
    BajaUsuarioComponent,
    EsperaComponent,
    InformacionComponent
  ],
  imports: [
    BrowserModule,
    RecaptchaModule,
    MatProgressBarModule,
    CommonModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    AppRoutingModule,
    GooglePlaceModule,
    MatToolbarModule,
    MatNativeDateModule,
    FormsModule,
    MatButtonModule,
    MatBottomSheetModule,
    MatListModule,
    MatCardModule,
    MatDialogModule,
    MatBadgeModule,
    MatInputModule,
    MatTooltipModule,
    MatIconModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatSnackBarModule,
    MDBBootstrapModule.forRoot(),
    MatTableModule,
    MatSlideToggleModule,
    HttpClientModule,
    AngularFireStorageModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    ConexionService,
    AutenticacionService,
    GuardianService,
    { provide: FirestoreSettingsToken, useValue: {} },
    { provide: MAT_DATE_LOCALE, useValue: 'es'},
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: '',
        language: 'es'
      } as RecaptchaSettings,
    }
  ],
  bootstrap: [AppComponent, ]
})
export class AppModule { }
