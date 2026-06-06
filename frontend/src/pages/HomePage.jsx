import { Link, useOutletContext } from "react-router-dom";

const highlights = [
  {
    title: "Contest studio",
    description: "Build public and private events with structured questions, runtime limits, and test cases.",
  },
  {
    title: "Secure sessions",
    description: "The app restores your session on load and keeps the experience frictionless.",
  },
  {
    title: "Professional flow",
    description: "A clean hierarchy, restrained color system, and purposeful navigation keep the focus on code.",
  },
];

function HomePage() {
  const { user } = useOutletContext();

  return (
    <section className="page-stack home-page">
      <section className="hero-card panel panel-hero">
        <div className="hero-copy">
          <span className="eyebrow">Home</span>
          <h1>
            Welcome back,
            <br />
            {user?.name || "operator"}.
          </h1>
          <p>
            Manage your coding contests from a dashboard built for clarity. Create events, review ongoing
            public or private contests, and move directly into the challenge workspace.
          </p>

          <div className="hero-actions">
            <Link to="/contests" className="primary-button inline-button">
              Open contests
            </Link>
            <span className="hero-note">Cookie-backed authentication is active.</span>
          </div>
        </div>

        <div className="hero-stats">
          <article>
            <strong>Secure</strong>
            <span>Session restored on refresh</span>
          </article>
          <article>
            <strong>Focused</strong>
            <span>Contest-first navigation</span>
          </article>
          <article>
            <strong>Clean</strong>
            <span>Professional visual hierarchy</span>
          </article>
        </div>
      </section>

      <section className="grid-3">
        {highlights.map((item) => (
          <article className="panel info-card" key={item.title}>
            <span className="card-kicker">Platform feature</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </section>
  );
}

export default HomePage;