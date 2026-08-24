import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnDestroy, Optional, ViewEncapsulation } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CustomInputComponent } from '../custom-input/custom-input.component';
import { DropdownCoordinatorService } from '../../services/dropdown-coordinator.service';

@Component({
  selector: 'sau-filter-button',
  templateUrl: './filter-button.component.html',
  styleUrls: ['./filter-button.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [ReactiveFormsModule, CustomInputComponent],
})
export class FilterButtonComponent implements OnInit, OnDestroy {

  @Input() searchButtonText = 'Buscar';
  @Input() orderByFields: { field: string; label: string }[] = [];
  @Input() sortOrderGroup!: FormGroup;
  @Input() hiddenCount = 0;
  @Output() search = new EventEmitter<void>();
  @Output() showHidden = new EventEmitter<boolean>();

  public showOrderDropdown = false;
  public showAllFilters = false;
  private openedSubscription?: Subscription;

  constructor(private elementRef: ElementRef, @Optional() private coordinator?: DropdownCoordinatorService) {}

  ngOnInit() {
    // Si un custom-select/custom-input/date-range-picker del mismo <sau-filter> se abre, cerramos este popover
    this.openedSubscription = this.coordinator?.opened$.subscribe(source => {
      if (source !== this && this.showOrderDropdown) {
        this.showOrderDropdown = false;
      }
    });
  }

  ngOnDestroy() {
    this.openedSubscription?.unsubscribe();
  }

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
}
