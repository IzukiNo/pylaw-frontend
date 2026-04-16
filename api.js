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
   * POST /api/summary/:doc_id
   * Fetches AI summary based on the user's question and document ID
   */
  async fetchSummary(docId, userQuestion) {
    if (!docId || !userQuestion) return null;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/summary/${docId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_question: userQuestion })
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Summary API Error:", error);
      return null;
    }
  },

  /**
   * GET /api/trending
   * Fetches random/recommended questions for the home screen (MOCK)
   */
  async getTrendingQuestions() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      "Vượt đèn đỏ phạt bao nhiêu tiền 2026?",
      "Không mang giấy tờ xe bị phạt thế nào?",
      "Không đội mũ bảo hiểm phạt bao nhiêu?",
      "Đi ngược chiều xe máy bị phạt bao nhiêu?",
      "Nồng độ cồn bao nhiêu thì bị phạt?",
      "Không có bằng lái xe bị phạt bao nhiêu?",
      "Quên mang bằng lái có bị giữ xe không?",
      "Chở quá số người quy định phạt bao nhiêu?",
      "Không bật đèn xe ban đêm có bị phạt không?",
      "Dừng đỗ xe sai quy định phạt bao nhiêu?",
      "Vượt xe sai quy định bị phạt thế nào?",
      "Không xi nhan khi rẽ có bị phạt không?",
      "Chạy quá tốc độ phạt bao nhiêu tiền?",
      "Xe không chính chủ có bị phạt không?",
      "Độ xe (độ pô, độ đèn) có bị phạt không?",
      "Xe máy điện có cần bằng lái không?",
      "Không mang bảo hiểm xe có bị phạt không?",
      "Vượt đèn vàng có bị phạt không?",
      "Đi xe trên vỉa hè bị phạt bao nhiêu?",
      "Bị tước bằng lái thì bao lâu được thi lại?"
    ];
  }
};

