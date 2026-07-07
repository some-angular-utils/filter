import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewEncapsulation } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CustomInputComponent } from '../custom-input/custom-input.component';

@Component({
  selector: 'sau-filter-button',
  templateUrl: './filter-button.component.html',
  styleUrls: ['./filter-button.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [ReactiveFormsModule, CustomInputComponent],
})
export class FilterButtonComponent {

  @Input() searchButtonText = 'Buscar';
  @Input() orderByFields: { field: string; label: string }[] = [];
  @Input() sortOrderGroup!: FormGroup;
  @Output() search = new EventEmitter<void>();

  public showOrderDropdown = false;

  constructor(private elementRef: ElementRef) {}

  public hasOrderFields(): boolean {
    return !!(this.orderByFields && this.orderByFields.length > 0);
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

  onSearch() {
    this.showOrderDropdown = false;
    this.search.emit();
  }
}
