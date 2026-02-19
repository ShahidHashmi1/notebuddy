import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
}

interface Section {
  id: string;
  title: string;
  notes: Note[];
}

interface Notebook {
  id: string;
  title: string;
  accent: string;
  icon: string;
  sections: Section[];
}

interface AppState {
  notebooks: Notebook[];
  selectedNotebookId: string;
  selectedSectionId: string;
  selectedNoteId: string;
}

type ContextTarget = 'notebook' | 'section' | 'note';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly storageKey = 'notebuddy.personal.workspace.v1';

  notebooks: Notebook[] = [];

  selectedNotebookId = '';
  selectedSectionId = '';
  selectedNoteId = '';

  editingNotebookId = '';
  editingSectionId = '';
  editingNoteId = '';

  notebookTitleDraft = '';
  sectionTitleDraft = '';
  noteTitleDraft = '';

  searchTerm = '';
  profileName = 'Shahid';
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    targetType: ContextTarget | null;
    targetId: string | null;
  } = {
    visible: false,
    x: 0,
    y: 0,
    targetType: null,
    targetId: null
  };

  constructor() {
    this.bootstrap();
  }

  get notebookCount(): number {
    return this.notebooks.length;
  }

  get sectionCount(): number {
    return this.notebooks.reduce((total, notebook) => total + notebook.sections.length, 0);
  }

  get totalNotes(): number {
    return this.notebooks.reduce(
      (notebookTotal, notebook) =>
        notebookTotal + notebook.sections.reduce((sectionTotal, section) => sectionTotal + section.notes.length, 0),
      0
    );
  }

  get selectedNotebook(): Notebook | undefined {
    return this.notebooks.find((notebook) => notebook.id === this.selectedNotebookId);
  }

  get selectedSection(): Section | undefined {
    return this.selectedNotebook?.sections.find((section) => section.id === this.selectedSectionId);
  }

  get filteredNotes(): Note[] {
    const section = this.selectedSection;
    if (!section) {
      return [];
    }

    const needle = this.searchTerm.trim().toLowerCase();
    if (!needle) {
      return [...section.notes].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    }

    return [...section.notes]
      .filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(needle))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }

  get selectedNote(): Note | undefined {
    return this.selectedSection?.notes.find((note) => note.id === this.selectedNoteId);
  }

  selectNotebook(notebookId: string): void {
    this.closeContextMenu();
    this.selectedNotebookId = notebookId;
    const notebook = this.selectedNotebook;
    this.selectedSectionId = notebook?.sections[0]?.id ?? '';
    this.selectedNoteId = notebook?.sections[0]?.notes[0]?.id ?? '';
    this.persist();
  }

  selectSection(sectionId: string): void {
    this.closeContextMenu();
    this.selectedSectionId = sectionId;
    this.selectedNoteId = this.selectedSection?.notes[0]?.id ?? '';
    this.persist();
  }

  selectNote(noteId: string): void {
    this.closeContextMenu();
    this.selectedNoteId = noteId;
    this.persist();
  }

  addNotebook(): void {
    const notebook = this.createNotebook(`Notebook ${this.notebooks.length + 1}`);
    this.notebooks = [notebook, ...this.notebooks];
    this.selectNotebook(notebook.id);
  }

  renameNotebook(notebookId: string): void {
    const notebook = this.notebooks.find((item) => item.id === notebookId);
    if (!notebook) {
      return;
    }

    const nextTitle = prompt('Rename notebook', notebook.title);
    if (nextTitle === null) {
      return;
    }

    notebook.title = nextTitle.trim() || 'Untitled notebook';
    this.persist();
  }

  startNotebookRename(notebookId: string): void {
    const notebook = this.notebooks.find((item) => item.id === notebookId);
    if (!notebook) {
      return;
    }

    this.editingNotebookId = notebookId;
    this.notebookTitleDraft = notebook.title;
  }

  saveNotebookRename(notebookId: string): void {
    const notebook = this.notebooks.find((item) => item.id === notebookId);
    if (!notebook) {
      return;
    }

    notebook.title = this.notebookTitleDraft.trim() || 'Untitled notebook';
    this.cancelNotebookRename();
    this.persist();
  }

  cancelNotebookRename(): void {
    this.editingNotebookId = '';
    this.notebookTitleDraft = '';
  }

  deleteNotebook(notebookId: string): void {
    const notebook = this.notebooks.find((item) => item.id === notebookId);
    if (!notebook) {
      return;
    }

    if (!confirm(`Delete notebook \"${notebook.title}\" and all its sections/notes?`)) {
      return;
    }

    if (this.notebooks.length === 1) {
      this.notebooks = [this.createNotebook('My Notebook')];
      this.selectNotebook(this.notebooks[0].id);
      return;
    }

    this.notebooks = this.notebooks.filter((item) => item.id !== notebookId);

    if (this.selectedNotebookId === notebookId) {
      this.selectNotebook(this.notebooks[0].id);
      return;
    }

    this.persist();
  }

  addSection(): void {
    const notebook = this.selectedNotebook;
    if (!notebook) {
      return;
    }

    const section: Section = {
      id: this.id(),
      title: `Section ${notebook.sections.length + 1}`,
      notes: [this.createNote('Untitled note', '')]
    };

    notebook.sections.unshift(section);
    this.selectSection(section.id);
  }

  addSectionToNotebook(notebookId: string): void {
    this.selectNotebook(notebookId);
    this.addSection();
  }

  renameSection(sectionId: string): void {
    const section = this.selectedNotebook?.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const nextTitle = prompt('Rename section', section.title);
    if (nextTitle === null) {
      return;
    }

    section.title = nextTitle.trim() || 'Untitled section';
    this.persist();
  }

  startSectionRename(sectionId: string): void {
    const section = this.selectedNotebook?.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    this.editingSectionId = sectionId;
    this.sectionTitleDraft = section.title;
  }

  saveSectionRename(sectionId: string): void {
    const section = this.selectedNotebook?.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    section.title = this.sectionTitleDraft.trim() || 'Untitled section';
    this.cancelSectionRename();
    this.persist();
  }

  cancelSectionRename(): void {
    this.editingSectionId = '';
    this.sectionTitleDraft = '';
  }

  deleteSection(sectionId: string): void {
    const notebook = this.selectedNotebook;
    if (!notebook) {
      return;
    }

    const section = notebook.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    if (!confirm(`Delete section \"${section.title}\" and all its notes?`)) {
      return;
    }

    if (notebook.sections.length === 1) {
      notebook.sections = [
        {
          id: this.id(),
          title: 'New Section',
          notes: [this.createNote('Untitled note', '')]
        }
      ];
      this.selectSection(notebook.sections[0].id);
      return;
    }

    notebook.sections = notebook.sections.filter((item) => item.id !== sectionId);

    if (this.selectedSectionId === sectionId) {
      this.selectSection(notebook.sections[0].id);
      return;
    }

    this.persist();
  }

  addNote(): void {
    const section = this.selectedSection;
    if (!section) {
      return;
    }

    const note = this.createNote('Untitled note', '');
    section.notes.unshift(note);
    this.selectNote(note.id);
  }

  addNoteToSection(sectionId: string): void {
    this.selectSection(sectionId);
    this.addNote();
  }

  renameNote(noteId: string): void {
    const note = this.selectedSection?.notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    const nextTitle = prompt('Rename note', note.title);
    if (nextTitle === null) {
      return;
    }

    note.title = nextTitle.trim() || 'Untitled note';
    note.updatedAt = new Date().toISOString();
    this.persist();
  }

  startNoteRename(noteId: string): void {
    const note = this.selectedSection?.notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    this.editingNoteId = noteId;
    this.noteTitleDraft = note.title;
  }

  saveNoteRename(noteId: string): void {
    const note = this.selectedSection?.notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    note.title = this.noteTitleDraft.trim() || 'Untitled note';
    note.updatedAt = new Date().toISOString();
    this.cancelNoteRename();
    this.persist();
  }

  cancelNoteRename(): void {
    this.editingNoteId = '';
    this.noteTitleDraft = '';
  }

  toggleFavorite(): void {
    const note = this.selectedNote;
    if (!note) {
      return;
    }

    note.favorite = !note.favorite;
    note.updatedAt = new Date().toISOString();
    this.persist();
  }

  updateSelectedNoteTitle(title: string): void {
    const note = this.selectedNote;
    if (!note) {
      return;
    }

    note.title = title.trim() || 'Untitled note';
    note.updatedAt = new Date().toISOString();
    this.persist();
  }

  updateNoteContent(content: string): void {
    const note = this.selectedNote;
    if (!note) {
      return;
    }

    note.content = content;
    note.updatedAt = new Date().toISOString();
    this.persist();
  }

  deleteNote(noteId: string): void {
    const section = this.selectedSection;
    if (!section) {
      return;
    }

    const note = section.notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    if (!confirm(`Delete note \"${note.title}\"?`)) {
      return;
    }

    if (section.notes.length === 1) {
      section.notes[0] = this.createNote('Untitled note', '');
      this.selectNote(section.notes[0].id);
      return;
    }

    section.notes = section.notes.filter((item) => item.id !== noteId);

    if (this.selectedNoteId === noteId) {
      this.selectNote(section.notes[0].id);
      return;
    }

    this.persist();
  }

  formatDate(dateIso: string): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(dateIso));
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  openContextMenu(event: MouseEvent, targetType: ContextTarget, targetId: string): void {
    event.preventDefault();

    if (targetType === 'notebook') {
      this.selectedNotebookId = targetId;
      const notebook = this.selectedNotebook;
      this.selectedSectionId = notebook?.sections[0]?.id ?? '';
      this.selectedNoteId = notebook?.sections[0]?.notes[0]?.id ?? '';
      this.persist();
    }

    if (targetType === 'section') {
      this.selectedSectionId = targetId;
      this.selectedNoteId = this.selectedSection?.notes[0]?.id ?? '';
      this.persist();
    }

    if (targetType === 'note') {
      this.selectedNoteId = targetId;
      this.persist();
    }

    const menuWidth = 170;
    const menuHeight = 180;
    const x = Math.min(event.clientX, window.innerWidth - menuWidth);
    const y = Math.min(event.clientY, window.innerHeight - menuHeight);

    this.contextMenu = {
      visible: true,
      x: Math.max(8, x),
      y: Math.max(8, y),
      targetType,
      targetId
    };
  }

  closeContextMenu(): void {
    this.contextMenu = {
      visible: false,
      x: 0,
      y: 0,
      targetType: null,
      targetId: null
    };
  }

  handleContextAction(action: 'open' | 'addSection' | 'addNote' | 'rename' | 'delete'): void {
    const { targetType, targetId } = this.contextMenu;
    if (!targetType || !targetId) {
      return;
    }

    if (targetType === 'notebook') {
      if (action === 'open') {
        this.selectNotebook(targetId);
      }
      if (action === 'addSection') {
        this.addSectionToNotebook(targetId);
      }
      if (action === 'rename') {
        this.renameNotebook(targetId);
      }
      if (action === 'delete') {
        this.deleteNotebook(targetId);
      }
    }

    if (targetType === 'section') {
      if (action === 'open') {
        this.selectSection(targetId);
      }
      if (action === 'addNote') {
        this.addNoteToSection(targetId);
      }
      if (action === 'rename') {
        this.renameSection(targetId);
      }
      if (action === 'delete') {
        this.deleteSection(targetId);
      }
    }

    if (targetType === 'note') {
      if (action === 'open') {
        this.selectNote(targetId);
      }
      if (action === 'rename') {
        this.renameNote(targetId);
      }
      if (action === 'delete') {
        this.deleteNote(targetId);
      }
    }

    this.closeContextMenu();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeContextMenu();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeContextMenu();
  }

  private bootstrap(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed.notebooks?.length) {
          this.notebooks = parsed.notebooks;
          this.selectedNotebookId = parsed.selectedNotebookId;
          this.selectedSectionId = parsed.selectedSectionId;
          this.selectedNoteId = parsed.selectedNoteId;
          this.ensureSelection();
          return;
        }
      } catch {
        localStorage.removeItem(this.storageKey);
      }
    }

    this.notebooks = this.seedData();
    this.selectedNotebookId = this.notebooks[0].id;
    this.selectedSectionId = this.notebooks[0].sections[0].id;
    this.selectedNoteId = this.notebooks[0].sections[0].notes[0].id;
    this.persist();
  }

  private ensureSelection(): void {
    if (!this.notebooks.length) {
      this.notebooks = this.seedData();
      this.selectedNotebookId = this.notebooks[0].id;
      this.selectedSectionId = this.notebooks[0].sections[0].id;
      this.selectedNoteId = this.notebooks[0].sections[0].notes[0].id;
      this.persist();
      return;
    }

    const notebook = this.notebooks.find((item) => item.id === this.selectedNotebookId) ?? this.notebooks[0];
    this.selectedNotebookId = notebook.id;

    if (!notebook.sections.length) {
      notebook.sections = [
        {
          id: this.id(),
          title: 'New Section',
          notes: [this.createNote('Untitled note', '')]
        }
      ];
    }

    const section = notebook.sections.find((item) => item.id === this.selectedSectionId) ?? notebook.sections[0];
    this.selectedSectionId = section.id;

    if (!section.notes.length) {
      section.notes = [this.createNote('Untitled note', '')];
    }

    const note = section.notes.find((item) => item.id === this.selectedNoteId) ?? section.notes[0];
    this.selectedNoteId = note.id;
  }

  private persist(): void {
    const state: AppState = {
      notebooks: this.notebooks,
      selectedNotebookId: this.selectedNotebookId,
      selectedSectionId: this.selectedSectionId,
      selectedNoteId: this.selectedNoteId
    };

    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  private createNote(title: string, content: string): Note {
    const now = new Date().toISOString();

    return {
      id: this.id(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
      favorite: false
    };
  }

  private createNotebook(title: string): Notebook {
    const accents = ['var(--accent-olive)', 'var(--accent-coral)', 'var(--accent-teal)', 'var(--accent-amber)'];
    const icons = ['journal', 'leaf', 'spark', 'north'];
    const index = this.notebooks.length;

    return {
      id: this.id(),
      title,
      accent: accents[index % accents.length],
      icon: icons[index % icons.length],
      sections: [
        {
          id: this.id(),
          title: 'New Section',
          notes: [this.createNote('Fresh note', 'Start writing your thoughts, plans, or drafts here.')]
        }
      ]
    };
  }

  private id(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private seedData(): Notebook[] {
    return [
      {
        id: this.id(),
        title: 'Personal OS',
        accent: 'var(--accent-coral)',
        icon: 'journal',
        sections: [
          {
            id: this.id(),
            title: 'Daily',
            notes: [
              this.createNote(
                'Morning intention',
                'Top 3 outcomes for today:\n1. Ship one meaningful feature\n2. Exercise for 30 minutes\n3. Finish one personal admin task'
              ),
              this.createNote(
                'Wins archive',
                '- Wrapped up onboarding flow\n- Had a great deep-work session\n- Cleared inbox to zero'
              )
            ]
          },
          {
            id: this.id(),
            title: 'Ideas',
            notes: [
              this.createNote(
                'Side project spark',
                'A lightweight note exporter that converts selected notes into a weekly digest PDF.'
              )
            ]
          }
        ]
      },
      {
        id: this.id(),
        title: 'Work Deep Dives',
        accent: 'var(--accent-teal)',
        icon: 'spark',
        sections: [
          {
            id: this.id(),
            title: 'Planning',
            notes: [
              this.createNote(
                'Q1 focus map',
                'Theme: reduce context switching.\n- Merge duplicate meetings\n- Batch review windows\n- Track deep work hours weekly'
              )
            ]
          }
        ]
      }
    ];
  }
}
