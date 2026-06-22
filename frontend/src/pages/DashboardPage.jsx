import { useEffect, useState } from "react";
import { useAppContext } from "../App";
import { loadDashboardStats } from "../services/authService";
import Editor from "@monaco-editor/react";
import { 
  Calendar, 
  Flame, 
  Activity, 
  Code, 
  X, 
  Info,
  Zap,
  Target,
  Cpu,
  Layers,
  Award
} from "lucide-react";

const getMonthName = (monthIndex) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[monthIndex];
};

function DashboardPage() {
  const { user: sessionUser } = useAppContext();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubCode, setSelectedSubCode] = useState(null);
  const [selectedSubTitle, setSelectedSubTitle] = useState("");
  const [selectedSubLanguage, setSelectedSubLanguage] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const data = await loadDashboardStats();
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="empty-state" style={{ minHeight: "300px", display: "grid", placeItems: "center" }}>
        <h3>Loading your developer dashboard...</h3>
      </div>
    );
  }

  const { totalSolved = 0, submissions = [] } = stats || {};

  // Calculate submission map and streaks
  const submissionsMap = {};
  const submissionDates = new Set();
  let pastYearCount = 0;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  oneYearAgo.setHours(0, 0, 0, 0);

  submissions.forEach((sub) => {
    const date = new Date(sub.submittedAt);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    submissionsMap[dateStr] = (submissionsMap[dateStr] || 0) + 1;
    submissionDates.add(dateStr);

    if (date >= oneYearAgo) {
      pastYearCount++;
    }
  });

  // Calculate Max Streak
  const sortedDates = Array.from(submissionDates).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let prevDateStr = null;

  sortedDates.forEach((dateStr) => {
    const currentDate = new Date(dateStr);
    currentDate.setHours(0, 0, 0, 0);

    if (!prevDateStr) {
      currentStreak = 1;
    } else {
      const prevDate = new Date(prevDateStr);
      prevDate.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(currentDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
        currentStreak = 1;
      }
    }
    prevDateStr = dateStr;
  });

  if (currentStreak > maxStreak) {
    maxStreak = currentStreak;
  }

  // Generate the last 12 months grids
  const getMonthsGrids = () => {
    const monthsData = [];
    const today = new Date();
    let currentYear = today.getFullYear();
    let currentMonthIdx = today.getMonth();

    // Generate month details backwards for 12 months, then reverse
    for (let i = 0; i < 12; i++) {
      monthsData.push({ year: currentYear, month: currentMonthIdx });
      currentMonthIdx--;
      if (currentMonthIdx < 0) {
        currentMonthIdx = 11;
        currentYear--;
      }
    }
    monthsData.reverse();

    return monthsData.map(({ year, month }) => {
      const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
      const totalDays = new Date(year, month + 1, 0).getDate();

      const slots = [];
      // Pad first week
      for (let d = 0; d < firstDay; d++) {
        slots.push(null);
      }
      // Add days
      for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const count = submissionsMap[dateStr] || 0;
        let level = 0;
        if (count > 0) {
          if (count <= 2) level = 1;
          else if (count <= 5) level = 2;
          else if (count <= 9) level = 3;
          else level = 4;
        }
        slots.push({ day, dateStr, count, level });
      }

      // Group slots into weeks (columns)
      const weeks = [];
      for (let j = 0; j < slots.length; j += 7) {
        const week = slots.slice(j, j + 7);
        // Pad the last week if it is incomplete
        while (week.length < 7) {
          week.push(null);
        }
        weeks.push(week);
      }

      return {
        name: getMonthName(month),
        year,
        weeks,
      };
    });
  };

  const monthsGrids = getMonthsGrids();

  return (
    <section className="page-stack dashboard-page">
      {/* 1. TOP CARDS ROW */}
      <div className="dashboard-grid-main">
        {/* Profile Details Card */}
        <div className="profile-card-premium">
          <div className="profile-avatar-large">
            {stats?.user?.name?.[0]?.toUpperCase() || sessionUser?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="profile-info-details">
            <h2>{stats?.user?.name || sessionUser?.name || "Developer"}</h2>
            <p style={{ color: "#fff", opacity: 0.9 }}>{stats?.user?.email || sessionUser?.email}</p>
            <p style={{ fontSize: "0.8rem" }}>
              Member since {stats?.user?.createdAt ? new Date(stats.user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "June 2026"}
            </p>
          </div>
        </div>

        {/* Problems Solved Statistics Card */}
        <div className="stats-card-premium">
          <div className="stats-details-list">
            <span>Solved Problems</span>
            <strong>{totalSolved} Unique Challenges</strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
              Across public and private contest rooms
            </p>
          </div>
          <div className="stats-circle-container">
            <div className="stats-circle-number">{totalSolved}</div>
          </div>
        </div>
      </div>

      {/* COGNITIVE PROFILE ENGINE CARD */}
      <div className="cognitive-profile-card panel">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <Award size={18} style={{ color: "#00b4d8" }} />
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>Cognitive Profile Engine</h3>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "-10px", marginBottom: "20px" }}>
          Real-time cognitive profile ratings computed dynamically based on the complexity, difficulty, and variety of challenges you solve.
        </p>

        <div className="cognitive-grid">
          {(stats?.cognitiveProfile || []).map((skill) => {
            let SkillIcon = Layers;
            let themeColor = "#9b5de5"; // purple
            let skillDesc = "Identifies structural patterns, sub-segments, and sequence formulas.";

            if (skill.name === "Optimization Ability") {
              SkillIcon = Zap;
              themeColor = "#00b4d8"; // blue
              skillDesc = "Devises greedily optimal, divide-and-conquer, or DP strategies.";
            } else if (skill.name === "Mathematical Reasoning") {
              SkillIcon = Cpu;
              themeColor = "#06d6a0"; // green
              skillDesc = "Applies number theory, modular arithmetic, and combinatorial logic.";
            } else if (skill.name === "Logic Flow & Debugging") {
              SkillIcon = Activity;
              themeColor = "#ffd166"; // yellow
              skillDesc = "Traces complex conditional paths, state logic, and locates edge case anomalies.";
            } else if (skill.name === "Memory & Complexity") {
              SkillIcon = Target;
              themeColor = "#ef476f"; // red/pink
              skillDesc = "Manages time-limit parameters, space-complexity bounds, and handles precision constraints.";
            }

            let badgeClass = "badge-easy";
            if (skill.tier === "Medium") badgeClass = "badge-medium";
            else if (skill.tier === "Hard") badgeClass = "badge-hard";
            else if (skill.tier === "Extreme") badgeClass = "badge-extreme";

            return (
              <div key={skill.name} className="cognitive-skill-row">
                <div className="skill-info-left">
                  <div className="skill-icon-wrapper" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                    <SkillIcon size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#fff" }}>{skill.name}</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "var(--muted)", lineHeight: "1.3" }}>
                      {skillDesc}
                    </p>
                  </div>
                </div>

                <div className="skill-stats-right">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                      Solved: <strong>{skill.solved}</strong>
                    </span>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span className={`cognitive-badge ${badgeClass}`}>{skill.tier}</span>
                      <strong style={{ fontSize: "0.95rem", color: themeColor }}>{skill.rating}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>/100</span>
                    </div>
                  </div>
                  <div className="skill-progress-bar-bg">
                    <div
                      className="skill-progress-bar-fill"
                      style={{
                        width: `${skill.rating}%`,
                        background: `linear-gradient(90deg, ${themeColor}aa, ${themeColor})`,
                        boxShadow: `0 0 8px ${themeColor}60`
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVITY HEATMAP CARD (Leetcode-Style) */}
      <div className="heatmap-card-container">
        <div className="heatmap-header-row">
          <div className="heatmap-header-left">
            <Calendar size={18} className="muted" />
            <h3>{pastYearCount} submissions in the past one year</h3>
            <Info size={14} className="muted" style={{ cursor: "pointer" }} title="Code answers submitted in contest rooms" />
          </div>
          <div className="heatmap-header-meta-row">
            <span>Total active days: <strong>{submissionDates.size}</strong></span>
            <span>•</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Flame size={15} style={{ color: "var(--accent)" }} />
              Max streak: <strong>{maxStreak} days</strong>
            </span>
          </div>
        </div>

        <div className="heatmap-grid-scroll-wrapper">
          <div className="heatmap-months-flex">
            {monthsGrids.map((month, mIdx) => (
              <div className="heatmap-month-column" key={`${month.name}-${mIdx}`}>
                <div className="heatmap-week-cols-container">
                  {month.weeks.map((week, wIdx) => (
                    <div className="heatmap-week-col" key={wIdx}>
                      {week.map((day, dIdx) => {
                        if (!day) {
                          return (
                            <div 
                              className="heatmap-day-square" 
                              style={{ backgroundColor: "transparent", pointerEvents: "none" }} 
                              key={dIdx} 
                            />
                          );
                        }
                        return (
                          <div 
                            className={`heatmap-day-square level-${day.level}`} 
                            key={dIdx}
                            title={`${day.dateStr}: ${day.count} submissions`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <span className="heatmap-month-label">{month.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MY SUBMISSIONS LIST (Leetcode-Style) */}
      <div className="submissions-table-card">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <Activity size={18} className="muted" />
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>Recent Submissions</h3>
        </div>

        {submissions.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 0" }}>
            <h3>No submissions recorded yet.</h3>
            <p>Enter a contest room and submit your code answers to view records.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Verdict</th>
                  <th>Problem / Challenge</th>
                  <th>Difficulty</th>
                  <th>Language</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const isAccepted = sub.verdict === "Accepted";
                  const cleanVerdict = sub.verdict || "Wrong Answer";

                  return (
                    <tr key={sub._id}>
                      <td>
                        <span className={`verdict-badge-leetcode ${isAccepted ? 'Accepted' : cleanVerdict === 'Wrong Answer' ? 'Wrong-Answer' : 'other'}`}>
                          {cleanVerdict}
                        </span>
                      </td>
                      <td style={{ fontWeight: "600", color: "#fff" }}>
                        {sub.questionTitle}
                      </td>
                      <td>
                        <span className={`difficulty-tag-v2 ${sub.difficulty || 'medium'}`}>
                          {sub.difficulty || 'medium'}
                        </span>
                      </td>
                      <td style={{ textTransform: "uppercase", fontSize: "0.85rem", fontWeight: "600" }}>
                        {sub.language}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                        {new Date(sub.submittedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button 
                          type="button" 
                          className="ghost-button" 
                          style={{ minHeight: "30px", padding: "0 12px", borderRadius: "8px", fontSize: "0.8rem" }}
                          onClick={() => {
                            setSelectedSubCode(sub.code);
                            setSelectedSubTitle(`${sub.questionTitle} (${sub.language.toUpperCase()})`);
                            setSelectedSubLanguage(sub.language);
                          }}
                        >
                          <Code size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                          View Code
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. CODE VIEW MODAL OVERLAY */}
      {selectedSubCode !== null && (
        <div className="code-modal-backdrop" onClick={() => setSelectedSubCode(null)}>
          <div className="code-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="code-modal-header">
              <h3>Source Code: {selectedSubTitle}</h3>
              <button className="code-modal-close-btn" onClick={() => setSelectedSubCode(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="code-modal-body" style={{ padding: 0 }}>
              <Editor
                height="450px"
                language={selectedSubLanguage === 'cpp' ? 'cpp' : selectedSubLanguage === 'javascript' ? 'javascript' : selectedSubLanguage === 'python' ? 'python' : 'c'}
                theme="vs-dark"
                value={selectedSubCode}
                options={{
                  readOnly: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: "on",
                  folding: true,
                  wordWrap: "on"
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardPage;
