import { Rol } from './rol';
import { Permiso } from './permiso';
export interface RolPermisos {
    id: number;
    rol: Rol;
    permiso: Permiso;
}
