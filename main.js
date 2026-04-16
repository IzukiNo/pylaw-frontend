/**
 * Legal Search AI - Main Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  const el = {
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    html: document.documentElement,
    logoBtn: document.getElementById('logo-btn'),
    appContainer: document.getElementById('app-container'),
    searchSection: document.getElementById('search-section'),
    searchHeader: document.getElementById('search-header'),
    searchResults: document.getElementById('results-section'),
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    autocompleteDropdown: document.getElementById('autocomplete-dropdown'),
  };

  let appState = {
    isDarkMode: false,
    hasSearched: false,
    currentQuery: "",
    suggestTimeout: null
  };

  function init() {
    initTheme();
    bindEvents();
    el.searchInput.focus();

    const savedQuery = localStorage.getItem("legal_search_last_query");
    if (savedQuery) {
      el.searchInput.value = savedQuery;
    }
  }

  function initTheme() {
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

  function bindEvents() {
    el.searchButton.addEventListener('click', handleSearchSubmit);

    el.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        UI.hideSuggestionsDropdown();
        handleSearchSubmit();
      }
    });

    el.searchInput.addEventListener('input', handleSuggestInput);

    el.logoBtn.addEventListener('click', resetApp);

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!el.autocompleteDropdown.contains(e.target) && e.target !== el.searchInput) {
        UI.hideSuggestionsDropdown();
      }
    });
  }

  function handleSuggestInput(e) {
    const rawVal = e.target.value;
    const query = rawVal.trim();

    clearTimeout(appState.suggestTimeout);

    // Rule: only call API when > 1 word OR user presses space natively (trailing space)
    const hasTrailingSpace = rawVal.endsWith(' ');
    const wordCount = query.split(/\s+/).filter(w => w.length > 0).length;

    if (query.length === 0 || (wordCount <= 1 && !hasTrailingSpace)) {
      UI.hideSuggestionsDropdown();
      return;
    }

    // 400ms debounce
    appState.suggestTimeout = setTimeout(async () => {
      try {
        const suggestions = await ApiService.suggest(query);
        UI.renderSuggestionsDropdown(suggestions, (selectedText) => {
          el.searchInput.value = selectedText;
          handleSearchSubmit();
        });
      } catch (err) {
        console.warn("Autosuggest failed", err);
      }
    }, 400);
  }

  function transitionToResultsView() {
    if (appState.hasSearched) return;
    appState.hasSearched = true;

    el.appContainer.classList.add('app-state-results');
    el.searchSection.classList.add('search-active');

    el.searchHeader.classList.add('search-header-hidden');

    el.searchResults.classList.remove('hidden');
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
    UI.hideSuggestionsDropdown();

    el.appContainer.classList.remove('app-state-results');
    el.searchSection.classList.remove('search-active');
    el.searchHeader.classList.remove('search-header-hidden');

    el.searchResults.classList.add('opacity-0');
    setTimeout(() => {
      el.searchResults.classList.add('hidden');
      UI.elements.resultsList.innerHTML = '';
      UI.elements.aiAnswerContent.innerText = '';
    }, 500);

    el.searchInput.focus();
  }

  async function handleSearchSubmit() {
    const query = el.searchInput.value.trim();
    if (!query) return;

    appState.currentQuery = query;
    localStorage.setItem("legal_search_last_query", query);

    el.searchInput.blur();
    UI.hideSuggestionsDropdown();
    transitionToResultsView();

    UI.setLoadingState(true);

    try {
      // Execute API Calls concurrently
      const [searchData, suggestData] = await Promise.all([
        ApiService.search(query),
        ApiService.suggest(query)
      ]);

      UI.renderResults(searchData);
      UI.renderRelatedQuestions(suggestData, (clickedQuery) => {
        el.searchInput.value = clickedQuery;
        handleSearchSubmit();
      });

      // Fetch summary for the top result
      if (searchData.results && searchData.results.length > 0) {
        const topResult = searchData.results[0];
        const docId = topResult.id || topResult.doc_id;
        ApiService.fetchSummary(docId).then(summaryData => {
          UI.renderSummary(summaryData);
        });
      } else {
        UI.renderSummary(null);
      }
    } catch (error) {
      console.error("Failed to fetch search results:", error);
      UI.renderResults({ results: [] });
    } finally {
      UI.setLoadingState(false);
    }
  }

  init();
});
