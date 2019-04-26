import { Component, OnInit, NgZone } from '@angular/core';
import { AutenticacionService } from 'src/app/services/autenticacion.service';
import { Sesion } from 'src/app/interfaces/sesion';
import { Router } from '@angular/router';
import * as imagenes from '../../../assets/carrusel/imagenes.json';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  jsonImagenes = (<any>imagenes).imagen;
  urlImagenes = (<any>imagenes).url;
  imagenesVector: any = [];
  estaIngresado = false;
  cargando = true;
  urlImagenEtiqueta;
  urlImagenAhorro;
  urlCarrusel = '../../../assets/carrusel/';
  alturaCarrusel = 400;

  constructor(
    private _autenticacion: AutenticacionService,
    private ruta: Router,
    private ngZone: NgZone) {

    const usuario: Sesion = this._autenticacion.getSesion();
    if (usuario) {
      this.estaIngresado = true;
    }
    this.imagenesCarrusel();
  }

  ngOnInit() {
  }

  private imagenesCarrusel () {
    const anchura = window.innerWidth || 0;
    const altura = window.innerHeight || 0;
    this.alturaCarrusel = altura / 2;
    for (const it of this.jsonImagenes) {
      const json = {
        img: `${this.urlImagenes}${it.img}`,
        txt: (altura > 500 && anchura > 500) ? it.txt : ''
      };
      this.imagenesVector.push(json);
    }
    this.cargando = false;
  }

  irAregistro () {
    this.ngZone.run(() => this.ruta.navigate(['registro']));
  }

}
