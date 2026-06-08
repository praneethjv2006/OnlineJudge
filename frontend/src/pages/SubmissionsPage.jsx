import { useOutletContext } from "react-router-dom";

function SubmissionsPage() {
  const { user } = useOutletContext();

  return (
    <section className="page-stack submissions-page">
      <section className="panel contests-header">
        <div className="contests-heading">
          <span className="eyebrow">Activity</span>
          <h1>My submissions</h1>
        </div>
      </section>

      <section className="panel empty-state">
        <div className="section-heading">
          <h3>No submissions found.</h3>
          <p>
            When you submit solutions in contest rooms, your history will appear here.
            Currently signed in as <strong>{user?.name || "User"}</strong>.
          </p>
        </div>
      </section>
    </section>
  );
}

export default SubmissionsPage;
