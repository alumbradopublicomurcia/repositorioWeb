import { Fichero } from './fichero';
import { CambioEstado } from './cambioEstado';

export interface Incidencia {
    id?: string;
    creador: string;
    fechaCreacion: any;
    estadoActual: number;
    direccion: string;
    averia: string;
    tipoAveria: number;
    ubicacion: any;
    localidad: string; // Localidad o barrio.
    codigoPostal: number;
    cambioEstados: CambioEstado []; // Para controlar quién y cuando cambia de estado.
    /*----- Opcionales usuario -----*/
    punto?: string;
    adjunto?: Fichero;
    /*----- Opcionales gestor -----*/
    idElectromur?: number;
    idAyto?: number;
    observaciones?: string;
    /*----- Provisional -----*/
    mensajeResolucion?: string;
}
