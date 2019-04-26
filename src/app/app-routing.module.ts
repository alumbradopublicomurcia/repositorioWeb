import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { IncidenciasComponent } from './components/incidencias/incidencias.component';
import { UsuariosComponent } from './components/usuarios/usuarios.component';
import { CuentaComponent } from './components/cuenta/cuenta.component';
import { IngresoComponent } from './components/ingreso/ingreso.component';
import { RegistroComponent } from './components/registro/registro.component';
import { NuevaIncidenciaComponent } from './components/nueva-incidencia/nueva-incidencia.component';
import { GuardianService } from './services/guardian.service';
import { SomosComponent } from './components/somos/somos.component';
import { ActividadComponent } from './components/actividad/actividad.component';
import { AvisosComponent } from './components/avisos/avisos.component';
import { ProteccionDatosComponent } from './components/proteccion-datos/proteccion-datos.component';
import { BuzonComponent } from './components/buzon/buzon.component';
import { InformacionComponent } from './components/informacion/informacion.component';

const RUTAS: Routes = [
  // Barra de navegación
  { path: 'inicio', component: InicioComponent},
  { path: 'incidencias', component: IncidenciasComponent, canActivate: [GuardianService]},
  { path: 'nuevaIncidencia', component: NuevaIncidenciaComponent, canActivate: [GuardianService]},
  { path: 'usuarios', component: UsuariosComponent, canActivate: [GuardianService]},
  { path: 'miCuenta', component: CuentaComponent, canActivate: [GuardianService]},
  { path: 'ingreso', component: IngresoComponent},
  { path: 'registro', component: RegistroComponent},
  { path: 'informacion', component: InformacionComponent},
  // Pie de página
  { path: 'somos', component: SomosComponent},
  { path: 'actividad', component: ActividadComponent},
  { path: 'avisos', component: AvisosComponent},
  { path: 'datos', component: ProteccionDatosComponent},
  { path: 'buzon', component: BuzonComponent},
  // Otro
  { path: '**', pathMatch: 'full', redirectTo: 'inicio'}

];

@NgModule({
  imports: [RouterModule.forRoot(RUTAS, { useHash: true, scrollPositionRestoration: 'enabled'})],
  exports: [RouterModule]
})
export class AppRoutingModule {}

export const APP_ROUTING = RouterModule.forRoot(RUTAS, { useHash: true});
