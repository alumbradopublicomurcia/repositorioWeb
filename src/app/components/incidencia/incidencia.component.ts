import { Component, OnInit, Inject } from '@angular/core';
import { ConexionService } from 'src/app/services/conexion.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormControl } from '@angular/forms';
import { CambioEstado } from '../../interfaces/cambioEstado';
import { AutenticacionService } from '../../services/autenticacion.service';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { pipe } from 'rxjs/index';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-incidencia',
  templateUrl: './incidencia.component.html',
  styleUrls: ['./incidencia.component.css']
})
export class IncidenciaComponent implements OnInit {
  formaIncidencia: FormGroup = new FormGroup({
    estado: new FormControl({value: '', disabled: true}),
    observaciones: new FormControl(''),
    estadoActual: new FormControl(''),
    nuevoEstado: new FormControl(''),
    idElectromur: new FormControl(''),
    idAyto: new FormControl(''),
    mensajeResolucion: new FormControl('')
  });
  deshabilitarBtn = false;
  estados = []; // Utilizado para el combo de Estados.
  datosIncidencia: any;
  datosTabla = [];
  mostrarInfo = false;
  datosUsuario = {
    correo: '',
    nombre: '',
    apellidos: '',
    telefono: ''
  };

  constructor(private _conexion: ConexionService,
              private _autenticacion: AutenticacionService,
              public dialogRef: MatDialogRef<IncidenciaComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.cargarCamposIniciales(data);
    this.datosIncidencia = data;
    this.rellenarTabla();
    this.cargarEstados();
    this.cargarInfoUsuario();
  }

  ngOnInit() {
  }


  private rellenarTabla() {
    if (this.datosIncidencia.cambioEstados.length > 0 ) {
      for (const it of this.datosIncidencia.cambioEstados) {
        const fecha: string = moment.unix(it.fecha.seconds).format('DD-MM-YYYY - HH:mm');
        const json = {
          estadoInicial: it.estadoInicial,
          estadoFinal: it.estadoFinal,
          usuario: it.usuario,
          fechaFormateada: fecha
        };
        this.datosTabla.push(json);
      }
    }
  }

  private cargarCamposIniciales (data: any) {
    if (data) {
      this.formaIncidencia.setValue({
        estado: data.estado || '',
        observaciones: data.observaciones || '',
        estadoActual: data.estadoActual || '',
        idElectromur: data.idElectromur || '',
        idAyto: data.idAyto || '',
        nuevoEstado: '',
        mensajeResolucion: data.mensajeResolucion ? data.mensajeResolucion : '',
      });
    }
  }

  private cargarEstados() {
      this._conexion.getEstados().pipe(take(1)).subscribe(res => {
      this.estados = [];
      for (const it of res) {
        if (it.id !== this.formaIncidencia.controls['estadoActual'].value) {
          const json = {
            suma: `${it.orden} - ${it.estado} - ${it.descripcion}`,
            id: it.id
          };
          this.estados.push(json);
        }
      }
    });
  }

  private cargarInfoUsuario() {
    if (this.datosIncidencia && this.datosIncidencia.creador) {
      this._conexion.getUsuario(this.datosIncidencia.creador).pipe(take(1)).subscribe( usu => {
        if (usu) {
          this.datosUsuario.nombre = usu.payload.get('nombre');
          this.datosUsuario.apellidos = usu.payload.get('apellidos');
          this.datosUsuario.correo = usu.payload.get('correo');
          this.datosUsuario.telefono = usu.payload.get('telefono');
        }
      });
    }
    // Usuario dado de baja
  }

  guardarGestion() {
    if (this.formaIncidencia.valid) {
      this.deshabilitarBtn = true;
      const estadoFinal = Number(this.formaIncidencia.controls['nuevoEstado'].value);
      const estadoInicial = Number(this.formaIncidencia.controls['estadoActual'].value);
      let nuevoEstado: CambioEstado = null;
      const registroEstados: CambioEstado[] = this.datosIncidencia.cambioEstados ?
        this.datosIncidencia.cambioEstados : [];
      if (estadoFinal !== 0) {
        nuevoEstado = {
          estadoInicial: estadoInicial,
          estadoFinal: estadoFinal,
          fecha: new Date(),
          usuario: this._autenticacion.getSesion().correo
        };
        registroEstados.push(nuevoEstado);
        this._conexion.guardarGestionConNuevoEstado(
          this.datosIncidencia.id, nuevoEstado.estadoFinal, registroEstados, this.formaIncidencia.value);
      } else {
        this._conexion.guardarGestionIncidencia(this.datosIncidencia.id, this.formaIncidencia.value);
      }
      this.dialogRef.close(true);
    }
  }

  cancelarDialogo (): void {
    this.dialogRef.close(false);
  }
}

