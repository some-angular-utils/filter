import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, HostListener, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'custom-select',
    templateUrl: './custom-select.component.html',
    styleUrl: './custom-select.component.scss',
    standalone: true,
    imports: [ReactiveFormsModule]
})
export class CustomSelectComponent implements OnInit, OnDestroy {
    @Input() label = '';
    @Input() placeholder = 'BUSCAR PRODUCTO POR NOMBRE O REFERENCIA...';
    @Input() formControlItem!: AbstractControl;
    @Input() isMultiple = false;

    @Input() bindValue = 'value';
    @Input() bindLabel = 'label';
    @Input() bindSubLabel = '';
    @Input() bindExtra = '';

    @Output() selectionChange = new EventEmitter<any>();

    @ViewChild('selectInput') selectInput!: ElementRef<HTMLInputElement>;

    isOpen = false;
    searchControl = new FormControl('');
    filteredOptions: any[] = [];

    private _options: any[] = [];
    private destroy$ = new Subject<void>();
    private isSettingInternalValue = false;

    @Input()
    set options(val: any[]) {
        this._options = val || [];
        this.filterOptions(this.searchControl?.value || '');
        this.syncSearchInputWithControlValue();
    }

    get options(): any[] {
        return this._options;
    }

    constructor(private elementRef: ElementRef) { }

    ngOnInit() {
        this.searchControl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(value => {
                if (this.isSettingInternalValue) return;
                this.filterOptions(value || '');
            });

        this.formControlItem?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.syncSearchInputWithControlValue());

        this.syncSearchInputWithControlValue();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    openDropdown(event: MouseEvent) {
        event.stopPropagation();
        if (this.isOpen) {
            this.selectInput?.nativeElement.focus();
            return;
        }

        this.isOpen = true;
        this.isSettingInternalValue = true;
        this.searchControl.setValue('');
        this.isSettingInternalValue = false;
        this.filterOptions('');

        setTimeout(() => {
            if (this.selectInput?.nativeElement) {
                this.selectInput.nativeElement.focus();
            }
        }, 20);
    }

    closeDropdown() {
        this.isOpen = false;
        this.syncSearchInputWithControlValue();
    }

    @HostListener('document:click', ['$event'])
    clickOut(event: MouseEvent) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.closeDropdown();
        }
    }

    private filterOptions(searchTerm: string) {
        const term = searchTerm.toLowerCase().trim();
        if (!term) {
            this.filteredOptions = this._options;
            return;
        }
        this.filteredOptions = this._options.filter(opt => {
            const labelText = opt[this.bindLabel] ? String(opt[this.bindLabel]) : '';
            const subLabelText = this.bindSubLabel && opt[this.bindSubLabel] ? String(opt[this.bindSubLabel]) : '';
            return labelText.toLowerCase().includes(term) || subLabelText.toLowerCase().includes(term);
        });
    }

    isSelected(option: any): boolean {
        const currentControlValue = this.formControlItem?.value;
        const optionValue = option[this.bindValue];

        if (this.isMultiple) {
            return Array.isArray(currentControlValue) && currentControlValue.includes(optionValue);
        }
        return currentControlValue === optionValue;
    }

    selectOption(option: any) {
        if (this.isMultiple) {
            this.toggleMultiple(option);
            this.selectInput?.nativeElement.focus();
        } else {
            this.selectSingle(option);
            this.closeDropdown();
        }
    }

    private selectSingle(option: any) {
        const optionValue = option[this.bindValue];
        this.formControlItem.setValue(optionValue);
        this.formControlItem.markAsDirty();

        this.selectionChange.emit(optionValue);
    }

    private toggleMultiple(option: any) {
        const optionValue = option[this.bindValue];
        let currentValues: any[] = Array.isArray(this.formControlItem.value) ? [...this.formControlItem.value] : [];

        if (currentValues.includes(optionValue)) {
            currentValues = currentValues.filter(val => val !== optionValue);
        } else {
            currentValues.push(optionValue);
        }

        this.formControlItem.setValue(currentValues);
        this.formControlItem.markAsDirty();

        this.selectionChange.emit(currentValues);
    }

    private syncSearchInputWithControlValue() {
        if (this.isMultiple) {
            this.isSettingInternalValue = true;
            const totalSelected = Array.isArray(this.formControlItem?.value) ? this.formControlItem.value.length : 0;
            this.searchControl.setValue(totalSelected > 0 ? `SELECCIONADOS (${totalSelected})` : '', { emitEvent: false });
            this.isSettingInternalValue = false;
        } else {
            const value = this.formControlItem?.value;
            const selectedOption = this._options.find(opt => opt[this.bindValue] === value);
            this.isSettingInternalValue = true;

            if (selectedOption) {
                const mainLabel = selectedOption[this.bindLabel];
                const subLabel = this.bindSubLabel && selectedOption[this.bindSubLabel] ? selectedOption[this.bindSubLabel] : null;
                const displayText = subLabel ? `${mainLabel} (REF: ${subLabel})` : mainLabel;
                this.searchControl.setValue(displayText, { emitEvent: false });
            } else {
                this.searchControl.setValue('', { emitEvent: false });
            }
            this.isSettingInternalValue = false;
        }
    }
}