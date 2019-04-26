import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { FormBuilder, FormGroup, FormControl, Validators} from '@angular/forms';
import { Usuario } from '../../interfaces/usuario';
import { ConexionService } from '../../services/conexion.service';
import { TranslateService } from '@ngx-translate/core';
import { Rol } from 'src/app/interfaces/rol';
import { pipe } from 'rxjs/index';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-nuevo-usuario',
  templateUrl: './nuevo-usuario.component.html',
  styleUrls: ['./nuevo-usuario.component.css']
})
export class NuevoUsuarioComponent implements OnInit {
  hide = true;
  forma: FormGroup;
  roles: Rol[] = [];

  formaUsuario: FormGroup = new FormGroup({
    nombre: new FormControl(''),
    apellidos: new FormControl(''),
    correo: new FormControl('', [Validators.required, Validators.email]),
    telefono: new FormControl(''),
    rol: new FormControl('')
  });

  constructor(
    public fb: FormBuilder,
    public translate: TranslateService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<NuevoUsuarioComponent>,
    private _conexion: ConexionService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this._conexion.getRoles().pipe(take(1)).subscribe(res => {
        this.roles = res;
        if (data) {
          this.formaUsuario.setValue({
            nombre: data.nombre || '',
            apellidos: data.apellidos || '',
            correo: data.correo || '',
            telefono: data.telefono || '',
            rol: data.rol || '',
          });
        }
      });
    }

  ngOnInit() {}

  guardarUsuario () {
    if (this.formaUsuario.valid) {
      const usuario: Usuario = {
        correo: this.formaUsuario.controls['correo'].value,
        nombre: this.formaUsuario.controls['nombre'].value,
        apellidos: this.formaUsuario.controls['apellidos'].value,
        telefono: this.formaUsuario.controls['telefono'].value,
        rol: this.formaUsuario.controls['rol'].value
      };
      let txt1 = '', txt2 = '';
      this._conexion.actualizarUsario(usuario.correo, usuario)
        .then( () => {
          this.translate.get('CORRECTA').pipe(take(1)).subscribe(res2 => txt1 = res2);
          this.translate.get('CUENTA.GUARDADO').pipe(take(1)).subscribe(res3 => txt2 = res3);
          this.snackBar.open(txt1, txt2 , {duration: 5000});
        }).catch( () => {
          this.translate.get('INCORRECTA').pipe(take(1)).subscribe(res2 => txt1 = res2);
          this.translate.get('CUENTA.NO_GUARDADO').pipe(take(1)).subscribe(res3 => txt2 = res3);
          this.snackBar.open(txt1, txt2 , {duration: 5000});
        });
    }
    this.cancelarDialogo();
  }

  cancelarDialogo (): void {
    this.dialogRef.close();
  }
}
