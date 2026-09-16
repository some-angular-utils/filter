import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnDestroy, Optional, ViewEncapsulation } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CustomInputComponent } from '../custom-input/custom-input.component';
import { DropdownCoordinatorService } from '../../services/dropdown-coordinator.service';

// Estilos de animación disponibles para el drag & drop de "Criterios de Ordenación".
// Se controlan variando la curva/duración de la transición CSS que anima el "hacer hueco" al
// arrastrar y el "asentado" al soltar (ver getRowTranslatePx() y onOrderPointerUp()); 'none'
// además desactiva también el "pop" (scale/rotate/sombra) de coger la fila.
export type SAUOrderDragAnimation = 'spring' | 'smooth' | 'fast' | 'none';

export const SAU_ORDER_DRAG_ANIMATIONS: { value: SAUOrderDragAnimation; label: string }[] = [
  { value: 'spring', label: 'Muelle' },
  { value: 'smooth', label: 'Suave' },
  { value: 'fast', label: 'Rápida' },
  { value: 'none', label: 'Ninguna' },
];

const ORDER_DRAG_ANIMATION_PRESETS: Record<SAUOrderDragAnimation, { duration: string; easing: string }> = {
  spring: { duration: '0.28s', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  smooth: { duration: '0.22s', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  fast: { duration: '0.12s', easing: 'ease-out' },
  none: { duration: '0s', easing: 'linear' },
};

@Component({
  selector: 'sau-filter-button',
  templateUrl: './filter-button.component.html',
  styleUrls: ['./filter-button.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [ReactiveFormsModule, CustomInputComponent],
})
export class FilterButtonComponent implements OnInit, OnDestroy {

  @Input() searchButtonText = 'Buscar';
  @Input() orderTitle = 'Criterios de Ordenación';
  @Input() dragAnimation: SAUOrderDragAnimation = 'spring';
  @Input() orderByFields: { field: string; label: string }[] = [];
  @Input() sortOrderGroup!: FormGroup;
  @Input() hiddenCount = 0;
  @Output() search = new EventEmitter<void>();
  @Output() showHidden = new EventEmitter<boolean>();

  public showOrderDropdown = false;
  public showAllFilters = false;
  private openedSubscription?: Subscription;

  // Estado del drag & drop para reordenar los criterios de "Criterios de Ordenación".
  // Usamos mousedown/mousemove/mouseup (+ sus equivalentes touch) en vez de la Drag & Drop API
  // nativa de HTML5: esta última requiere dataTransfer, se cancela con facilidad si el drag
  // arranca sobre un elemento interactivo anidado (el checkbox de custom-input) y no funciona
  // en absoluto con touch — cosas que hacían que el drag no arrancara de forma fiable.
  // El orden resultante se refleja mutando in-place el array `orderByFields` recibido por @Input:
  // sau-filter (filter.ts) recibe la misma referencia y la usa, en ese orden, para priorizar los
  // segmentos de la query de ordenación al procesar el filtro — no hace falta ningún @Output.
  public draggedIndex: number | null = null;
  public dragOverIndex: number | null = null;
  public dragOffsetPx = 0;
  private dragStartClientY = 0;
  private rowHeight = 0;
  private initialRowTops: number[] = [];

  // Tras soltar y reordenar el array, la fila dropeada "asienta" en su nueva posición con un
  // pequeño ajuste FLIP (ver onOrderPointerUp): arranca exactamente donde el puntero la dejó
  // visualmente y se anima hasta 0, en vez de saltar de golpe a la posición final.
  public settlingIndex: number | null = null;
  public settlingOffsetPx = 0;
  public settlingImmediate = false;

  constructor(private elementRef: ElementRef, @Optional() private coordinator?: DropdownCoordinatorService) {}

  ngOnInit() {
    // Si un custom-select/custom-input/date-range-picker del mismo <sau-filter> se abre, cerramos este popover.
    // Excepción: los custom-input de "Criterios de Ordenación" viven dentro de este propio popover y también
    // avisan al coordinador al hacer clic (para cerrar otros desplegables abiertos) — si no los excluimos aquí,
    // el popover se cerraría a sí mismo en cuanto se pulsa cualquiera de sus checkboxes.
    this.openedSubscription = this.coordinator?.opened$.subscribe(source => {
      if (source === this || !this.showOrderDropdown) {
        return;
      }

      const sourceElement = (source as { elementRef?: ElementRef })?.elementRef?.nativeElement;
      if (sourceElement && this.elementRef.nativeElement.contains(sourceElement)) {
        return;
      }

      this.showOrderDropdown = false;
    });
  }

  ngOnDestroy() {
    this.openedSubscription?.unsubscribe();
    this.removeOrderPointerListeners();
  }

  public hasOrderFields(): boolean {
    return !!(this.orderByFields && this.orderByFields.length > 0);
  }

  public get orderTransitionDuration(): string {
    return (ORDER_DRAG_ANIMATION_PRESETS[this.dragAnimation] ?? ORDER_DRAG_ANIMATION_PRESETS['spring']).duration;
  }

  public get orderTransitionEasing(): string {
    return (ORDER_DRAG_ANIMATION_PRESETS[this.dragAnimation] ?? ORDER_DRAG_ANIMATION_PRESETS['spring']).easing;
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth >= 576 && !this.showAllFilters) {
      this.showAllFilters = true;
      this.showHidden.emit(true);
    }
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showOrderDropdown = false;
    }
  }

  toggleOrderDropdown(event: MouseEvent) {
    event.stopPropagation();
    if (this.hasOrderFields()) {
      this.showOrderDropdown = !this.showOrderDropdown;
      if (this.showOrderDropdown) {
        this.coordinator?.notifyOpened(this);
      }
    }
  }

  toggleHidden() {
    this.showAllFilters = !this.showAllFilters;
    this.showHidden.emit(this.showAllFilters);
  }

  onSearch() {
    this.showOrderDropdown = false;
    this.search.emit();
  }

  onOrderHandlePointerDown(event: MouseEvent | TouchEvent, index: number): void {
    // Evita selección de texto / scroll de la página mientras se arrastra.
    event.preventDefault();

    const rows = this.getOrderRows();
    // Medimos las posiciones "en reposo" (sin transformar) una sola vez al coger la fila: como
    // solo desplazamos visualmente con CSS `translate` (que no afecta al layout), estas siguen
    // siendo válidas durante todo el gesto aunque otras filas se vayan desplazando para hacer hueco.
    this.initialRowTops = rows.map(row => row.getBoundingClientRect().top);
    this.rowHeight = rows[index]?.getBoundingClientRect().height || 0;

    const clientY = this.clientYFromEvent(event);
    this.dragStartClientY = clientY ?? 0;
    this.dragOffsetPx = 0;
    this.draggedIndex = index;
    this.dragOverIndex = index;

    // Cancela cualquier animación de "asentado" pendiente de un drag anterior.
    this.settlingIndex = null;
    this.settlingOffsetPx = 0;
    this.settlingImmediate = false;

    document.addEventListener('mousemove', this.onOrderPointerMove);
    document.addEventListener('mouseup', this.onOrderPointerUp);
    document.addEventListener('touchmove', this.onOrderPointerMove, { passive: false });
    document.addEventListener('touchend', this.onOrderPointerUp);
  }

  // Desplazamiento (en px) que debe aplicarse a la fila `index` para animar el "coger y soltar":
  // la fila arrastrada sigue al puntero 1:1, las filas que quedan entre su posición original y la
  // posición sobre la que se está soltando se apartan un `rowHeight` para hacerle hueco, y tras
  // soltar, la fila dropeada usa `settlingIndex`/`settlingOffsetPx` para el ajuste fino (ver
  // onOrderPointerUp) en vez de saltar directamente a 0.
  public getRowTranslatePx(index: number): number {
    if (this.draggedIndex !== null) {
      if (index === this.draggedIndex) return this.dragOffsetPx;
      if (this.dragOverIndex === null) return 0;

      if (this.draggedIndex < this.dragOverIndex) {
        return index > this.draggedIndex && index <= this.dragOverIndex ? -this.rowHeight : 0;
      }
      if (this.draggedIndex > this.dragOverIndex) {
        return index >= this.dragOverIndex && index < this.draggedIndex ? this.rowHeight : 0;
      }
      return 0;
    }

    return index === this.settlingIndex ? this.settlingOffsetPx : 0;
  }

  // Referencias estables (arrow functions) para poder añadir/quitar el mismo listener en document.
  private readonly onOrderPointerMove = (event: MouseEvent | TouchEvent): void => {
    if (this.draggedIndex === null) return;
    event.preventDefault();

    const clientY = this.clientYFromEvent(event);
    if (clientY === undefined) return;

    this.dragOffsetPx = clientY - this.dragStartClientY;

    let targetIndex = this.draggedIndex;
    for (let i = 0; i < this.initialRowTops.length; i++) {
      const top = this.initialRowTops[i];
      if (clientY >= top && clientY <= top + this.rowHeight) {
        targetIndex = i;
        break;
      }
    }
    this.dragOverIndex = targetIndex;
  };

  private readonly onOrderPointerUp = (): void => {
    const draggedIndex = this.draggedIndex;
    const dragOverIndex = this.dragOverIndex;

    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Ajuste FLIP: dónde está la fila visualmente ahora mismo vs. dónde caerá su nueva posición
      // de reposo, para que el settle arranque desde ahí y no dé un salto al reordenar el array.
      const visualTop = this.initialRowTops[draggedIndex] + this.dragOffsetPx;
      const newRestTop = this.initialRowTops[dragOverIndex];

      const reordered = [...this.orderByFields];
      const [moved] = reordered.splice(draggedIndex, 1);
      reordered.splice(dragOverIndex, 0, moved);
      this.orderByFields.splice(0, this.orderByFields.length, ...reordered);

      this.settlingIndex = dragOverIndex;
      this.settlingOffsetPx = visualTop - newRestTop;
      this.settlingImmediate = true;

      // Doble rAF: la primera confirma que el navegador pintó el "salto" sin transición antes de
      // habilitar la transición y llevar el offset a 0 en el segundo frame (patrón FLIP estándar).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.settlingImmediate = false;
          this.settlingOffsetPx = 0;
        });
      });
    }

    this.resetDragState();
    this.removeOrderPointerListeners();
  };

  private resetDragState(): void {
    this.draggedIndex = null;
    this.dragOverIndex = null;
    this.dragOffsetPx = 0;
    this.initialRowTops = [];
  }

  private removeOrderPointerListeners(): void {
    document.removeEventListener('mousemove', this.onOrderPointerMove);
    document.removeEventListener('mouseup', this.onOrderPointerUp);
    document.removeEventListener('touchmove', this.onOrderPointerMove);
    document.removeEventListener('touchend', this.onOrderPointerUp);
  }

  private getOrderRows(): HTMLElement[] {
    return Array.from(this.elementRef.nativeElement.querySelectorAll('.sau-filter__order-row'));
  }

  private clientYFromEvent(event: MouseEvent | TouchEvent): number | undefined {
    return event instanceof MouseEvent ? event.clientY : event.touches[0]?.clientY;
  }
}
