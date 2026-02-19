export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  color: string;
}

export interface Section {
  id: string;
  title: string;
  color: string;
  notes: Note[];
}

export interface Notebook {
  id: string;
  title: string;
  accent: string;
  icon: string;
  sections: Section[];
}

export interface ThemeConfig {
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  glowOne: string;
  glowTwo: string;
  paneBg: string;
  cardBg: string;
  border: string;
  text: string;
  muted: string;
}

export interface AppState {
  notebooks: Notebook[];
  selectedNotebookId: string;
  selectedSectionId: string;
  selectedNoteId: string;
  theme?: Partial<ThemeConfig>;
}

export type ContextTarget = 'app' | 'notebook' | 'section' | 'note';

export type ContextAction =
  | 'open'
  | 'addSection'
  | 'addNote'
  | 'rename'
  | 'delete'
  | 'setColor'
  | 'setBgStart'
  | 'setBgMid'
  | 'setBgEnd'
  | 'setPaneBg'
  | 'setCardBg'
  | 'setBorder'
  | 'setText'
  | 'setMuted'
  | 'setGlowOne'
  | 'setGlowTwo'
  | 'resetTheme';
