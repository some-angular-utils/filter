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
  @Input() hiddenCount = 0;
  @Output() search = new EventEmitter<void>();
  @Output() showHidden = new EventEmitter<boolean>();

  public showOrderDropdown = false;
  public showAllFilters = false;

  constructor(private elementRef: ElementRef) {}

  public hasOrderFields(): boolean {
    return !!(this.orderByFields && this.orderByFields.length > 0);
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
}
