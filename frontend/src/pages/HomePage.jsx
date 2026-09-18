import { useNavigate } from "react-router-dom";
import { useAppContext } from "../App";
import LottieComponent from "lottie-react";
const Lottie = LottieComponent?.default || LottieComponent;
import gif3 from "../assets/animations/gif3.json";
import { 
  Trophy, 
  PlusCircle, 
  Terminal, 
  ShieldCheck, 
  ArrowRight,
  Code2,
  Compass,
  Swords,
  Activity
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

const quickLinks = [
  {
    id: "problems",
    title: "Problems",
    path: "/problems",
    icon: Terminal,
    frontDesc: "Browse algorithm challenges across multiple categories.",
    backTitle: "Algorithm Dojo",
    backDesc: "Master algorithms, data structures, and prepare for technical interviews with automated test cases.",
  },
  {
    id: "contests",
    title: "Contests",
    path: "/contests",
    icon: Trophy,
    frontDesc: "Compete in real-time with other developers worldwide.",
    backTitle: "Live Arenas",
    backDesc: "Join timed competitive programming tournaments, earn ranks, and battle programmers globally.",
  },
  {
    id: "shadow-code",
    title: "Shadow Code",
    path: "/shadow-code",
    icon: Swords,
    frontDesc: "Solve surprise format coding challenges.",
    backTitle: "Surprise Arena",
    backDesc: "Experience unpredictable questions with surprise formats. Test your adaptability, instinct, and raw coding skills.",
  },
  {
    id: "stats",
    title: "Stats",
    path: "/dashboard",
    icon: Activity,
    frontDesc: "Track your progress, submission history, and ranking.",
    backTitle: "Performance Analytics",
    backDesc: "Inspect execution metrics, topic mastery ratings, accuracy breakdowns, and personal milestones.",
  },
];

function HomePage() {
  const { user } = useAppContext();
  const navigate = useNavigate();

  return (
    <section className="page-stack home-page">
      {/* 1. HERO PANEL */}
      <section className="dashboard-hero professional-hero">
        <div className="hero-split-container">
          <div className="hero-main-content">
            <h1 className="hero-title-main">
              Welcome back, <span>{user?.name || "Code Crafter"}</span>.
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
          </div>

          <div className="hero-visual-content">
            <div className="hero-lottie-wrapper">
              <Lottie animationData={gif3} loop={true} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK NAVIGATION SECTION (3D FLIP CARDS) */}
      <section style={{ marginTop: "24px" }}>
        <h3 style={{ margin: "0 0 16px 4px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--muted)" }}>
          Quick Navigation
        </h3>
        
        <div className="quick-actions-panel">
          {quickLinks.map((item) => {
            const IconComp = item.icon;
            return (
              <div 
                key={item.id} 
                className="quick-link-flip-card"
                onClick={() => navigate(item.path)}
              >
                <div className="quick-link-card-inner">
                  {/* FRONT SIDE */}
                  <div className="quick-link-card-front">
                    <div>
                      <div className="action-card-icon">
                        <IconComp size={22} />
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.frontDesc}</p>
                    </div>
                    <span className="action-card-link-text">
                      Explore <ArrowRight size={14} />
                    </span>
                  </div>

                  {/* BACK SIDE (Flipped) */}
                  <div className="quick-link-card-back">
                    <div>
                      <div className="card-back-header">
                        <div className="card-back-icon">
                          <IconComp size={18} />
                        </div>
                        <h4>{item.backTitle}</h4>
                      </div>
                      <p>{item.backDesc}</p>
                    </div>
                    <span className="card-back-action">
                      Enter Section <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. PLATFORM FEATURES / SPECIFICATIONS */}
      <section style={{ marginTop: "32px" }}>
        <h3 style={{ margin: "0 0 16px 4px", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--muted)" }}>
          Platform Features
        </h3>
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