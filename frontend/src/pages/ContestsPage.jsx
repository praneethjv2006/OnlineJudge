import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { joinContest, loadContests } from "../services/contestService";
import { 
  Lock, 
  Clock, 
  FileQuestion, 
  ChevronRight, 
  Search, 
  Trophy, 
  Sparkles,
  Globe
} from "lucide-react";

const formatRemainingTime = (endAt) => {
  const remainingMs = new Date(endAt).getTime() - Date.now();

  if (remainingMs <= 0) {
    return "Ending soon";
  }

  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min left`;
  }

  return `${hours}h ${minutes}m left`;
};

function ContestsPage() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const initialLoadRef = useRef(true);
  const [visibility, setVisibility] = useState("public");
  const [contests, setContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showJoiner, setShowJoiner] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinedContest, setJoinedContest] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [joinError, setJoinError] = useState("");
  const joinPanelRef = useRef(null);

  useEffect(() => {
    const createdContest = location.state?.createdContest;

    if (createdContest) {
      setJoinMessage(`Contest ${createdContest.title} created successfully.`);
    }
  }, [location.state]);

  useEffect(() => {
    let isMounted = true;

    const fetchContests = async () => {
      const isInitialLoad = initialLoadRef.current;

      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const data = await loadContests(visibility);

        if (isMounted) {
          setContests(data.contests || []);
        }
      } catch {
        // Silently handle load errors for now or use another notification method
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
          initialLoadRef.current = false;
        }
      }
    };

    fetchContests();

    return () => {
      isMounted = false;
    };
  }, [visibility]);

  const openJoinPanel = () => {
    setShowJoiner((current) => {
      const nextState = !current;

      if (nextState) {
        window.requestAnimationFrame(() => {
          joinPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }

      return nextState;
    });
  };

  const submitJoinByCode = async (event) => {
    event.preventDefault();
    setIsJoining(true);
    setJoinError("");
    setJoinMessage("");

    try {
      const data = await joinContest({ code: joinCode });
      setJoinedContest(data.contest || null);
      setJoinMessage(data.message || "Joined contest successfully.");
      setJoinCode("");
      setShowJoiner(false);
      
      if (data.contest?._id) {
        navigate(`/contests/${data.contest._id}`);
      }
    } catch {
      setJoinError("Unable to join the contest room.");
    } finally {
      setIsJoining(false);
    }
  };

  const joinPublicContest = async (contestId) => {
    setIsJoining(true);
    setJoinError("");
    setJoinMessage("");

    try {
      const data = await joinContest({ contestId });
      setJoinedContest(data.contest || null);
      setJoinMessage(data.message || "Joined contest successfully.");
      setShowJoiner(false);
      navigate(`/contests/${contestId}`);
    } catch {
      setJoinError("Unable to join the contest room.");
      setShowJoiner(true);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <section className="page-stack contests-page">
      <section className="panel contests-header-single">
        <div className="header-left">
          <div className="contests-heading">
            <h1><Trophy size={24} style={{ marginRight: 12, verticalAlign: 'middle', color: 'var(--accent)' }} />Contests</h1>
          </div>

          <div className="segmented-control compact-toggle">
            <button
              type="button"
              className={visibility === "public" ? "segment active" : "segment"}
              onClick={() => setVisibility("public")}
            >
              <Globe size={14} style={{ marginRight: 6 }} /> Public
            </button>
            <button
              type="button"
              className={visibility === "private" ? "segment active" : "segment"}
              onClick={() => setVisibility("private")}
            >
              <Lock size={14} style={{ marginRight: 6 }} /> Private
            </button>
          </div>
        </div>

        <div className="header-right">
          <div className="contest-actions-row">
            <button
              type="button"
              className={showJoiner ? "secondary-action active" : "secondary-action"}
              onClick={openJoinPanel}
            >
              <Search size={16} style={{ marginRight: 8 }} />
              {showJoiner ? "Hide join" : "Join contest"}
            </button>
            <Link to="/contests/create" className="primary-action">
              <Sparkles size={16} style={{ marginRight: 8 }} />
              Create contest
            </Link>
          </div>
        </div>
      </section>

      {joinedContest && (
        <section className="panel join-success-banner">
          <span className="eyebrow">Room joined</span>
          <h2>{joinedContest.title}</h2>
          <p>{joinMessage || "You are in the contest room."}</p>
        </section>
      )}

      {showJoiner && (
        <section className="panel contest-joiner" ref={joinPanelRef} id="join-contest-panel">
          <header className="section-heading">
            <span className="eyebrow">Join contest</span>
            <h2>Enter a private room code</h2>
            <p>
              Private rooms require the generated contest code. Public rooms can be joined from the listing
              below without entering a code.
            </p>
          </header>

          <form className="contest-form join-form" onSubmit={submitJoinByCode}>
            <label>
              Room code
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="CJ-1A2B3C"
                autoComplete="off"
              />
            </label>

            {joinError && <p className="status status-error">{joinError}</p>}
            {joinMessage && <p className="status status-success">{joinMessage}</p>}

            <div className="form-actions join-actions">
              <button type="submit" className="primary-button inline-button" disabled={isJoining}>
                {isJoining ? "Joining room..." : "Join private room"}
              </button>
              <button type="button" className="ghost-button" onClick={() => setShowJoiner(false)}>
                Close
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={`panel contest-results ${isRefreshing ? "is-refreshing" : ""}`}>
        <div className="section-heading inline">
          <div>
            <span className="eyebrow">Live feed</span>
            <h2>{visibility === "public" ? "Public" : "Private"} rooms</h2>
          </div>
          <span className="muted-copy">
            {visibility === "public"
              ? "Open rooms can be joined directly."
              : "Locked rooms remain available only through their generated code."}
          </span>
        </div>

        {isRefreshing && <div className="refresh-strip">Updating room list...</div>}

        {isLoading ? (
          <div className="empty-state loading-state">Loading contests...</div>
        ) : contests.length === 0 ? (
          <div className="empty-state">
            <Trophy size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3>No ongoing contests yet.</h3>
            <p>Create the first one to start a new round.</p>
          </div>
        ) : (
          <div className="contest-grid">
            {contests.map((contest) => {
              const totalQuestions = contest.questions.length;
              const canJoinDirectly = contest.visibility === "public";

              return (
                <article 
                  className="professional-contest-card" 
                  key={contest._id}
                  onClick={() => canJoinDirectly ? joinPublicContest(contest._id) : setShowJoiner(true)}
                >
                  <div className="card-header">
                    <h3 className="card-title">{contest.title}</h3>
                    <div className={`visibility-pill ${contest.visibility}`}>
                      {contest.visibility === "public" ? <Globe size={12} /> : <Lock size={12} />}
                      {contest.visibility}
                    </div>
                  </div>

                  <p className="card-description">{contest.description || "No contest description provided."}</p>

                  <div className="card-stats">
                    <div className="stat">
                      <FileQuestion size={14} />
                      <span>{totalQuestions} Problems</span>
                    </div>
                    <div className="stat">
                      <Clock size={14} />
                      <span>{contest.durationMinutes} Min</span>
                    </div>
                    <div className="stat" style={{ marginLeft: "auto", color: "var(--accent)" }}>
                      <Clock size={14} />
                      <span>{formatRemainingTime(contest.endAt)}</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="creator-info">
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}>
                        {(contest.createdBy?.name || user?.name || "O").charAt(0)}
                      </div>
                      <span>{contest.createdBy?.name || user?.name || "Organizer"}</span>
                    </div>
                    
                    <button className="enter-button-mini">
                      {canJoinDirectly ? "Enter" : "Join"} <ChevronRight size={14} style={{ marginLeft: "4px" }} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

export default ContestsPage;