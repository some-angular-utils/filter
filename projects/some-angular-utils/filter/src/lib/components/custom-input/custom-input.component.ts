import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'custom-input',
  templateUrl: './custom-input.component.html',
  styleUrl: './custom-input.component.scss',
  imports: [
    ReactiveFormsModule,
  ]
})
export class CustomInputComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text'; // Ponemos 'text' por defecto por seguridad

  private _formControlItem!: AbstractControl;
  
  @Input() set formControlItem(ctrl: AbstractControl) {
    this._formControlItem = ctrl;
    this.inputControl = ctrl as FormControl;

    // ¡La CLAVE aquí!: Si el control del padre ya trae un valor por defecto,
    // se lo inyectamos explícitamente a nuestro input interno para que se autorellene.
    if (this.inputControl && this.inputControl.value !== undefined) {
      this.inputControl.setValue(this.inputControl.value, { emitEvent: false });
    }
  }
  
  get formControlItem() {
    return this._formControlItem;
  }

  @Output() onClick = new EventEmitter<any>();

  inputControl!: FormControl;

  doClick() {
    this.onClick.emit();
  }
}