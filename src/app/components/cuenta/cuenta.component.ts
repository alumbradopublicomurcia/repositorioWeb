import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';
import { ConexionService } from '../../services/conexion.service';
import { Usuario } from 'src/app/interfaces/usuario';
import { MatSnackBar, MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import * as firebase from 'firebase/app';
import { BajaUsuarioComponent } from './baja-usuario/baja-usuario.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.component.html',
  styleUrls: ['./cuenta.component.css']
})
export class CuentaComponent implements OnInit {

  edicionDatos = false;
  cambiarPass = false;
  ocultarPass = true;
  ocultarPass2 = true;
  ocultarPass3 = true;
  proveedor = '';
  accedeConCorreo = true;
  correoUsuario = '';
  cargando = true;

  formaUsuario: FormGroup = new FormGroup({
    correo: new FormControl({value: '', disabled: true}, [Validators.required, Validators.email]),
    nombre: new FormControl({value: '', disabled: true}),
    apellidos: new FormControl({value: '', disabled: true}),
    telefono: new FormControl({value: '', disabled: true}),
    rol: new FormControl({value: '', disabled: true})
  });

  formaPass: FormGroup = new FormGroup({
    passActual: new FormControl({value: '', disabled: true}, [
      Validators.required,
      Validators.minLength(6)
    ]),
    passNueva: new FormControl({value: '', disabled: true}, [
      Validators.required,
      Validators.minLength(6)]),
    passNueva2: new FormControl({value: '', disabled: true}, [
      Validators.required,
      Validators.minLength(6)
    ])
  });

  constructor(
    private afAuth: AngularFireAuth,
    private snackBar: MatSnackBar,
    private _conexion: ConexionService,
    public dialog: MatDialog,
    private translate: TranslateService) {

    // Obtenemos el correo electrónico ingresado en la aplicación.
    if (afAuth.auth.currentUser.providerData && afAuth.auth.currentUser.providerData[0]) {
      this.correoUsuario = afAuth.auth.currentUser.providerData[0].email;
      if (afAuth.auth.currentUser.providerData[0].providerId !== 'password' ) {
        this.accedeConCorreo = false;
      }
      if (this.correoUsuario) {
        // Obtenemos los datos de usuario para mostrarlos.
        this._conexion.getUsuario(this.correoUsuario).pipe(take(1)).subscribe( usu => {
          if (usu.payload.data()) {
            this.formaUsuario.setValue({
              nombre: usu.payload.get('nombre') || '',
              apellidos: usu.payload.get('apellidos') || '',
              correo: usu.payload.get('correo') || '',
              telefono: usu.payload.get('telefono') || '',
              rol: usu.payload.get('rol') || false,
            });
          }
          this.cargando = false;
        });
      }
    }
  }

  ngOnInit() {
    this.formaPass.controls['passNueva2'].setValidators([
      Validators.required,
      Validators.minLength(6),
      this.verificarPass.bind(this.formaPass)
    ]);
    this.formaPass.controls['passNueva'].setValidators([
      Validators.required,
      Validators.minLength(6),
      this.verificarPass.bind(this.formaPass)
    ]);
  }

  habilitarEdicion() {
    this.edicionDatos = !this.edicionDatos;
    if (this.edicionDatos) {
      this.formaUsuario.controls['nombre'].enable();
      this.formaUsuario.controls['apellidos'].enable();
      this.formaUsuario.controls['telefono'].enable();
    } else {
      this.formaUsuario.controls['correo'].disable();
      this.formaUsuario.controls['nombre'].disable();
      this.formaUsuario.controls['apellidos'].disable();
      this.formaUsuario.controls['telefono'].disable();
    }
  }

  guardarEdicion() {
    if (this.formaUsuario.valid) {
      this.habilitarEdicion();
      const usuario: Usuario = {
        correo: this.formaUsuario.controls['correo'].value,
        nombre: this.formaUsuario.controls['nombre'].value,
        apellidos: this.formaUsuario.controls['apellidos'].value,
        telefono: this.formaUsuario.controls['telefono'].value,
        rol: this.formaUsuario.controls['rol'].value
      };
      let txt1 = '', txt2 = '';
      this._conexion.actualizarUsario(usuario.correo, usuario)
        .then( () => {
          this.translate.get('CORRECTA').pipe(take(1)).subscribe(res2 => txt1 = res2);
          this.translate.get('CUENTA.GUARDADO').pipe(take(1)).subscribe(res3 => txt2 = res3);
          this.snackBar.open(txt1, txt2 , {duration: 5000});
        }).catch(res => {
          this.translate.get('INCORRECTA').pipe(take(1)).subscribe(res2 => txt1 = res2);
          this.translate.get('CUENTA.NO_GUARDADO').pipe(take(1)).subscribe(res3 => txt2 = res3);
          this.snackBar.open(txt1, txt2 , {duration: 5000});
        });
    }
  }

  cancelarEdicion() {
    this.habilitarEdicion();
  }

  editarPass() {
    this.cambiarPass = !this.cambiarPass;
    if (this.cambiarPass) {
      this.formaPass.controls['passActual'].enable();
      this.formaPass.controls['passNueva'].enable();
      this.formaPass.controls['passNueva2'].enable();
    } else {
      this.formaPass.controls['passActual'].disable();
      this.formaPass.controls['passNueva'].disable();
      this.formaPass.controls['passNueva2'].disable();
    }
  }
  guardarPass() {
    if (this.formaPass.valid) {
      let txt1 = '', txt2 = '';
      // Comprobamos que contraseña ACTUAL sea correcta con Re-autenticacion
      const user = this.afAuth.auth.currentUser;
      const credenciales = firebase.auth.EmailAuthProvider.credential(user.email, this.formaPass.controls['passActual'].value);
      user.reauthenticateAndRetrieveDataWithCredential(credenciales)
        .then(() => {
          // Procedemos a actualizar la contraseña
          user.updatePassword(this.formaPass.controls['passNueva2'].value).then( () => {
            this.translate.get('CORRECTA').pipe(take(1)).subscribe(res5 => txt1 = res5);
            this.translate.get('CUENTA.PASS_GUARDADA').pipe(take(1)).subscribe(res6 => txt2 = res6);
            this.snackBar.open(txt1, txt2 , {duration: 5000});
            this.editarPass();
            this.limpiarCamposPass();
          }).catch((error) => {
            console.error(error);
            this.translate.get('INCORRECTA').pipe(take(1)).subscribe(res2 => txt1 = res2);
            this.translate.get('CUENTA.PASS_NO_GUARDADA').pipe(take(1)).subscribe(res3 => txt2 = res3);
            this.snackBar.open(txt1, txt2 , {duration: 5000});
          });
        }).catch((error) => {
          console.error(error);
          this.translate.get('INCORRECTA').pipe(take(1)).subscribe(res2 => txt1 = res2);
          this.translate.get('CUENTA.ACTUAL_INCORRECTA').pipe(take(1)).subscribe(res3 => txt2 = res3);
          this.snackBar.open(txt1, txt2 , {duration: 5000});
      });
    }
  }
  cancelarPass() {
    this.editarPass();
  }

  verificarPass(control: any) {
    const forma: any = this;
    if ( control.value !== forma.controls['passNueva'].value ) {
      return {
        noiguales: true
      };
    }
    return null;
  }

  limpiarCamposPass() {
    this.formaPass.setValue({
      passActual: '',
      passNueva: '',
      passNueva2: ''
    });
  }

  abrirDialogo (): void {
    this.dialog.open(BajaUsuarioComponent, {
      width: 'auto',
      height: 'auto',
      data: {
        correo: this.correoUsuario,
        accederConCorreo: this.accedeConCorreo
      }
    });
  }
}
