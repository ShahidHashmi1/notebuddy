import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { EditorPaneComponent } from './components/editor-pane/editor-pane.component';
import { NotesPaneComponent } from './components/notes-pane/notes-pane.component';
import { NotebooksPaneComponent } from './components/notebooks-pane/notebooks-pane.component';
import { WorkspaceHeaderComponent } from './components/workspace-header/workspace-header.component';
import { AppState, ContextAction, ContextTarget, Note, Notebook, Section, ThemeConfig } from './models/workspace.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WorkspaceHeaderComponent,
    NotebooksPaneComponent,
    NotesPaneComponent,
    EditorPaneComponent,
    ContextMenuComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly storageKey = 'notebuddy.personal.workspace.v1';
  private readonly sectionColors = ['#4f95d9', '#3e85c4', '#5ba7e6', '#2f74b0', '#77b8ea', '#6a9fd3'];

  readonly defaultTheme: ThemeConfig = {
    bgStart: '#e6f2ff',
    bgMid: '#d6e8fb',
    bgEnd: '#c9def4',
    glowOne: '#3e85c4',
    glowTwo: '#4f95d9',
    paneBg: '#ecf5ff',
    cardBg: '#ffffff',
    border: '#b6d2ee',
    text: '#152c45',
    muted: '#4f6f90'
  };

  notebooks: Notebook[] = [];

  selectedNotebookId = '';
  selectedSectionId = '';
  selectedNoteId = '';

  searchTerm = '';
  profileName = 'Shahid';

  theme: ThemeConfig = { ...this.defaultTheme };

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

  get themeVars(): Record<string, string> {
    return {
      '--bg-start': this.theme.bgStart,
      '--bg-mid': this.theme.bgMid,
      '--bg-end': this.theme.bgEnd,
      '--glow-one': this.theme.glowOne,
      '--glow-two': this.theme.glowTwo,
      '--pane-bg': this.theme.paneBg,
      '--card-bg': this.theme.cardBg,
      '--border': this.theme.border,
      '--ink': this.theme.text,
      '--muted': this.theme.muted
    };
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

  setNotebookColor(notebookId: string): void {
    const notebook = this.notebooks.find((item) => item.id === notebookId);
    if (!notebook) {
      return;
    }

    const value = this.askColor('Notebook color', notebook.accent);
    if (!value) {
      return;
    }

    notebook.accent = value;
    this.persist();
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
      color: this.defaultSectionColor(notebook.sections.length),
      notes: [this.createNote('Untitled note', '', this.defaultSectionColor(notebook.sections.length))]
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

  setSectionColor(sectionId: string): void {
    const section = this.selectedNotebook?.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const value = this.askColor('Section color', section.color);
    if (!value) {
      return;
    }

    section.color = value;
    section.notes.forEach((note) => {
      if (!note.color) {
        note.color = value;
      }
    });
    this.persist();
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
          color: this.defaultSectionColor(0),
          notes: [this.createNote('Untitled note', '', this.defaultSectionColor(0))]
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

    const note = this.createNote('Untitled note', '', section.color);
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

  setNoteColor(noteId: string): void {
    const note = this.selectedSection?.notes.find((item) => item.id === noteId);
    if (!note) {
      return;
    }

    const value = this.askColor('Note color', note.color || this.selectedSection?.color || this.defaultSectionColor(0));
    if (!value) {
      return;
    }

    note.color = value;
    note.updatedAt = new Date().toISOString();
    this.persist();
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
      section.notes[0] = this.createNote('Untitled note', '', section.color);
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

  openContextMenu(event: MouseEvent, targetType: ContextTarget, targetId: string): void {
    event.preventDefault();
    event.stopPropagation();

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

    const menuWidth = 220;
    const menuHeight = 300;
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

  handleContextAction(action: ContextAction): void {
    const { targetType, targetId } = this.contextMenu;

    if (targetType === 'app') {
      this.applyThemeAction(action);
      this.closeContextMenu();
      return;
    }

    if (!targetType || !targetId) {
      return;
    }

    if (targetType === 'notebook') {
      if (action === 'open') this.selectNotebook(targetId);
      if (action === 'addSection') this.addSectionToNotebook(targetId);
      if (action === 'rename') this.renameNotebook(targetId);
      if (action === 'setColor') this.setNotebookColor(targetId);
      if (action === 'delete') this.deleteNotebook(targetId);
    }

    if (targetType === 'section') {
      if (action === 'open') this.selectSection(targetId);
      if (action === 'addNote') this.addNoteToSection(targetId);
      if (action === 'rename') this.renameSection(targetId);
      if (action === 'setColor') this.setSectionColor(targetId);
      if (action === 'delete') this.deleteSection(targetId);
    }

    if (targetType === 'note') {
      if (action === 'open') this.selectNote(targetId);
      if (action === 'rename') this.renameNote(targetId);
      if (action === 'setColor') this.setNoteColor(targetId);
      if (action === 'delete') this.deleteNote(targetId);
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

  private applyThemeAction(action: ContextAction): void {
    if (action === 'setBgStart') this.updateThemeColor('bgStart', 'Background start', this.theme.bgStart);
    if (action === 'setBgMid') this.updateThemeColor('bgMid', 'Background middle', this.theme.bgMid);
    if (action === 'setBgEnd') this.updateThemeColor('bgEnd', 'Background end', this.theme.bgEnd);
    if (action === 'setPaneBg') this.updateThemeColor('paneBg', 'Pane background', this.theme.paneBg);
    if (action === 'setCardBg') this.updateThemeColor('cardBg', 'Card background', this.theme.cardBg);
    if (action === 'setBorder') this.updateThemeColor('border', 'Border', this.theme.border);
    if (action === 'setText') this.updateThemeColor('text', 'Main text', this.theme.text);
    if (action === 'setMuted') this.updateThemeColor('muted', 'Muted text', this.theme.muted);
    if (action === 'setGlowOne') this.updateThemeColor('glowOne', 'Glow color 1', this.theme.glowOne);
    if (action === 'setGlowTwo') this.updateThemeColor('glowTwo', 'Glow color 2', this.theme.glowTwo);

    if (action === 'resetTheme') {
      this.theme = { ...this.defaultTheme };
      this.persist();
    }
  }

  private updateThemeColor(key: keyof ThemeConfig, label: string, current: string): void {
    const value = this.askColor(label, current);
    if (!value) {
      return;
    }

    this.theme[key] = value;
    this.persist();
  }

  private askColor(label: string, current: string): string | null {
    const value = prompt(`${label} color (hex or CSS color)`, current);
    if (value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && !CSS.supports('color', trimmed)) {
      alert('Invalid color value. Try hex like #4f95d9 or a valid CSS color.');
      return null;
    }

    return trimmed;
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
          this.theme = { ...this.defaultTheme, ...(parsed.theme ?? {}) };
          this.ensureSelection();
          this.persist();
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
    this.theme = { ...this.defaultTheme };
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

    this.notebooks.forEach((notebook) => {
      notebook.sections.forEach((section, index) => {
        if (!section.color) {
          section.color = this.defaultSectionColor(index);
        }

        section.notes.forEach((note) => {
          if (!note.color) {
            note.color = section.color;
          }
        });
      });
    });

    const notebook = this.notebooks.find((item) => item.id === this.selectedNotebookId) ?? this.notebooks[0];
    this.selectedNotebookId = notebook.id;

    if (!notebook.sections.length) {
      notebook.sections = [
        {
          id: this.id(),
          title: 'New Section',
          color: this.defaultSectionColor(0),
          notes: [this.createNote('Untitled note', '', this.defaultSectionColor(0))]
        }
      ];
    }

    const section = notebook.sections.find((item) => item.id === this.selectedSectionId) ?? notebook.sections[0];
    this.selectedSectionId = section.id;

    if (!section.notes.length) {
      section.notes = [this.createNote('Untitled note', '', section.color)];
    }

    const note = section.notes.find((item) => item.id === this.selectedNoteId) ?? section.notes[0];
    this.selectedNoteId = note.id;
  }

  private persist(): void {
    const state: AppState = {
      notebooks: this.notebooks,
      selectedNotebookId: this.selectedNotebookId,
      selectedSectionId: this.selectedSectionId,
      selectedNoteId: this.selectedNoteId,
      theme: this.theme
    };

    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  private createNote(title: string, content: string, color: string): Note {
    const now = new Date().toISOString();

    return {
      id: this.id(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
      favorite: false,
      color
    };
  }

  private createNotebook(title: string): Notebook {
    const accents = ['#68a7df', '#4f95d9', '#2f74b0', '#3e85c4'];
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
          color: this.defaultSectionColor(0),
          notes: [
            this.createNote('Fresh note', 'Start writing your thoughts, plans, or drafts here.', this.defaultSectionColor(0))
          ]
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
        accent: '#4f95d9',
        icon: 'journal',
        sections: [
          {
            id: this.id(),
            title: 'Daily',
            color: this.defaultSectionColor(0),
            notes: [
              this.createNote(
                'Morning intention',
                'Top 3 outcomes for today:\n1. Ship one meaningful feature\n2. Exercise for 30 minutes\n3. Finish one personal admin task',
                this.defaultSectionColor(0)
              ),
              this.createNote(
                'Wins archive',
                '- Wrapped up onboarding flow\n- Had a great deep-work session\n- Cleared inbox to zero',
                this.defaultSectionColor(0)
              )
            ]
          },
          {
            id: this.id(),
            title: 'Ideas',
            color: this.defaultSectionColor(1),
            notes: [
              this.createNote(
                'Side project spark',
                'A lightweight note exporter that converts selected notes into a weekly digest PDF.',
                this.defaultSectionColor(1)
              )
            ]
          }
        ]
      },
      {
        id: this.id(),
        title: 'Work Deep Dives',
        accent: '#2f74b0',
        icon: 'spark',
        sections: [
          {
            id: this.id(),
            title: 'Planning',
            color: this.defaultSectionColor(2),
            notes: [
              this.createNote(
                'Q1 focus map',
                'Theme: reduce context switching.\n- Merge duplicate meetings\n- Batch review windows\n- Track deep work hours weekly',
                this.defaultSectionColor(2)
              )
            ]
          }
        ]
      }
    ];
  }

  private defaultSectionColor(index: number): string {
    return this.sectionColors[index % this.sectionColors.length];
  }
}
