const express = require("express");
const {
  searchUsers,
  sendRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  unfriend,
  getMyFriends,
  getIncomingRequests,
  getSentRequests,
  getMutualFriends,
  getSuggestions,
  getRequestCount,
} = require("../controllers/friendController");

const router = express.Router();

// Search
router.get("/search", searchUsers);

// Request count badge
router.get("/requests/count", getRequestCount);

// Friend lists
router.get("/", getMyFriends);
router.get("/requests/incoming", getIncomingRequests);
router.get("/requests/sent", getSentRequests);
router.get("/suggestions", getSuggestions);
router.get("/mutual/:userId", getMutualFriends);

// Request actions
router.post("/request", sendRequest);
router.patch("/request/:id/accept", acceptRequest);
router.patch("/request/:id/reject", rejectRequest);
router.delete("/request/:id", cancelRequest);

// Unfriend
router.delete("/:friendId", unfriend);

module.exports = router;
