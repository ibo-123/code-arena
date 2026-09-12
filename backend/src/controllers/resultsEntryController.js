const mongoose = require("mongoose");
const Contest = require("../models/Contest");
const Participant = require("../models/Participant");
const Result = require("../models/Result");
const VideoSubmission = require("../models/VideoSubmission");
const AuditLog = require("../models/AuditLog");

const getAuthUserId = (req) =>
        req.user?.userId || req.user?.id || req.user?._id || null;

// ============================================================
// SHARED — compute ranks for a contest
// ============================================================
// Sorts by solved DESC, then penalty ASC, then seed ASC.
// Only participants whose video is APPROVED are counted —
// everyone else gets 0 solved / 0 penalty but still appears.
// ============================================================
const recomputeContestRanks = async (contestId) => {
        const contest = await Contest.findById(contestId).lean();
        if (!contest) return;

        // Get all Results for this contest
        const results = await Result.find({ contestId }).lean();

        // Get video approvals for this contest
        const approvedVideos = await VideoSubmission.find({
                contestId,
                status: "APPROVED",
        })
                .select("participantId")
                .lean();
        const approvedIds = new Set(
                approvedVideos.map((v) => String(v.participantId))
        );

        // For each result, compute effective solved/penalty
        // If video not approved → force 0
        const effective = results.map((r) => {
                const isEligible = approvedIds.has(String(r.participantId));
                return {
                        ...r,
                        effectiveSolved: isEligible ? r.solvedCount || 0 : 0,
                        effectivePenalty: isEligible ? r.penalty || 0 : 0,
                        isEligible,
                };
        });

        // Sort: solved desc, penalty asc, seed asc (tiebreak)
        effective.sort((a, b) => {
                if (b.effectiveSolved !== a.effectiveSolved)
                        return b.effectiveSolved - a.effectiveSolved;
                if (a.effectivePenalty !== b.effectivePenalty)
                        return a.effectivePenalty - b.effectivePenalty;
                return 0;
        });

        // Assign ranks and persist
        for (let i = 0; i < effective.length; i++) {
                const row = effective[i];
                const rank = i + 1;

                await Result.updateOne(
                        { _id: row._id },
                        {
                                $set: {
                                        rank,
                                        // keep the raw entered values so admin sees what they typed
                                        solvedCount: row.solvedCount || 0,
                                        penalty: row.penalty || 0,
                                },
                        }
                );

                // Also update the Participant summary row (used by standings)
                await Participant.updateOne(
                        { _id: row.participantId },
                        {
                                $set: {
                                        rank,
                                        solved: row.effectiveSolved,
                                        penalty: row.effectivePenalty,
                                        score: row.effectiveSolved,
                                },
                        }
                );
        }
};

// ============================================================
// GET — roster + existing results
// ============================================================
// GET /api/admin/contests/:contestId/results
// Returns every eligible participant for this contest, merged
// with any Result document and video approval status.
// ============================================================
exports.getContestResultsRoster = async (req, res) => {
        try {
                const { contestId } = req.params;

                if (!mongoose.Types.ObjectId.isValid(contestId)) {
                        return res.status(400).json({ success: false, message: "Invalid contest ID" });
                }

                const contest = await Contest.findById(contestId).lean();
                if (!contest) {
                        return res.status(404).json({ success: false, message: "Contest not found" });
                }

                // ---- Determine which participants are eligible ---------------
                // GROUP_STAGE → only that group; everything else → everyone APPROVED
                const participantFilter = {
                        tournamentId: contest.tournamentId,
                        registrationStatus: "APPROVED",
                };

                if (contest.stage === "GROUP_STAGE" && contest.group) {
                        const g = String(contest.group).trim().toUpperCase();
                        participantFilter.$or = [{ group: g }, { group: g.toLowerCase() }];
                }

                const participants = await Participant.find(participantFilter)
                        .populate("user", "name username codeforcesUsername")
                        .sort({ group: 1, seed: 1 })
                        .lean();

                // ---- Fetch all results for this contest ----------------------
                const results = await Result.find({ contestId }).lean();
                const resultsByParticipant = Object.fromEntries(
                        results.map((r) => [String(r.participantId), r])
                );

                // ---- Fetch video submission status ---------------------------
                const videos = await VideoSubmission.find({ contestId })
                        .select("participantId status")
                        .lean();
                const videoByParticipant = Object.fromEntries(
                        videos.map((v) => [String(v.participantId), v.status])
                );

                // ---- Merge into a single roster ------------------------------
                const roster = participants.map((p) => {
                        const r = resultsByParticipant[String(p._id)] || null;
                        const videoStatus = videoByParticipant[String(p._id)] || "NOT_SUBMITTED";
                        const isEligible = videoStatus === "APPROVED";

                        return {
                                participantId: p._id,
                                user: p.user,
                                group: p.group,
                                seed: p.seed,
                                videoStatus,
                                isEligible,
                                // entered values (what admin typed)
                                solved: r?.solvedCount ?? 0,
                                penalty: r?.penalty ?? 0,
                                rank: r?.rank ?? null,
                                // effective values used for standings
                                effectiveSolved: isEligible ? (r?.solvedCount ?? 0) : 0,
                                effectivePenalty: isEligible ? (r?.penalty ?? 0) : 0,
                        };
                });

                return res.json({
                        success: true,
                        contest: {
                                _id: contest._id,
                                name: contest.name,
                                stage: contest.stage,
                                group: contest.group,
                                status: contest.status,
                                startTime: contest.startTime,
                                endTime: contest.endTime,
                        },
                        count: roster.length,
                        roster,
                });
        } catch (err) {
                console.error("getContestResultsRoster error:", err);
                return res.status(500).json({ success: false, message: "Server error" });
        }
};

// ============================================================
// POST — save one participant's result (incremental)
// ============================================================
// POST /api/admin/contests/:contestId/results
// Body: { participantId, solved, penalty }
// Upserts a Result document, then recomputes ranks.
// ============================================================
exports.saveParticipantResult = async (req, res) => {
        try {
                const { contestId } = req.params;
                const { participantId, solved, penalty } = req.body || {};

                if (!mongoose.Types.ObjectId.isValid(contestId)) {
                        return res.status(400).json({ success: false, message: "Invalid contest ID" });
                }
                if (!mongoose.Types.ObjectId.isValid(participantId)) {
                        return res.status(400).json({ success: false, message: "Invalid participant ID" });
                }

                const solvedNum = Number(solved);
                const penaltyNum = Number(penalty);

                if (!Number.isFinite(solvedNum) || solvedNum < 0) {
                        return res.status(400).json({
                                success: false,
                                message: "Solved must be a non-negative number",
                        });
                }
                if (!Number.isFinite(penaltyNum) || penaltyNum < 0) {
                        return res.status(400).json({
                                success: false,
                                message: "Penalty must be a non-negative number",
                        });
                }

                const contest = await Contest.findById(contestId).lean();
                if (!contest) {
                        return res.status(404).json({ success: false, message: "Contest not found" });
                }

                const participant = await Participant.findOne({
                        _id: participantId,
                        tournamentId: contest.tournamentId,
                }).lean();

                if (!participant) {
                        return res.status(404).json({ success: false, message: "Participant not found in this tournament" });
                }

                // Upsert the Result
                const result = await Result.findOneAndUpdate(
                        { contestId, participantId },
                        {
                                $set: {
                                        tournamentId: contest.tournamentId,
                                        contestId,
                                        participantId,
                                        solvedCount: Math.floor(solvedNum),
                                        penalty: penaltyNum,
                                        points: Math.floor(solvedNum),
                                        syncedAt: new Date(),
                                },
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                // Recompute all ranks in the contest
                await recomputeContestRanks(contestId);

                await AuditLog.create({
                        action: "CONTEST_RESULT_SAVED",
                        description: `Saved result for participant ${participant.user} in contest ${contest.name}`,
                        admin: getAuthUserId(req),
                        tournament: contest.tournamentId,
                        details: { contestId, participantId, solved: solvedNum, penalty: penaltyNum },
                }).catch(() => { });

                return res.json({
                        success: true,
                        message: "Result saved",
                        result,
                });
        } catch (err) {
                console.error("saveParticipantResult error:", err);
                return res.status(500).json({ success: false, message: "Server error" });
        }
};