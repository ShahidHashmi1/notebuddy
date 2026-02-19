import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ContextAction, ContextTarget } from '../../models/workspace.models';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-menu.component.html'
})
export class ContextMenuComponent {
  @Input({ required: true }) visible = false;
  @Input({ required: true }) x = 0;
  @Input({ required: true }) y = 0;
  @Input({ required: true }) targetType: ContextTarget | null = null;

  @Output() actionSelected = new EventEmitter<ContextAction>();
}
