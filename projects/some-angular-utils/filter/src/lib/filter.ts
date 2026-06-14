import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

import { CustomInputComponent } from './components/custom-input/custom-input.component';
import { CustomSelectComponent } from './components/custom-select/custom-select.component';
import { DateRangeInputComponent } from './components/date-range-input/date-range-input.component';

@Component({
  selector: 'sau-filter',
  templateUrl: './filter.html',
  styleUrls: ['./filter.scss'],
  providers: [DatePipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomInputComponent,
    CustomSelectComponent,
    DateRangeInputComponent
  ]
})
export class SAUFilterModule {

  @Input() filterConfig: any;
  @Input() searchButtonText = 'Buscar';
  @Output() onFilterProcessed = new EventEmitter<{ json: any, url: string }>();

  public filterForm = new FormGroup<any>({});
  public dropdowns: any = {};
  public arrayMobile: string[] = [];

  public showOrderDropdown = false;

  // Nuevo FormGroup para aislar y encapsular todas las columnas de ordenación
  public sortOrderGroup = new FormGroup<any>({});

  constructor(
    private datePipe: DatePipe,
    private elementRef: ElementRef
  ) { }

  private get orderKey(): string {
    return this.filterConfig?.orderParamName || 'order';
  }

  ngOnInit() {
    if (this.filterConfig?.mobile) {
      this.arrayMobile = this.filterConfig.mobile;
    }
    this.buildFormStructure();
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
    }
  }

  public hasOrderFields(): boolean {
    return !!(this.filterConfig?.orderByFields && this.filterConfig.orderByFields.length > 0);
  }

  private convertToNumberFilter(value: any): any {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value;

    const stringValue = value.toString().trim();

    // Validar si la cadena es un número válido
    const isNumeric = /^-?\d+(\.\d+)?$/.test(stringValue);

    if (isNumeric) {
      return stringValue.includes('.') ? parseFloat(stringValue) : parseInt(stringValue, 10);
    }

    // Tratamiento especial para strings que representan booleanos desde la URL
    if (stringValue.toLowerCase() === 'true') return true;
    if (stringValue.toLowerCase() === 'false') return false;

    return stringValue;
  }

  /**
   * Crea dinámicamente los controles del formulario y mapea valores iniciales
   */
  private buildFormStructure() {
    if (!this.filterConfig || !this.filterConfig.form) return;

    const urlParams = new URLSearchParams(window.location.search);
    const formConfig = this.filterConfig.form;

    // 1. Inicializar los controles de ordenación si existen campos declarados
    if (this.hasOrderFields()) {
      const urlOrderParam = urlParams.get(this.orderKey);
      // Convertir el string de la URL (ej: "title,-created_at") en un array para comprobar los estados
      const activeOrders = urlOrderParam ? urlOrderParam.split(',') : [];

      this.filterConfig.orderByFields.forEach((option: { field: string, label: string }) => {
        let defaultSortValue: boolean | undefined = undefined;

        const matchingUrlValue = activeOrders.find(o => o === option.field || o === `-${option.field}`);

        if (matchingUrlValue) {
          defaultSortValue = !matchingUrlValue.startsWith('-');
        }

        this.sortOrderGroup.addControl(option.field, new FormControl<boolean | undefined>(defaultSortValue));
      });
    }

    Object.keys(formConfig).forEach(nameFilter => {
      const config = formConfig[nameFilter];

      if (['selectSimple', 'selectMultiple'].includes(config.type)) {
        this.dropdowns[nameFilter] = config.dropdowns || [];
      }

      let defaultValue: any = '';

      // 1. Intentar obtener el valor crudo primario de la URL, si no, del config
      let rawValue: any = urlParams.get(config.key) ?? config.defaultValue;

      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {

        // 2. Si es un filter múltiple...
        if (config.type === 'selectMultiple') {
          if (Array.isArray(rawValue)) {
            // Caso Storybook (Opción B): Ya viene como Array [10, 20]
            defaultValue = rawValue.map(e => this.convertToNumberFilter(e));
          } else if (typeof rawValue === 'string') {
            // Caso URL real: Viene como String '10,20'
            defaultValue = rawValue.split(',').map(e => this.convertToNumberFilter(e.trim()));
          }
        } else {
          defaultValue = this.convertToNumberFilter(rawValue);
        }
      }

      this.filterForm.addControl(nameFilter, new FormControl(defaultValue));
    });
  }

  /**
   * Procesa los inputs, limpia tipos de datos y genera el JSON junto a la URL
   */
  public processFilter() {
    if (!this.filterConfig || !this.filterConfig.form) return;

    const jsonResult: any = {};
    const formConfig = this.filterConfig.form;

    // 2. Procesar los múltiples valores de ordenación activos
    if (this.hasOrderFields()) {
      const orderSegments: string[] = [];

      Object.keys(this.sortOrderGroup.controls).forEach(fieldKey => {
        const value = this.sortOrderGroup.get(fieldKey)?.value;
        if (value === true) {
          orderSegments.push(fieldKey);       // Ascendente: "title"
        } else if (value === false) {
          orderSegments.push(`-${fieldKey}`);  // Descendente: "-title"
        }
      });

      if (orderSegments.length > 0) {
        jsonResult[this.orderKey] = orderSegments.join(','); // Asigna la clave configurada
      }
    }

    Object.keys(formConfig).forEach(nameField => {
      const configField = formConfig[nameField];
      const key = configField.key;
      const control = this.filterForm.get(nameField);

      if (!control) return;

      let value = control.value;

      if (configField.type === 'inputCheckbox' && value !== undefined) {
        if (value === undefined || value === null) return;
        jsonResult[key] = value ? true : false;
        return;
      }

      // Validar que el campo tenga contenido real
      if (value !== null && value !== undefined && value.toString().trim() !== '') {

        // 2. Tratamiento para Fechas individuales
        if (configField.type === 'date' && value instanceof Date) {
          jsonResult[key] = this.datePipe.transform(value, 'yyyy-MM-dd');

          // 3. Tratamiento para Rango de fechas (array de dos fechas)
        } else if (configField.type === 'dateRange' && Array.isArray(value) && value.length === 2) {
          const [startDate, endDate] = value;
          if (startDate instanceof Date && endDate instanceof Date) {
            jsonResult[key] = this.datePipe.transform(startDate, 'yyyy-MM-dd');
            jsonResult[configField.keyTo || `${key}_end`] = this.datePipe.transform(endDate, 'yyyy-MM-dd');
          }

          // 4. Tratamiento para Filteres Múltiples (Arrays)
        } else if (Array.isArray(value)) {
          jsonResult[key] = value.map(item => this.convertToNumberFilter(item));

          // 5. Tratamiento para Inputs de texto/número y Filteres Simples
        } else {
          jsonResult[key] = this.convertToNumberFilter(value);
        }
      }
    });

    // Generar la Query String final
    const urlString = this.buildQueryString(jsonResult);
    this.showOrderDropdown = false;

    // Emitir ambos formatos listos al componente padre
    this.onFilterProcessed.emit({
      json: jsonResult,
      url: urlString
    });
  }

  /**
   * Transforma el objeto plano en una cadena de texto codificada para URL (?key=value&key2=value2)
   */
  private buildQueryString(paramsObject: any): string {
    const pairs: string[] = [];
    Object.keys(paramsObject).forEach(key => {
      const val = paramsObject[key];
      if (val !== undefined && val !== null && val !== '') {
        // Si es un array de IDs (filteres múltiples), los une separados por comas
        const formattedVal = Array.isArray(val) ? val.join(',') : val;
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(formattedVal)}`);
      }
    });
    return pairs.length > 0 ? `?${pairs.join('&')}` : '';
  }

  public onChangeSelect() { }

  public showMoreFilter(show: boolean) {
    this.arrayMobile = show ? [] : (this.filterConfig.mobile || []);
  }

  public checkMobile(nameFilter: string): boolean {
    return !this.isMobile() || this.arrayMobile.length === 0 || this.arrayMobile.includes(nameFilter);
  }

  private isMobile(): boolean {
    return !!(navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i));
  }
}