// ATAB - Notes Module with Rich Markdown, Interactive Todo Checklist, Tags & Assignees

const NotesManager = {
  notes: [],
  activeNoteId: null,
  viewMode: 'preview', // 'edit', 'preview'
  activeFilter: 'all', // 'all' or specific tag/assignee
  saveTimeout: null,

  async init(notes) {
    this.notes = (notes || []).map(n => ({
      ...n,
      tags: n.tags || [],
      assignees: n.assignees || []
    }));

    if (this.notes.length > 0) {
      this.activeNoteId = this.notes[0].id;
    }
    this.render();
    this.setupEventListeners();
  },

  save() {
    return StorageManager.set('atab_notes', this.notes);
  },

  getActiveNote() {
    return this.notes.find(n => n.id === this.activeNoteId) || null;
  },

  // Markdown Parser with @Person and #Tag support
  parseMarkdown(md) {
    if (!md) return '<p class="empty-markdown-text">Henüz içerik yazılmadı...</p>';

    let html = md;

    // Escape HTML
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```code```
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre class="md-code-block"><code>${code.trim()}</code></pre>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

    // Headers (# H1, ## H2, ### H3)
    html = html.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

    // Bold & Italic & Strike
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="md-quote">$1</blockquote>');

    // Horizontal Rule
    html = html.replace(/^---$/gim, '<hr class="md-hr">');

    // Interactive Checkboxes / Todo list (- [ ] or - [x])
    let checkboxIndex = 0;
    html = html.replace(/^-\s+\[([ xX])\]\s+(.*)$/gim, (match, checkState, text) => {
      const isChecked = checkState.toLowerCase() === 'x';
      const cbId = `md-task-${checkboxIndex++}`;
      return `
        <div class="md-todo-item ${isChecked ? 'completed' : ''}">
          <input type="checkbox" class="md-todo-checkbox" data-task-index="${checkboxIndex - 1}" ${isChecked ? 'checked' : ''} id="${cbId}">
          <label for="${cbId}" class="md-todo-label">${text}</label>
        </div>
      `;
    });

    // Unordered lists (- item)
    html = html.replace(/^-\s+(?!<div class="md-todo-item")(.*$)/gim, '<li class="md-li">$1</li>');
    html = html.replace(/(<li class="md-li">.*<\/li>)/s, '<ul class="md-ul">$1</ul>');

    // Links [Text](URL)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener noreferrer">$1</a>');

    // Mentions (@Kişi)
    html = html.replace(/@([a-zA-ZçğıöşüÇĞİÖŞÜ0-9_-]+)/g, '<span class="md-mention">👤 @$1</span>');

    // Hashtags (#etiket)
    html = html.replace(/#([a-zA-ZçğıöşüÇĞİÖŞÜ0-9_-]+)/g, '<span class="md-tag-pill">#$1</span>');

    // Paragraphs / Line Breaks
    html = html.replace(/\n\n/g, '</p><p class="md-p">');
    html = html.replace(/\n/g, '<br>');

    return `<div class="md-content"><p class="md-p">${html}</p></div>`;
  },

  // Toggle checkbox directly in markdown text
  toggleTask(taskIndex) {
    const note = this.getActiveNote();
    if (!note || !note.content) return;

    let currentIndex = 0;
    const lines = note.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\s*-\s+\[)([ xX])(\]\s+.*)$/);
      if (match) {
        if (currentIndex === taskIndex) {
          const currentCheck = match[2].toLowerCase() === 'x';
          const newCheck = currentCheck ? ' ' : 'x';
          lines[i] = `${match[1]}${newCheck}${match[3]}`;
          break;
        }
        currentIndex++;
      }
    }

    note.content = lines.join('\n');
    note.updatedAt = Date.now();
    this.save();
    this.renderNoteContent();
    this.renderNotesList();
  },

  createNote() {
    const newNote = {
      id: 'note_' + Date.now(),
      title: 'Yeni Not',
      content: '# Yeni Not\n\nBuraya notlarınızı Markdown formatında yazabilirsiniz.\n\n- [ ] Yapılacak 1\n- [ ] Yapılacak 2',
      tags: [],
      assignees: [],
      updatedAt: Date.now(),
      isPinned: false
    };

    this.notes.unshift(newNote);
    this.activeNoteId = newNote.id;
    this.viewMode = 'edit';
    this.save();
    this.render();
    App.showToast('Yeni not oluşturuldu.');
  },

  deleteNote(noteId) {
    if (this.notes.length <= 1) {
      const note = this.notes[0];
      note.title = 'Not';
      note.content = '';
      note.tags = [];
      note.assignees = [];
      note.updatedAt = Date.now();
      this.save();
      this.render();
      return;
    }

    this.notes = this.notes.filter(n => n.id !== noteId);
    if (this.activeNoteId === noteId) {
      this.activeNoteId = this.notes[0] ? this.notes[0].id : null;
    }
    this.save();
    this.render();
    App.showToast('Not silindi.');
  },

  // Assignee Management for Active Note
  addAssignee(name) {
    const note = this.getActiveNote();
    if (!note || !name || !name.trim()) return;

    let cleanName = name.trim().replace(/^@/, '');
    if (!cleanName) return;

    if (!note.assignees) note.assignees = [];
    if (!note.assignees.includes(cleanName)) {
      note.assignees.push(cleanName);
      note.updatedAt = Date.now();
      this.save();
      this.renderNoteMeta();
      this.renderFilterPills();
      this.renderNotesList();
      App.showToast(`@${cleanName} kişisi atandı.`);
    }
  },

  removeAssignee(name) {
    const note = this.getActiveNote();
    if (!note || !note.assignees) return;

    note.assignees = note.assignees.filter(a => a !== name);
    note.updatedAt = Date.now();
    this.save();
    this.renderNoteMeta();
    this.renderFilterPills();
    this.renderNotesList();
  },

  // Tag Management for Active Note
  addTag(tag) {
    const note = this.getActiveNote();
    if (!note || !tag || !tag.trim()) return;

    let cleanTag = tag.trim();
    if (!cleanTag.startsWith('#')) {
      cleanTag = '#' + cleanTag;
    }

    if (!note.tags) note.tags = [];
    if (!note.tags.includes(cleanTag)) {
      note.tags.push(cleanTag);
      note.updatedAt = Date.now();
      this.save();
      this.renderNoteMeta();
      this.renderFilterPills();
      this.renderNotesList();
      App.showToast(`${cleanTag} etiketi eklendi.`);
    }
  },

  removeTag(tag) {
    const note = this.getActiveNote();
    if (!note || !note.tags) return;

    note.tags = note.tags.filter(t => t !== tag);
    note.updatedAt = Date.now();
    this.save();
    this.renderNoteMeta();
    this.renderFilterPills();
    this.renderNotesList();
  },

  render() {
    this.renderFilterPills();
    this.renderNotesList();
    this.renderNoteContent();
    this.renderNoteMeta();
  },

  // Render Sidebar Tag & Assignee Filter Pills
  renderFilterPills() {
    const pillsContainer = document.getElementById('notes-filter-pills');
    if (!pillsContainer) return;

    const allTags = new Set();
    const allAssignees = new Set();

    this.notes.forEach(note => {
      (note.tags || []).forEach(t => allTags.add(t));
      (note.assignees || []).forEach(a => allAssignees.add(a));
    });

    let html = `
      <button class="filter-pill ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
        Tümü (${this.notes.length})
      </button>
    `;

    allAssignees.forEach(assignee => {
      const isAct = this.activeFilter === `user:${assignee}`;
      html += `
        <button class="filter-pill user-pill ${isAct ? 'active' : ''}" data-filter="user:${this.escapeHtml(assignee)}">
          👤 @${this.escapeHtml(assignee)}
        </button>
      `;
    });

    allTags.forEach(tag => {
      const isAct = this.activeFilter === `tag:${tag}`;
      html += `
        <button class="filter-pill tag-pill ${isAct ? 'active' : ''}" data-filter="tag:${this.escapeHtml(tag)}">
          🏷️ ${this.escapeHtml(tag)}
        </button>
      `;
    });

    pillsContainer.innerHTML = html;
  },

  renderNotesList(searchFilter = '') {
    const listEl = document.getElementById('notes-sidebar-list');
    if (!listEl) return;

    let filtered = this.notes;

    // Filter by Pill (Tag or Assignee)
    if (this.activeFilter !== 'all') {
      if (this.activeFilter.startsWith('user:')) {
        const targetUser = this.activeFilter.replace('user:', '');
        filtered = filtered.filter(n => n.assignees && n.assignees.includes(targetUser));
      } else if (this.activeFilter.startsWith('tag:')) {
        const targetTag = this.activeFilter.replace('tag:', '');
        filtered = filtered.filter(n => n.tags && n.tags.includes(targetTag));
      }
    }

    // Filter by Search Query
    if (searchFilter.trim() !== '') {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) || 
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some(t => t.toLowerCase().includes(q))) ||
        (n.assignees && n.assignees.some(a => a.toLowerCase().includes(q)))
      );
    }

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="notes-empty-list">Eşleşen not bulunamadı</div>';
      return;
    }

    listEl.innerHTML = filtered.map(note => {
      const date = new Date(note.updatedAt || Date.now());
      const dateStr = `${date.getDate()} ${['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][date.getMonth()]} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
      const isActive = note.id === this.activeNoteId;

      return `
        <div class="note-list-item ${isActive ? 'active' : ''}" data-note-id="${note.id}">
          <div class="note-item-header">
            <span class="note-item-title">${this.escapeHtml(note.title || 'Başlıksız Not')}</span>
            <button class="note-item-delete" data-note-id="${note.id}" title="Notu Sil">×</button>
          </div>
          <div class="note-item-snippet">${this.escapeHtml((note.content || '').replace(/[#*`_~>\-]/g, '').slice(0, 50))}</div>
          
          <!-- Badges for Assignees & Tags -->
          <div class="note-item-meta-row">
            ${(note.assignees || []).map(a => `
              <span class="note-list-assignee-badge" title="Atanan: ${this.escapeHtml(a)}">
                👤 ${this.escapeHtml(a)}
              </span>
            `).join('')}
            ${(note.tags || []).map(t => `
              <span class="note-list-tag-badge">
                ${this.escapeHtml(t)}
              </span>
            `).join('')}
          </div>

          <div class="note-item-date">${dateStr}</div>
        </div>
      `;
    }).join('');
  },

  renderNoteMeta() {
    const note = this.getActiveNote();
    const assigneesContainer = document.getElementById('note-assignees-container');
    const tagsContainer = document.getElementById('note-tags-container');

    if (assigneesContainer) {
      if (!note || !note.assignees || note.assignees.length === 0) {
        assigneesContainer.innerHTML = '';
      } else {
        assigneesContainer.innerHTML = note.assignees.map(a => `
          <div class="note-assignee-pill">
            <span class="assignee-avatar">${a.charAt(0).toUpperCase()}</span>
            <span class="assignee-name">${this.escapeHtml(a)}</span>
            <button class="meta-pill-remove btn-remove-assignee" data-name="${this.escapeHtml(a)}" title="Kaldır">×</button>
          </div>
        `).join('');
      }
    }

    if (tagsContainer) {
      if (!note || !note.tags || note.tags.length === 0) {
        tagsContainer.innerHTML = '';
      } else {
        tagsContainer.innerHTML = note.tags.map(t => `
          <div class="note-tag-pill">
            <span class="tag-name">${this.escapeHtml(t)}</span>
            <button class="meta-pill-remove btn-remove-tag" data-tag="${this.escapeHtml(t)}" title="Kaldır">×</button>
          </div>
        `).join('');
      }
    }
  },

  renderNoteContent() {
    const note = this.getActiveNote();
    const titleInput = document.getElementById('note-active-title');
    const editorTextarea = document.getElementById('note-editor-textarea');
    const previewContainer = document.getElementById('note-preview-container');
    const editModeBtn = document.getElementById('note-mode-edit');
    const previewModeBtn = document.getElementById('note-mode-preview');

    if (!note) {
      if (titleInput) titleInput.value = '';
      if (editorTextarea) editorTextarea.value = '';
      if (previewContainer) previewContainer.innerHTML = '<p class="empty-markdown-text">Seçili not yok.</p>';
      return;
    }

    if (titleInput) titleInput.value = note.title || '';
    if (editorTextarea) editorTextarea.value = note.content || '';
    if (previewContainer) previewContainer.innerHTML = this.parseMarkdown(note.content || '');

    // Toggle view mode UI
    if (this.viewMode === 'edit') {
      if (editorTextarea) editorTextarea.style.display = 'block';
      if (previewContainer) previewContainer.style.display = 'none';
      if (editModeBtn) editModeBtn.classList.add('active');
      if (previewModeBtn) previewModeBtn.classList.remove('active');
    } else {
      if (editorTextarea) editorTextarea.style.display = 'none';
      if (previewContainer) previewContainer.style.display = 'block';
      if (editModeBtn) editModeBtn.classList.remove('active');
      if (previewModeBtn) previewModeBtn.classList.add('active');
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  setupEventListeners() {
    const listEl = document.getElementById('notes-sidebar-list');
    const addNoteBtn = document.getElementById('btn-add-note');
    const titleInput = document.getElementById('note-active-title');
    const editorTextarea = document.getElementById('note-editor-textarea');
    const previewContainer = document.getElementById('note-preview-container');
    const searchInput = document.getElementById('notes-search-input');
    const filterPillsContainer = document.getElementById('notes-filter-pills');
    const editModeBtn = document.getElementById('note-mode-edit');
    const previewModeBtn = document.getElementById('note-mode-preview');
    const copyBtn = document.getElementById('note-btn-copy');

    const addAssigneeInput = document.getElementById('note-add-assignee-input');
    const addTagInput = document.getElementById('note-add-tag-input');
    const assigneesContainer = document.getElementById('note-assignees-container');
    const tagsContainer = document.getElementById('note-tags-container');

    // Add note
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => this.createNote());
    }

    // Filter pill clicks
    if (filterPillsContainer) {
      filterPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (pill) {
          this.activeFilter = pill.getAttribute('data-filter') || 'all';
          this.renderFilterPills();
          this.renderNotesList(searchInput ? searchInput.value : '');
        }
      });
    }

    // Select or Delete note from sidebar
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.note-item-delete');
        if (deleteBtn) {
          e.stopPropagation();
          const noteId = deleteBtn.getAttribute('data-note-id');
          if (noteId) this.deleteNote(noteId);
          return;
        }

        const item = e.target.closest('.note-list-item');
        if (item) {
          const noteId = item.getAttribute('data-note-id');
          if (noteId && noteId !== this.activeNoteId) {
            this.activeNoteId = noteId;
            this.render();
          }
        }
      });
    }

    // Search notes
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.renderNotesList(searchInput.value);
      });
    }

    // Add Assignee Input (Enter key or comma)
    if (addAssigneeInput) {
      addAssigneeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          this.addAssignee(addAssigneeInput.value);
          addAssigneeInput.value = '';
        }
      });
      addAssigneeInput.addEventListener('blur', () => {
        if (addAssigneeInput.value.trim()) {
          this.addAssignee(addAssigneeInput.value);
          addAssigneeInput.value = '';
        }
      });
    }

    // Remove Assignee click
    if (assigneesContainer) {
      assigneesContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.btn-remove-assignee');
        if (removeBtn) {
          const name = removeBtn.getAttribute('data-name');
          if (name) this.removeAssignee(name);
        }
      });
    }

    // Add Tag Input (Enter key or comma)
    if (addTagInput) {
      addTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          this.addTag(addTagInput.value);
          addTagInput.value = '';
        }
      });
      addTagInput.addEventListener('blur', () => {
        if (addTagInput.value.trim()) {
          this.addTag(addTagInput.value);
          addTagInput.value = '';
        }
      });
    }

    // Remove Tag click
    if (tagsContainer) {
      tagsContainer.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.btn-remove-tag');
        if (removeBtn) {
          const tag = removeBtn.getAttribute('data-tag');
          if (tag) this.removeTag(tag);
        }
      });
    }

    // Auto-save Title
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        const note = this.getActiveNote();
        if (note) {
          note.title = titleInput.value;
          note.updatedAt = Date.now();
          this.scheduleSave();
          this.renderNotesList();
        }
      });
    }

    // Auto-save Content
    if (editorTextarea) {
      editorTextarea.addEventListener('input', () => {
        const note = this.getActiveNote();
        if (note) {
          note.content = editorTextarea.value;
          note.updatedAt = Date.now();
          this.scheduleSave();
        }
      });
    }

    // Interactive Checkbox Click in Preview
    if (previewContainer) {
      previewContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('md-todo-checkbox')) {
          const taskIndex = parseInt(e.target.getAttribute('data-task-index'), 10);
          if (!isNaN(taskIndex)) {
            this.toggleTask(taskIndex);
          }
        }
      });
    }

    // Mode switchers
    if (editModeBtn) {
      editModeBtn.addEventListener('click', () => {
        this.viewMode = 'edit';
        this.renderNoteContent();
        if (editorTextarea) editorTextarea.focus();
      });
    }

    if (previewModeBtn) {
      previewModeBtn.addEventListener('click', () => {
        this.viewMode = 'preview';
        this.renderNoteContent();
      });
    }

    // Copy note
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const note = this.getActiveNote();
        if (note && note.content) {
          navigator.clipboard.writeText(note.content).then(() => {
            App.showToast('Not panoya kopyalandı.');
          });
        }
      });
    }
  },

  scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.save();
    }, 250);
  }
};
