import { Component, OnInit, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ConexionService } from 'src/app/services/conexion.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-buzon',
  templateUrl: './buzon.component.html',
  styleUrls: ['./buzon.component.css']
})
export class BuzonComponent implements OnInit {
  deshabilitaBoton = true;
  formaBuzon: FormGroup = new FormGroup({
    correo: new FormControl('', [Validators.required, Validators.email]),
    mensaje: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  constructor(
    private _conexion: ConexionService,
    public ngZone: NgZone
  ) { }

  ngOnInit() {
  }

  enviarComunicacion() {
    if (this.formaBuzon.valid) {
      this.deshabilitaBoton = true;
      this._conexion.nuevoMensajeBuzon(this.formaBuzon.value.correo, this.formaBuzon.value.mensaje);
    }
  }

  resolved(captchaResponse: string) {
    this.deshabilitaBoton = false;
  }
}
