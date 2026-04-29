import { useState } from "react";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/gifts";

const SUGGESTIONS = {
  en: [
    "Gift for a newborn under 200 AED",
    "Thoughtful gift for a friend with a 6-month-old",
    "Premium stroller recommendation",
    "Self-care gift for a new mom",
    "Educational toy for a 2 year old",
    "Baby monitor under 500 AED",
  ],
  ar: [
    "هدية لمولود جديد أقل من 200 درهم",
    "هدية مميزة لصديقة عندها طفل عمره 6 أشهر",
    "عربة أطفال فاخرة",
    "هدية عناية ذاتية لأم جديدة",
    "لعبة تعليمية لطفل عمره سنتين",
    "جهاز مراقبة أطفال أقل من 500 درهم",
  ],
};

const TEXT = {
  en: {
    title: "Find the Perfect Gift",
    subtitle: "Tell us who you're shopping for, their age, and your budget — we'll find the ideal gift from our curated collection.",
    placeholder: "e.g., thoughtful gift for a friend with a 6-month-old, under 200 AED",
    search: "Find Gifts",
    searching: "Searching...",
    results: "Recommendations",
    tryThese: "Try these:",
    confidence: "Match",
    reasoning: "Why we picked this",
    reasoningAr: "لماذا اخترنا هذا",
    footer: "Mumzworld AI Gift Finder — Powered by AI",
  },
  ar: {
    title: "ابحثي عن الهدية المثالية",
    subtitle: "أخبرينا لمن تتسوقين، عمر الطفل، وميزانيتك — وسنجد الهدية المثالية من مجموعتنا المختارة.",
    placeholder: "مثال: هدية مميزة لصديقة عندها طفل عمره 6 أشهر، أقل من 200 درهم",
    search: "ابحثي عن الهدايا",
    searching: "جاري البحث...",
    results: "التوصيات",
    tryThese: "جربي هذه:",
    confidence: "التطابق",
    reasoning: "لماذا اخترنا هذا",
    reasoningAr: "Why we picked this",
    footer: "محرك هدايا ممز وورلد — مدعوم بالذكاء الاصطناعي",
  },
};

function App() {
  const [lang, setLang] = useState("en");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const t = TEXT[lang];
  const isRTL = lang === "ar";

  async function handleSearch(searchQuery) {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, language: lang }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data.data);
    } catch (err) {
      setError("Could not connect to the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  function getConfidenceColor(c) {
    if (c >= 0.7) return "confidence-high";
    if (c >= 0.4) return "confidence-mid";
    return "confidence-low";
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <div className="bg-gradient" />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">🎁</div>
            <span className="logo-text">Mumzworld Gift Finder</span>
          </div>
          <div className="lang-toggle">
            <button
              className={`lang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => setLang("en")}
            >
              English
            </button>
            <button
              className={`lang-btn ${lang === "ar" ? "active" : ""}`}
              onClick={() => setLang("ar")}
            >
              العربية
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Hero */}
        <section className="hero">
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </section>

        {/* Search */}
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              disabled={loading}
              id="search-input"
            />
            <button
              className="search-btn"
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              id="search-button"
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  {t.searching}
                </>
              ) : (
                <>🔍 {t.search}</>
              )}
            </button>
          </div>
        </div>

        {/* Suggestions */}
        {!result && !loading && !error && (
          <div>
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
              {t.tryThese}
            </p>
            <div className="suggestions">
              {SUGGESTIONS[lang].map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => {
                    setQuery(s);
                    handleSearch(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading">
            <div className="loading-spinner" />
            <p className="loading-text">
              {lang === "en"
                ? "Finding the perfect gifts for you..."
                : "نبحث لكِ عن الهدايا المثالية..."}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-card">
            <h3>⚠️ {lang === "en" ? "Oops!" : "عذراً!"}</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Refusal */}
            {!result.query_understood && (
              <div className="refusal-card">
                <div className="refusal-icon">🙅‍♀️</div>
                <h3>{lang === "en" ? "Out of Scope" : "خارج النطاق"}</h3>
                <p>{result.refusal_reason_en}</p>
                <p className="refusal-ar">{result.refusal_reason_ar}</p>
              </div>
            )}

            {/* Budget note */}
            {result.budget_note_en && (
              <div className="budget-note">
                <span>💡</span>
                <span>{lang === "en" ? result.budget_note_en : result.budget_note_ar}</span>
              </div>
            )}

            {/* Recommendations */}
            {result.query_understood && result.recommendations.length > 0 && (
              <>
                <div className="results-header">
                  <h2>{t.results}</h2>
                  <span className="results-count">
                    {result.recommendations.length} {lang === "en" ? "gifts found" : "هدايا"}
                  </span>
                </div>

                {result.recommendations.map((rec, i) => (
                  <div className="product-card" key={rec.product_id}>
                    <div className="card-top">
                      <div>
                        <div className="card-name">{rec.name_en}</div>
                        <div className="card-name-ar">{rec.name_ar}</div>
                      </div>
                      <div className="card-price">
                        {rec.price} <span>{rec.currency}</span>
                      </div>
                    </div>

                    <div className="card-reasoning">
                      <strong style={{ color: "var(--primary-light)", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                        {t.reasoning}
                      </strong>
                      <p style={{ marginTop: 6 }}>{rec.reasoning_en}</p>
                    </div>

                    <div className="card-reasoning-ar">
                      <strong style={{ color: "var(--secondary-light)", fontSize: 12 }}>
                        {t.reasoningAr}
                      </strong>
                      <p style={{ marginTop: 6 }}>{rec.reasoning_ar}</p>
                    </div>

                    <div className="card-footer">
                      <div className="match-factors">
                        {rec.match_factors.map((f, j) => (
                          <span className="factor-tag" key={j}>{f}</span>
                        ))}
                      </div>
                      <div className="confidence-badge">
                        <span style={{ color: "var(--text-muted)" }}>{t.confidence}</span>
                        <div className="confidence-bar">
                          <div
                            className={`confidence-fill ${getConfidenceColor(rec.confidence)}`}
                            style={{ width: `${rec.confidence * 100}%` }}
                          />
                        </div>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                          {Math.round(rec.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* No results */}
            {result.query_understood && result.recommendations.length === 0 && !result.budget_note_en && (
              <div className="refusal-card">
                <div className="refusal-icon">🤷‍♀️</div>
                <h3>{lang === "en" ? "No matches found" : "لم يتم العثور على نتائج"}</h3>
                <p>{lang === "en" ? "Try adjusting your criteria or budget." : "حاولي تعديل معاييرك أو ميزانيتك."}</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">{t.footer}</footer>
    </div>
  );
}

export default App;
