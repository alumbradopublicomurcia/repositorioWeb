import { Injectable, NgZone } from '@angular/core';
import { Usuario } from '../interfaces/usuario';
import { Rol } from '../interfaces/rol';
import { Fichero } from '../interfaces/fichero';
import { Incidencia } from '../interfaces/incidencia';
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from '@angular/fire/storage';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CambioEstado } from '../interfaces/cambioEstado';
import { pipe } from 'rxjs/index';
import { take } from 'rxjs/operators';
import { Averia } from '../interfaces/averia';

@Injectable({
  providedIn: 'root'
})
export class ConexionService {

  private CARPETA_IMAGENES = 'Adjuntos_incidencias';

  constructor(
    private _bd: AngularFirestore,
    private _storage: AngularFireStorage,
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private ruta: Router,
    private ngZone: NgZone,
    private _auth: AngularFireAuth) {

  }

  getRoles (): any {
    return this._bd.collection<Rol>('roles').valueChanges();
  }

  getAverias (): any {
    return this._bd.collection<Averia>('averias', ref => {
      let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
      query = query.orderBy('orden', 'asc');
      return query;
    }).valueChanges();
  }

  getRol (rol: string): any {
    return this._bd.collection('roles').doc(rol).snapshotChanges();
  }

  getEstado(id: number): any {
    return this._bd.collection('estados').doc(id.toString()).snapshotChanges();
  }

  getEstados (): any {
    return this._bd.collection<any>('estados', ref => {
      let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
      query = query.orderBy('orden', 'asc');
      return query;
    }).valueChanges();
  }

  guardarGestionConNuevoEstado (idIncidencia: string, nuevo: number, registro: CambioEstado[], datosIncidencia: Incidencia) {
    this._bd.collection('incidencias').doc(idIncidencia).update({
      cambioEstados: registro,
      estadoActual: nuevo,
      idElectromur: datosIncidencia.idElectromur,
      observaciones: datosIncidencia.observaciones,
      idAyto: datosIncidencia.idAyto,
      mensajeResolucion: datosIncidencia.mensajeResolucion
    }).then( () => this.finalizacionCorrecta(true)).catch( (err) => {
      console.error(err);
    });
  }

  guardarGestionIncidencia (idIncidencia: string, datosIncidencia: Incidencia) {
    this._bd.collection('incidencias').doc(idIncidencia).update({
      idElectromur: datosIncidencia.idElectromur,
      observaciones: datosIncidencia.observaciones,
      idAyto: datosIncidencia.idAyto,
      mensajeResolucion: datosIncidencia.mensajeResolucion
    }).then( () => {
      this.finalizacionCorrecta(true);
    }).catch( (err) => {
      console.error(err);
    });
  }

  async desvincularIncidencias (incidencias: any) {
    if (incidencias && incidencias.length > 0) {
      for (const inc of incidencias) {
          await this._bd.collection('incidencias').doc(inc.id).update({
            creador: null
          }).catch(err => console.error(err));
      }
    }
  }

  getUsuarios (): any {
    return this._bd.collection<Usuario>('usuarios').valueChanges();
  }

  getImagen (url: string): any {
    let profileUrl: Observable<string | null>;
    const ref = this._storage.ref(url);
    profileUrl = ref.getDownloadURL();
    return profileUrl;
  }

  eliminarUsario(correoUsuario: string) {
    if (correoUsuario) {
      this._bd.collection('usuarios').doc(correoUsuario).delete()
        .catch( err => console.error(err));
    }
  }

  // Obtenemos los datos del Usuario, pasando su identificador (correo)
  getUsuario(correoEntrada: string): any {
    return this._bd.collection('usuarios').doc(correoEntrada).snapshotChanges();
  }

  // Actualiza los datos del Usuario (id=correo)
  actualizarUsario(id: string, usuario: Usuario) {
    return this._bd.collection('usuarios').doc(id).set(usuario);
  }

   // Crea los usuarios en nuestra BBDD, donde almacenamos su informacion.
   insertarUsario(usuario: any) {
    const user: Usuario = usuario.value || null;
    if (user && user.correo) {
      this._bd.collection('usuarios').doc(user.correo).set({
        correo: user.correo || '',
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        telefono: user.telefono || '',
        rol: 'usuario', // Por defecto, todos los usuarios que se registren serán del tipo "USUARIO".
      }).then().catch(error => console.error('Error writing document: ', error));
    }
  }

  crearUsuarioIngresadoConGoogle(usuario: any) {
    const perfil = usuario.additionalUserInfo.profile || null;
    if (perfil && perfil.email ) {
      this._bd.collection('usuarios').doc(perfil.email).set({
        correo: perfil.email || '',
        nombre: perfil.given_name || '',
        apellidos: perfil.family_name || '',
        telefono: '',
        rol: 'usuario', // Por defecto, todos los usuarios que se registren serán del tipo "USUARIO".
      }).then().catch( error => console.error('Error writing document: ', error));
    }
  }

  nuevoMensajeBuzon(correo: string, mensaje: string) {
    this._bd.collection('buzon').add({
      correo: correo,
      mensaje: mensaje
    }).then( () => {
      let txt1 = '', txt2 = '';
      this.translate.get('BUZON.OK').pipe(take(1)).subscribe(res2 => txt1 = res2);
      this.translate.get('BUZON.GRACIAS').pipe(take(1)).subscribe(res2 => txt2 = res2);
      this.snackBar.open(txt1, txt2 , {duration: 5000});
      this.ngZone.run(() => this.ruta.navigate(['inicio'])).then();
    }).catch( err => console.error(err));
  }

  /**
   * Guardamos la incidencia en la bd y posteriormente la imagen en el CloudStorage
   */
  guardarIncidencia(incidencia: any): any {
    const that = this;
    const inci: Incidencia = incidencia.value || null;
    const correoCreador = that._auth.auth.currentUser.providerData[0].email;
    if (inci) {
      that._bd.collection('incidencias').add({
        adjunto: {
          existe: false,
          nombreArchivo: null,
          url: null
        },
        creador: correoCreador || '',
        fechaCreacion: new Date(),
        tipoAveria: inci.tipoAveria || 0,
        estadoActual: 1, // Primer estado: Inicial, creada
        direccion: inci.direccion || '',
        averia: inci.averia || '',
        ubicacion: inci.ubicacion || null,
        localidad: inci.localidad || '',
        codigoPostal: inci.codigoPostal || 0,
        cambioEstados: [],
        // Opcionales
        punto: inci.punto || '',
        observaciones: inci.observaciones || ''
      }).then(function(res: any) {
        // Si tiene adjunto y se ha creado la incidencias => subimos adjunto y lo asociamos a la incidencia.
        if (inci.adjunto) {
          that.guardarAdjunto(inci.adjunto, res.id);
        } else {
          that.anyadirIdIncidencia(res.id);
          that.finalizacionCorrecta(false);
        }
      })
      .catch(function(error) {
        console.error('Error writing document: ', error);
      });
    }
  }

  /* Función: Guarda adjunto en el Storage
   * Es ejecutada una vez que las incidencias ya han sido guardadas en el BBDD.
   * Acutalizamos BBDD con la URL que enlaza DataBase con Storage.
   */
  private guardarAdjunto(imagen: Fichero, idIncidencia: string) {
    const ruta = `${this.CARPETA_IMAGENES}/${idIncidencia}`;
    this._storage.upload(ruta, imagen.archivo)
      .then( () => {
          this._bd.collection('incidencias').doc(idIncidencia).update({
            adjunto: {
              existe: true,
              nombreArchivo: imagen.nombreArchivo,
              url: ruta
            }
          });
          this.anyadirIdIncidencia(idIncidencia);
          this.finalizacionCorrecta(false);
      }).catch( (err) => {
          console.error('Error al subir el fichero', err);
          this._bd.collection('incidencias').doc(idIncidencia).update({
            adjunto: {
              existe: true,
              nombreArchivo: imagen.nombreArchivo,
              url: 'Error en la subida de la imagen'
            }
          });
      });
  }

  private anyadirIdIncidencia (idIncidencia: string) {
     this._bd.collection('incidencias').doc(idIncidencia).update({
      id: idIncidencia
    });
  }

  // Incidencia guardada correctamente.
  finalizacionCorrecta(modificacion: boolean) {
    let txt1 = '', txt2 = '';
    if (modificacion) {
      this.translate.get('INCI.INCI_ACTU_OK').pipe(take(1)).subscribe(res1 => txt1 = res1);
    } else {
      this.ngZone.run(() => this.ruta.navigate(['incidencias'])).then();
      this.translate.get('INCI.INCI_OK').pipe(take(1)).subscribe(res1 => txt1 = res1);
    }
    this.translate.get('INCI.GRACIAS').pipe(take(1)).subscribe(res2 => txt2 = res2);
    this.snackBar.open(txt1, txt2 , {duration: 5000});
  }

  /**
   * Obtiene todas las incidencias excepto las archivadas o finalizadas para los gestores.
   * Todas las incidencias para los gestores.
   * @esGestor: solo los usuarios del tipo gestor pueden ver todas las incidencias.
   */
  getIncidencias(esGestor: boolean, correoUsuario: string) {
    if (esGestor) {
      return this._bd.collection<Incidencia>('incidencias', ref => {
        let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
        query = query.where('estadoActual', '<', 4);
        query = query.orderBy('estadoActual', 'asc');
        query = query.orderBy('fechaCreacion', 'asc');
        return query;
      }).valueChanges();
    } else {
      return this._bd.collection<Incidencia>('incidencias', ref => {
        let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
        query = query.where('creador', '==', correoUsuario);
        return query;
      }).valueChanges();
    }
  }

  /**
   * Obtiene todas las incidencias según el filtro aplicado
   */
  getIncidenciasFiltradas(filtro: any) {
    return this._bd.collection<Incidencia>('incidencias', ref => {
      let query: firebase.firestore.CollectionReference | firebase.firestore.Query = ref;
      if (filtro) {
        if (filtro && filtro.adjunto === 2) {
          query = query.where('adjunto.existe', '==', true);
        } else if (filtro && filtro.adjunto === 1) { // Sin adjunto
          query = query.where('adjunto.existe', '==', false);
        }
        if (filtro.idAyto) {
          query = query.where('idAyto', '==', filtro.idAyto);
        }
        if (filtro.idElectromur) {
          query = query.where('idElectromur', '==', filtro.idElectromur);
        }

        switch (filtro.estado) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            query = query.where('estadoActual', '==', filtro.estado);
            break;
          case 6: // No finalizadas
            query = query.where('estadoActual', '>=', 1).where('estadoActual', '<=', 3);
            query = query.orderBy('estadoActual', 'asc');
            break;
          case 7: // Finalizadas
            query = query.where('estadoActual', '>=', 4).where('estadoActual', '<=', 5);
            query = query.orderBy('estadoActual', 'asc');
            break;
          default: // Todos los estados
            break;
        }
        query = query.orderBy('fechaCreacion', 'asc');
      }
      return query;
    }).valueChanges();
  }
}
