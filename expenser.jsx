const { useState } = React;

const QUESTIONS = {
  who: {
    id: "who",
    text: "Who was at the meal?",
    options: [
      { label: "Just me — no one else", value: "solo" },
      { label: "Me plus employees or other directors", value: "staff" },
      { label: "Me plus a client or external person", value: "client_mix" },
      { label: "Clients or external parties only (I organised, didn't attend or attended briefly)", value: "client_only" },
      { label: "A mix of staff and clients", value: "mixed_group" },
    ],
  },
  purpose: {
    id: "purpose",
    text: "What was the primary reason for the meal?",
    options: [
      { label: "No real business agenda — social or personal", value: "social" },
      { label: "Business was discussed but that wasn't the main point", value: "incidental" },
      { label: "Genuine business purpose (meeting, negotiation, strategy session)", value: "business" },
      { label: "I was travelling overnight for work", value: "travel" },
      { label: "A staff function (e.g. team celebration, Christmas party)", value: "staff_function" },
    ],
  },
  location: {
    id: "location",
    text: "Where did the meal take place?",
    options: [
      { label: "At our usual place of business (office, shop, etc.)", value: "office" },
      { label: "At a restaurant, café, or external venue", value: "external" },
      { label: "At someone's home", value: "home" },
    ],
  },
  pattern: {
    id: "pattern",
    text: "How frequently does this type of expense occur?",
    options: [
      { label: "One-off or occasional", value: "occasional" },
      { label: "Regular — weekly or more often", value: "regular" },
    ],
  },
  staff_function_size: {
    id: "staff_function_size",
    text: "Is this staff function open to all employees?",
    options: [
      { label: "Yes — all staff are invited", value: "all_staff" },
      { label: "No — only some employees (selected group)", value: "selected" },
    ],
  },
};

function getFlow(answers) {
  const flow = ["who"];
  if (!answers.who) return flow;

  flow.push("purpose");
  if (!answers.purpose) return flow;

  if (answers.purpose === "travel") return flow;

  if (answers.purpose === "staff_function" && answers.who === "staff") {
    flow.push("staff_function_size");
    if (!answers.staff_function_size) return flow;
    if (shouldAskPattern(answers)) {
      flow.push("pattern");
    }
    return flow;
  }

  if (answers.who === "solo" && answers.purpose === "social") {
    flow.push("pattern");
    return flow;
  }

  if (answers.who !== "solo") {
    flow.push("location");
    if (!answers.location) return flow;
  }

  if (shouldAskPattern(answers)) {
    flow.push("pattern");
  }
  return flow;
}

function shouldAskPattern(answers) {
  const { who, purpose, location, staff_function_size } = answers;
  if (purpose === "travel") return false;
  if (purpose === "staff_function" && who === "staff") {
    return staff_function_size === "all_staff";
  }
  if (who === "solo" && purpose === "social") return true;
  if (who === "staff" && location !== "office") return true;
  return false;
}

function getQuestionOptions(qId, answers) {
  if (qId === "purpose") {
    if (answers.who !== "staff") {
      return QUESTIONS.purpose.options.filter(opt => opt.value !== "staff_function");
    }
  }
  return QUESTIONS[qId].options;
}

function getResult(answers) {
  const { who, purpose, location, pattern, staff_function_size } = answers;

  // Overnight travel
  if (purpose === "travel") {
    return {
      verdict: "yes",
      title: "Fully deductible",
      summary: "Meals during overnight business travel are excluded from the entertainment rules entirely. The full cost is deductible with no FBT, as long as the travel is genuinely for work.",
      deductibility: "100% deductible — travel exception under s DD 4",
      fbt: "No FBT on genuine business travel meals",
      cost: "Full cost claimable",
      risk: "Keep receipts and note the business purpose of the trip. Travel that looks personal (e.g. a weekend away that happens to include one meeting) won't qualify.",
      tags: [{ label: "100% deductible", type: "green" }, { label: "No FBT", type: "green" }],
    };
  }

  // Staff function — all staff
  if (purpose === "staff_function" && staff_function_size === "all_staff") {
    const regularRisk = pattern === "regular"
      ? "Multiple staff functions per year are fine, but if you're running them weekly they'll attract scrutiny. IRD expects these to be genuine events, not a mechanism to route personal meals through the company."
      : null;
    return {
      verdict: "half",
      title: "50% deductible — staff function rules apply",
      summary: "Staff functions open to all employees qualify under the entertainment rules at 50%. The other 50% is non-deductible. FBT is generally not required on the non-deductible portion when it's a genuine all-staff event.",
      deductibility: "50% deductible under s DD entertainment rules",
      fbt: "FBT generally not required — all-staff function exemption may apply",
      cost: "You can claim half. The rest is a permanent cost.",
      risk: regularRisk || "Keep a record of the event, who attended, and the total cost.",
      tags: [{ label: "50% deductible", type: "gold" }, { label: "FBT exemption possible", type: "green" }],
    };
  }

  // Staff function — selected staff only
  if (purpose === "staff_function" && staff_function_size === "selected") {
    return {
      verdict: "half",
      title: "50% deductible — FBT likely applies",
      summary: "A function for selected employees (rather than all staff) doesn't qualify for the all-staff FBT exemption. The entertainment rules still allow 50% deductibility, but FBT applies on the non-deductible portion because it's a benefit provided to specific employees.",
      deductibility: "50% deductible under entertainment rules (s DD)",
      fbt: "FBT applies on the non-deductible 50%",
      cost: "Employer FBT rate is up to 63.93% on the taxable value of the non-deductible portion.",
      risk: "If certain employees are always included and others excluded, IRD may treat this as targeted remuneration rather than a staff event.",
      tags: [{ label: "50% deductible", type: "gold" }, { label: "FBT liable", type: "red" }],
    };
  }

  // Solo meals
  if (who === "solo") {
    if (purpose === "social") {
      return {
        verdict: "no",
        title: "Not deductible — FBT applies",
        summary: "A personal meal for yourself alone, paid by the company, is a private benefit. It can't be deducted, and FBT is owed because the company is providing you something of value.",
        deductibility: "Not deductible",
        fbt: "FBT applies — up to 63.93% employer rate on the meal value",
        cost: "A $50 meal can cost the company $80+ once FBT is factored in.",
        risk: pattern === "regular"
          ? "Regular personal meals through the company are a common IRD audit trigger. Consider running these through your shareholder current account instead, or simply paying personally."
          : "Even occasional instances should have FBT returned. It's a small amount but the obligation exists.",
        tags: [{ label: "Not deductible", type: "red" }, { label: "FBT liable", type: "red" }],
      };
    }
    // Solo but business purpose
    return {
      verdict: "no",
      title: "Not deductible — entertainment requires another party",
      summary: "The 50% entertainment deduction only applies when you're entertaining someone. A solo working lunch doesn't qualify, even if you're genuinely doing business. FBT still applies because the company is paying for a personal benefit.",
      deductibility: "Not deductible — no entertainment of another party",
      fbt: "FBT applies on the full value",
      cost: "FBT rate up to 63.93% on the meal value.",
      risk: "Sole traders have slightly more flexibility here — a working meal may be deductible if the business purpose is clear and documented. But for a company director, this is a personal benefit.",
      tags: [{ label: "Not deductible", type: "red" }, { label: "FBT liable", type: "red" }],
    };
  }

  // Meals at the office (on-premises)
  if (location === "office") {
    if (who === "staff" || who === "mixed_group") {
      return {
        verdict: "yes",
        title: "Fully deductible — on-premises exception",
        summary: "Meals provided to employees on your business premises (e.g. a working lunch at the office) are excluded from the entertainment rules and are 100% deductible. No FBT applies under the on-premises meal exemption.",
        deductibility: "100% deductible — on-premises meal exemption (s DD 4(c))",
        fbt: "No FBT — on-premises employee meal exemption applies",
        cost: "Full cost claimable.",
        risk: "The exemption requires the meal to be provided on your actual premises during the working day. A catered party at the office after hours sits in different territory.",
        tags: [{ label: "100% deductible", type: "green" }, { label: "No FBT", type: "green" }],
      };
    }
    if (who === "client_mix" || who === "client_only") {
      return {
        verdict: "half",
        title: "50% deductible",
        summary: "The on-premises exemption applies to meals for employees, not clients. Entertaining clients at your office still falls under the entertainment rules, so only 50% is deductible. No FBT since the benefit is going to non-employees.",
        deductibility: "50% deductible under entertainment rules (s DD)",
        fbt: "No FBT — benefit is to clients, not employees",
        cost: "Half the cost is a permanent non-deductible expense.",
        risk: null,
        tags: [{ label: "50% deductible", type: "gold" }, { label: "No FBT", type: "green" }],
      };
    }
  }

  // External venue — staff only
  if (who === "staff") {
    if (purpose === "social") {
      return {
        verdict: "half",
        title: "50% deductible — needs a business connection",
        summary: "Staff meals at external venues with a social flavour can qualify at 50%, but IRD expects some legitimate business connection. A purely social outing with no business element may not qualify at all. A team dinner after completing a project is the kind of thing that tends to hold up.",
        deductibility: "Up to 50% deductible if a business connection exists (s DD)",
        fbt: "FBT applies on the non-deductible 50%",
        cost: "FBT on the non-deductible portion at up to 63.93%.",
        risk: pattern === "regular"
          ? "Weekly or fortnightly staff meals are an audit flag. Make sure each one is documented."
          : "Keep a record of who attended and the occasion.",
        tags: [{ label: "50% deductible", type: "gold" }, { label: "FBT on remainder", type: "gold" }],
      };
    }
    return {
      verdict: "half",
      title: "50% deductible",
      summary: "A meal with staff at an external venue where business is genuinely being conducted qualifies at 50% under the entertainment rules. FBT applies on the non-deductible half. Keep a note of who attended and what was discussed.",
      deductibility: "50% deductible under entertainment rules (s DD)",
      fbt: "FBT applies on the non-deductible 50%",
      cost: "FBT on the non-deductible portion at up to 63.93%.",
      risk: pattern === "regular" ? "Frequent staff meals with a business agenda are fine, but records need to be solid if IRD asks." : null,
      tags: [{ label: "50% deductible", type: "gold" }, { label: "FBT on remainder", type: "gold" }],
    };
  }

  // Client meals (with or without staff present)
  if (who === "client_mix" || who === "client_only" || who === "mixed_group") {
    if (purpose === "social") {
      return {
        verdict: "half",
        title: "50% deductible — relationship must be business",
        summary: "Client entertainment is where the 50% rule most clearly applies. A social meal with someone you do business with can qualify if the relationship is commercial. If it's a personal friend who happens to be a client, IRD may push back.",
        deductibility: "50% deductible where a business relationship is present (s DD)",
        fbt: "No FBT on the client portion — benefit isn't going to employees",
        cost: who === "mixed_group" ? "The staff portion may attract FBT on its non-deductible share. The client portion does not." : "Half the cost is a permanent expense.",
        risk: "Keep a note of who you entertained and the business relationship. A calendar entry is enough for most cases.",
        tags: [{ label: "50% deductible", type: "gold" }, { label: "No FBT (clients)", type: "green" }],
      };
    }
    return {
      verdict: "half",
      title: "50% deductible",
      summary: "Client meals with a genuine business purpose are the clearest application of the entertainment rules. 50% is deductible, no FBT applies on the client portion because the benefit goes to non-employees.",
      deductibility: "50% deductible under entertainment rules (s DD)",
      fbt: who === "mixed_group"
        ? "No FBT on the client portion. FBT may apply on the non-deductible share of any staff attending."
        : "No FBT — benefit is to clients, not employees",
      cost: "Half the cost is claimable. The rest is a permanent non-deductible expense.",
      risk: null,
      tags: [{ label: "50% deductible", type: "gold" }, { label: "No FBT (clients)", type: "green" }],
    };
  }

  // Fallback
  return {
    verdict: "info",
    title: "Verify with an accountant",
    summary: "Your situation doesn't fit cleanly into a standard category. The entertainment rules likely apply at 50%, but the FBT picture depends on who attended and what benefit they received.",
    deductibility: "Likely 50% under entertainment rules — confirm with an accountant",
    fbt: "May apply depending on who benefited",
    cost: null,
    risk: "Keep documentation of the meal, attendees, and purpose.",
    tags: [{ label: "Seek advice", type: "grey" }],
  };
}

const VERDICT_STYLES = {
  yes:  { bg: "#f0f7f4", border: "#2d6a4f", tagColor: "#2d6a4f", label: "Result" },
  no:   { bg: "#fdf2f0", border: "#c84b2f", tagColor: "#c84b2f", label: "Result" },
  half: { bg: "#fdf8ee", border: "#b8963e", tagColor: "#b8963e", label: "Result" },
  info: { bg: "#f0f4fd", border: "#4a6fa5", tagColor: "#4a6fa5", label: "Result" },
};

const TAG_STYLES = {
  green: { bg: "#e4f0eb", color: "#2d6a4f" },
  red:   { bg: "#fbe8e4", color: "#c84b2f" },
  gold:  { bg: "#fdf0d5", color: "#b8963e" },
  grey:  { bg: "#ede8dc", color: "#7a7468" },
  blue:  { bg: "#e8eef8", color: "#4a6fa5" },
};

function App() {
  const [answers, setAnswers] = useState({});

  const flow = getFlow(answers);
  const currentQId = flow[flow.length - 1];
  const isComplete = answers[currentQId] !== undefined;

  const isDone = isComplete && answers[currentQId] !== undefined;

  function answer(qId, value) {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }

  function restart() {
    setAnswers({});
  }

  // Build the list of completed steps to show
  const completedSteps = flow.filter(qId => answers[qId] !== undefined);
  const nextQId = flow.find(qId => answers[qId] === undefined);
  const result = nextQId === undefined ? getResult(answers) : null;

  const totalEstimate = 5;
  const progress = result ? 100 : Math.round((completedSteps.length / totalEstimate) * 100);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f0e8",
      fontFamily: "'Georgia', serif",
      padding: "40px 20px 80px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48, maxWidth: 560 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7a7468", marginBottom: 10, fontFamily: "monospace" }}>
          New Zealand · Income Tax Act 2007
        </p>
        <h1 style={{ fontSize: "clamp(1.8rem, 6vw, 2.8rem)", lineHeight: 1.15, color: "#1a1a18", marginBottom: 10 }}>
          Meal expense <em style={{ color: "#c84b2f", fontStyle: "italic" }}>checker</em>
        </h1>
        <div style={{ width: 36, height: 2, background: "#c84b2f", margin: "16px auto" }} />
        <p style={{ fontSize: 11, color: "#7a7468", letterSpacing: "0.04em", lineHeight: 1.7, fontFamily: "monospace" }}>
          Answer a few questions to find out whether your meal<br />
          is deductible, FBT-liable, or neither.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: 560, width: "100%", marginBottom: 24 }}>
        <div style={{ height: 2, background: "#ede8dc", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#c84b2f", transition: "width 0.4s ease", borderRadius: 1 }} />
        </div>
      </div>

      {/* Answered questions summary */}
      {completedSteps.length > 0 && (
        <div style={{ maxWidth: 560, width: "100%", marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {completedSteps.map(qId => {
            const q = QUESTIONS[qId];
            const opt = q.options.find(o => o.value === answers[qId]);
            return (
              <div key={qId} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "white", border: "1px solid #c8c0b0", borderRadius: 2,
                padding: "10px 16px", fontSize: 11, fontFamily: "monospace",
              }}>
                <span style={{ color: "#7a7468" }}>{q.text}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#1a1a18", fontWeight: 500 }}>{opt?.label}</span>
                  <button
                    onClick={() => setAnswers(prev => {
                      const next = { ...prev };
                      // Remove this answer and all subsequent ones
                      const idx = flow.indexOf(qId);
                      flow.slice(idx).forEach(id => delete next[id]);
                      return next;
                    })}
                    style={{ background: "none", border: "none", color: "#c84b2f", cursor: "pointer", fontSize: 11, padding: "0 4px", fontFamily: "monospace" }}
                  >
                    edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Current question */}
      {!result && nextQId && (
        <div style={{
          background: "white", border: "1px solid #c8c0b0", borderRadius: 2,
          maxWidth: 560, width: "100%", padding: 32,
          boxShadow: "4px 4px 0 #ede8dc",
          animation: "fadeIn 0.25s ease",
        }}>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7a7468", marginBottom: 10, fontFamily: "monospace" }}>
            Question {completedSteps.length + 1}
          </p>
          <p style={{ fontSize: "1.2rem", lineHeight: 1.4, color: "#1a1a18", marginBottom: 24 }}>
            {QUESTIONS[nextQId].text}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {getQuestionOptions(nextQId, answers).map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => answer(nextQId, opt.value)}
                style={{
                  background: "#f5f0e8", border: "1px solid #c8c0b0", borderRadius: 2,
                  padding: "13px 16px", fontFamily: "monospace", fontSize: 12,
                  color: "#1a1a18", cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "all 0.1s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c84b2f"; e.currentTarget.style.color = "#c84b2f"; e.currentTarget.style.background = "#ede8dc"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#c8c0b0"; e.currentTarget.style.color = "#1a1a18"; e.currentTarget.style.background = "#f5f0e8"; }}
              >
                <span style={{
                  fontSize: 9, letterSpacing: "0.15em", color: "#7a7468",
                  background: "white", border: "1px solid #c8c0b0",
                  padding: "2px 6px", borderRadius: 1, flexShrink: 0, fontFamily: "monospace"
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (() => {
        const vs = VERDICT_STYLES[result.verdict] || VERDICT_STYLES.info;
        return (
          <div style={{ maxWidth: 560, width: "100%", animation: "fadeIn 0.3s ease" }}>
            <div style={{
              padding: "24px 32px", border: `1px solid ${vs.border}`,
              borderRadius: "2px 2px 0 0", background: vs.bg, marginBottom: -1,
            }}>
              <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: vs.tagColor, marginBottom: 8, fontFamily: "monospace" }}>
                {vs.label}
              </p>
              <p style={{ fontSize: "1.5rem", lineHeight: 1.25, color: vs.tagColor }}>
                {result.title}
              </p>
            </div>
            <div style={{
              background: "white", border: "1px solid #c8c0b0", borderTop: "none",
              borderRadius: "0 0 2px 2px", padding: "28px 32px",
              boxShadow: "4px 4px 0 #ede8dc",
            }}>
              {[
                { label: "Summary", content: result.summary },
                { label: "Deductibility", content: result.deductibility },
                { label: "FBT", content: result.fbt },
                result.cost && { label: "Cost impact", content: result.cost },
                result.risk && { label: "Watch out", content: result.risk },
              ].filter(Boolean).map((s, i, arr) => (
                <div key={s.label} style={{
                  marginBottom: i < arr.length - 1 ? 20 : 0,
                  paddingBottom: i < arr.length - 1 ? 20 : 0,
                  borderBottom: i < arr.length - 1 ? "1px solid #ede8dc" : "none",
                }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7a7468", marginBottom: 6, fontFamily: "monospace" }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.75, color: "#1a1a18", fontFamily: "monospace" }}>
                    {s.content}
                  </p>
                </div>
              ))}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
                {result.tags.map(t => {
                  const ts = TAG_STYLES[t.type] || TAG_STYLES.grey;
                  return (
                    <span key={t.label} style={{
                      fontSize: 10, padding: "4px 10px", borderRadius: 1,
                      background: ts.bg, color: ts.color, fontFamily: "monospace",
                      letterSpacing: "0.06em",
                    }}>
                      {t.label}
                    </span>
                  );
                })}
              </div>

              <button
                onClick={restart}
                style={{
                  marginTop: 24, width: "100%", background: "#1a1a18", color: "#f5f0e8",
                  border: "none", borderRadius: 2, padding: "13px 20px",
                  fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em",
                  textTransform: "uppercase", cursor: "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#c84b2f"}
                onMouseLeave={e => e.currentTarget.style.background = "#1a1a18"}
              >
                ↺ Check another meal
              </button>
            </div>
          </div>
        );
      })()}

      <p style={{
        maxWidth: 560, width: "100%", marginTop: 24,
        fontSize: 10, color: "#7a7468", textAlign: "center",
        lineHeight: 1.7, fontFamily: "monospace", letterSpacing: "0.03em",
      }}>
        This tool is a guide only — not tax advice.<br />
        Talk to an accountant for your specific situation.
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
