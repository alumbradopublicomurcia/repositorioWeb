import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';
import { AutenticacionService } from '../../services/autenticacion.service';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-ingreso',
  templateUrl: './ingreso.component.html',
  styleUrls: ['./ingreso.component.css']
})
export class IngresoComponent implements OnInit {
  public forma: FormGroup = new FormGroup({
    pass: new FormControl('', [ Validators.required]),
    correo: new FormControl('', [ Validators.required, Validators.email]),
  });
  deshabilitaBoton = false;
  hide = true;
  cargando = false;

  @ViewChild('campoCorreo') campoCorreo: ElementRef;

  constructor(
    public afAuth: AngularFireAuth,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private _autenticacion: AutenticacionService) { }

  ngOnInit() {
    this.campoCorreo.nativeElement.focus();
  }

  // Inicio de sesión con correo y contraseña
  public ingresar() {
    if (this.forma.valid) {
      this.deshabilitaBoton = true;
      this.cargando = true;
      this._autenticacion.ingresoUsuarioCorreo(this.forma.controls['correo'].value, this.forma.controls['pass'].value)
        .then( (res) => {
          this.cargando = false;
          // Es obligatorio tener el correo verificado para acceder.
          if (res && res.user && res.user.emailVerified) {
            this._autenticacion.ingresoCorrecto(res);
          } else {
            let txt1: string, txt2: string;
            this.translate.get('INGRESO.NO_VERIFICADO').pipe(take(1)).subscribe(res1 => txt1 = res1);
            this.translate.get('INGRESO.NECESARIO').pipe(take(1)).subscribe(res2 => txt2 = res2);
            this.snackBar.open(txt1, txt2 , {duration: 5000});
          }
        }).catch( (err) => {
          this.deshabilitaBoton = false;
          this.cargando = false;
          this._autenticacion.controlErrores(err);
        });
    }
  }
  public ingresarConGoogle(): void {
    this.cargando = true;
    this._autenticacion.ingresoUsuarioGoogle()
      .then( (res) => {
        this._autenticacion.ingresoCorrecto(res);
        this.cargando = false;
      }).catch( err => {
        console.error(err);
        this._autenticacion.controlErrores(err);
        this.cargando = false;
      });
  }

  public resetearPass () {
    this.cargando = true;
    this._autenticacion.resetPass(this.forma.controls['correo'].value)
      .then( () => this.cargando = false)
      .catch( error => {
        this.cargando = false;
        console.error(error);
      });
  }

  public presionarEnter (event) {
    if (event.key === 'Enter') {
      this.ingresar();
    }
  }
}
