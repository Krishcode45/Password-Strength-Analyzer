import { useState, useCallback } from "react";

// ── Cybersecurity colour palette ──────────────────────────────
// Deep navy terminal aesthetic with electric green accents
// Signature: an animated "entropy arc" that fills like a radar sweep

const COMMON = new Set([
  "password","password123","123456","12345678","qwerty","abc123",
  "111111","123123","letmein","admin","welcome","monkey","dragon",
  "master","sunshine","princess","iloveyou","football","shadow",
  "superman","batman","trustno1","pass","login","hello","test",
  "guest","1234","12345","123456789","0000","passw0rd","admin123",
]);

const KEYBOARD = ["qwerty","qwertyuiop","asdfgh","asdfghjkl","zxcvbn","1qaz","2wsx"];

const WORDS = ["pass","word","name","user","login","admin","love","baby","cool","king","fire","blue","dark","nice","star"];

function charsetSize(p) {
  let n = 0;
  if (/[a-z]/.test(p)) n += 26;
  if (/[A-Z]/.test(p)) n += 26;
  if (/[0-9]/.test(p)) n += 10;
  if (/[^a-zA-Z0-9]/.test(p)) n += 32;
  return Math.max(n, 1);
}

function entropy(p) {
  return p.length * Math.log2(charsetSize(p));
}

function analyse(pwd) {
  if (!pwd) return null;
  const p = pwd.toLowerCase();
  let score = 0;
  const issues = [];
  const checks = {
    length8:   pwd.length >= 8,
    length12:  pwd.length >= 12,
    length16:  pwd.length >= 16,
    upper:     /[A-Z]/.test(pwd),
    lower:     /[a-z]/.test(pwd),
    digit:     /[0-9]/.test(pwd),
    special:   /[^a-zA-Z0-9]/.test(pwd),
  };

  if (checks.length8)  score += 10; else issues.push("At least 8 characters");
  if (checks.length12) score += 10;
  if (checks.length16) score += 10;
  if (checks.upper)    score += 10; else issues.push("Add an uppercase letter");
  if (checks.lower)    score += 10; else issues.push("Add a lowercase letter");
  if (checks.digit)    score += 10; else issues.push("Add a digit (0–9)");
  if (checks.special)  score += 15; else issues.push("Add a special character (!@#$...)");

  const ent = entropy(pwd);
  if (ent >= 60) score += 15;

  const risks = [];
  if (COMMON.has(p))                          risks.push("This is a commonly used password");
  if (KEYBOARD.some(k => p.includes(k)))      risks.push("Keyboard walking pattern detected");
  if (/(.)\1{2,}/.test(pwd))                  risks.push("Repeated characters (e.g. aaa)");
  if (/012|123|234|345|456|567|678|789/.test(pwd)) risks.push("Sequential digits detected");
  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn/.test(p)) risks.push("Sequential letters detected");
  if (WORDS.some(w => p.includes(w)))         risks.push("Common word found in password");

  if (!risks.length) score += 10;
  score = Math.min(100, score);

  let label, color;
  if      (score <= 20) { label = "Very Weak";   color = "#ff3b30"; }
  else if (score <= 40) { label = "Weak";         color = "#ff9500"; }
  else if (score <= 60) { label = "Moderate";     color = "#ffd60a"; }
  else if (score <= 80) { label = "Strong";       color = "#30d158"; }
  else                  { label = "Very Strong";  color = "#00d4ff"; }

  let crackTime;
  if      (ent < 28) crackTime = "Instantly";
  else if (ent < 36) crackTime = "Minutes";
  else if (ent < 50) crackTime = "Hours–Days";
  else if (ent < 65) crackTime = "Years";
  else if (ent < 80) crackTime = "Centuries";
  else               crackTime = "Practically forever";

  return { score, label, color, checks, issues, risks, ent: ent.toFixed(1), crackTime };
}

const CHARS_UPPER   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARS_LOWER   = "abcdefghijklmnopqrstuvwxyz";
const CHARS_DIGIT   = "0123456789";
const CHARS_SPECIAL = "!@#$%^&*()-_=+[]{}|;:,.<>?";

function generatePassword(length = 16) {
  const all = CHARS_UPPER + CHARS_LOWER + CHARS_DIGIT + CHARS_SPECIAL;
  let arr = [
    CHARS_UPPER  [Math.floor(Math.random() * CHARS_UPPER.length)],
    CHARS_LOWER  [Math.floor(Math.random() * CHARS_LOWER.length)],
    CHARS_DIGIT  [Math.floor(Math.random() * CHARS_DIGIT.length)],
    CHARS_SPECIAL[Math.floor(Math.random() * CHARS_SPECIAL.length)],
  ];
  for (let i = 4; i < length; i++) arr.push(all[Math.floor(Math.random() * all.length)]);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

// ── Entropy Arc SVG ───────────────────────────────────────────
function EntropyArc({ score, color }) {
  const r = 52;
  const cx = 64, cy = 64;
  const full = 2 * Math.PI * r;
  const startAngle = -Math.PI * 0.75;
  const sweep = Math.PI * 1.5;
  const filled = (score / 100) * sweep;

  const arc = (angle, radius) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const describeArc = (start, end, rad) => {
    const s = arc(start, rad);
    const e = arc(end, rad);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${s.x} ${s.y} A ${rad} ${rad} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const trackPath  = describeArc(startAngle, startAngle + sweep, r);
  const fillPath   = score > 0 ? describeArc(startAngle, startAngle + filled, r) : null;

  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      {/* Track */}
      <path d={trackPath} fill="none" stroke="#1e2d3d" strokeWidth="10" strokeLinecap="round" />
      {/* Fill */}
      {fillPath && (
        <path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
      {/* Score */}
      <text x="64" y="60" textAnchor="middle" fill={color} fontSize="22" fontWeight="700" fontFamily="monospace">
        {score}
      </text>
      <text x="64" y="76" textAnchor="middle" fill="#7a8a9a" fontSize="9" fontFamily="monospace" letterSpacing="1">
        /100
      </text>
    </svg>
  );
}

// ── Check row ─────────────────────────────────────────────────
function CheckRow({ ok, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%",
        background: ok ? "#30d15822" : "#ff3b3022",
        border: `1.5px solid ${ok ? "#30d158" : "#ff3b30"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, flexShrink: 0, color: ok ? "#30d158" : "#ff3b30",
      }}>
        {ok ? "✓" : "✗"}
      </span>
      <span style={{ fontSize: 13, color: ok ? "#a0b4c0" : "#ff6b6b", fontFamily: "monospace" }}>
        {label}
      </span>
    </div>
  );
}

// ── Suggestion card ───────────────────────────────────────────
function SuggestionCard({ pwd, onUse }) {
  const [copied, setCopied] = useState(false);
  const a = analyse(pwd);
  const copy = () => {
    navigator.clipboard?.writeText(pwd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{
      background: "#0d1a24", border: "1px solid #1e2d3d",
      borderRadius: 8, padding: "10px 14px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
    }}>
      <span style={{ fontFamily: "monospace", fontSize: 13, color: "#e0eaf0", letterSpacing: 0.5, wordBreak: "break-all" }}>
        {pwd}
      </span>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: a.color, background: a.color + "22", padding: "2px 7px", borderRadius: 4, fontFamily: "monospace" }}>
          {a.score}
        </span>
        <button onClick={copy} style={{
          background: copied ? "#30d15822" : "#1e2d3d", border: "1px solid #2e3d4d",
          color: copied ? "#30d158" : "#7a8a9a", borderRadius: 4,
          padding: "2px 9px", cursor: "pointer", fontSize: 11, fontFamily: "monospace",
        }}>
          {copied ? "✓" : "copy"}
        </button>
        <button onClick={() => onUse(pwd)} style={{
          background: "#00d4ff22", border: "1px solid #00d4ff55",
          color: "#00d4ff", borderRadius: 4,
          padding: "2px 9px", cursor: "pointer", fontSize: 11, fontFamily: "monospace",
        }}>
          use
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [pwd, setPwd]           = useState("");
  const [show, setShow]         = useState(false);
  const [suggestions, setSug]   = useState([]);
  const [genLen, setGenLen]      = useState(16);
  const [copied, setCopied]     = useState(false);

  const result = analyse(pwd);

  const generate = useCallback(() => {
    setSug([generatePassword(genLen), generatePassword(genLen), generatePassword(genLen)]);
  }, [genLen]);

  const copyPwd = () => {
    navigator.clipboard?.writeText(pwd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070e14",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#e0eaf0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 16px 64px",
    }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#00d4ff", fontFamily: "monospace", marginBottom: 10, textTransform: "uppercase" }}>
          Cybersecurity Tool
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: "#e0eaf0" }}>
          Password Strength Analyser
        </h1>
        <p style={{ margin: "8px 0 0", color: "#4a6070", fontSize: 14 }}>
          Type your password to see real-time analysis
        </p>
      </div>

      {/* Main card */}
      <div style={{
        width: "100%", maxWidth: 560,
        background: "#0d1a24",
        border: "1px solid #1e2d3d",
        borderRadius: 16,
        overflow: "hidden",
      }}>

        {/* Input area */}
        <div style={{ padding: "24px 24px 0" }}>
          <div style={{ position: "relative" }}>
            <input
              type={show ? "text" : "password"}
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              placeholder="Enter your password…"
              autoComplete="off"
              spellCheck={false}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#070e14",
                border: `1.5px solid ${result ? result.color + "55" : "#1e2d3d"}`,
                borderRadius: 10, padding: "14px 48px 14px 16px",
                fontSize: 17, fontFamily: "monospace",
                color: "#e0eaf0", outline: "none",
                letterSpacing: show ? 0 : 2,
                transition: "border-color 0.3s",
              }}
            />
            {/* Show/hide toggle */}
            <button
              onClick={() => setShow(s => !s)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "#4a6070", fontSize: 16, padding: 4,
              }}
              title={show ? "Hide" : "Show"}
            >
              {show ? "🙈" : "👁"}
            </button>
          </div>

          {/* Strength bar */}
          <div style={{ marginTop: 10, marginBottom: 4 }}>
            <div style={{ height: 4, background: "#1e2d3d", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: result ? `${result.score}%` : "0%",
                background: result ? result.color : "#1e2d3d",
                borderRadius: 2,
                boxShadow: result ? `0 0 8px ${result.color}` : "none",
                transition: "width 0.4s ease, background 0.3s, box-shadow 0.3s",
              }} />
            </div>
          </div>
        </div>

        {/* Results */}
        {result ? (
          <div style={{ padding: "16px 24px 24px" }}>

            {/* Arc + stats */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
              {/* Arc */}
              <div style={{ flexShrink: 0 }}>
                <EntropyArc score={result.score} color={result.color} />
                <div style={{ textAlign: "center", marginTop: -8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: result.color, fontFamily: "monospace" }}>
                    {result.label}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ flex: 1, paddingTop: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginBottom: 12 }}>
                  {[
                    ["Length",   `${pwd.length} chars`],
                    ["Entropy",  `${result.ent} bits`],
                    ["Charset",  charsetSize(pwd) + " chars"],
                    ["Crack",    result.crackTime],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: "#4a6070", fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase" }}>{k}</div>
                      <div style={{ fontSize: 13, color: "#c0d4e0", fontFamily: "monospace", fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Checks */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                  <CheckRow ok={result.checks.length8}  label="8+ chars" />
                  <CheckRow ok={result.checks.upper}    label="Uppercase" />
                  <CheckRow ok={result.checks.length12} label="12+ chars" />
                  <CheckRow ok={result.checks.lower}    label="Lowercase" />
                  <CheckRow ok={result.checks.digit}    label="Digits" />
                  <CheckRow ok={result.checks.special}  label="Symbols" />
                </div>
              </div>
            </div>

            {/* Vulnerabilities */}
            {result.risks.length > 0 && (
              <div style={{
                background: "#ff3b3011", border: "1px solid #ff3b3033",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, color: "#ff6b6b", fontFamily: "monospace", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                  ⚠ Vulnerabilities
                </div>
                {result.risks.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#ff9090", fontFamily: "monospace", padding: "2px 0" }}>
                    — {r}
                  </div>
                ))}
              </div>
            )}

            {/* Issues / what to fix */}
            {result.issues.length > 0 && (
              <div style={{
                background: "#ffd60a0d", border: "1px solid #ffd60a33",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, color: "#ffd60a", fontFamily: "monospace", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                  ✦ To improve
                </div>
                {result.issues.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#e0c060", fontFamily: "monospace", padding: "2px 0" }}>
                    + {r}
                  </div>
                ))}
              </div>
            )}

            {/* All good */}
            {result.score >= 81 && result.risks.length === 0 && (
              <div style={{
                background: "#30d15811", border: "1px solid #30d15833",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "#30d158", fontFamily: "monospace",
              }}>
                ✓ Excellent password — no vulnerabilities detected.
              </div>
            )}

            {/* Copy current */}
            {pwd && (
              <button onClick={copyPwd} style={{
                width: "100%", padding: "10px", marginBottom: 16,
                background: "#1e2d3d", border: "1px solid #2e3d4d",
                borderRadius: 8, color: copied ? "#30d158" : "#7a8a9a",
                cursor: "pointer", fontSize: 13, fontFamily: "monospace",
                transition: "color 0.2s",
              }}>
                {copied ? "✓ Copied to clipboard" : "Copy password"}
              </button>
            )}

            {/* Suggest strong passwords */}
            <div style={{
              borderTop: "1px solid #1e2d3d", paddingTop: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: "#c0d4e0", fontWeight: 600 }}>Strong password suggestions</div>
                  <div style={{ fontSize: 11, color: "#4a6070", fontFamily: "monospace", marginTop: 2 }}>
                    length: {genLen} chars
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="range" min={8} max={32} value={genLen}
                    onChange={e => setGenLen(Number(e.target.value))}
                    style={{ width: 80, accentColor: "#00d4ff" }}
                  />
                  <button onClick={generate} style={{
                    background: "linear-gradient(135deg, #0080ff22, #00d4ff22)",
                    border: "1px solid #00d4ff55",
                    color: "#00d4ff", borderRadius: 8,
                    padding: "6px 14px", cursor: "pointer",
                    fontSize: 12, fontFamily: "monospace",
                    transition: "background 0.2s",
                  }}>
                    Generate
                  </button>
                </div>
              </div>

              {suggestions.length === 0 && (
                <div style={{
                  textAlign: "center", padding: "20px",
                  color: "#2e4050", fontSize: 13, fontFamily: "monospace",
                  border: "1px dashed #1e2d3d", borderRadius: 8,
                }}>
                  Click Generate to get strong password suggestions
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {suggestions.map((s, i) => (
                  <SuggestionCard key={i} pwd={s} onUse={p => { setPwd(p); setSug([]); }} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "24px", textAlign: "center", color: "#2e4050", fontSize: 13, fontFamily: "monospace" }}>
            Start typing to analyse your password…
          </div>
        )}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 24, fontSize: 11, color: "#2e4050", fontFamily: "monospace", textAlign: "center" }}>
        Analysis runs locally — your password never leaves this page
      </div>
    </div>
  );
}
