export interface CambioEstado {
    estadoInicial: number;
    estadoFinal: number;
    fecha: Date;
    usuario: string; // idUsuario (correo) de quien realiza el cambio.
}
