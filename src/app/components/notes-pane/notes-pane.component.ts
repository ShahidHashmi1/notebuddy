import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Note, Notebook, Section } from '../../models/workspace.models';

@Component({
  selector: 'app-notes-pane',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes-pane.component.html'
})
export class NotesPaneComponent {
  @Input({ required: true }) selectedNotebook?: Notebook;
  @Input({ required: true }) selectedSectionId = '';
  @Input({ required: true }) selectedNoteId = '';
  @Input({ required: true }) filteredNotes: Note[] = [];
  @Input({ required: true }) searchTerm = '';
  @Input({ required: true }) formatDate!: (dateIso: string) => string;

  @Output() addSection = new EventEmitter<void>();
  @Output() addNote = new EventEmitter<void>();
  @Output() selectSection = new EventEmitter<string>();
  @Output() renameSection = new EventEmitter<string>();
  @Output() deleteSection = new EventEmitter<string>();
  @Output() selectNote = new EventEmitter<string>();
  @Output() renameNote = new EventEmitter<string>();
  @Output() deleteNote = new EventEmitter<string>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() sectionContextMenuRequested = new EventEmitter<{ event: MouseEvent; targetId: string }>();
  @Output() noteContextMenuRequested = new EventEmitter<{ event: MouseEvent; targetId: string }>();

  trackSectionById(_: number, section: Section): string {
    return section.id;
  }

  trackNoteById(_: number, note: Note): string {
    return note.id;
  }
}
