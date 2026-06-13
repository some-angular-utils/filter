import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  @Input() searchButtonText = 'Buscar'
  // Emite un objeto con la estructura JSON limpia y el String de la URL armada
  @Output() onFilterProcessed = new EventEmitter<{ json: any, url: string }>();

  public filterForm = new FormGroup<any>({});
  public dropdowns: any = {};
  public arrayMobile: string[] = [];

  constructor(
    private datePipe: DatePipe,
  ) { }

  ngOnInit() {

    if (this.filterConfig?.mobile) {
      this.arrayMobile = this.filterConfig.mobile;
    }
    this.buildFormStructure();
  }

  /**
   * Función interna que reemplaza al antiguo Utils externo.
   * Convierte cadenas numéricas en números reales y limpia textos.
   */
  private convertToNumberFilter(value: any): any {
    // 1. Si es estrictamente nulo o indefinido, o un string vacío real
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // 2. Si ya es un booleano (para los checkboxes por defecto), devuélvelo tal cual
    if (typeof value === 'boolean') {
      return value;
    }

    // 3. Si ya es un número, devuélvelo tal cual
    if (typeof value === 'number') {
      return value;
    }

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
        }
        // 3. Caso para controles individuales (inputText, selectSimple, etc.)
        else {
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

    Object.keys(formConfig).forEach(nameField => {
      const configField = formConfig[nameField];
      const key = configField.key;
      const control = this.filterForm.get(nameField);

      if (!control) return;

      let value = control.value;

      // 1. Tratamiento para Checkbox
      if (configField.type === 'inputCheckbox') {
        jsonResult[key] = value ? '1' : '0';
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

  // --- Helpers de UI y Mobile ---
  public onChangeSelect() {
    // Si prefieres procesamiento instantáneo al cambiar un select, descomenta la siguiente línea:
    // this.processFilter();
  }

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