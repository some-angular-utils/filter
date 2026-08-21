import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Coordina la apertura de los distintos `custom-select` de un mismo `<sau-filter>`.
 * openDropdown() hace stopPropagation(), así que el click nunca llega a document y
 * el clickOut() de los demás selects nunca se dispara; sin este servicio, dos
 * selects abiertos a la vez se quedan ambos abiertos.
 */
@Injectable()
export class SelectCoordinatorService {
  private readonly openedSource = new Subject<unknown>();
  readonly opened$ = this.openedSource.asObservable();

  notifyOpened(source: unknown): void {
    this.openedSource.next(source);
  }
}
