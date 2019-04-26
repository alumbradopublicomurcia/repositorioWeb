import { Component, OnInit } from '@angular/core';
import { AutenticacionService } from '../../services/autenticacion.service';
import { ConexionService } from 'src/app/services/conexion.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  usuarioIngresado = false;
  sesion = null;
  cargando = false;
  rol = 0; // Corresponde a cualquier rol "usuario", 1 => Gestor, 2 => admin

  constructor(
    private _conexion: ConexionService,
    private _autenticacion: AutenticacionService) {
      this.sesion = sessionStorage;
  }

  ngOnInit() {
    this.getUsuarioActual();
  }

  private getUsuarioActual () {
    this.cargando = true;
    this._autenticacion.estaAutenticado().subscribe( usu => {
      if (usu && usu.email && usu.emailVerified) {
        if (this.sesion && this.sesion.usuario) {
          this.usuarioIngresado = true;
          this.rolUsuario(usu.email, true);
        } else {
          this.usuarioIngresado = true;
          this.rolUsuario(usu.email, false);
        }
      } else {
        sessionStorage.clear();
        this.usuarioIngresado = false;
        this.cargando = false;
      }
    }, error => {
      console.error(error);
    });
  }

  private rolUsuario(correo: any, conSesion: boolean) {
    // Comprobamos el rol del usuario ingresado.
    this._conexion.getUsuario(correo).pipe(take(1)).subscribe( usu => {
      switch (usu.payload.get('rol')) {
        case 'usuario':
          this.rol = 0;
          break;
        case 'gestor':
          this.rol = 1;
          break;
        case 'admin':
          this.rol = 2;
          break;
        default:
          break;
      }
      this.cargando = false;
      if (!conSesion) {
        this._autenticacion.setSesion({correo: correo, rol: usu.payload.get('rol')});
      }
    });
  }

  cerrarSesion () {
    this.cargando = true;
    this._autenticacion.cerrarSesion().finally( () => this.cargando = false);
  }
}
