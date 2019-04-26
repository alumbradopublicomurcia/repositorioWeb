import { Component, OnInit, Inject, NgZone } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { ConexionService } from 'src/app/services/conexion.service';
import { AutenticacionService } from 'src/app/services/autenticacion.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { pipe } from 'rxjs/index';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-baja-usuario',
  templateUrl: './baja-usuario.component.html',
  styleUrls: ['./baja-usuario.component.css']
})
export class BajaUsuarioComponent implements OnInit {
  correoUsuario: string;
  ocultarPass = true;
  deshabilitaBoton = false;
  deshabilitaBtnGoogle = false;
  mostrarErrorGoogle = false;
  mostrarOkGoogle = false;
  mostrarError = false;
  accederConCorreo = true;
  formaPass: FormGroup = new FormGroup({
    pass: new FormControl('', [
      Validators.required,
      Validators.minLength(6)
    ])
  });

  constructor(
    private _conexion: ConexionService,
    private _autenticacion: AutenticacionService,
    private _auth: AngularFireAuth,
    public dialogRef: MatDialogRef<BajaUsuarioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.correoUsuario = data.correo;
    this.accederConCorreo = data.accederConCorreo;
    this.accederConCorreo ? this.deshabilitaBoton = false : this.deshabilitaBoton = true;
  }

  ngOnInit() {
  }

  async confirmaBaja() {
    if (this.accederConCorreo) {
      this.mostrarError = false;
      if (this.formaPass.valid) {
        this.deshabilitaBoton = true;
        const user = this._auth.auth.currentUser;
        const credenciales = firebase.auth.EmailAuthProvider.credential(this.correoUsuario, this.formaPass.controls['pass'].value);
        // Comprobamos que contraseña ACTUAL sea correcta con Re-autenticacion
        user.reauthenticateAndRetrieveDataWithCredential(credenciales).then( () => {
          try {
            this._conexion.getIncidencias(false, this.correoUsuario).pipe(take(1)).subscribe(incis => {
              this._conexion.desvincularIncidencias(incis)
                .then( () => this._conexion.eliminarUsario(this.correoUsuario))
                .then( () => this._autenticacion.eliminarUsuario())
                .then( () => this.dialogRef.close());
            });
          } catch (error) {
            console.error(error);
          }
        // Autenticación fallida
        }).catch((error) => {
          if (error.code === 'auth/wrong-password') {
            this.mostrarError = true;
            this.deshabilitaBoton = false;
          }
          console.error(error);
        });
      }
    } else {
      this.deshabilitaBoton = true;
      try {
        this._conexion.getIncidencias(false, this.correoUsuario).pipe(take(1)).subscribe(incis => {
          this._conexion.desvincularIncidencias(incis)
            .then( () => this._conexion.eliminarUsario(this.correoUsuario))
            .then( () => this._autenticacion.eliminarUsuario())
            .then( () => this.dialogRef.close());
        });
      } catch (error) {
        this.deshabilitaBoton = false;
        console.error(error);
      }
    }
  }

  cancelaBaja() {
    this.dialogRef.close();
  }

  public reIngresarConGoogle(): void {
    this.deshabilitaBtnGoogle = true;
    const user = this._auth.auth.currentUser;
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    user.reauthenticateWithPopup(provider).then( res => {
      this.correoUsuario = res.user.email;
      this.deshabilitaBoton = false;
    }).catch((error) => {
      this.mostrarErrorGoogle = true;
      this.deshabilitaBtnGoogle = false;
      console.error(error);
    });
  }

}
