import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../App";
import LottieComponent from "lottie-react";
const Lottie = LottieComponent?.default || LottieComponent;
import { loadContests, joinContest } from "../services/contestService";
import gif3 from "../assets/animations/gif3.json";
import { 
  Trophy, 
  PlusCircle, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  ArrowRight,
  Code2,
  Users,
  Compass,
  CheckCircle2,
  Activity,
  Server,
  Zap,
  Clock,
  Sparkles
} from "lucide-react";

const platformSpecifications = [
  {
    icon: Code2,
    title: "Contest Studio",
    description: "Construct public or private coding events with strict execution rules, runtime parameters, and custom test cases.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Sessions",
    description: "State persistent cookie-backed authentication automatically restores your workspace with zero friction.",
  },
  {
    icon: Terminal,
    title: "Apex Sandbox",
    description: "Isolated compiler backend ensuring secure execution, precise cpu runtime limiting, and output validation.",
  },
];

function HomePage() {
  const { user } = useAppContext();
  const navigate = useNavigate();
  
  const [contests, setContests] = useState([]);
  const [isLoadingContests, setIsLoadingContests] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Elegant clock display
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchPublicContests = async () => {
      try {
        const data = await loadContests("public");
        if (isMounted) {
          // Take the top 3 public contests
          setContests((data.contests || []).slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load public contests:", err);
      } finally {
        if (isMounted) {
          setIsLoadingContests(false);
        }
      }
    };

    fetchPublicContests();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickJoin = async (contestId) => {
    if (isJoining) return;
    setIsJoining(true);
    try {
      await joinContest({ contestId });
      navigate(`/contests/${contestId}`);
    } catch (err) {
      console.error("Failed to join contest:", err);
      // Fallback navigate to contests page if something fails
      navigate(`/contests`);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <section className="page-stack home-page">
      {/* 1. HERO PANEL (RE-DESIGNED LEETCODE STYLE) */}
      <section className="dashboard-hero professional-hero">
        <div className="hero-split-container">
          <div className="hero-main-content">
            <div className="hero-eyebrow">
              <Sparkles size={14} />
              <span>Developer Center</span>
            </div>
            <h1 className="hero-title-main">
              Welcome back, <br />
              <span>{user?.name || "operator"}</span>.
            </h1>
            <p className="hero-description">
              Elevate your coding skills on the premier platform for technical interviews and competitive programming. Master algorithms, conquer data structures, and prepare for top-tier engineering roles.
            </p>
            <div className="hero-btn-group">
              <button onClick={() => navigate("/problems")} className="primary-action active" style={{ display: "inline-flex", gap: "8px" }}>
                <Compass size={16} /> Explore Problems
              </button>
              <button onClick={() => navigate("/contests/create")} className="secondary-action" style={{ display: "inline-flex", gap: "8px" }}>
                <PlusCircle size={16} /> Create Arena
              </button>
            </div>

            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <span className="stat-label">System Status</span>
                <span className="stat-value"><div className="pulse-dot-indicator" /> Operational</span>
              </div>
              <div className="hero-stat-item">
                <span className="stat-label">Local Time</span>
                <span className="stat-value" style={{ fontFamily: "monospace" }}>{currentTime || "--:--:--"}</span>
              </div>
              <div className="hero-stat-item">
                <span className="stat-label">Session Secure</span>
                <span className="stat-value" style={{ color: "var(--success)" }}><ShieldCheck size={12} /> Encrypted</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-content">
            <div className="hero-lottie-wrapper">
              <Lottie animationData={gif3} loop={true} />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRACTICE ARENA BANNER */}
      <div className="featured-challenge-banner" onClick={() => navigate("/problems")}>
        <div className="featured-banner-left">
          <div className="featured-banner-icon">
            <Zap size={22} />
          </div>
          <div className="featured-banner-text">
            <h3>Apex Practice Challenges</h3>
            <p>Solve algorithm challenges in C++, Python, Javascript and C. Test your solution limits, examine complexity runtimes, and trace custom compilation testcases.</p>
          </div>
        </div>
        <div className="featured-banner-action">
          <span>Explore Sandbox <ArrowRight size={16} /></span>
        </div>
      </div>

      {/* 2. DASHBOARD BODY (2 columns layout) */}
      <div className="dashboard-layout-grid">
        {/* Left Side: Daily Challenge & Live Contests */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Daily Challenge Card (LeetCode Style) */}
          <div className="daily-challenge-card" onClick={() => navigate("/problems")}>
            <div className="daily-card-header">
              <div className="daily-label">
                <Zap size={14} fill="var(--accent)" color="var(--accent)" />
                Daily Coding Challenge
              </div>
              <div className="daily-date">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            </div>
            <div className="daily-card-body">
              <div className="daily-problem-info">
                <h3>Two Sum IV - Input is a BST</h3>
                <div className="difficulty-tag medium">Medium</div>
              </div>
              <button className="solve-button">
                Solve Now <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div>
            <h3 style={{ margin: "0 0 12px 4px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--muted)" }}>Quick Navigation</h3>
            <div className="quick-actions-panel">
              <div className="action-card-interactive" onClick={() => navigate("/problems")}>
                <div className="action-card-icon">
                  <Terminal size={22} />
                </div>
                <h3>Problems</h3>
                <p>Browse algorithm challenges across multiple categories.</p>
                <span className="action-card-link-text">
                  View all <ArrowRight size={14} />
                </span>
              </div>

              <div className="action-card-interactive" onClick={() => navigate("/contests")}>
                <div className="action-card-icon">
                  <Trophy size={22} />
                </div>
                <h3>Contests</h3>
                <p>Compete in real-time with other developers worldwide.</p>
                <span className="action-card-link-text">
                  Enter arena <ArrowRight size={14} />
                </span>
              </div>

              <div className="action-card-interactive" onClick={() => navigate("/dashboard")}>
                <div className="action-card-icon">
                  <Activity size={22} />
                </div>
                <h3>Stats</h3>
                <p>Track your progress, submission history, and ranking.</p>
                <span className="action-card-link-text">
                  My profile <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contests Feed */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 4px 12px" }}>
              <h3 style={{ margin: 0, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--muted)" }}>Featured Contests</h3>
              <Link to="/contests" style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                All rooms <ArrowRight size={12} />
              </Link>
            </div>

            <div className="quick-contests-list-panel">
              {isLoadingContests ? (
                <div className="empty-contests-state-minimal">Loading active rooms...</div>
              ) : contests.length === 0 ? (
                <div className="empty-contests-state-minimal">
                  No public rooms active currently. Create a contest to get started.
                </div>
              ) : (
                contests.map((c) => (
                  <div key={c._id} className="quick-contest-item-row" onClick={() => handleQuickJoin(c._id)}>
                    <div className="quick-contest-item-details">
                      <div className="quick-contest-item-title-row">
                        <h4>{c.title}</h4>
                        <span className="quick-contest-item-duration">{c.durationMinutes}m duration</span>
                      </div>
                      <div className="quick-contest-item-meta">
                        <span><Users size={14} /> {c.createdBy?.name || "Organizer"}</span>
                        <span>•</span>
                        <span><Code2 size={14} /> {c.questions?.length || 0} Questions</span>
                      </div>
                    </div>
                    <button type="button" className="primary-button inline-button" style={{ minHeight: "36px", padding: "0 14px", borderRadius: "10px", fontSize: "0.85rem" }} disabled={isJoining}>
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Progress & Community */}
        <div>
          <h3 style={{ margin: "0 0 12px 4px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--muted)" }}>Your Progress</h3>
          <div className="progress-container-premium">
            <div className="progress-stat-card">
              <div className="progress-stat-header">
                <span className="stat-name">Solved Problems</span>
                <span className="stat-count">24 / 150</span>
              </div>
              <div className="progress-bar-wrapper">
                <div className="progress-bar-fill" style={{ width: '16%' }}></div>
              </div>
            </div>

            <div className="progress-stat-card">
              <div className="progress-stat-header">
                <span className="stat-name">Contest Rating</span>
                <span className="stat-count">1,540</span>
              </div>
              <div className="progress-bar-wrapper">
                <div className="progress-bar-fill" style={{ width: '60%', background: 'var(--accent)' }}></div>
              </div>
            </div>

            <div className="community-cta-card">
              <Sparkles size={24} color="var(--accent)" />
              <h4>Join the Community</h4>
              <p>Discuss problems, share solutions, and learn from top programmers.</p>
              <button className="ghost-button">Join Discord</button>
            </div>
          </div>

          <h3 style={{ margin: "24px 0 12px 4px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--muted)" }}>Platform Engine</h3>
          <div className="system-status-container">
            
            <div className="status-indicator-tile">
              <div className="status-tile-left">
                <div className="status-tile-icon">
                  <Cpu size={20} />
                </div>
                <div className="status-tile-info">
                  <span>Sandbox Compiler</span>
                  <strong>Node Sandbox-v2.1</strong>
                </div>
              </div>
              <div className="status-badge-pill online">
                <div className="pulse-dot-indicator" />
                Online
              </div>
            </div>

            <div className="status-indicator-tile">
              <div className="status-tile-left">
                <div className="status-tile-icon">
                  <ShieldCheck size={20} />
                </div>
                <div className="status-tile-info">
                  <span>Session Guard</span>
                  <strong>Cookie Active</strong>
                </div>
              </div>
              <div className="status-badge-pill online">
                <CheckCircle2 size={14} />
                Verified
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. PLATFORM FEATURES / SPECIFICATIONS */}
      <section style={{ marginTop: "24px" }}>
        <h3 style={{ margin: "0 0 16px 4px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--muted)" }}>Platform Features</h3>
        <div className="modern-feature-showcase-grid">
          {platformSpecifications.map((item) => {
            const IconComponent = item.icon;
            return (
              <article className="modern-feature-showcase-card" key={item.title}>
                <div className="modern-feature-showcase-card-header">
                  <div className="modern-feature-showcase-card-icon-wrapper">
                    <IconComponent size={20} />
                  </div>
                  {item.title}
                </div>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

export default HomePage;