/**
 * Endpoint OpenAI-compatible tối thiểu, dùng để kiểm thử chuỗi
 * backend → worker → mô hình mà không cần LLM thật.
 *
 *   node tools/stub_llm_server.js [cổng]
 *
 * Trả về một nhận xét chỉ dùng lại đúng những con số có trong phần ngữ cảnh
 * mà worker gửi sang, để đi qua được bộ kiểm chứng số liệu của M09/M10.
 */

const http = require("http");

const PORT = Number(process.argv[2] || 8000);

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || !req.url.includes("/chat/completions")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    let context = "";
    try {
      const payload = JSON.parse(body);
      const user = (payload.messages || []).find((m) => m.role === "user");
      context = user ? user.content : "";
    } catch (e) {
      context = "";
    }

    // Lấy mã fact và giá trị từ các dòng "- [F1] Nhãn: 152.340 tấn".
    const facts = [];
    for (const line of context.split("\n")) {
      const match = line.match(/^-\s*\[([^\]]+)]\s*([^:]*):\s*(.+)$/);
      if (match) {
        facts.push({ code: match[1], label: match[2].trim(), value: match[3].trim() });
      }
    }

    let narrative = facts.length
      ? facts.map((f) => `${f.label} là ${f.value}.`).join(" ")
      : "Chưa đủ dữ liệu để nhận xét.";

    // STUB_FABRICATE=1 giả lập mô hình tự bịa số liệu, để kiểm tra bộ chặn.
    if (process.env.STUB_FABRICATE === "1") {
      narrative += " Dự kiến quý sau đạt 987.654 tấn.";
    }

    const content = JSON.stringify({
      narrative,
      facts_used: facts.map((f) => f.code),
      // Trường của luồng chat; luồng narrative bỏ qua.
      answer: narrative,
      citations: ["S1"],
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        id: "stub",
        object: "chat.completion",
        choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      })
    );
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`stub LLM đang nghe trên cổng ${PORT}`);
});
