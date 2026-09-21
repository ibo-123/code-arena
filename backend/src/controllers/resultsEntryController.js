// backend/src/controllers/resultsEntryController.js
const mongoose = require("mongoose");
const Contest = require("../models/Contest");
const Participant = require("../models/Participant");
const Result = require("../models/Result");
const Match = require("../models/Match");
const VideoSubmission = require("../models/VideoSubmission");
const AuditLog = require("../models/AuditLog");
const {
        computeWinnerFromContest,
} = require("../services/advancementService");

const getAuthUserId = (req) =>
        req.user?.userId || req.user?.id || req.user?._id || null;

const DEBUG = true;
const log = (...args) => {
        if (DEBUG) console.log("[resultsEntry]", ...args);
};

// ============================================================
// Internal helper — recompute ranks for a contest AND update
// the linked match's winner if the contest is attached to one.
// ============================================================
const recomputeContestRanks = async (contestId) => {
        const contest = await Contest.findById(contestId).lean();
        if (!contest) return;

        const results = await Result.find({ contestId }).lean();

        const approvedVideos = await VideoSubmission.find({
                contestId,
                status: "APPROVED",
        })
                .select("participantId")
                .lean();
        const approvedIds = new Set(
                approvedVideos.map((v) => String(v.participantId))
        );

        const effective = results.map((r) => {
                const isEligible = approvedIds.has(String(r.participantId));
                return {
                        ...r,
                        effectiveSolved: isEligible ? r.solvedCount || 0 : 0,
                        effectivePenalty: isEligible ? r.penalty || 0 : 0,
                        isEligible,
                };
        });

        effective.sort((a, b) => {
                if (b.effectiveSolved !== a.effectiveSolved)
                        return b.effectiveSolved - a.effectiveSolved;
                if (a.effectivePenalty !== b.effectivePenalty)
                        return a.effectivePenalty - b.effectivePenalty;
                return 0;
        });

        for (let i = 0; i < effective.length; i++) {
                const row = effective[i];
                const rank = i + 1;

                await Result.updateOne(
                        { _id: row._id },
                        {
                                $set: {
                                        rank,
                                        solvedCount: row.solvedCount || 0,
                                        penalty: row.penalty || 0,
                                },
                        }
                );

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

        // ---- Auto-update the linked match's winner ----
        if (contest.matchNumber && contest.stage !== "GROUP_STAGE") {
                const match = await Match.findOne({
                        tournament: contest.tournamentId,
                        stage: contest.stage,
                        matchNumber: contest.matchNumber,
                });

                if (match) {
                        const tournament = await require("../models/Tournament")
                                .findById(contest.tournamentId)
                                .lean();
                        const stageOrder = [
                                "QUARTER_FINAL",
                                "SEMI_FINAL",
                                "FINAL",
                                "COMPLETED",
                        ];
                        const currentIdx = stageOrder.indexOf(tournament?.currentStage || "");
                        const thisIdx = stageOrder.indexOf(contest.stage);

                        const isLocked = currentIdx > thisIdx;

                        if (!isLocked) {
                                const { winner, tie } = await computeWinnerFromContest(
                                        contest._id,
                                        match.participants
                                );

                                if (tie) {
                                        match.winner = null;
                                        match.status = "TIE";
                                } else if (winner) {
                                        match.winner = winner;
                                        match.status = "COMPLETED";
                                }
                                await match.save();
                        }
                }
        }
};

// ============================================================
// GET — roster + existing results
// ============================================================
exports.getContestResultsRoster = async (req, res) => {
        try {
                const { contestId } = req.params;

                if (!mongoose.Types.ObjectId.isValid(contestId)) {
                        return res
                                .status(400)
                                .json({ success: false, message: "Invalid contest ID" });
                }

                const contest = await Contest.findById(contestId).lean();
                if (!contest) {
                        return res
                                .status(404)
                                .json({ success: false, message: "Contest not found" });
                }

                const participantFilter = {
                        tournamentId: contest.tournamentId,
                        registrationStatus: "APPROVED",
                };

                if (contest.stage === "GROUP_STAGE" && contest.group) {
                        const g = String(contest.group).trim().toUpperCase();
                        participantFilter.$or = [{ group: g }, { group: g.toLowerCase() }];
                } else if (contest.stage !== "GROUP_STAGE" && contest.matchNumber) {
                        const match = await Match.findOne({
                                tournament: contest.tournamentId,
                                stage: contest.stage,
                                matchNumber: contest.matchNumber,
                        }).lean();

                        if (match) {
                                participantFilter._id = { $in: match.participants };
                        }
                }

                const participants = await Participant.find(participantFilter)
                        .populate("user", "name username codeforcesUsername")
                        .sort({ group: 1, seed: 1 })
                        .lean();

                const results = await Result.find({ contestId }).lean();
                const resultsByParticipant = Object.fromEntries(
                        results.map((r) => [String(r.participantId), r])
                );

                const videos = await VideoSubmission.find({ contestId })
                        .select("participantId status")
                        .lean();
                const videoByParticipant = Object.fromEntries(
                        videos.map((v) => [String(v.participantId), v.status])
                );

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
                                solved: r?.solvedCount ?? 0,
                                penalty: r?.penalty ?? 0,
                                rank: r?.rank ?? null,
                                effectiveSolved: isEligible ? r?.solvedCount ?? 0 : 0,
                                effectivePenalty: isEligible ? r?.penalty ?? 0 : 0,
                        };
                });

                let matchInfo = null;
                if (contest.matchNumber && contest.stage !== "GROUP_STAGE") {
                        const match = await Match.findOne({
                                tournament: contest.tournamentId,
                                stage: contest.stage,
                                matchNumber: contest.matchNumber,
                        })
                                .populate({
                                        path: "winner",
                                        populate: { path: "user", select: "name username" },
                                })
                                .lean();

                        if (match) {
                                const tournament = await require("../models/Tournament")
                                        .findById(contest.tournamentId)
                                        .lean();
                                const stageOrder = [
                                        "QUARTER_FINAL",
                                        "SEMI_FINAL",
                                        "FINAL",
                                        "COMPLETED",
                                ];
                                const currentIdx = stageOrder.indexOf(tournament?.currentStage || "");
                                const thisIdx = stageOrder.indexOf(contest.stage);
                                const isLocked = currentIdx > thisIdx;

                                matchInfo = {
                                        matchId: match._id,
                                        matchNumber: match.matchNumber,
                                        stage: match.stage,
                                        status: match.status,
                                        isLocked,
                                        winner: match.winner
                                                ? {
                                                        participantId: match.winner._id,
                                                        name: match.winner.user?.name,
                                                        username: match.winner.user?.username,
                                                }
                                                : null,
                                };
                        }
                }

                return res.json({
                        success: true,
                        contest: {
                                _id: contest._id,
                                name: contest.name,
                                stage: contest.stage,
                                group: contest.group,
                                matchNumber: contest.matchNumber,
                                status: contest.status,
                                startTime: contest.startTime,
                                endTime: contest.endTime,
                        },
                        matchInfo,
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
exports.saveParticipantResult = async (req, res) => {
        try {
                const { contestId } = req.params;
                const { participantId, solved, penalty } = req.body || {};

                if (!mongoose.Types.ObjectId.isValid(contestId)) {
                        return res
                                .status(400)
                                .json({ success: false, message: "Invalid contest ID" });
                }
                if (!mongoose.Types.ObjectId.isValid(participantId)) {
                        return res
                                .status(400)
                                .json({ success: false, message: "Invalid participant ID" });
                }

                const solvedNum = Number(solved);
                const penaltyNum = Number(penalty);

                if (!Number.isFinite(solvedNum) || solvedNum < 0) {
                        return res
                                .status(400)
                                .json({ success: false, message: "Solved must be non-negative" });
                }
                if (!Number.isFinite(penaltyNum) || penaltyNum < 0) {
                        return res
                                .status(400)
                                .json({ success: false, message: "Penalty must be non-negative" });
                }

                const contest = await Contest.findById(contestId).lean();
                if (!contest) {
                        return res
                                .status(404)
                                .json({ success: false, message: "Contest not found" });
                }

                if (contest.matchNumber && contest.stage !== "GROUP_STAGE") {
                        const tournament = await require("../models/Tournament")
                                .findById(contest.tournamentId)
                                .lean();
                        const stageOrder = [
                                "QUARTER_FINAL",
                                "SEMI_FINAL",
                                "FINAL",
                                "COMPLETED",
                        ];
                        const currentIdx = stageOrder.indexOf(tournament?.currentStage || "");
                        const thisIdx = stageOrder.indexOf(contest.stage);
                        if (currentIdx > thisIdx) {
                                return res.status(409).json({
                                        success: false,
                                        message: "This stage has already advanced — results are locked",
                                });
                        }
                }

                const participant = await Participant.findOne({
                        _id: participantId,
                        tournamentId: contest.tournamentId,
                }).lean();

                if (!participant) {
                        return res
                                .status(404)
                                .json({ success: false, message: "Participant not found" });
                }

                // ---- Save (upsert) ----------------------------------------
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

                log(
                        `saved result contestId=${contestId} participantId=${participantId} ` +
                        `solved=${solvedNum} penalty=${penaltyNum} resultId=${result._id}`
                );

                // ---- Recompute ranks + match winner -----------------------
                await recomputeContestRanks(contestId);

                await AuditLog.create({
                        action: "CONTEST_RESULT_SAVED",
                        description: `Saved result for participant ${participant.user} in contest ${contest.name}`,
                        admin: getAuthUserId(req),
                        tournament: contest.tournamentId,
                        details: {
                                contestId,
                                participantId,
                                solved: solvedNum,
                                penalty: penaltyNum,
                        },
                }).catch(() => { });

                return res.json({ success: true, message: "Result saved", result });
        } catch (err) {
                console.error("saveParticipantResult error:", err);
                return res.status(500).json({ success: false, message: "Server error" });
        }
};

// ============================================================
// POST — trigger a rematch
// ============================================================
exports.startRematch = async (req, res) => {
        try {
                const { matchId } = req.params;
                const {
                        invitationUrl,
                        startTime,
                        durationMinutes = 60,
                        description = "",
                } = req.body || {};

                if (!mongoose.Types.ObjectId.isValid(matchId)) {
                        return res
                                .status(400)
                                .json({ success: false, message: "Invalid match ID" });
                }

                if (!invitationUrl || !startTime) {
                        return res.status(400).json({
                                success: false,
                                message: "invitationUrl and startTime are required",
                        });
                }

                const match = await Match.findById(matchId);
                if (!match) {
                        return res
                                .status(404)
                                .json({ success: false, message: "Match not found" });
                }

                if (match.status !== "TIE") {
                        return res.status(409).json({
                                success: false,
                                message: "Only tied matches can start a rematch",
                        });
                }

                const previousContestId = match.contest;

                const startDate = new Date(startTime);
                const endDate = new Date(
                        startDate.getTime() + Number(durationMinutes) * 60 * 1000
                );

                const newContest = await Contest.create({
                        tournamentId: match.tournament,
                        name: `${match.stage.replace(/_/g, " ")} — Match ${match.matchNumber} (Rematch ${match.rematchRound + 1})`,
                        invitationUrl,
                        description,
                        stage: match.stage,
                        matchNumber: match.matchNumber,
                        startTime: startDate,
                        endTime: endDate,
                        durationSeconds: Number(durationMinutes) * 60,
                        status: "DRAFT",
                        published: true,
                        publishedAt: new Date(),
                });

                match.previousContests = [
                        ...(match.previousContests || []),
                        previousContestId,
                ].filter(Boolean);
                match.contest = newContest._id;
                match.contestId = newContest._id;
                match.rematchRound = (match.rematchRound || 0) + 1;
                match.winner = null;
                match.status = "PENDING";
                await match.save();

                if (previousContestId) {
                        await Result.deleteMany({ contestId: previousContestId });
                }

                return res.json({
                        success: true,
                        message: "Rematch created. Enter new results.",
                        match,
                        contest: newContest,
                });
        } catch (err) {
                console.error("startRematch error:", err);
                return res.status(500).json({ success: false, message: "Server error" });
        }
};