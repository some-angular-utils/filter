import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'custom-input',
  templateUrl: './custom-input.component.html',
  styleUrl: './custom-input.component.scss',
  imports: [ReactiveFormsModule]
})
export class CustomInputComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';

  // Textos de estado
  @Input() trueLabel = 'Activo';
  @Input() falseLabel = 'Inactivo';
  @Input() nullLabel = 'Sin especificar';

  // Nuevos inputs para personalizar los iconos del tirador (por defecto los de checkbox)
  @Input() trueIcon = '✓';
  @Input() falseIcon = '✕';
  @Input() nullIcon = '•';

  private _formControlItem!: AbstractControl;
  inputControl!: FormControl;

  @Input() set formControlItem(ctrl: AbstractControl) {
    this._formControlItem = ctrl;
    this.inputControl = ctrl as FormControl;

    if (this.inputControl) {
      if (this.type === 'checkbox') {
        // Normalizamos el valor inicial de forma estricta
        const sanitized = this.normalizeTriStateValue(this.inputControl.value);
        this.inputControl.setValue(sanitized, { emitEvent: false });
      } else {
        this.inputControl.setValue(this.inputControl.value, { emitEvent: false });
      }
    }
  }

  get formControlItem() {
    return this._formControlItem;
  }

  @Output() onClick = new EventEmitter<any>();

  doClick() {
    this.onClick.emit();
  }

  /**
   * Mapea de forma estricta las entradas para evitar que 'falsys' de JS 
   * como el string vacío o el número 0 se confundan con null/undefined.
   */
  private normalizeTriStateValue(value: any): boolean | undefined {
    // Si es explícitamente null o undefined, devolvemos undefined (Sin especificar)
    if (value === null || value === undefined) {
      return undefined;
    }

    // Si viene de una API o un formato string
    if (typeof value === 'string') {
      const cleanStr = value.trim().toLowerCase();
      if (cleanStr === 'true' || cleanStr === '1') return true;
      if (cleanStr === 'false' || cleanStr === '0') return false;
      if (cleanStr === '') return undefined; // Un input vacío externo se vuelve indeterminado
      return undefined;
    }

    // Valores booleanos o numéricos puros
    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;

    return undefined;
  }

  /**
   * Ciclo de rotación de estados estricto: 
   * undefined -> true -> false -> vuelve a undefined
   */
  toggleTriState(event: MouseEvent) {
    event.stopPropagation();

    // Evaluamos el valor actual usando comparaciones estrictas (===) 
    // para que JS no mezcle undefined con false.
    const currentValue = this.inputControl.value;
    let nextValue: boolean | undefined;

    if (currentValue === true) {
      nextValue = false;
    } else if (currentValue === false) {
      nextValue = undefined; // Pasa al centro (Sin especificar)
    } else {
      nextValue = true; // Si era undefined o null, pasa a true
    }

    // Forzamos el cambio en el FormControl de Angular
    this.inputControl.setValue(nextValue, { emitEvent: true });
    this.inputControl.markAsDirty();
    this.inputControl.markAsTouched();
  }
}