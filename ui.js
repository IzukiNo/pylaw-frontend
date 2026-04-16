/**
 * Legal Search AI - UI Rendering Logic
 */

const UI = {
  elements: {
    aiAnswerBox: document.getElementById('ai-answer'),
    aiAnswerContent: document.getElementById('ai-answer-content'),
    resultsList: document.getElementById('results-list'),
    emptyState: document.getElementById('empty-state'),
    autocompleteDropdown: document.getElementById('autocomplete-dropdown'),
    autocompleteList: document.getElementById('autocomplete-list'),

    // loading parts
    aiLoading: document.getElementById('ai-loading'),
    resultsLoading: document.getElementById('results-loading'),
    contextLoading: document.getElementById('context-loading'),
    contextList: document.getElementById('context-list'),
  },

  escapeHtml(unsafe) {
    return (unsafe || "").toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  sanitizeHighlight(htmlWithMark) {
    if (!htmlWithMark) return "";
    let escaped = UI.escapeHtml(htmlWithMark);
    escaped = escaped.replace(/&lt;mark&gt;/gi, '<mark>').replace(/&lt;\/mark&gt;/gi, '</mark>');
    return escaped;
  },

  setLoadingState(isLoading) {
    const el = UI.elements;
    if (isLoading) {
      el.aiAnswerBox.classList.add('hidden');
      el.resultsList.classList.add('hidden');
      el.emptyState.classList.add('hidden');
      el.contextList.classList.add('hidden');

      el.resultsLoading.innerHTML = Array.from({ length: 3 }).map(() => `
        <div class="bg-surface border border-border rounded-2xl p-5 fade-in">
          <div class="h-5 w-3/4 skeleton rounded mb-3"></div>
          <div class="h-4 w-full skeleton rounded mb-2"></div>
          <div class="h-4 w-5/6 skeleton rounded"></div>
        </div>
      `).join('');

      el.aiLoading.classList.remove('hidden');
      el.resultsLoading.classList.remove('hidden');
      el.contextLoading.classList.remove('hidden');
    } else {
      // NOTE: aiLoading is managed by renderSummary / requestSummary
      el.resultsLoading.classList.add('hidden');
      el.contextLoading.classList.add('hidden');
    }
  },

  formatLawRefConfig(ref) {
    if (!ref) return null;

    var parts = [];
    if (ref.law_name) {
      parts.push(ref.law_name);
    }

    var specifics = [];

    if (ref.article) {
      specifics.push(`Điều ${ref.article}`);
    }

    if (ref.clause) {
      specifics.push(`Khoản ${ref.clause}`);
    }

    if (ref.point) {
      specifics.push(`Điểm ${ref.point}`);
    }

    if (specifics.length > 0) {
      parts.push(specifics.join(' '));
    }

    return parts.join(' - ');
  },

  renderLawRefs(refs) {
    if (!refs || !Array.isArray(refs) || refs.length === 0) return '';

    const renderedItems = refs.map(ref => {
      const label = UI.formatLawRefConfig(ref);
      if (!label) return '';

      const linkHtml = ref.url
        ? `<a href="${UI.escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer" class="law-ref-link font-medium">Xem văn bản <i class="ph ph-arrow-up-right"></i></a>`
        : '';

      return `
        <div class="law-ref-item">
          <i class="ph ph-caret-right text-primary mt-1"></i>
          <div>
            <div>${UI.escapeHtml(label)}</div>
            ${linkHtml}
          </div>
        </div>
      `;
    }).filter(html => html !== '').join('');

    if (!renderedItems) return '';

    return `
      <div class="law-ref-section">
        <div class="law-ref-title">
          <i class="ph ph-file-text"></i> Căn cứ pháp lý
        </div>
        <div class="law-ref-list">
          ${renderedItems}
        </div>
      </div>
    `;
  },

  renderSummary(summaryData) {
    const el = UI.elements;
    el.aiLoading.classList.add('hidden');
    el.aiAnswerBox.classList.remove('hidden');
    el.aiAnswerBox.classList.add('fade-in');

    if (!summaryData || (!summaryData.summary && !summaryData.text)) {
      el.aiAnswerContent.innerHTML = `<div class="flex items-center gap-2 text-textMuted py-2 italic text-[14px]">
        <i class="ph ph-info"></i>
        <span>Không tìm thấy tóm tắt phù hợp cho kết quả này.</span>
      </div>`;
      return;
    }

    const summaryText = summaryData.summary || summaryData.text || "";
    el.aiAnswerContent.innerText = summaryText;

    // Truncation check
    setTimeout(() => {
      const wrapper = el.aiAnswerContent.closest('.answer-wrapper');
      const toggle = wrapper.querySelector('.expand-toggle');
      if (el.aiAnswerContent.scrollHeight <= 130) {
        el.aiAnswerContent.classList.remove('answer-collapsed');
        el.aiAnswerContent.classList.add('answer-expanded');
        toggle.style.display = 'none';
      } else {
        el.aiAnswerContent.classList.add('answer-collapsed');
        el.aiAnswerContent.classList.remove('answer-expanded');
        toggle.style.display = 'inline-flex';
      }
    }, 50);
  },

  renderResults(data, onSummaryRequest) {
    const el = UI.elements;

    if (!data.results || data.results.length === 0) {
      el.aiAnswerBox.classList.add('hidden');
      el.resultsList.classList.add('hidden');
      el.resultsLoading.classList.add('hidden');
      el.emptyState.classList.remove('hidden');
      el.emptyState.classList.add('fade-in');
      return;
    }

    el.resultsList.innerHTML = data.results.map((item, index) => {
      const sanitizedHTML = UI.sanitizeHighlight(item.highlighted_answer || item.answer);
      const lawRefsHTML = UI.renderLawRefs(item.law_refs);
      const questionText = item.question || item.title || 'Kết quả';
      const docId = item.id || item.doc_id;

      return `
        <div class="result-card bg-surface border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors shadow-sm fade-in flex flex-col" style="animation-delay: ${index * 0.1}s">
          <div class="flex justify-between items-start gap-4 mb-3">
            <h4 class="font-medium text-xl leading-tight text-textMain">${UI.escapeHtml(questionText)}</h4>
            ${item.score ? `<span class="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap">${(item.score * 100).toFixed(0)}% Match</span>` : ''}
          </div>
          
          <div class="answer-wrapper mb-4">
            <div class="answer-content answer-collapsed text-textMuted leading-relaxed text-[15px]">
              ${sanitizedHTML}
            </div>
            <button class="expand-toggle" onclick="UI.toggleExpand(this)">
              <span>Xem thêm</span>
              <i class="ph ph-caret-down"></i>
            </button>
          </div>
          
          <div class="mt-auto pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div class="flex-1">
              ${lawRefsHTML || '<div class="text-xs text-textMuted italic">Không có căn cứ pháp lý đính kèm</div>'}
            </div>
            <button class="result-summary-btn group px-3 py-1.5 rounded-lg border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 text-primary dark:text-blue-400 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all shadow-sm flex items-center gap-1.5 self-end mb-1" 
                    title="Tóm tắt nội dung này"
                    data-id="${UI.escapeHtml(docId)}" 
                    data-q="${UI.escapeHtml(questionText)}">
              <i class="ph-fill ph-sparkle text-sm"></i>
              <span class="text-[12px] font-bold uppercase tracking-wider">Summary</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    el.resultsList.classList.remove('hidden');

    // Bind Summary Button clicks
    const summaryBtns = el.resultsList.querySelectorAll('.result-summary-btn');
    summaryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const q = btn.getAttribute('data-q');
        onSummaryRequest(id, q);
      });
    });

    setTimeout(() => {
      const wrappers = el.resultsList.querySelectorAll('.answer-wrapper');
      wrappers.forEach(wrapper => {
        const content = wrapper.querySelector('.answer-content');
        const toggle = wrapper.querySelector('.expand-toggle');
        // If content height is less than max height + padding (approx 130px), no need to collapse
        if (content.scrollHeight <= 130) {
          content.classList.remove('answer-collapsed');
          content.classList.add('answer-expanded');
          toggle.style.display = 'none';
        }
      });
    }, 50);
  },

  toggleExpand(btn) {
    const wrapper = btn.closest('.answer-wrapper');
    const content = wrapper.querySelector('.answer-content');
    const isCollapsed = content.classList.contains('answer-collapsed');

    if (isCollapsed) {
      content.style.maxHeight = content.scrollHeight + 'px';
      content.classList.remove('answer-collapsed');
      content.classList.add('answer-expanded');
      btn.querySelector('span').innerText = 'Thu gọn';
      btn.querySelector('i').classList.replace('ph-caret-down', 'ph-caret-up');
    } else {
      content.style.maxHeight = '120px';
      content.classList.remove('answer-expanded');
      content.classList.add('answer-collapsed');
      btn.querySelector('span').innerText = 'Xem thêm';
      btn.querySelector('i').classList.replace('ph-caret-up', 'ph-caret-down');
    }
  },

  renderSuggestionsDropdown(suggestions, onSelectCallback) {
    const el = UI.elements;
    if (!suggestions || suggestions.length === 0) {
      UI.hideSuggestionsDropdown();
      return;
    }

    el.autocompleteDropdown.classList.remove('hidden');

    setTimeout(() => {
      el.autocompleteDropdown.classList.remove('opacity-0');
      el.autocompleteDropdown.classList.add('opacity-100');
    }, 10);

    el.autocompleteList.innerHTML = suggestions.map(s => {
      const text = typeof s === 'string' ? s : (s.question || s.text || s.query || JSON.stringify(s));
      return `<li class="autocomplete-item text-[15px] font-medium border-b border-border/50 last:border-0">${UI.escapeHtml(text)}</li>`;
    }).join('');

    const items = el.autocompleteList.querySelectorAll('.autocomplete-item');
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const text = item.innerText;
        onSelectCallback(text);
        UI.hideSuggestionsDropdown();
      });
    });
  },

  hideSuggestionsDropdown() {
    const el = UI.elements;
    el.autocompleteDropdown.classList.remove('opacity-100');
    el.autocompleteDropdown.classList.add('opacity-0');
    setTimeout(() => {
      el.autocompleteDropdown.classList.add('hidden');
      el.autocompleteList.innerHTML = '';
    }, 200);
  },

  renderRelatedQuestions(suggestions, onSelectCallback) {
    const el = UI.elements;
    el.contextLoading.classList.add('hidden');
    if (!suggestions || suggestions.length === 0) {
      el.contextList.innerHTML = `<li class="text-textMuted text-xs italic py-2">Không có câu hỏi liên quan nào.</li>`;
    } else {
      el.contextList.innerHTML = suggestions.map((s, i) => {
        const text = typeof s === 'string' ? s : (s.question || s.text || s.query || JSON.stringify(s));
        return `
          <li class="fade-in" style="animation-delay: ${i * 0.05}s">
            <button class="related-question-btn w-full text-left p-3 rounded-xl group transition-all flex items-start justify-between border border-border/40 hover:border-primary/40 dark:border-slate-700/80 dark:hover:border-primary/50 bg-white/50 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800">
              <span class="text-[13px] font-medium text-textMuted dark:text-slate-400 group-hover:text-textMain dark:group-hover:text-slate-200 transition-colors pr-2">${UI.escapeHtml(text)}</span>
              <i class="ph ph-arrow-right text-primary dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0 mt-0.5"></i>
            </button>
          </li>
        `;
      }).join('');

      const btns = el.contextList.querySelectorAll('.related-question-btn');
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          const query = btn.querySelector('span').innerText;
          onSelectCallback(query);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }
    el.contextList.classList.remove('hidden');
  },

  renderTrending(questions, onSelectCallback) {
    const container = document.getElementById('trending-container');
    const track1 = document.getElementById('trending-track-1');
    const track2 = document.getElementById('trending-track-2');

    if (!questions || questions.length === 0) return;

    // Pick a random subset (e.g., 10 questions) to keep the marquee smooth and varied
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    // Split the items roughly in half
    const half = Math.ceil(selected.length / 2);
    const row1Questions = selected.slice(0, half);
    const row2Questions = selected.slice(half);

    const renderTrack = (qArray, targetNode) => {
      if (qArray.length === 0) return;
      const displayItems = [...qArray, ...qArray];
      targetNode.innerHTML = displayItems.map(q => {
        const text = typeof q === 'string' ? q : (q.question || q.text || JSON.stringify(q));
        return `
          <button class="trending-tag px-4 py-2 bg-white/80 dark:bg-slate-800/90 border border-border/80 dark:border-slate-700/80 hover:border-primary/50 dark:hover:border-primary/50 text-textMuted dark:text-slate-400 hover:text-textMain dark:hover:text-slate-200 rounded-full text-[14px] font-medium whitespace-nowrap transition-all shadow-sm hover:shadow flex items-center gap-2">
            <i class="ph ph-trend-up text-primary dark:text-blue-400"></i>
            <span>${UI.escapeHtml(text)}</span>
          </button>
        `;
      }).join('');
    };

    renderTrack(row1Questions, track1);
    renderTrack(row2Questions, track2);

    // Smooth fade in
    setTimeout(() => {
      container.classList.remove('opacity-0', 'pointer-events-none');
      container.classList.add('opacity-100');
    }, 100);

    const btns = container.querySelectorAll('.trending-tag');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.querySelector('span').innerText;
        onSelectCallback(query);
      });
    });
  }
};

