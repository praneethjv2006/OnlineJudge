import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { joinContest, loadContests } from "../services/contestService";

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
  const [error, setError] = useState("");
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

      setError("");

      try {
        const data = await loadContests(visibility);

        if (isMounted) {
          setContests(data.contests || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Unable to load contests.");
        }
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

  const refreshContests = async () => {
    const data = await loadContests(visibility);
    setContests(data.contests || []);
  };

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
    setError("");

    try {
      const data = await joinContest({ code: joinCode });
      setJoinedContest(data.contest || null);
      setJoinMessage(data.message || "Joined contest successfully.");
      setJoinCode("");
      setShowJoiner(false);
    } catch (requestError) {
      setJoinError(requestError.response?.data?.message || "Unable to join the contest room.");
    } finally {
      setIsJoining(false);
    }
  };

  const joinPublicContest = async (contestId) => {
    setIsJoining(true);
    setJoinError("");
    setJoinMessage("");
    setError("");

    try {
      const data = await joinContest({ contestId });
      setJoinedContest(data.contest || null);
      setJoinMessage(data.message || "Joined contest successfully.");
      setShowJoiner(false);
    } catch (requestError) {
      setJoinError(requestError.response?.data?.message || "Unable to join the contest room.");
      setShowJoiner(true);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <section className="page-stack contests-page">
      <section className="panel contests-header">
        <div className="contests-heading">
          <span className="eyebrow">Contests</span>
          <h1>Contest rooms</h1>
        </div>

        <div className="contest-actions-row">
          <button
            type="button"
            className={showJoiner ? "secondary-action active" : "secondary-action"}
            onClick={openJoinPanel}
          >
            {showJoiner ? "Hide join" : "Join contest"}
          </button>
          <Link to="/contests/create" className="primary-action">
            Create contest
          </Link>
        </div>
      </section>

      <section className="panel contests-toolbar">
        <div className="segmented-control contest-toggle">
          <button
            type="button"
            aria-pressed={visibility === "public"}
            className={visibility === "public" ? "segment active" : "segment"}
            onClick={() => setVisibility("public")}
          >
            Public rooms
          </button>
          <button
            type="button"
            aria-pressed={visibility === "private"}
            className={visibility === "private" ? "segment active" : "segment"}
            onClick={() => setVisibility("private")}
          >
            Private rooms
          </button>
        </div>

        <span className="muted-copy">
          {visibility === "public"
            ? "Browse open rooms and join them directly."
            : "Review locked rooms and join them with a code."}
        </span>
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
            <h3>No ongoing contests yet.</h3>
            <p>Create the first one to start a new round.</p>
          </div>
        ) : (
          <div className="contest-grid">
            {contests.map((contest) => {
              const totalQuestions = contest.questions.length;
              const totalCases = contest.questions.reduce(
                (sum, question) => sum + question.testCases.length,
                0
              );
              const canJoinDirectly = contest.visibility === "public";

              return (
                <article className="contest-card" key={contest._id}>
                  <div className="contest-card-head">
                    <span className={contest.visibility === "public" ? "visibility-badge public" : "visibility-badge private"}>
                      {contest.visibility === "public" ? "Public room" : "Private room"}
                    </span>
                    <span className="muted-copy">{formatRemainingTime(contest.endAt)}</span>
                  </div>

                  <h3>{contest.title}</h3>
                  <p>{contest.description || "No contest description provided."}</p>

                  <dl className="contest-meta">
                    <div>
                      <dt>Questions</dt>
                      <dd>{totalQuestions}</dd>
                    </div>
                    <div>
                      <dt>Test cases</dt>
                      <dd>{totalCases}</dd>
                    </div>
                    <div>
                      <dt>Duration</dt>
                      <dd>{contest.durationMinutes} min</dd>
                    </div>
                  </dl>

                  <div className="contest-owner">
                    <span>Created by</span>
                    <strong>{contest.createdBy?.name || user?.name || "Organizer"}</strong>
                  </div>

                  <div className="contest-card-actions">
                    <button
                      type="button"
                      className="primary-button inline-button"
                      onClick={() => (canJoinDirectly ? joinPublicContest(contest._id) : setShowJoiner(true))}
                      disabled={isJoining}
                    >
                      {canJoinDirectly ? "Join room" : "Join with code"}
                    </button>
                    {!canJoinDirectly && (
                      <span className="muted-copy">Private rooms require the generated contest code.</span>
                    )}
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