/**
 * Legal Search AI - Main Application Logic
 * 
 * Handles UI state, DOM manipulation, transitions, and ties into the ApiService.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const el = {
    // Theme
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    html: document.documentElement,
    logoBtn: document.getElementById('logo-btn'),

    // App Containers
    appContainer: document.getElementById('app-container'),
    searchSection: document.getElementById('search-section'),
    searchHeader: document.getElementById('search-header'),
    searchResults: document.getElementById('results-section'),
    
    // Search Inputs
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    searchSuggestionsHome: document.getElementById('search-suggestions'),
    suggestionTags: document.querySelectorAll('.suggestion-tag'),

    // Result Blocks
    aiLoading: document.getElementById('ai-loading'),
    aiAnswerBox: document.getElementById('ai-answer'),
    aiAnswerContent: document.getElementById('ai-answer-content'),
    
    resultsLoading: document.getElementById('results-loading'),
    resultsList: document.getElementById('results-list'),
    emptyState: document.getElementById('empty-state'),

    contextLoading: document.getElementById('context-loading'),
    contextList: document.getElementById('context-list'),
  };

  // --- State ---
  let appState = {
    isDarkMode: false,
    hasSearched: false,
    currentQuery: ""
  };

  // --- Initialization ---
  function init() {
    initTheme();
    bindEvents();
    el.searchInput.focus();

    // Check if there was a previous query
    const savedQuery = localStorage.getItem("legal_search_last_query");
    if (savedQuery) {
      el.searchInput.value = savedQuery;
    }
  }

  // --- Theme Management ---
  function initTheme() {
    // Check local storage or OS preference
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      setTheme(true);
    } else {
      setTheme(false);
    }

    el.themeToggle.addEventListener('click', () => {
      setTheme(!appState.isDarkMode);
    });
  }

  function setTheme(isDark) {
    appState.isDarkMode = isDark;
    if (isDark) {
      el.html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      el.themeIcon.classList.replace('ph-moon', 'ph-sun');
    } else {
      el.html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      el.themeIcon.classList.replace('ph-sun', 'ph-moon');
    }
  }

  // --- Event Binding ---
  function bindEvents() {
    el.searchButton.addEventListener('click', handleSearchSubmit);
    el.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearchSubmit();
    });

    el.logoBtn.addEventListener('click', resetApp);

    // Initial home suggestion clicks
    el.suggestionTags.forEach(tag => {
      tag.addEventListener('click', () => {
        el.searchInput.value = tag.innerText;
        handleSearchSubmit();
      });
    });
  }

  // --- View Transitions ---
  function transitionToResultsView() {
    if (appState.hasSearched) return; // Already transitioned
    appState.hasSearched = true;

    // Morph the container layouts
    el.appContainer.classList.add('app-state-results');
    el.searchSection.classList.add('search-active');
    
    // Hide header and center tags
    el.searchHeader.classList.add('search-header-hidden');
    el.searchSuggestionsHome.classList.add('hidden');

    // Show the results section
    el.searchResults.classList.remove('hidden');
    // small delay to allow display flex to apply before opacity transitions
    setTimeout(() => {
      el.searchResults.classList.remove('opacity-0');
    }, 50);
  }

  function resetApp() {
    if (!appState.hasSearched) return;
    appState.hasSearched = false;
    appState.currentQuery = "";
    el.searchInput.value = "";
    localStorage.removeItem("legal_search_last_query");

    el.appContainer.classList.remove('app-state-results');
    el.searchSection.classList.remove('search-active');
    el.searchHeader.classList.remove('search-header-hidden');
    el.searchSuggestionsHome.classList.remove('hidden');
    
    el.searchResults.classList.add('opacity-0');
    setTimeout(() => {
      el.searchResults.classList.add('hidden');
    }, 500);

    el.searchInput.focus();
  }

  // --- Search Logic & UI Flow ---
  async function handleSearchSubmit() {
    const query = el.searchInput.value.trim();
    if (!query) return;

    appState.currentQuery = query;
    localStorage.setItem("legal_search_last_query", query);

    el.searchInput.blur();
    transitionToResultsView();

    // Prepare UI for Loading
    setLoadingState(true);

    try {
      // Execute API Calls concurrently
      const [searchData, suggestData] = await Promise.all([
        ApiService.search(query),
        ApiService.suggest(query)
      ]);

      renderResults(searchData);
      renderSuggestions(suggestData);
    } catch (error) {
      console.error("Failed to fetch search results:", error);
      // Fallback empty state on error
      renderResults({ results: [] });
    } finally {
      setLoadingState(false);
    }
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      // Hide actual content
      el.aiAnswerBox.classList.add('hidden');
      el.resultsList.classList.add('hidden');
      el.emptyState.classList.add('hidden');
      el.contextList.classList.add('hidden');

      // Generate skeleton list items based on random number
      el.resultsLoading.innerHTML = Array.from({length: 3}).map(() => `
        <div class="bg-surface border border-border rounded-2xl p-5 fade-in">
          <div class="h-5 w-3/4 skeleton rounded mb-3"></div>
          <div class="h-4 w-full skeleton rounded mb-2"></div>
          <div class="h-4 w-5/6 skeleton rounded"></div>
        </div>
      `).join('');

      // Show skeletons
      el.aiLoading.classList.remove('hidden');
      el.resultsLoading.classList.remove('hidden');
      el.contextLoading.classList.remove('hidden');
    } else {
      // Hide skeletons
      el.aiLoading.classList.add('hidden');
      el.resultsLoading.classList.add('hidden');
      el.contextLoading.classList.add('hidden');
    }
  }

  // --- DOM Rendering ---
  function renderResults(data) {
    if (!data.results || data.results.length === 0) {
      // Empty State
      el.aiAnswerBox.classList.add('hidden');
      el.resultsList.classList.add('hidden');
      el.emptyState.classList.remove('hidden');
      el.emptyState.classList.add('fade-in');
      return;
    }

    // Process AI Summary
    if (data.ai_summary) {
      el.aiAnswerContent.innerText = data.ai_summary;
      el.aiAnswerBox.classList.remove('hidden');
      el.aiAnswerBox.classList.add('fade-in');
    }

    // Process List
    el.resultsList.innerHTML = data.results.map((item, index) => `
      <div class="bg-surface border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors shadow-sm fade-in" style="animation-delay: ${index * 0.1}s">
        <div class="flex justify-between items-start gap-4 mb-2">
          <h4 class="font-medium text-lg">${escapeHtml(item.question)}</h4>
          ${item.score ? `<span class="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap">${(item.score * 100).toFixed(0)}% Match</span>` : ''}
        </div>
        <p class="text-textMuted leading-relaxed">${sanitizeHighlight(item.highlighted_answer)}</p>
      </div>
    `).join('');

    el.resultsList.classList.remove('hidden');
  }

  function renderSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      el.contextList.innerHTML = `<li class="text-textMuted text-sm italic py-2">No related suggestions.</li>`;
    } else {
      el.contextList.innerHTML = suggestions.map((sug, i) => `
        <li class="fade-in" style="animation-delay: ${i * 0.05}s">
          <button class="context-suggestion w-full text-left p-3 rounded-lg hover:bg-bg-primary group transition-colors flex items-center justify-between border border-transparent hover:border-border">
            <span class="text-sm font-medium text-textMuted group-hover:text-textMain transition-colors">${escapeHtml(sug)}</span>
            <i class="ph ph-arrow-up-right text-textMuted opacity-0 group-hover:opacity-100 transition-opacity"></i>
          </button>
        </li>
      `).join('');

      // Bind click events to new context suggestions
      document.querySelectorAll('.context-suggestion').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const newQuery = e.currentTarget.querySelector('span').innerText;
          el.searchInput.value = newQuery;
          handleSearchSubmit();
          // Scroll to top mobile friendly
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }

    el.contextList.classList.remove('hidden');
  }

  // --- Utility Functions ---
  
  // Basic HTML Escaping to prevent XSS
  function escapeHtml(unsafe) {
    return (unsafe || "").toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Safely renders incoming highlighted HTML.
  // We only allow <mark> tags. All other tags are escaped.
  function sanitizeHighlight(htmlWithMark) {
    if (!htmlWithMark) return "";
    
    // First, escape everything
    let escaped = escapeHtml(htmlWithMark);
    
    // Then, unescape ONLY <mark> and </mark>
    // Note: escapeHtml converts < to &lt; and > to &gt;
    escaped = escaped.replace(/&lt;mark&gt;/gi, '<mark>');
    escaped = escaped.replace(/&lt;\/mark&gt;/gi, '</mark>');
    
    return escaped;
  }

  // Run init
  init();
});
