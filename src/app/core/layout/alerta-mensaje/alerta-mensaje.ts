import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ErrorHttp } from '../../api/errores';

export type TipoAlerta = 'error' | 'exito' | 'info';

export interface ErrorCampoItem {
  campo: string;
  mensaje: string;
}

@Component({
  selector: 'app-alerta-mensaje',
  templateUrl: './alerta-mensaje.html',
  styleUrl: './alerta-mensaje.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertaMensaje {
  readonly error = input<ErrorHttp | null>(null);
  readonly tipo = input<TipoAlerta>('error');
  readonly mensaje = input<string | null>(null);
  readonly cerrable = input(false);
  readonly cerrado = output<void>();

  protected readonly tipoEfectivo = computed<TipoAlerta>(() =>
    this.error() ? 'error' : this.tipo(),
  );
  protected readonly textoPrincipal = computed(
    () => this.error()?.mensaje ?? this.mensaje() ?? null,
  );
  protected readonly listaErroresCampo = computed<readonly ErrorCampoItem[]>(() => {
    const mapa = this.error()?.erroresCampo;
    if (!mapa) return [];
    return Object.entries(mapa).map(([campo, mensaje]) => ({ campo, mensaje }));
  });
}
