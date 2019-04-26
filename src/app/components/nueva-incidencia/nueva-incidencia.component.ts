import { Component, OnInit, ViewChild, NgZone, ElementRef } from '@angular/core';
import { ConexionService } from 'src/app/services/conexion.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
declare const google: any;
import { Marcador } from 'src/app/interfaces/marcador';
import { Fichero } from 'src/app/interfaces/fichero';
import { Router } from '@angular/router';
import { GooglePlaceDirective } from 'ngx-google-places-autocomplete';
import { Averia } from 'src/app/interfaces/averia';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-nueva-incidencia',
  templateUrl: './nueva-incidencia.component.html',
  styleUrls: ['./nueva-incidencia.component.css']
})
export class NuevaIncidenciaComponent implements OnInit {
  averias: Averia[];
  mensaje = '';
  cargando = true;
  urlImagenEtiqueta;
  mostrarError = false;
  mostrarAyuda = false;
  guardando = false;
  formaIncidencia: FormGroup;
  mostrarInfo = false;
  mostrarErrorLocalizacion = 0;
  limites = {
    north: 38.117800,
    south: 37.716834,
    east: -0.847000,
    west: -1.406374
  };
  coordenadasIniciales = new google.maps.LatLng( 37.990248, -1.124005);
  limitesBuscador = new google.maps.LatLngBounds(
    new google.maps.LatLng(this.limites.south, this.limites.west),
    new google.maps.LatLng(this.limites.north, this.limites.east)
  );
  opcionesInput = {
    types: [],
    language: 'es',
    bounds: this.limitesBuscador,
    componentRestrictions: {
      country: 'ES',
    },
    strictBounds: true
  };

  // Mapa
  @ViewChild('gmap') gmapElement: any;
  map: google.maps.Map;
  // Marcador
  marcador: google.maps.Marker;

  // Autocompletado en la dirección a buscar
  @ViewChild('placesRef') placesRef: GooglePlaceDirective;
  @ViewChild('alerta') alerta: ElementRef;

  constructor(private _conexion: ConexionService,
              private ruta: Router,
              public ngZone: NgZone) {

    this.formaIncidencia = new FormGroup({
      direccion: new FormControl('', [Validators.required]),
      punto: new FormControl(''),
      tipoAveria: new FormControl (''),
      adjunto: new FormControl(''),
      ubicacion: new FormControl('', [Validators.required]),
      localidad: new FormControl('', [Validators.required]),
      codigoPostal: new FormControl('', [Validators.required, this.validarCodigoPostal]),
      averia: new FormControl('', [Validators.required, Validators.minLength(10)]),
      observaciones: new FormControl('')
    });

    // Obtenemos imagen de la numeración.
    //this._conexion.getImagen('Etiqueta.jpg').pipe(take(1)).subscribe( img => this.urlImagenEtiqueta = img);

    this.cargarAverias();
  }

  ngOnInit() {
    this.mostrarMapa();
    // Clic del mapa
    google.maps.event.addListener(this.map, 'click', (event: google.maps.MouseEvent) => {
      if (event && event.latLng) {
        this.dibujarMarcador(event.latLng);
        this.mostrarError = false;
      }
    });
  }

  private cargarAverias () {
    this._conexion.getAverias().pipe(take(1)).subscribe(res => {
      this.averias = res;
      this.cargando = false;
    });
  }

  private mostrarMapa() {
    this.map = new google.maps.Map(this.gmapElement.nativeElement, {
      center: this.coordenadasIniciales,
      zoom: 14,
      minZoom: 9,
      clickableIcons: false,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      restriction: {
        latLngBounds: this.limites,
        strictBounds: false,
      }
    });
  }

  public cambiaAdjunto(files: any) {
    if (files) {
      const imagen: Fichero = {
        archivo: files[0],
        nombreArchivo: files[0].name,
        url: ''
      };
      this.formaIncidencia.patchValue({
        adjunto: imagen
      });
    }
  }

  public crearNuevaIncidencia() {
    if (this.formaIncidencia.valid) {
      this.guardando = true;
      this.cargando = true;
      this._conexion.guardarIncidencia(this.formaIncidencia);
    } else if (!this.formaIncidencia.value.ubicacion) {
      this.mostrarError = true;
    }
    this.cargando = false;
  }
  public cancelar() {
    this.ngZone.run(() => this.ruta.navigate(['incidencias'])).then();
  }

  public cambiaDireccion(entrada: any) {
    if (entrada && entrada.geometry && entrada.geometry.location) {
      this.dibujarMarcador(entrada.geometry.location);
    } else {
      this.mostrarErrorLocalizacion = 1;
    }
  }

  public buscarUbicacion() {
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((posicion) => {
        this.mostrarPosicionActual(posicion);
      }, () => this.mostrarErrorLocalizacion = 2);
    } else {
      this.mostrarErrorLocalizacion = 2;
    }
  }

  public cerrarAlerta() {
    this.alerta.nativeElement.classList.remove('show');
  }

  private mostrarPosicionActual(posicion) {
    if (posicion) {
      const location = new google.maps.LatLng(posicion.coords.latitude, posicion.coords.longitude);
      this.map.panTo(location);
      this.dibujarMarcador(location);
    }
  }

  private dibujarMarcador(coordenadas: google.maps.LatLng) {
    if (!this.marcador) {
      this.marcador = new google.maps.Marker({
        position: coordenadas,
        map: this.map,
        title: 'Ubicación de la incidencia',
        draggable: false
      });
    } else {
      this.marcador.setPosition(coordenadas);
    }

    const ubicacion: Marcador = {
      lat: coordenadas.lat(),
      lng: coordenadas.lng()
    };

    // Hacemos un "vuelo" y zoom hasta la ubicación.
    this.map.panTo(ubicacion);
    this.map.setZoom(19);

    // Completamos la dirección, una vez dibujado el marcador
    this.obtenerDireccion(ubicacion);
  }

  private obtenerDireccion (ubicacion: Marcador) {
    const geocoder = new google.maps.Geocoder;
    const that = this;
    geocoder.geocode({'location': {
      lat: ubicacion.lat || 0,
      lng: ubicacion.lng || 0
    } }, function(res, estado) {
      if (estado === 'OK') {
        if (res[0]) {
          that.formaIncidencia.patchValue({
            ubicacion: ubicacion,
            direccion: res[0].formatted_address || '',
            localidad: res[0].address_components[2] ? res[0].address_components[2].long_name || '' : '',
            codigoPostal: res[0].address_components[6] ? res[0].address_components[6].long_name || '' : ''
          });
        } else {
          this.mostrarErrorLocalizacion = 1;
        }
      } else {
        this.mostrarErrorLocalizacion = 1;
      }
    });
  }

  private validarCodigoPostal(forma: FormControl): {[s: string]: boolean} {
    // Códigos postales de la ciudad de Murcia, barrios y pedanías.
    const codigosPostales = [30000, 30001, 30002, 30003, 30004, 30005, 30006, 30007, 30008, 30009, 30010, 30011,
        30012, 30100, 30107, 30108, 30110, 30120, 30139, 30150, 30151, 30152, 30153, 30154, 30155, 30156, 30157,
        30158, 30160, 30161, 30162, 30163, 30164, 30165, 30166, 30167, 30168, 30169, 30179, 30331, 30570, 30579,
        30580, 30588, 30589, 30590, 30592, 30750, 30826, 30830, 30831, 30832, 30833, 30834, 30835, 30836, 30837,
        30850, 30883];
    for (let i = 0; i < codigosPostales.length; i++) {
      const codigoNum: number = Number(forma.value);
      if (codigosPostales[i] === codigoNum) {
        return null;
      }
    }
    // No coincide el código postal
    return {noValido: true};
  }

  cambiaTipoAveria (averia: any) {
    this.mostrarAyuda = averia === 1 ? true : false;
  }

}
