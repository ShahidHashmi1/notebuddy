import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Notebook } from '../../models/workspace.models';

@Component({
  selector: 'app-notebooks-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notebooks-pane.component.html'
})
export class NotebooksPaneComponent {
  @Input({ required: true }) notebooks: Notebook[] = [];
  @Input({ required: true }) selectedNotebookId = '';

  @Output() createNotebook = new EventEmitter<void>();
  @Output() selectNotebook = new EventEmitter<string>();
  @Output() renameNotebook = new EventEmitter<string>();
  @Output() deleteNotebook = new EventEmitter<string>();
  @Output() contextMenuRequested = new EventEmitter<{ event: MouseEvent; targetId: string }>();

  trackById(_: number, item: Notebook): string {
    return item.id;
  }
}
