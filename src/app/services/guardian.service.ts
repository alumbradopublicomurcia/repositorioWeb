import { Injectable, NgZone } from '@angular/core';
import { AutenticacionService } from './autenticacion.service';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from '@angular/router';
import { Sesion } from '../interfaces/sesion';

@Injectable()
export class GuardianService implements CanActivate {

  constructor(private _autenticacion: AutenticacionService,
              private ruta: Router,
              private ngZone: NgZone) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
    const usuario: Sesion = this._autenticacion.getSesion();
    if (usuario) {
      // Si no es nulo => está ingresado
      if (usuario.rol !== 'usuario') {
        // Los gestores y admin tienen acceso a todo
        return true;
      } else if (state.url === '/usuarios') {
        // Lo usuarios no tienen acceso a Usuarios
        this.ngZone.run(() => this.ruta.navigate(['inicio'])).then();
        return false;
      } else {
        // Es usuario y está ingresado. tiene acceso a todo menos Usuarios.
        return true;
      }
    } else {
      this.ngZone.run(() => this.ruta.navigate(['inicio'])).then();
      return false;
    }
  }
}
