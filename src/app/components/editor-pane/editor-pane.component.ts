import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Note } from '../../models/workspace.models';

@Component({
  selector: 'app-editor-pane',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor-pane.component.html'
})
export class EditorPaneComponent {
  @Input({ required: true }) selectedNote?: Note;
  @Input({ required: true }) formatDate!: (dateIso: string) => string;

  @Output() updateTitle = new EventEmitter<string>();
  @Output() toggleFavorite = new EventEmitter<void>();
  @Output() deleteNote = new EventEmitter<string>();
  @Output() updateContent = new EventEmitter<string>();
}
