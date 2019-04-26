import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { NuevoUsuarioComponent } from './nuevo-usuario.component';
import { Usuario } from '../../interfaces/usuario';
import { ConexionService } from '../../services/conexion.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { Rol } from 'src/app/interfaces/rol';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  roles: Rol[] = null;
  esAdmin = false;
  cargando = true;

  constructor(public dialog: MatDialog,
              private _auth: AngularFireAuth,
              private _conexion: ConexionService) {
    // Comprobamos el rol del usuario ingresado.
    const correo = this._auth.auth.currentUser.providerData[0].email;
    this._conexion.getUsuario(correo).pipe(take(1)).subscribe( usu => {
      if (usu.payload.get('rol') === 'admin') {
        this.esAdmin = true;
      }
    });
    this._conexion.getUsuarios().pipe(take(1)).subscribe(res => {
      this.usuarios = res;
      this.cargando = false;
    });
  }

  ngOnInit() {
  }

  abrirDialogo(indice: number): void {
    this.dialog.open(NuevoUsuarioComponent, {
      width: '500px',
      height: 'auto',
      data: this.usuarios[indice]
    });
  }
}
