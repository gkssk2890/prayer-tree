import { useState, useEffect, useMemo, useCallback } from "react";
import { Leaf, Plus, X, Calendar, ChevronLeft, ChevronRight, Layers, NotebookPen, Trash2 } from "lucide-react";

const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const STORAGE_KEY = "prayer-tree-entries";
const todayStr = () => new Date().toISOString().slice(0, 10);

function useEntries() {
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, true);
        setEntries(res ? JSON.parse(res.value) : []);
        setStatus("ready");
      } catch {
        setEntries([]);
        setStatus("ready");
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setEntries(next);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(next), true);
    } catch {
      setStatus("error");
    }
  }, []);

  return { entries, status, persist };
}

export default function PrayerTree() {
  const { entries, status, persist } = useEntries();
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [mode, setMode] = useState("month"); // month | all
  const [formOpen, setFormOpen] = useState(false);

  const [fDate, setFDate] = useState(todayStr());
  const [fName, setFName] = useState("");
  const [fPrayers, setFPrayers] = useState(["", "", ""]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const yearEntries = useMemo(
    () => entries.filter((e) => new Date(e.date + "T00:00:00").getFullYear() === year),
    [entries, year]
  );

  const monthEntries = useMemo(
    () =>
      yearEntries
        .filter((e) => new Date(e.date + "T00:00:00").getMonth() === monthIdx)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [yearEntries, monthIdx]
  );

  const countsByMonth = useMemo(() => {
    const c = Array(12).fill(0);
    yearEntries.forEach((e) => c[new Date(e.date + "T00:00:00").getMonth()]++);
    return c;
  }, [yearEntries]);

  const grouped = useMemo(() => {
    const g = {};
    yearEntries.forEach((e) => {
      const m = new Date(e.date + "T00:00:00").getMonth();
      (g[m] = g[m] || []).push(e);
    });
    Object.values(g).forEach((arr) => arr.sort((a, b) => (a.date < b.date ? 1 : -1)));
    return g;
  }, [yearEntries]);

  const totalThisYear = yearEntries.length;

  function resetForm() {
    setFDate(todayStr());
    setFName("");
    setFPrayers(["", "", ""]);
  }

  async function submitEntry() {
    const cleanPrayers = fPrayers.map((p) => p.trim()).filter(Boolean);
    if (!fName.trim() || cleanPrayers.length === 0) {
      setNotice("이름과 기도제목을 하나 이상 입력해 주세요.");
      setTimeout(() => setNotice(""), 2500);
      return;
    }
    setSaving(true);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: fDate,
      name: fName.trim(),
      prayers: cleanPrayers,
      createdAt: new Date().toISOString(),
    };
    const next = [...entries, entry];
    await persist(next);
    const targetMonth = new Date(fDate + "T00:00:00").getMonth();
    const targetYear = new Date(fDate + "T00:00:00").getFullYear();
    setYear(targetYear);
    setMonthIdx(targetMonth);
    setMode("month");
    resetForm();
    setFormOpen(false);
    setSaving(false);
  }

  async function removeEntry(id) {
    await persist(entries.filter((e) => e.id !== id));
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .pt-scroll::-webkit-scrollbar { height: 6px; }
        .pt-scroll::-webkit-scrollbar-thumb { background: #cfd8c9; border-radius: 4px; }
        .pt-fade { animation: pt-fade-in .25s ease; }
        @keyframes pt-fade-in { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }
        .pt-btn:focus-visible, .pt-tab:focus-visible, input:focus-visible, textarea:focus-visible {
          outline: 2px solid #6f9271; outline-offset: 2px;
        }

        /* --- hanging tag garland --- */
        .tag-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: flex-start;
          column-gap: 16px;
          row-gap: 4px;
          padding: 6px 2px 4px;
        }
        .tag-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 162px;
        }
        .tag-item.compact { width: 138px; }
        .tag-string {
          width: 1px;
          background: linear-gradient(to bottom, #c7bb9a, #a9987a);
          position: relative;
        }
        .tag-string::after {
          content: '';
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 7px;
          height: 7px;
          border-radius: 50%;
          border: 1.4px solid #a9987a;
          background: #f4f1e6;
        }
        .tag-card {
          position: relative;
          width: 100%;
          background: #fbf8ef;
          border: 1px solid #e6ddc4;
          box-shadow: 0 8px 16px rgba(38,51,44,0.11);
          padding: 17px 12px 12px;
          clip-path: polygon(0 0, 100% 0, 100% 88%, 88% 100%, 12% 100%, 0 88%);
          transition: transform .15s ease;
        }
        .tag-item.compact .tag-card { padding: 14px 10px 10px; }
        .tag-leaf {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%) rotate(-14deg);
          color: #6f8f66;
          background: #f4f1e6;
          border-radius: 50%;
        }
        .tag-delete {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          border: none;
          background: transparent;
          color: #c9bfa5;
          cursor: pointer;
          border-radius: 5px;
        }
        .tag-delete:hover { color: #a1524f; }

        .twine-wrap { position: relative; max-width: 720px; margin: 0 auto; padding: 12px 22px 0; }
        .twine-leaves { display: flex; justify-content: space-between; padding: 0 6px; margin-top: -15px; }
        .twine-leaves span:nth-child(1) svg { transform: rotate(-18deg); }
        .twine-leaves span:nth-child(2) svg { transform: rotate(12deg); }
        .twine-leaves span:nth-child(3) svg { transform: rotate(-8deg); }
        .twine-leaves span:nth-child(4) svg { transform: rotate(16deg); }
        .twine-leaves span:nth-child(5) svg { transform: rotate(-14deg); }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerCanopy} aria-hidden="true" />
        <div style={styles.headerInner}>
          <div style={styles.headerBadge}>
            <Leaf size={14} strokeWidth={2.2} />
            <span>95년 동기</span>
          </div>
          <h1 style={styles.title}>월간 기도나무</h1>
          <p style={styles.verse}>
            네 짐을 여호와께 맡기라 그가 너를 붙드시고<br />
            의인의 요동함을 영원히 허락하지 아니하시리로다
          </p>
          <p style={styles.verseRef}>시편 55:22</p>
        </div>
      </header>

      <div className="twine-wrap" aria-hidden="true">
        <svg viewBox="0 0 720 30" preserveAspectRatio="none" style={{ width: "100%", height: 22, display: "block" }}>
          <path
            d="M0 16 C 90 2, 180 28, 270 14 S 450 0, 540 16 S 660 26, 720 12"
            stroke="#b7a888"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="1 6"
          />
        </svg>
        <div className="twine-leaves">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i}>
              <Leaf size={13} strokeWidth={2} />
            </span>
          ))}
        </div>
      </div>

      <main style={styles.main}>
        {/* Year + stat row */}
        <div style={styles.yearRow}>
          <button
            className="pt-btn"
            style={styles.yearArrow}
            onClick={() => setYear((y) => y - 1)}
            aria-label="이전 해"
          >
            <ChevronLeft size={18} />
          </button>
          <div style={styles.yearLabel}>{year}년</div>
          <button
            className="pt-btn"
            style={styles.yearArrow}
            onClick={() => setYear((y) => y + 1)}
            aria-label="다음 해"
          >
            <ChevronRight size={18} />
          </button>

          <div style={styles.statPill}>
            <Layers size={13} />
            <span>{year}년 누적 {totalThisYear}건</span>
          </div>

          <div style={styles.modeSwitch}>
            <button
              className="pt-btn"
              onClick={() => setMode("month")}
              style={{ ...styles.modeBtn, ...(mode === "month" ? styles.modeBtnActive : {}) }}
            >
              월별 보기
            </button>
            <button
              className="pt-btn"
              onClick={() => setMode("all")}
              style={{ ...styles.modeBtn, ...(mode === "all" ? styles.modeBtnActive : {}) }}
            >
              전체 누적
            </button>
          </div>
        </div>

        {/* Month tabs */}
        <div className="pt-scroll" style={styles.tabRow}>
          {MONTH_NAMES.map((m, i) => (
            <button
              key={m}
              className="pt-tab"
              onClick={() => {
                setMonthIdx(i);
                setMode("month");
              }}
              style={{
                ...styles.tab,
                ...(mode === "month" && monthIdx === i ? styles.tabActive : {}),
              }}
            >
              {m}
              {countsByMonth[i] > 0 && (
                <span
                  style={{
                    ...styles.tabCount,
                    ...(mode === "month" && monthIdx === i ? styles.tabCountActive : {}),
                  }}
                >
                  {countsByMonth[i]}
                </span>
              )}
            </button>
          ))}
        </div>

        {status === "loading" && <div style={styles.loading}>불러오는 중…</div>}

        {status !== "loading" && mode === "month" && (
          <section className="pt-fade">
            <div style={styles.sectionHead}>
              <h2 style={styles.sectionTitle}>
                {year}년 {MONTH_NAMES[monthIdx]} <span style={styles.sectionCount}>· {monthEntries.length}건</span>
              </h2>
              <button className="pt-btn" style={styles.addBtn} onClick={() => setFormOpen((v) => !v)}>
                {formOpen ? <X size={15} /> : <Plus size={15} />}
                {formOpen ? "닫기" : "기도제목 추가"}
              </button>
            </div>

            {formOpen && (
              <div style={styles.form} className="pt-fade">
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    <Calendar size={13} /> 작성 날짜
                  </label>
                  <input
                    type="date"
                    value={fDate}
                    onChange={(e) => setFDate(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formRow}>
                  <label style={styles.label}>
                    <NotebookPen size={13} /> 이름
                  </label>
                  <input
                    type="text"
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    style={styles.input}
                  />
                </div>
                {[0, 1, 2].map((i) => (
                  <div style={styles.formRow} key={i}>
                    <label style={styles.label}>기도제목 {i + 1}</label>
                    <textarea
                      value={fPrayers[i]}
                      onChange={(e) => {
                        const next = [...fPrayers];
                        next[i] = e.target.value;
                        setFPrayers(next);
                      }}
                      placeholder={i === 0 ? "기도제목을 적어주세요 (필수)" : "기도제목 (선택)"}
                      style={styles.textarea}
                      rows={2}
                    />
                  </div>
                ))}
                {notice && <div style={styles.notice}>{notice}</div>}
                <button
                  type="button"
                  onClick={submitEntry}
                  style={{ ...styles.submitBtn, opacity: saving ? 0.7 : 1 }}
                  disabled={saving}
                >
                  {saving ? "저장 중…" : "기도나무에 새기기"}
                </button>
              </div>
            )}

            {monthEntries.length === 0 ? (
              <div style={styles.empty}>
                <Leaf size={20} strokeWidth={1.5} />
                <p>아직 이 달에 심어진 기도제목이 없어요.</p>
              </div>
            ) : (
              <div className="tag-row">
                {monthEntries.map((e) => (
                  <EntryCard key={e.id} entry={e} onDelete={() => removeEntry(e.id)} />
                ))}
              </div>
            )}
          </section>
        )}

        {status !== "loading" && mode === "all" && (
          <section className="pt-fade">
            {totalThisYear === 0 ? (
              <div style={styles.empty}>
                <Leaf size={20} strokeWidth={1.5} />
                <p>{year}년에 기록된 기도제목이 아직 없어요.</p>
              </div>
            ) : (
              MONTH_NAMES.map((m, i) =>
                grouped[i] ? (
                  <div key={m} style={styles.cumMonth}>
                    <h3 style={styles.cumMonthTitle}>
                      {m} <span style={styles.sectionCount}>· {grouped[i].length}건</span>
                    </h3>
                    <div className="tag-row">
                      {grouped[i].map((e) => (
                        <EntryCard key={e.id} entry={e} compact onDelete={() => removeEntry(e.id)} />
                      ))}
                    </div>
                  </div>
                ) : null
              )
            )}
          </section>
        )}
      </main>

      <footer style={styles.footer}>이 페이지의 기록은 95년 동기 모두에게 함께 보여요 🌿</footer>
    </div>
  );
}

function hashOf(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function EntryCard({ entry, onDelete, compact }) {
  const h = hashOf(entry.id);
  const rotate = (h % 7) - 3; // -3..3 deg, gentle handmade tilt
  const stringLen = [14, 22, 30][h % 3]; // varied hang length

  return (
    <div className={`tag-item${compact ? " compact" : ""}`}>
      <div className="tag-string" style={{ height: stringLen }} />
      <div className="tag-card" style={{ transform: `rotate(${rotate}deg)` }}>
        <Leaf size={14} strokeWidth={2.2} className="tag-leaf" />
        <button className="pt-btn tag-delete" onClick={onDelete} aria-label="삭제" title="삭제">
          <Trash2 size={12} />
        </button>
        <div style={styles.cardMeta}>
          <span style={styles.cardName}>{entry.name}</span>
          <span style={styles.cardDate}>{formatDate(entry.date)}</span>
        </div>
        <div style={styles.cardRule} />
        <ol style={styles.prayerList}>
          {entry.prayers.map((p, i) => (
            <li key={i} style={styles.prayerItem}>
              <span style={styles.prayerIdx}>{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}.${d.getDate()} (${days[d.getDay()]})`;
}

const GREEN_DARK = "#173327";
const GREEN_MID = "#3f6b52";
const GREEN_SAGE = "#7fa383";
const CREAM = "#f4f1e6";
const CREAM_DEEP = "#ece6d6";
const INK = "#26332c";
const MUTED = "#748072";
const ROSE = "#a1524f";

const styles = {
  page: {
    minHeight: "100%",
    background: CREAM,
    fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
    color: INK,
  },
  header: {
    position: "relative",
    background: `radial-gradient(120% 100% at 50% -10%, #234a3a 0%, ${GREEN_DARK} 55%, #0f231b 100%)`,
    padding: "40px 20px 34px",
    textAlign: "center",
    overflow: "hidden",
  },
  headerCanopy: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "radial-gradient(180px 90px at 8% 0%, rgba(127,163,131,0.35), transparent 60%), radial-gradient(220px 110px at 92% 5%, rgba(127,163,131,0.3), transparent 60%), radial-gradient(140px 80px at 50% -20%, rgba(127,163,131,0.25), transparent 60%)",
    pointerEvents: "none",
  },
  headerInner: { position: "relative" },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#c9dcc7",
    background: "rgba(127,163,131,0.16)",
    border: "1px solid rgba(197,216,192,0.25)",
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: 12,
    letterSpacing: "0.02em",
    marginBottom: 14,
  },
  title: {
    fontFamily: "'Noto Serif KR', serif",
    fontWeight: 700,
    fontSize: "clamp(26px, 6vw, 34px)",
    color: "#f5f3ea",
    margin: "0 0 14px",
  },
  verse: {
    color: "#d9e3d4",
    fontFamily: "'Noto Serif KR', serif",
    fontSize: 14.5,
    lineHeight: 1.7,
    margin: "0 0 8px",
  },
  verseRef: { color: "#8fa88f", fontSize: 12, letterSpacing: "0.04em", margin: 0 },

  main: { maxWidth: 720, margin: "0 auto", padding: "22px 16px 40px" },

  yearRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  yearArrow: {
    display: "grid",
    placeItems: "center",
    width: 30,
    height: 30,
    borderRadius: 8,
    border: `1px solid ${CREAM_DEEP}`,
    background: "#fff",
    color: GREEN_MID,
    cursor: "pointer",
  },
  yearLabel: {
    fontFamily: "'Noto Serif KR', serif",
    fontWeight: 700,
    fontSize: 19,
    color: GREEN_DARK,
    minWidth: 62,
    textAlign: "center",
  },
  statPill: {
    marginLeft: "auto",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12.5,
    color: GREEN_MID,
    background: "#e7efe3",
    border: `1px solid #d3e0cc`,
    borderRadius: 999,
    padding: "5px 10px",
  },
  modeSwitch: {
    display: "flex",
    background: "#fff",
    border: `1px solid ${CREAM_DEEP}`,
    borderRadius: 10,
    padding: 3,
    gap: 2,
    width: "100%",
    marginTop: 6,
  },
  modeBtn: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "7px 10px",
    fontSize: 13,
    fontWeight: 500,
    color: MUTED,
    borderRadius: 7,
    cursor: "pointer",
  },
  modeBtnActive: { background: GREEN_DARK, color: "#fff" },

  tabRow: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 6,
    marginBottom: 18,
  },
  tab: {
    flex: "0 0 auto",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "7px 13px",
    borderRadius: 999,
    border: `1px solid ${CREAM_DEEP}`,
    background: "#fff",
    color: INK,
    fontSize: 13.5,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tabActive: { background: GREEN_MID, borderColor: GREEN_MID, color: "#fff" },
  tabCount: {
    fontSize: 11,
    background: "#eef2ea",
    color: GREEN_MID,
    borderRadius: 999,
    padding: "1px 6px",
    fontWeight: 600,
  },
  tabCountActive: { background: "rgba(255,255,255,0.25)", color: "#fff" },

  loading: { textAlign: "center", color: MUTED, padding: "40px 0", fontSize: 14 },

  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "'Noto Serif KR', serif",
    fontSize: 18,
    fontWeight: 700,
    color: GREEN_DARK,
    margin: 0,
  },
  sectionCount: { fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500, fontSize: 13, color: MUTED },

  addBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: GREEN_DARK,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 13px",
    fontSize: 13,
    cursor: "pointer",
  },

  form: {
    background: "#fff",
    border: `1px solid ${CREAM_DEEP}`,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  formRow: { display: "flex", flexDirection: "column", gap: 5 },
  label: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12.5,
    color: GREEN_MID,
    fontWeight: 600,
  },
  input: {
    border: `1px solid ${CREAM_DEEP}`,
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 14,
    fontFamily: "inherit",
    color: INK,
    background: CREAM,
  },
  textarea: {
    border: `1px solid ${CREAM_DEEP}`,
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 14,
    fontFamily: "inherit",
    color: INK,
    background: CREAM,
    resize: "vertical",
  },
  notice: { fontSize: 12.5, color: ROSE },
  submitBtn: {
    background: GREEN_MID,
    color: "#fff",
    border: "none",
    borderRadius: 9,
    padding: "11px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 2,
  },

  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    color: MUTED,
    padding: "36px 0",
    fontSize: 13.5,
    textAlign: "center",
  },

  cardMeta: { display: "flex", flexDirection: "column", gap: 1, marginBottom: 8, paddingRight: 16 },
  cardName: {
    fontFamily: "'Noto Serif KR', serif",
    fontWeight: 700,
    fontSize: 14,
    color: GREEN_DARK,
    wordBreak: "keep-all",
  },
  cardDate: { fontSize: 10.5, color: MUTED, letterSpacing: "0.01em" },
  cardRule: {
    height: 0,
    borderTop: `1px dashed ${CREAM_DEEP}`,
    margin: "0 0 9px",
  },
  prayerList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 7 },
  prayerItem: { display: "flex", gap: 6, fontSize: 12.5, lineHeight: 1.5, color: INK },
  prayerIdx: {
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    width: 15,
    height: 15,
    marginTop: 1,
    borderRadius: "50%",
    background: "#e7efe3",
    color: GREEN_MID,
    fontSize: 9.5,
    fontWeight: 700,
  },

  cumMonth: { marginBottom: 22 },
  cumMonthTitle: {
    fontFamily: "'Noto Serif KR', serif",
    fontSize: 15.5,
    fontWeight: 700,
    color: GREEN_DARK,
    borderBottom: `1px solid ${CREAM_DEEP}`,
    paddingBottom: 6,
    marginBottom: 10,
  },

  footer: { textAlign: "center", color: MUTED, fontSize: 12, padding: "10px 0 28px" },
};
