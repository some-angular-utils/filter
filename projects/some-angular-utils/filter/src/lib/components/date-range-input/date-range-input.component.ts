import { Component, Input, Output, EventEmitter, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';

interface DateRangeOption {
    label: string;
    value: string;
    getRange: () => [Date, Date];
}

@Component({
    selector: 'date-range-input',
    templateUrl: './date-range-input.component.html',
    styleUrl: './date-range-input.component.scss',
    imports: [CommonModule, ReactiveFormsModule]
})
export class DateRangeInputComponent {
    @Input() label = '';
    @Input() placeholder = 'Selecciona rango de fechas';

    private _formControlItem!: AbstractControl;

    @Input() set formControlItem(ctrl: AbstractControl) {
        this._formControlItem = ctrl;
        this.inputControl = ctrl as FormControl;
        if (this.inputControl && this.inputControl.value !== undefined) {
            this.inputControl.setValue(this.inputControl.value, { emitEvent: false });
        }
    }

    get formControlItem() { return this._formControlItem; }
    @Output() onClick = new EventEmitter<any>();
    inputControl!: FormControl;

    // Signals de Control de Estados
    showDropdown = signal(false);
    showCalendar = signal(false);
    selectedMode = signal<'preset' | 'custom'>('preset');
    startDate = signal<Date | null>(null);
    endDate = signal<Date | null>(null);
    currentMonth = signal(new Date());
    selectingEndDate = signal(false);
    hoveredDate = signal<Date | null>(null); // Rastreador de hover para renderizado de rango continuo

    // Computada para resolver dinámicamente el mes contiguo de la derecha
    nextMonthComputed = computed(() => {
        const date = new Date(this.currentMonth());
        date.setMonth(date.getMonth() + 1);
        return date;
    });

    displayDate = computed(() => {
        const start = this.startDate();
        const end = this.endDate();
        if (!start || !end) return this.placeholder;
        return `${this.formatDate(start)} - ${this.formatDate(end)}`;
    });

    constructor() {
        effect(() => {
            if (this.showCalendar()) {
                this.selectingEndDate.set(false);
            }
        });
    }

    dateRangeOptions: DateRangeOption[] = [
        {
            label: 'Hoy',
            value: 'today',
            getRange: () => {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const end = new Date(today); end.setHours(23, 59, 59, 999);
                return [today, end];
            }
        },
        {
            label: 'Mañana',
            value: 'tomorrow',
            getRange: () => {
                const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0, 0, 0, 0);
                const end = new Date(tomorrow); end.setHours(23, 59, 59, 999);
                return [tomorrow, end];
            }
        },
        {
            label: 'Hace 3 días',
            value: 'last3days',
            getRange: () => {
                const end = new Date(); end.setHours(23, 59, 59, 999);
                const start = new Date(); start.setDate(start.getDate() - 3); start.setHours(0, 0, 0, 0);
                return [start, end];
            }
        },
        {
            label: 'Mes actual',
            value: 'currentMonth',
            getRange: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1); start.setHours(0, 0, 0, 0);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); end.setHours(23, 59, 59, 999);
                return [start, end];
            }
        },
        {
            label: 'Próximo mes',
            value: 'nextMonth',
            getRange: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth() + 1, 1); start.setHours(0, 0, 0, 0);
                const end = new Date(now.getFullYear(), now.getMonth() + 2, 0); end.setHours(23, 59, 59, 999);
                return [start, end];
            }
        },
        {
            label: 'Año actual',
            value: 'currentYear',
            getRange: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), 0, 1); start.setHours(0, 0, 0, 0);
                const end = new Date(now.getFullYear(), 11, 31); end.setHours(23, 59, 59, 999);
                return [start, end];
            }
        }
    ];

    toggleDropdown() {
        if (this.showCalendar()) {
            this.showCalendar.set(false);
            this.showDropdown.set(false);
        } else {
            this.showDropdown.set(!this.showDropdown());
        }
    }

    selectPresetRange(option: DateRangeOption) {
        const [start, end] = option.getRange();
        this.startDate.set(start);
        this.endDate.set(end);
        this.updateFormControl([start, end]);
        this.showDropdown.set(false);
    }

    openCustomRange() {
        this.selectedMode.set('custom');
        this.showCalendar.set(true);
        this.showDropdown.set(false);
        if (!this.startDate()) {
            this.currentMonth.set(new Date());
        } else {
            this.currentMonth.set(new Date(this.startDate()!));
        }
        this.selectingEndDate.set(false);
        this.hoveredDate.set(null);
    }

    backToPresets() {
        this.showCalendar.set(false);
        this.showDropdown.set(true);
    }

    closeCalendar() { this.showCalendar.set(false); }

    applyCustomRange() {
        if (this.startDate() && this.endDate()) {
            this.updateFormControl([this.startDate()!, this.endDate()!]);
            this.showCalendar.set(false);
        }
    }

    selectDate(date: Date) {
        if (!this.selectingEndDate()) {
            this.startDate.set(new Date(date));
            this.endDate.set(null);
            this.selectingEndDate.set(true);
        } else {
            if (date < this.startDate()!) {
                const temp = this.startDate();
                this.startDate.set(new Date(date));
                this.endDate.set(temp);
            } else {
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
                this.endDate.set(endOfDay);
            }
            this.selectingEndDate.set(false);
            this.hoveredDate.set(null); // Limpieza post-selección
        }
    }

    selectDateFromDay(day: number | null, contextMonth: Date) {
        if (!day) return;
        const date = new Date(contextMonth.getFullYear(), contextMonth.getMonth(), day);
        this.selectDate(date);
    }

    /* Gestores de eventos de Mouse para Rango Dinámico en Hover */
    onDayMouseEnter(day: number | null, contextMonth: Date) {
        if (!day || !this.selectingEndDate() || !this.startDate()) return;
        const date = new Date(contextMonth.getFullYear(), contextMonth.getMonth(), day);
        this.hoveredDate.set(date);
    }

    onDaysMouseLeave() {
        this.hoveredDate.set(null);
    }

    isDateHovered(day: number | null, contextMonth: Date): boolean {
        if (!day) return false;
        const start = this.startDate();
        const hover = this.hoveredDate();
        if (!start || !hover || !this.selectingEndDate()) return false;

        const date = new Date(contextMonth.getFullYear(), contextMonth.getMonth(), day);

        // Si se hace un hover hacia atrás respecto al día de inicio, invierte la dirección visual del tramo
        if (hover < start) {
            return date >= hover && date <= start;
        }
        return date >= start && date <= hover;
    }

    previousMonth() {
        const newMonth = new Date(this.currentMonth());
        newMonth.setMonth(newMonth.getMonth() - 1);
        this.currentMonth.set(newMonth);
    }

    nextMonth() {
        const newMonth = new Date(this.currentMonth());
        newMonth.setMonth(newMonth.getMonth() + 1);
        this.currentMonth.set(newMonth);
    }

    getDaysInMonth(contextMonth: Date): (number | null)[] {
        const year = contextMonth.getFullYear();
        const month = contextMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        let startDate = firstDay.getDay();
        startDate = startDate === 0 ? 6 : startDate - 1; // Ajuste inicial a Lunes

        const daysInMonth = lastDay.getDate();
        const days: (number | null)[] = [];

        for (let i = 0; i < startDate; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);

        return days;
    }

    isDateSelected(day: number | null, contextMonth: Date): boolean {
        if (!day) return false;
        const date = new Date(contextMonth.getFullYear(), contextMonth.getMonth(), day);
        const start = this.startDate();
        const end = this.endDate();
        if (!start || !end) return false;
        return date >= start && date <= end;
    }

    isDateStart(day: number | null, contextMonth: Date): boolean {
        if (!day) return false;
        const start = this.startDate();
        if (!start) return false;
        const date = new Date(contextMonth.getFullYear(), contextMonth.getMonth(), day);
        return date.toDateString() === start.toDateString();
    }

    isDateEnd(day: number | null, contextMonth: Date): boolean {
        if (!day) return false;
        const end = this.endDate();
        if (!end) return false;
        const date = new Date(contextMonth.getFullYear(), contextMonth.getMonth(), day);
        return date.toDateString() === end.toDateString();
    }

    formatDate(date: Date): string {
        return new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    }

    getMonthYear(contextMonth: Date): string {
        return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(contextMonth);
    }

    getWeekDays(): string[] {
        return ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    }

    private updateFormControl(dates: [Date, Date]) {
        if (this.inputControl) {
            this.inputControl.setValue(dates, { emitEvent: true });
        }
    }

    clearSelection() {
        this.startDate.set(null);
        this.endDate.set(null);
        this.selectingEndDate.set(false);
        this.hoveredDate.set(null);
        this.updateFormControl([null, null] as any);
        this.showDropdown.set(false);
    }
}