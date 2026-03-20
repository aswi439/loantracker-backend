// src/routes/uploads.ts
import express from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth';
import Upload from '../models/Upload';
import Loan from '../models/Loan';
import { uploadPhotoToS3 } from '../services/s3';

const router = express.Router();

// Store file in memory before S3 upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/uploads — receive a new upload from mobile
router.post('/', requireAuth, upload.single('photo'), async (req: AuthRequest, res) => {
  if (!req.file) return res.status(400).json({ message: 'Photo file is required' });

  const { loanId, latitude, longitude, timestamp, note, aiResult, trustScore } = req.body;
  if (!loanId || !latitude || !longitude || !timestamp) {
    return res.status(400).json({ message: 'loanId, latitude, longitude, timestamp are required' });
  }

  try {
    // Verify loan belongs to this user
    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    if (loan.beneficiaryUid !== req.user!.uid) {
      return res.status(403).json({ message: 'Not your loan' });
    }

    // Upload to S3
    const photoUrl = await uploadPhotoToS3(
      req.file.buffer,
      req.file.originalname,
      loanId
    );

    // Parse AI result if provided
    let parsedAiResult = null;
    if (aiResult) {
      try { parsedAiResult = JSON.parse(aiResult); } catch {}
    }

    // Save upload record
    const uploadRecord = await Upload.create({
      uploadId: req.body.uploadId || require('uuid').v4(),
      loanId,
      beneficiaryUid: req.user!.uid,
      photoUrl,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date(timestamp),
      note: note || '',
      trustScore: trustScore ? parseInt(trustScore) : null,
      aiResult: parsedAiResult,
      reviewStatus: 'pending',
    });

    // Increment upload count on loan
    await Loan.findByIdAndUpdate(loanId, { $inc: { uploads: 1 } });

    return res.status(201).json({
      message: 'Upload received successfully',
      uploadId: uploadRecord.uploadId,
      photoUrl,
    });
  } catch (err: any) {
    console.error('Upload error:', err.message);
    return res.status(500).json({ message: 'Upload failed: ' + err.message });
  }
});

// GET /api/uploads/loan/:loanId — get all uploads for a loan
router.get('/loan/:loanId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uploads = await Upload.find({ loanId: req.params.loanId })
      .sort({ timestamp: -1 });
    return res.json({ uploads });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch uploads' });
  }
});

// GET /api/uploads/pending — get all pending uploads (officer)
router.get('/pending', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role === 'beneficiary') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  try {
    const uploads = await Upload.find({ reviewStatus: 'pending' })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json({ uploads });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch pending uploads' });
  }
});

// PATCH /api/uploads/:id/review — approve or reject (officer)
router.patch('/:id/review', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role === 'beneficiary') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const { status, comment } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'status must be approved or rejected' });
  }
  try {
    const uploadRecord = await Upload.findByIdAndUpdate(
      req.params.id,
      {
        reviewStatus: status,
        reviewedBy: req.user!.uid,
        reviewComment: comment,
        reviewedAt: new Date(),
      },
      { new: true }
    );
    return res.json({ upload: uploadRecord });
  } catch (err) {
    return res.status(500).json({ message: 'Review failed' });
  }
});

export default router;
