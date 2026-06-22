const mongoose = require("mongoose");
const User = require("../models/User");
const Friendship = require("../models/Friendship");
const { resolveUserFromAccessToken } = require("../services/authSession");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get the set of accepted friend IDs for a given userId.
 * Returns an array of ObjectIds.
 */
const getFriendIds = async (userId) => {
  const friendships = await Friendship.find({
    $or: [
      { requester: userId, status: "accepted" },
      { recipient: userId, status: "accepted" },
    ],
  }).select("requester recipient");

  return friendships.map((f) =>
    f.requester.toString() === userId.toString() ? f.recipient : f.requester
  );
};

// ─── Search Users ─────────────────────────────────────────────────────────────

const searchUsers = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const query = String(req.query.q || "").trim();
    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      _id: { $ne: me._id },
      name: { $regex: query, $options: "i" },
    })
      .select("_id name email createdAt")
      .limit(20);

    // Enrich with friendship status for each result
    const myFriendships = await Friendship.find({
      $or: [
        { requester: me._id },
        { recipient: me._id },
      ],
    }).select("requester recipient status");

    const statusMap = {};
    myFriendships.forEach((f) => {
      const otherId =
        f.requester.toString() === me._id.toString()
          ? f.recipient.toString()
          : f.requester.toString();
      statusMap[otherId] = {
        status: f.status,
        friendshipId: f._id,
        iAmRequester: f.requester.toString() === me._id.toString(),
      };
    });

    const enriched = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      friendship: statusMap[u._id.toString()] || null,
    }));

    return res.json({ users: enriched });
  } catch (err) {
    return res.status(500).json({ message: "Search failed.", error: err.message });
  }
};

// ─── Send Friend Request ──────────────────────────────────────────────────────

const sendRequest = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const { recipientId } = req.body;
    if (!recipientId || !mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ message: "Invalid recipient." });
    }
    if (recipientId.toString() === me._id.toString()) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: "User not found." });

    // Check if any friendship already exists (in either direction)
    const existing = await Friendship.findOne({
      $or: [
        { requester: me._id, recipient: recipientId },
        { requester: recipientId, recipient: me._id },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(409).json({ message: "Already friends." });
      }
      if (existing.status === "pending") {
        return res.status(409).json({ message: "Friend request already pending." });
      }
      if (existing.status === "rejected") {
        // Allow re-sending after rejection
        existing.status = "pending";
        existing.requester = me._id;
        existing.recipient = recipientId;
        await existing.save();
        return res.status(200).json({ message: "Friend request sent.", friendship: existing });
      }
    }

    const friendship = await Friendship.create({
      requester: me._id,
      recipient: recipientId,
      status: "pending",
    });

    return res.status(201).json({ message: "Friend request sent.", friendship });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Friend request already exists." });
    }
    return res.status(500).json({ message: "Failed to send request.", error: err.message });
  }
};

// ─── Accept Request ───────────────────────────────────────────────────────────

const acceptRequest = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const friendship = await Friendship.findById(req.params.id);
    if (!friendship) return res.status(404).json({ message: "Request not found." });

    if (friendship.recipient.toString() !== me._id.toString()) {
      return res.status(403).json({ message: "Only the recipient can accept this request." });
    }
    if (friendship.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending." });
    }

    friendship.status = "accepted";
    await friendship.save();

    return res.json({ message: "Friend request accepted.", friendship });
  } catch (err) {
    return res.status(500).json({ message: "Failed to accept request.", error: err.message });
  }
};

// ─── Reject Request ───────────────────────────────────────────────────────────

const rejectRequest = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const friendship = await Friendship.findById(req.params.id);
    if (!friendship) return res.status(404).json({ message: "Request not found." });

    if (friendship.recipient.toString() !== me._id.toString()) {
      return res.status(403).json({ message: "Only the recipient can reject this request." });
    }

    friendship.status = "rejected";
    await friendship.save();

    return res.json({ message: "Friend request rejected." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to reject request.", error: err.message });
  }
};

// ─── Cancel (withdraw) sent request ──────────────────────────────────────────

const cancelRequest = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const friendship = await Friendship.findById(req.params.id);
    if (!friendship) return res.status(404).json({ message: "Request not found." });

    if (friendship.requester.toString() !== me._id.toString()) {
      return res.status(403).json({ message: "Only the requester can cancel this request." });
    }

    await friendship.deleteOne();

    return res.json({ message: "Friend request cancelled." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to cancel request.", error: err.message });
  }
};

// ─── Unfriend ─────────────────────────────────────────────────────────────────

const unfriend = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const { friendId } = req.params;

    const friendship = await Friendship.findOneAndDelete({
      status: "accepted",
      $or: [
        { requester: me._id, recipient: friendId },
        { requester: friendId, recipient: me._id },
      ],
    });

    if (!friendship) return res.status(404).json({ message: "Friendship not found." });

    return res.json({ message: "Unfriended successfully." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to unfriend.", error: err.message });
  }
};

// ─── Get My Friends (Paginated) ───────────────────────────────────────────────

const getMyFriends = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [friendships, total] = await Promise.all([
      Friendship.find({
        status: "accepted",
        $or: [{ requester: me._id }, { recipient: me._id }],
      })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("requester", "name email createdAt")
        .populate("recipient", "name email createdAt"),
      Friendship.countDocuments({
        status: "accepted",
        $or: [{ requester: me._id }, { recipient: me._id }],
      }),
    ]);

    const friends = friendships.map((f) => {
      const friend =
        f.requester._id.toString() === me._id.toString() ? f.recipient : f.requester;
      return {
        friendshipId: f._id,
        since: f.updatedAt,
        user: friend,
      };
    });

    return res.json({
      friends,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch friends.", error: err.message });
  }
};

// ─── Incoming Requests ────────────────────────────────────────────────────────

const getIncomingRequests = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      Friendship.find({ recipient: me._id, status: "pending" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("requester", "name email createdAt"),
      Friendship.countDocuments({ recipient: me._id, status: "pending" }),
    ]);

    return res.json({ requests, total, page, hasMore: skip + limit < total });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch requests.", error: err.message });
  }
};

// ─── Sent Requests ────────────────────────────────────────────────────────────

const getSentRequests = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const requests = await Friendship.find({ requester: me._id, status: "pending" })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("recipient", "name email createdAt");

    return res.json({ requests });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch sent requests.", error: err.message });
  }
};

// ─── Mutual Friends ───────────────────────────────────────────────────────────

const getMutualFriends = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const { userId } = req.params;

    const [myFriendIds, theirFriendIds] = await Promise.all([
      getFriendIds(me._id),
      getFriendIds(userId),
    ]);

    const mySet = new Set(myFriendIds.map((id) => id.toString()));
    const mutualIds = theirFriendIds.filter((id) => mySet.has(id.toString()));

    const mutualUsers = await User.find({ _id: { $in: mutualIds } })
      .select("name email createdAt")
      .limit(20);

    return res.json({ mutual: mutualUsers, count: mutualIds.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to compute mutual friends.", error: err.message });
  }
};

// ─── Friend Suggestions (Friends-of-Friends) ──────────────────────────────────

const getSuggestions = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const myFriendIds = await getFriendIds(me._id);
    const myFriendSet = new Set([me._id.toString(), ...myFriendIds.map((id) => id.toString())]);

    // For each of my friends, get their friend list
    const foaFriendships = await Friendship.find({
      status: "accepted",
      $or: [
        { requester: { $in: myFriendIds } },
        { recipient: { $in: myFriendIds } },
      ],
    }).select("requester recipient");

    // Collect candidate suggestion IDs + how many mutual friends they have
    const mutualCount = {};
    foaFriendships.forEach((f) => {
      const a = f.requester.toString();
      const b = f.recipient.toString();
      // The candidate is whoever is NOT already in myFriendSet
      [a, b].forEach((id) => {
        if (!myFriendSet.has(id)) {
          mutualCount[id] = (mutualCount[id] || 0) + 1;
        }
      });
    });

    // Also exclude users who have a pending/rejected request with me
    const existingRelations = await Friendship.find({
      $or: [{ requester: me._id }, { recipient: me._id }],
    }).select("requester recipient");

    existingRelations.forEach((f) => {
      const otherId =
        f.requester.toString() === me._id.toString()
          ? f.recipient.toString()
          : f.requester.toString();
      delete mutualCount[otherId];
    });

    // Sort by mutual count, take top 10
    const sortedIds = Object.entries(mutualCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    const suggestedUsers = await User.find({ _id: { $in: sortedIds } })
      .select("name email createdAt");

    const suggestions = suggestedUsers.map((u) => ({
      user: u,
      mutualCount: mutualCount[u._id.toString()] || 0,
    }));

    return res.json({ suggestions });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch suggestions.", error: err.message });
  }
};

// ─── Friend request count (for badge) ────────────────────────────────────────

const getRequestCount = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.json({ count: 0 });

    const count = await Friendship.countDocuments({ recipient: me._id, status: "pending" });
    return res.json({ count });
  } catch (err) {
    return res.json({ count: 0 });
  }
};

module.exports = {
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
};

