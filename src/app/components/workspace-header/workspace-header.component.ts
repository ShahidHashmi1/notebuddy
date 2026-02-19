import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-workspace-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace-header.component.html'
})
export class WorkspaceHeaderComponent {
  @Input({ required: true }) profileName = '';
  @Input({ required: true }) notebookCount = 0;
  @Input({ required: true }) sectionCount = 0;
  @Input({ required: true }) totalNotes = 0;
}
