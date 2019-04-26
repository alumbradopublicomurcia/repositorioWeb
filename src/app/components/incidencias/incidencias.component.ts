import { Component, OnInit, ViewChild } from '@angular/core';
import { ConexionService } from '../../services/conexion.service';
import { TranslateService } from '@ngx-translate/core';
import { AngularFireAuth } from '@angular/fire/auth';
import * as moment from 'moment';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material';
import { IncidenciaComponent } from '../incidencia/incidencia.component';
import { AutenticacionService } from '../../services/autenticacion.service';
import { FormGroup, FormControl } from '@angular/forms';
declare const google: any;
import { take } from 'rxjs/operators';
import { Averia } from 'src/app/interfaces/averia';

@Component({
  selector: 'app-incidencias',
  templateUrl: './incidencias.component.html',
  styleUrls: ['./incidencias.component.css']
})
export class IncidenciasComponent implements OnInit {

  esGestor = false;
  cargando = true;
  cargando2 = true;
  averias: Averia[];
  // Filtro
  adjuntos: any = [
    {id: 1, desc: 'No'},
    {id: 2, desc: 'Sí'}
  ];
  estados = []; // Utilizado para el combo de Estados.
  formaFiltro: FormGroup = new FormGroup({
    estado: new FormControl(''),
    idAyto: new FormControl(''),
    idElectromur: new FormControl(''),
    adjunto: new FormControl(''),
    fechaInicio: new FormControl(''),
    fechaFin: new FormControl(''),
  });
  fechaHoy = new Date();
  minFecFin: Date;
  // Variables destinadas para el filtrado de incidencias.
  incidencias: any[] = [];
  incidenciasMostradas: any[] = [];
  indices: number[] = [];
  activos: boolean[] = [];
  primeraVez = true;
  // Literales
  litEstado: String;
  litDireccion: String;
  litPunto: String;
  litObservaciones: String;
  // Mapa
  marcadores: any[] = [];
  coordenadasIniciales = new google.maps.LatLng( 37.990248, -1.124005);
  limites = {
    north: 38.117800,
    south: 37.716834,
    east: -0.847000,
    west: -1.406374
  };
  @ViewChild('gmap') gmapElement: any;
  map: google.maps.Map;

  constructor(
    private _conexion: ConexionService,
    private _autenticacion: AutenticacionService,
    private _auth: AngularFireAuth,
    public dialog: MatDialog,
    private translate: TranslateService) {

    this.vaciarVariables();
    this.cargaLiterales();
    this.cargarEstados();
    this.cargarAverias();
  }

  ngOnInit() {
    // Comprobamos el rol del usuario ingresado.
    this.rolUsuario();
    this.mostrarMapa();
  }

  private vaciarVariables () {
    // Inicializamos incidencias.
    this.incidencias = [];
    this.incidenciasMostradas = [];
    this.indices = [];
    this.activos = [];
    this.primeraVez = true;
    this.borrarMarcadores();
    this.fechaHoy = new Date();
  }

  private borrarMarcadores () {
    if (this.marcadores && this.marcadores.length > 0) {
      for (const mk of this.marcadores) {
        mk.setMap(null);
      }
      this.marcadores = [];
    }
  }

  private cargaLiterales() {
    this.translate.get('INCI.DIREC').pipe(take(1)).subscribe(res => this.litDireccion = res);
    this.translate.get('INCI.OBSERVACIONES').pipe(take(1)).subscribe(res2 => this.litObservaciones = res2);
    this.translate.get('INCI.PUNTO').pipe(take(1)).subscribe(res3 => this.litPunto = res3);
    this.translate.get('INCI.ESTADO').pipe(take(1)).subscribe(res4 => this.litEstado = res4);
  }

  private cargarEstados() {
    this._conexion.getEstados().pipe(take(1)).subscribe(res => {
      this.estados = [];
      for (const it of res) {
        const json = {
          suma: `${it.orden} - ${it.estado}`,
          estadoCadGestor: `${it.orden} - ${it.estado} - ${it.descripcion}`,
          estadoCad:  `${it.orden} - ${it.descUsuario}`,
          id: it.id
        };
        this.estados.push(json);
      }
      this.estados.push({
        id: 6,
        suma: '1/2/3 - Todos los estados NO finalizados'
      });
      this.estados.push({
        id: 7,
        suma: '4/5 - Todos los estados finalizados'
      });
      this.estados.push({
        id: 8,
        suma: 'Todos los estados'
      });
      this.formaFiltro.setValue({
        estado: 6,
        idAyto: '',
        idElectromur: '',
        adjunto: '',
        fechaInicio: '',
        fechaFin: '',
      });
    });
  }

  private cargarAverias () {
    this._conexion.getAverias().pipe(take(1)).subscribe(res => {
      this.averias = res;
    });
  }

  private mostrarMapa() {
    this.map = new google.maps.Map(this.gmapElement.nativeElement, {
      center: this.coordenadasIniciales,
      zoom: 9,
      minZoom: 8,
      clickableIcons: false,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      restriction: {
        latLngBounds: this.limites,
        strictBounds: false,
      }
    });
  }

  private rolUsuario() {
    if (this._auth.auth && this._auth.auth.currentUser && this._auth.auth.currentUser.providerData
        && this._auth.auth.currentUser.providerData[0] && this._auth.auth.currentUser.providerData[0].email ) {
      const correo = this._auth.auth.currentUser.providerData[0].email;
      this._conexion.getUsuario(correo).pipe(take(1)).subscribe( usu => {
        if (usu.payload.get('rol') === 'admin' || usu.payload.get('rol') === 'gestor') {
          this.esGestor = true;
        }
        this._conexion.getIncidencias(this.esGestor, this._autenticacion.getSesion().correo).pipe(take(1)).subscribe(res => {
          if (res) {
            res = _.orderBy(res, ['fechaCreacion']);
            this.cargarIncidencias(res);
          }
        }, (error) => {
          console.error(error);
        }, () => {
          this.cargando = false;
          this.cargando2 = false;
        });
      });
    } else {
      this.cargando = false;
      this.cargando2 = false;
    }
  }

  private mostrarIncidencias (ind: number, movimiento: boolean) {
    // Lugar del marcador seleccionado en la variable INCIDENCIAS
    const orden = this.indices.indexOf(ind);
    // Cuando el tamaño sea el mismo entonces borramos quiere decir que se están mostrando todas => Borramos las activas.
    if (this.incidencias.length === this.incidenciasMostradas.length && this.primeraVez) {
      for (let i = 0; i < this.activos.length; i++) {
        this.activos[i] = false;
      }
    }
    this.primeraVez = false;
    // Vaciamos las mostradas para poder controlarlas.
    this.incidenciasMostradas = [];
    // Activamos el que corresponda.
    this.activos[orden] = movimiento;

    // Mostramos las incidencias que correspondan
    let mostramosTodas = true;
    for (let i = 0; i < this.activos.length; i++) {
      if (this.activos[i]) {
        mostramosTodas = false;
        this.incidenciasMostradas.push(this.incidencias[i]);
      }
    }
    if (mostramosTodas) {
      this.incidenciasMostradas = this.incidencias;
    }
  }

  private cargarIncidencias(res: any) {
    this.vaciarVariables();
    if (res && res.length > 0) {
      for (let i = 0; i < res.length; i++) {
        if (res[i].adjunto && res[i].adjunto.url) {
          // Contiene imagen adjunta
          this._conexion.getImagen(res[i].adjunto.url).pipe(take(1)).subscribe( (res2: any) => {
            const json = Object.assign({
              estado: this.esGestor ?
                this.estados[res[i].estadoActual - 1].estadoCadGestor : this.estados[res[i].estadoActual - 1].estadoCad,
              tipoAveriaTit: res[i].tipoAveria ? this.averias[res[i].tipoAveria - 1].titulo : '',
              fecha: moment.unix(res[i].fechaCreacion.seconds).format('DD-MM-YYYY') || '',
              imagen: res2,
            }, res[i]);
            this.final(json, res[i], i);
          });
        } else {
          const json = Object.assign({
            estado: this.esGestor ? this.estados[res[i].estadoActual - 1].estadoCadGestor : this.estados[res[i].estadoActual - 1].estadoCad,
            tipoAveriaTit: res[i].tipoAveria ? this.averias[res[i].tipoAveria - 1].titulo : '',
            fecha: moment.unix(res[i].fechaCreacion.seconds).format('DD-MM-YYYY') || '',
          }, res[i]);
          this.final(json, res[i], i);
        }
      }
    } else {
      this.cargando = false;
      this.cargando2 = false;
    }
  }

  private final (json: any, item: any, i: number) {
    const icono = {
      url: '../../../assets/iconos/marcadorBombilla32.png',
    };
    // Dibujamos los marcadores y su evento de clic
    const marcador = new google.maps.Marker({
      position: new google.maps.LatLng(item.ubicacion.lat, item.ubicacion.lng),
      map: this.map,
      title: item.averia,
      animation: google.maps.Animation.DROP,
      icon: icono,
      draggable: false
    });
    marcador.addListener('click', () => {
      if (marcador.getAnimation() !== null) {
        marcador.setAnimation(null);
        this.mostrarIncidencias(i, false);
      } else {
        marcador.setAnimation(google.maps.Animation.BOUNCE);
        this.mostrarIncidencias(i, true);
      }
    });
    this.marcadores.push(marcador);
    this.incidencias.push(json);
    this.incidenciasMostradas.push(json);
    this.indices.push(i);
    this.activos.push(true);
    this.cargando = false;
    this.cargando2 = false;
  }

  abrirDialogo (inc: any): void {
    const dialogRef = this.dialog.open(IncidenciaComponent, {
      width: '90%',
      height: '83%',
      data: inc
    });
    dialogRef.afterClosed().pipe(take(1)).subscribe( resultado => {
      if (resultado) {
        this.aplicarFiltro();
      }
    });
  }

  aplicarFiltro() {
    this.cargando2 = true;
    const fechaInicio = this.formaFiltro.controls['fechaInicio'].value;
    const fechaFin = this.formaFiltro.controls['fechaFin'].value;
    let filtradas = [];
      this._conexion.getIncidenciasFiltradas(this.formaFiltro.getRawValue()).pipe(take(1)).subscribe(res => {
      if (res) {
        if (fechaInicio && fechaFin) {
          for (const it of res) {
            if (moment.unix(it.fechaCreacion.seconds).isAfter(fechaInicio)
              && moment.unix(it.fechaCreacion.seconds).isBefore(fechaFin)) {
              filtradas.push(it);
            }
          }
        } else if (fechaInicio) {
          for (const it of res) {
            if (moment.unix(it.fechaCreacion.seconds).isAfter(fechaInicio)) {
              filtradas.push(it);
            }
          }
        } else if (fechaFin) {
          for (const it of res) {
            if (moment.unix(it.fechaCreacion.seconds).isBefore(fechaFin)) {
              filtradas.push(it);
            }
          }
        } else {
          filtradas = res;
        }
        filtradas = _.orderBy(filtradas, ['fechaCreacion']);
        this.cargarIncidencias(filtradas);
      }
    });
  }

  limpiarFiltro() {
    this.formaFiltro.setValue({
      estado: '',
      idAyto: '',
      idElectromur: '',
      adjunto: '',
      fechaInicio: '',
      fechaFin: '',
    });
  }

  deshacerFiltro() {
    this.cargando2 = true;
      this._conexion.getIncidencias(this.esGestor, this._autenticacion.getSesion().correo).pipe(take(1)).subscribe(res => {
      if (res) {
        res = _.orderBy(res, ['fechaCreacion']);
        this.cargarIncidencias(res);
      }
      this.formaFiltro.setValue({
        estado: 6,
        idAyto: '',
        idElectromur: '',
        adjunto: '',
        fechaInicio: '',
        fechaFin: '',
      });
    });
  }
}
