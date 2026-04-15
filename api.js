/**
 * Legal Search AI - API Service Layer
 * 
 * This file contains the API abstractions for the application.
 * Currently it implements mock data. When the real backend is ready,
 * replace the methods inside ApiService to use standard fetch() calls.
 */

const ApiService = {
  
  /**
   * Simulates network delay
   */
  async _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * GET /api/search?q=...
   * Mocks a real search response
   */
  async search(query) {
    // Artificial latency (800ms - 1500ms)
    const latency = Math.floor(Math.random() * 700) + 800;
    await this._delay(latency);

    const lowercaseQuery = query.toLowerCase();
    
    // Simulate empty state if they ask about something unrelated
    if (lowercaseQuery.includes("pizza") || lowercaseQuery.includes("recipe") || lowercaseQuery === "xyz") {
      return {
        query: query,
        ai_summary: null,
        results: []
      };
    }

    // Default mock response for Vietnamese Traffic Law
    return {
      query: query,
      ai_summary: `Dựa trên Luật Giao thông đường bộ của Việt Nam, vi phạm hành chính đối với hành vi bạn vừa hỏi thường có mức xử phạt theo Nghị định 100/2019/NĐ-CP và được sửa đổi bổ sung tại Nghị định 123/2021/NĐ-CP. Hành vi này có thể chịu mức phạt tiền và tước quyền sử dụng Giấy phép lái xe tùy thuộc vào việc bạn đang điều khiển loại phương tiện nào.`,
      results: [
        {
          id: "r1",
          question: "Vượt đèn đỏ phạt bao nhiêu đối với xe máy?",
          answer: "Theo Nghị định 100/2019/NĐ-CP (sửa đổi bởi Nghị định 123/2021/NĐ-CP), phạt tiền từ 800.000 đồng đến 1.000.000 đồng đối với người điều khiển xe mô tô, xe gắn máy vượt đèn đỏ. Ngoài ra có thể bị tước Giấy phép lái xe từ 1-3 tháng.",
          highlighted_answer: "Theo Nghị định 100/2019/NĐ-CP, <mark>phạt tiền từ 800.000 đồng đến 1.000.000 đồng</mark> đối với người điều khiển xe mô tô, xe gắn máy <mark>vượt đèn đỏ</mark>. Ngoài ra có thể bị <mark>tước Giấy phép lái xe từ 1-3 tháng</mark>.",
          score: 0.95
        },
        {
          id: "r2",
          question: "Vượt đèn đỏ phạt bao nhiêu đối với ô tô?",
          answer: "Phạt tiền từ 4.000.000 đồng đến 6.000.000 đồng đối với người điều khiển xe ô tô vi phạm lỗi không chấp hành hiệu lệnh của đèn tín hiệu giao thông. Tước Giấy phép lái xe từ 1-3 tháng.",
          highlighted_answer: "<mark>Phạt tiền từ 4.000.000 đồng đến 6.000.000 đồng</mark> đối với người điều khiển xe ô tô vi phạm lỗi không chấp hành hiệu lệnh của đèn tín hiệu giao thông (vượt đèn đỏ). <mark>Tước Giấy phép lái xe từ 1-3 tháng</mark>.",
          score: 0.89
        },
        {
          id: "r3",
          question: "Xe đạp vượt đèn đỏ bị phạt như thế nào?",
          answer: "Người điều khiển xe đạp, xe đạp máy vi phạm vượt đèn đỏ sẽ bị phạt tiền từ 100.000 đồng đến 200.000 đồng.",
          highlighted_answer: "Người điều khiển <mark>xe đạp</mark>, xe đạp máy vi phạm <mark>vượt đèn đỏ</mark> sẽ bị <mark>phạt tiền từ 100.000 đồng đến 200.000 đồng</mark>.",
          score: 0.76
        }
      ]
    };

    /* 
      // REAL IMPLEMENTATION (Once Backend is ready)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
      } catch (error) {
        console.error("Search API Error:", error);
        throw error;
      }
    */
  },

  /**
   * GET /api/suggest?q=...
   * Returns a list of context/suggestion strings based on the query
   */
  async suggest(query) {
    if (!query) return [];
    
    // Quick latency
    await this._delay(300);
    
    return [
      "Mức phạt không đội mũ bảo hiểm",
      "Lỗi đi sai làn đường năm nay",
      "Có được rẽ phải khi đèn đỏ không?",
      "Quy định nồng độ cồn mới nhất",
      "Tra cứu vi phạm phạt nguội"
    ];

    /* 
      // REAL IMPLEMENTATION
      try {
        const response = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    */
  }

};
