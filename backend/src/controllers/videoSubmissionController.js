const VideoSubmission = require("../models/VideoSubmission");
const Contest = require("../models/Contest");
const Participant = require("../models/Participant");
const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

const submitVideo = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { videoUrl, note } = req.body;
    const userId = req.user.userId || req.user._id;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Video URL is required",
      });
    }

    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found",
      });
    }

    const now = new Date();
    const endTime = new Date(new Date(contest.startTime).getTime() + contest.durationSeconds * 1000);
    if (now < endTime) {
      return res.status(400).json({
        success: false,
        message: "Contest is still ongoing. Video submission is only allowed after the contest ends.",
      });
    }

    const participant = await Participant.findOne({
      tournamentId: contest.tournamentId,
      user: userId,
      registrationStatus: "APPROVED",
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "You are not an approved participant for this tournament",
      });
    }

    const existingSubmission = await VideoSubmission.findOne({
      contestId,
      participantId: participant._id,
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a video for this contest",
        submission: existingSubmission,
      });
    }

    const submission = await VideoSubmission.create({
      contestId,
      tournamentId: contest.tournamentId,
      participantId: participant._id,
      videoUrl,
      note: note || "",
      status: "PENDING",
    });

    return res.status(201).json({
      success: true,
      message: "Video submitted successfully. Awaiting admin review.",
      submission,
    });
  } catch (error) {
    console.error("submitVideo error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMyVideoSubmission = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.user.userId || req.user._id;

    const participant = await Participant.findOne({ user: userId });
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    const submission = await VideoSubmission.findOne({
      contestId,
      participantId: participant._id,
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "No video submission found",
      });
    }

    return res.json({ success: true, submission });
  } catch (error) {
    console.error("getMyVideoSubmission error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getVideoSubmissions = async (req, res) => {
  try {
    const { contestId } = req.params;
    const { status } = req.query;

    const filter = { contestId };
    if (status) {
      filter.status = status;
    }

    const submissions = await VideoSubmission.find(filter)
      .populate({
        path: "participantId",
        select: "group seed user",
        populate: {
          path: "user",
          select: "name username codeforcesUsername",
        },
      })
      .populate("reviewedBy", "name username")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("getVideoSubmissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const approveVideo = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await VideoSubmission.findById(submissionId)
      .populate("participantId");

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    if (submission.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Submission is already ${submission.status.toLowerCase()}`,
      });
    }

    submission.status = "APPROVED";
    submission.reviewedBy = req.user.userId || req.user._id;
    submission.reviewedAt = new Date();
    await submission.save();

    await AuditLog.create({
      action: "VIDEO_APPROVED",
      description: `Video submission ${submissionId} approved`,
      admin: req.user.userId || req.user._id,
      tournament: submission.tournamentId,
      details: { contestId: submission.contestId, participantId: submission.participantId?._id || submission.participantId },
    });

    return res.json({
      success: true,
      message: "Video approved successfully",
      submission,
    });
  } catch (error) {
    console.error("approveVideo error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const rejectVideo = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { reason } = req.body;

    const submission = await VideoSubmission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    if (submission.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Submission is already ${submission.status.toLowerCase()}`,
      });
    }

    submission.status = "REJECTED";
    submission.reviewedBy = req.user.userId || req.user._id;
    submission.reviewedAt = new Date();
    submission.rejectionReason = reason || "No reason provided";
    await submission.save();

    await AuditLog.create({
      action: "VIDEO_REJECTED",
      description: `Video submission ${submissionId} rejected${reason ? ` — ${reason}` : ''}`,
      admin: req.user.userId || req.user._id,
      tournament: submission.tournamentId,
      details: { reason: submission.rejectionReason, contestId: submission.contestId },
    });

    return res.json({
      success: true,
      message: "Video rejected",
      submission,
    });
  } catch (error) {
    console.error("rejectVideo error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  submitVideo,
  getMyVideoSubmission,
  getVideoSubmissions,
  approveVideo,
  rejectVideo,
};