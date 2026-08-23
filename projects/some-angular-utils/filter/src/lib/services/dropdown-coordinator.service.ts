import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Coordina el cierre de los distintos desplegables (custom-select, custom-input,
 * sau-date-range-picker) de un mismo `<sau-filter>`. Cada uno hace stopPropagation()
 * al abrirse, así que el clickOut() de document de los demás nunca se dispara;
 * sin este servicio, dos desplegables abiertos a la vez se quedan ambos abiertos.
 */
@Injectable()
export class DropdownCoordinatorService {
  private readonly openedSource = new Subject<unknown>();
  readonly opened$ = this.openedSource.asObservable();

  notifyOpened(source: unknown): void {
    this.openedSource.next(source);
  }
}
