import { Component, ElementRef, HostListener, Input, ViewChild, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'custom-select',
    templateUrl: './custom-select.component.html',
    styleUrl: './custom-select.component.scss',
    imports: [CommonModule, ReactiveFormsModule]
})
export class CustomSelectComponent implements OnInit, OnChanges {
    @Input() label = '';
    @Input() placeholder = 'Selecciona una opción';
    @Input() isMultiple = false;

    // Cada vez que las opciones cambien desde el componente padre (ej: datos de API), re-sincronizamos
    private _options: any[] = [];
    @Input() set options(val: any[]) {
        this._options = val || [];
        this.filteredOptions = [...this._options];
        if (this.inputControl) {
            this.syncVisualInput(this.inputControl.value);
        }
    }
    get options(): any[] { return this._options; }

    @Input() bindLabel = 'label';
    @Input() bindValue = 'value';
    @Input() bindSubLabel = '';
    @Input() bindExtra = '';

    @ViewChild('selectInput') selectInput!: ElementRef<HTMLInputElement>;

    isOpen = false;
    searchControl = new FormControl('');
    filteredOptions: any[] = [];

    private _formControlItem!: AbstractControl;
    inputControl!: FormControl;

    @Input() set formControlItem(ctrl: AbstractControl) {
        this._formControlItem = ctrl;
        this.inputControl = ctrl as FormControl;

        if (this.inputControl) {
            // Sincroniza el valor actual inmediatamente
            this.syncVisualInput(this.inputControl.value);

            // Escucha cambios reactivos futuros
            this.inputControl.valueChanges.subscribe(value => {
                this.syncVisualInput(value);
            });
        }
    }
    get formControlItem() { return this._formControlItem; }

    constructor(private elementRef: ElementRef) {
        this.searchControl.valueChanges.subscribe(val => {
            if (this.isOpen) {
                this.filterData(val || '');
            }
        });
    }

    ngOnInit() {
        this.filteredOptions = [...this.options];
        // Doble verificación en el arranque inicial por si los inputs ya están estables
        if (this.inputControl) {
            this.syncVisualInput(this.inputControl.value);
        }
    }

    // Captura cualquier desajuste de ciclo de vida de inputs nativos de Angular
    ngOnChanges(changes: SimpleChanges) {
        if ((changes['options'] || changes['formControlItem']) && this.inputControl) {
            this.syncVisualInput(this.inputControl.value);
        }
    }

    @HostListener('document:click', ['$event'])
    clickOut(event: MouseEvent) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.closeDropdown();
        }
    }

    openDropdown(event: MouseEvent) {
        event.stopPropagation();
        if (this.isOpen) {
            this.closeDropdown();
            return;
        }

        this.isOpen = true;
        this.searchControl.setValue('', { emitEvent: false });
        this.filteredOptions = [...this.options];

        setTimeout(() => this.selectInput?.nativeElement.focus(), 50);
    }

    closeDropdown() {
        this.isOpen = false;
        this.syncVisualInput(this.inputControl?.value);
        this.filteredOptions = [...this.options];
    }

    selectOption(option: any) {
        const selectedValue = option[this.bindValue];

        if (this.isMultiple) {
            let currentValues: any[] = this.inputControl.value || [];
            if (currentValues.includes(selectedValue)) {
                currentValues = currentValues.filter(v => v !== selectedValue);
            } else {
                currentValues = [...currentValues, selectedValue];
            }
            this.inputControl.setValue(currentValues);
        } else {
            this.inputControl.setValue(selectedValue);
            this.closeDropdown();
        }
    }

    isSelected(option: any): boolean {
        if (!this.inputControl || this.inputControl.value === null || this.inputControl.value === undefined) return false;
        const val = option[this.bindValue];
        if (this.isMultiple) {
            return Array.isArray(this.inputControl.value) && this.inputControl.value.includes(val);
        }
        return this.inputControl.value === val;
    }

    filterData(query: string) {
        if (!query) {
            this.filteredOptions = [...this.options];
            return;
        }
        this.filteredOptions = this.options.filter(opt =>
            opt[this.bindLabel]?.toLowerCase().includes(query.toLowerCase())
        );
    }

    private syncVisualInput(value: any) {
        // Si no hay opciones cargadas todavía, no podemos buscar el texto legible; esperamos a que entren las opciones
        if (!this.options || this.options.length === 0) return;

        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
            this.searchControl.setValue('', { emitEvent: false });
            return;
        }

        if (this.isMultiple && Array.isArray(value)) {
            const selectedLabels = this.options
                .filter(opt => value.includes(opt[this.bindValue]))
                .map(opt => opt[this.bindLabel]);

            this.searchControl.setValue(
                selectedLabels.length > 0 ? `${selectedLabels.length} seleccionados (${selectedLabels.join(', ')})` : '',
                { emitEvent: false }
            );
        } else {
            const selectedOption = this.options.find(opt => opt[this.bindValue] === value);
            if (selectedOption) {
                this.searchControl.setValue(selectedOption[this.bindLabel], { emitEvent: false });
            } else {
                // Limpieza de seguridad si el valor guardado no coincide con ninguna opción real
                this.searchControl.setValue('', { emitEvent: false });
            }
        }
    }
}