/**
 * Legal Search AI - API Service Layer
 */

const ApiService = {
  /**
   * GET /api/search?q=...
   * Fetches real search results from backend
   */
  async search(query) {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return await response.json();
    } catch (error) {
      console.error("Search API Error:", error);
      throw error;
    }
  },

  /**
   * GET /api/suggest?q=...
   * Returns a list of autocomplete suggestions
   */
  async suggest(query) {
    if (!query) return [];
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/suggest?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      // API returns { query: "...", suggestions: [...] }
      return data.suggestions || (Array.isArray(data) ? data : (data.results || []));
    } catch (error) {
      console.error("Suggest API Error:", error);
      return [];
    }
  },

  /**
   * GET /api/summary/:doc_id
   * Fetches AI summary for a specific document
   */
  async fetchSummary(docId) {
    if (!docId) return null;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/summary/${docId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Summary API Error:", error);
      return null;
    }
  }
};
