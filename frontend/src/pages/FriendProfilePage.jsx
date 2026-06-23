import { useParams, useNavigate } from "react-router-dom";
import FriendProfileModal from "../components/social/FriendProfileModal";

function FriendProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    // Attempt to go back, fallback to /friends page
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/friends");
    }
  };

  const handleMessage = (conversationId) => {
    navigate("/messages", { state: { conversationId } });
  };

  return (
    <div className="friend-profile-page-container" style={{ minHeight: "calc(100vh - 70px)", padding: "40px 20px" }}>
      <FriendProfileModal
        friend={{ _id: userId }}
        onClose={handleClose}
        onMessage={handleMessage}
        onUnfriend={() => navigate("/friends")}
      />
    </div>
  );
}

export default FriendProfilePage;
