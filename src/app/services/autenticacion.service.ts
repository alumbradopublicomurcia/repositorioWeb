import { Injectable, NgZone } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { auth } from 'firebase/app';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material';
import { ConexionService } from './conexion.service';
import { Sesion } from '../interfaces/sesion';
import * as CryptoJS from 'crypto-js';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {

  constructor(
    private afAuth: AngularFireAuth,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private ruta: Router,
    private _conexion: ConexionService) { }

  getSesion(): Sesion {
    const jsonCadena = sessionStorage.getItem('usuario');
    const sesion: Sesion = JSON.parse(jsonCadena);
    if (sesion) {
      const rolDecodificado = CryptoJS.AES.decrypt(sesion.rol, environment.cifrado).toString(CryptoJS.enc.Utf8);
      sesion.rol = rolDecodificado;
    }
    return sesion;
  }

  public setSesion(usuario: Sesion) {
    if (usuario) {
      const rolCodificado = CryptoJS.AES.encrypt(usuario.rol, environment.cifrado).toString();
      usuario.rol = rolCodificado;
    }
    sessionStorage.setItem('usuario', JSON.stringify(usuario));
  }

  registroNuevoUsuario (correo: string, pass: string, formaUsuario: any) {
   return new Promise ((resolve, reject) => {
      this.afAuth.auth.createUserWithEmailAndPassword(correo, pass)
        .then( () => {
          this._conexion.insertarUsario(formaUsuario);
          this.afAuth.auth.currentUser.sendEmailVerification().then(() => {
            resolve();
          }).catch( err => console.error(err));
        }, error => reject(error));
    });
  }

  ingresoUsuarioCorreo (correo: string, pass: string): any {
    return new Promise((resolve, reject) => {
      this.afAuth.auth.signInWithEmailAndPassword(correo, pass)
        .then (datosUsuario => resolve (datosUsuario),
        error => reject(error));
      });
  }

  ingresoUsuarioGoogle (): any {
    const proveedor = new auth.GoogleAuthProvider();
    proveedor.addScope('profile');
    proveedor.addScope('email');
    return this.afAuth.auth.signInWithPopup( proveedor )
      .then(credenciales => {
        // Si el usuario es nuevo, lo añadimos a nuestra BBDD de Usuarios
        if (credenciales && credenciales.additionalUserInfo && credenciales.additionalUserInfo.isNewUser) {
          this._conexion.crearUsuarioIngresadoConGoogle(credenciales);
        }
        return credenciales;
    }).catch(err => console.error(err));
  }

  async cerrarSesion () {
    await this.afAuth.auth.signOut().then( () => {
      this.limpiarEiniciar();
    }).catch(err => {
      console.error(err);
    });
  }

  cerrarSesionTrasCrearUsuario () {
    // Si ha llegado hasta aquí es que ha terminado la creación completa del usuario => salimos
    this.afAuth.auth.signOut().then( () => {
      this.ngZone.run(() => this.ruta.navigate(['inicio'])).then( () => {
        let txt1 = '', txt2 = '';
        this.translate.get('REGISTRO.CORREO_ENVIADO').pipe(take(1)).subscribe(res2 => txt1 = res2);
        this.translate.get('REGISTRO.VERIFIQUE').pipe(take(1)).subscribe(res3 => txt2 = res3);
        this.snackBar.open(txt1, txt2 , {duration: 5000});
      });
    });
  }

  private limpiarEiniciar () {
    this.ngZone.run(() => this.ruta.navigate(['inicio']));
    sessionStorage.clear();
  }

  estaAutenticado(): any {
    return this.afAuth.authState.pipe(map( auth => auth));
  }

  resetPass (correo: string): any {
    let txtEnv = '', txtNoEnv = '', txtRevise = '', txtInstruc = '';
    this.translate.get('REGISTRO.CORREO_ENVIADO').pipe(take(1)).subscribe(res => txtEnv = res);
    this.translate.get('REGISTRO.CORREO_NO_ENVIADO').pipe(take(1)).subscribe(res => txtNoEnv = res);
    this.translate.get('REGISTRO.REVISE').pipe(take(1)).subscribe(res => txtRevise = res);
    this.translate.get('REGISTRO.INSTRUCCIONES').pipe(take(1)).subscribe(res => txtInstruc = res);
    return this.afAuth.auth.sendPasswordResetEmail(correo)
      .then( res => {
        this.snackBar.open(txtEnv, txtInstruc , {duration: 5000});
        return res;
      }).catch( error => {
        this.snackBar.open(txtNoEnv, txtRevise , {duration: 5000});
        console.error(error);
        return error;
      });
  }

  eliminarUsuario () {
    this.afAuth.auth.currentUser.delete().then(() => {
      this.ngZone.run(() => this.ruta.navigate(['inicio'])).then( () => {
        let txt1 = '', txt2 = '';
        this.translate.get('CUENTA.BAJA_OK').pipe(take(1)).subscribe(res2 => txt1 = res2);
        this.translate.get('CUENTA.GRACIAS').pipe(take(1)).subscribe(res3 => txt2 = res3);
        this.snackBar.open(txt1, txt2 , {duration: 5000});
      });
    }).catch(err => console.error(err));
  }

  // Control de errores en la autenticación.
  public controlErrores (err: any) {
    let txt1 = '', txt2;
    if (err) {
      switch (err.code) {
        case 'auth/user-not-found':
          this.translate.get('REGISTRO.ERR_CORREO_NO_EXISTE').pipe(take(1)).subscribe(res => txt1 = res);
          this.translate.get('USUARIOS.CORREO_INVALIDO').pipe(take(1)).subscribe(res => txt2 = res);
          break;
        case 'auth/invalid-email':
          this.translate.get('REGISTRO.ERR_CORREO_INVALIDO').pipe(take(1)).subscribe(res => txt1 = res);
          this.translate.get('USUARIOS.CORREO_INVALIDO').pipe(take(1)).subscribe(res => txt2 = res);
          break;
        case 'auth/wrong-password':
          this.translate.get('REGISTRO.ERR_CONTR_INVALIDA').pipe(take(1)).subscribe(res => txt1 = res);
          this.translate.get('REGISTRO.ERR_CONTR_INVALIDA2').pipe(take(1)).subscribe(res => txt2 = res);
          break;
        case 'auth/account-exists-with-different-credential':
          this.translate.get('REGISTRO.ERR_DIFERENTE').pipe(take(1)).subscribe(res => txt1 = res);
          this.translate.get('REGISTRO.ERR_DIFERENTE2').pipe(take(1)).subscribe(res => txt2 = res);
          break;
        default:
          this.translate.get('REGISTRO.ERR_GENERICO').pipe(take(1)).subscribe(res => txt1 = res);
          this.translate.get('REGISTRO.ERR_GENERICO2').pipe(take(1)).subscribe(res => txt2 = res);
          break;
      }
      this.snackBar.open(txt1, txt2 , {duration: 5000});
    }
  }

  public ingresoCorrecto (datosUsuario: any) {
    if (datosUsuario && datosUsuario.user && datosUsuario.user.email) {
      // Comprobamos el rol del usuario ingresado.
      this._conexion.getUsuario(datosUsuario.user.email).pipe(take(1)).subscribe( usu => {
        const jsonUsuario: Sesion = {
          rol: usu.payload.get('rol'),
          correo: datosUsuario.user.email
        };
        this.setSesion(jsonUsuario);
        this.ngZone.run(() => this.ruta.navigate(['inicio'])).then();
      });
    }
  }
}
