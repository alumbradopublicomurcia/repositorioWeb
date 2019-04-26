import { Component, OnInit, NgZone, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AutenticacionService } from 'src/app/services/autenticacion.service';
import { Router } from '@angular/router';
import { ConexionService } from '../../services/conexion.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnInit {

  formaUsuario: FormGroup = new FormGroup({
    nombre: new FormControl(''),
    apellidos: new FormControl(''),
    correo: new FormControl('', [Validators.required, Validators.email]),
    pass: new FormControl(),
    pass2: new FormControl(),
    telefono: new FormControl('')
  });

  @ViewChild('campoCorreo') campoCorreo: ElementRef;

  aceptaCondiciones = false;
  hide = true;
  hide2 = true;
  deshabilitarCrear = false;
  cargando = false;

  constructor(
    private _autenticacion: AutenticacionService,
    private ruta: Router) {}

  ngOnInit() {
    this.formaUsuario.controls['pass2'].setValidators([
      Validators.required,
      Validators.minLength(6),
      this.verificarPass.bind(this.formaUsuario)
    ]);
    this.formaUsuario.controls['pass'].setValidators([
      Validators.required,
      Validators.minLength(6),
      this.verificarPass.bind(this.formaUsuario)
    ]);
    this.campoCorreo.nativeElement.focus();
  }

  crearUsuario() {
    if (this.formaUsuario.valid) {
      this.cargando = true;
      this.deshabilitarCrear = true;
      this._autenticacion.registroNuevoUsuario(
        this.formaUsuario.value.correo, this.formaUsuario.value.pass, this.formaUsuario)
          .then( () => {
            this._autenticacion.cerrarSesionTrasCrearUsuario();
            this.cargando = false;
          }).catch( error => {
            console.error(error);
            if (error && error.code === 'auth/email-already-in-use') {
              alert(`Cuenta de correo ya registrada.
                Si aún no ha recibido el correo, vaya a la ventana de inicio y pulse en "Olvidé contraseña".`);
            }
            this.cargando = false;
          });
    }
  }
  cancelarDialogo() {
    this.ruta.navigate(['inicio']);
  }

  verificarPass(control: any) {
    const forma: any = this;
    if ( control.value !== forma.controls['pass'].value ) {
      return {
        noiguales: true
      };
    }
    return null;
  }
}
