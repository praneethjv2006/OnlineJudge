/**
 * Rating Service — Elo-style contest rating updates
 *
 * Only called when an "official" contest (isOfficial: true, created by admin) ends.
 * User-created public/private contests do NOT update ratings.
 *
 * Tier System:
 *  0         → Unranked
 *  1–399     → Wanderer    (slate)
 *  400–799   → Challenger  (green)
 *  800–1199  → Adept       (teal)
 *  1200–1599 → Specialist  (blue)
 *  1600–1999 → Expert      (violet)
 *  2000–2399 → Grandmaster (orange)
 *  2400+     → Legendary   (gold)
 */

const User = require("../models/User");
const Contest = require("../models/Contest");
const Submission = require("../models/Submission");

const TIERS = [
  { min: 2400, name: "Legendary" },
  { min: 2000, name: "Grandmaster" },
  { min: 1600, name: "Expert" },
  { min: 1200, name: "Specialist" },
  { min: 800,  name: "Adept" },
  { min: 400,  name: "Challenger" },
  { min: 1,    name: "Wanderer" },
  { min: 0,    name: "Unranked" },
];

const getTier = (rating) => {
  for (const t of TIERS) {
    if (rating >= t.min) return t.name;
  }
  return "Unranked";
};

const DIFFICULTY_POINTS = { easy: 100, medium: 220, hard: 380 };

const computeTagRatings = (acceptedSubs) => {
  const tagMap = {};
  const now = Date.now();

  acceptedSubs.forEach((sub) => {
    const difficulty = sub.difficulty || "medium";
    const basePoints = DIFFICULTY_POINTS[difficulty] || 220;
    const tags = sub.tags || [];

    const daysSince = Math.max(0, (now - new Date(sub.solvedAt).getTime()) / 86400000);
    const recencyMultiplier = daysSince < 30 ? 1 + (0.2 * (1 - daysSince / 30)) : 1;
    const points = Math.round(basePoints * recencyMultiplier);

    tags.forEach((tag) => {
      if (!tag) return;
      const normalizedTag = tag.trim().toLowerCase();
      if (!tagMap[normalizedTag]) {
        tagMap[normalizedTag] = { displayTag: tag.trim(), totalPoints: 0, count: 0, lastSolvedAt: null };
      }
      tagMap[normalizedTag].totalPoints += points;
      tagMap[normalizedTag].count += 1;
      if (!tagMap[normalizedTag].lastSolvedAt || new Date(sub.solvedAt) > new Date(tagMap[normalizedTag].lastSolvedAt)) {
        tagMap[normalizedTag].lastSolvedAt = sub.solvedAt;
      }
    });
  });

  return Object.entries(tagMap).map(([, entry]) => {
    const { displayTag, totalPoints, count } = entry;
    const rawRating = Math.round(Math.min(3000, totalPoints));
    return { tag: displayTag, rating: rawRating, solved: count, tier: getTier(rawRating) };
  }).sort((a, b) => b.rating - a.rating);
};

const computeOverallRating = (tagRatings, easySolved, mediumSolved, hardSolved) => {
  const base = (easySolved * 80) + (mediumSolved * 200) + (hardSolved * 350);
  const topTagBonus = tagRatings.slice(0, 5).reduce((sum, t) => sum + t.rating * 0.1, 0);
  return Math.round(Math.min(3000, base + topTagBonus));
};

/**
 * Compute and update ratings for all participants of an official contest.
 * Called after an official contest ends.
 */
const updateRatingsForContest = async (contestId) => {
  try {
    const contest = await Contest.findById(contestId);
    if (!contest || !contest.isOfficial) return;

    const participants = contest.participants || [];
    if (participants.length === 0) return;

    // Fetch all accepted submissions in this contest
    const submissions = await Submission.find({ contest: contestId, verdict: "Accepted" })
      .populate("user", "name")
      .sort({ createdAt: 1 });

    // Fetch leaderboard for ranking
    const leaderboard = contest.leaderboard || [];
    const rankMap = {};
    leaderboard.forEach((entry) => {
      rankMap[entry.user.toString()] = entry.rank || 999;
    });

    // For each participant, recompute their full rating from ALL their accepted submissions
    for (const participant of participants) {
      const userId = participant.user.toString();
      const user = await User.findById(userId);
      if (!user) continue;

      // Get all accepted submissions for this user across ALL contests
      const allAccepted = await Submission.find({ user: userId, verdict: "Accepted" })
        .populate("contest", "questions isOfficial")
        .populate("problem", "title difficulty tags");

      const acceptedForTagRating = [];
      let easySolved = 0, mediumSolved = 0, hardSolved = 0;
      const solvedSet = new Set();

      allAccepted.forEach((sub) => {
        let questionKey = "";
        let difficulty = "medium";
        let tags = [];
        let solvedAt = sub.submittedAt || sub.createdAt;

        if (sub.contest) {
          questionKey = `contest-${sub.contest._id}-${sub.questionIndex}`;
          const q = sub.contest.questions?.[sub.questionIndex];
          difficulty = q?.difficulty || "medium";
          tags = q?.tags || q?.topics || [];
        } else if (sub.problem) {
          questionKey = `problem-${sub.problem._id}`;
          difficulty = sub.problem.difficulty || "medium";
          tags = sub.problem.tags || [];
        }

        if (!solvedSet.has(questionKey)) {
          solvedSet.add(questionKey);
          acceptedForTagRating.push({ difficulty, tags, solvedAt });
          if (difficulty === "easy") easySolved++;
          else if (difficulty === "hard") hardSolved++;
          else mediumSolved++;
        }
      });

      const tagRatings = computeTagRatings(acceptedForTagRating);
      const overallRating = computeOverallRating(tagRatings, easySolved, mediumSolved, hardSolved);
      const tier = getTier(overallRating);

      const contestRank = rankMap[userId];
      const prevBest = user.skillMetadata?.bestContestRank;

      await User.findByIdAndUpdate(userId, {
        "skillMetadata.overallRating": overallRating,
        "skillMetadata.tier": tier,
        "skillMetadata.tagRatings": tagRatings,
        "skillMetadata.easySolved": easySolved,
        "skillMetadata.mediumSolved": mediumSolved,
        "skillMetadata.hardSolved": hardSolved,
        "skillMetadata.lastComputedAt": new Date(),
        "skillMetadata.totalContestsParticipated": (user.skillMetadata?.totalContestsParticipated || 0) + 1,
        "skillMetadata.bestContestRank": (!prevBest || contestRank < prevBest) ? contestRank : prevBest,
        $push: {
          "skillMetadata.contestRatingHistory": {
            rating: overallRating,
            date: new Date(),
            contestId: contest._id,
          },
        },
      });
    }

    console.log(`[ratingService] Ratings updated for official contest: ${contest.title} (${contestId})`);
  } catch (err) {
    console.error("[ratingService] Error updating ratings:", err.message);
  }
};

module.exports = { updateRatingsForContest, getTier, computeTagRatings, computeOverallRating };
