// src/routes/loans.ts
import express from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import Loan from '../models/Loan';

const router = express.Router();

// GET /api/loans/my — get current user's loans
router.get('/my', requireAuth, async (req: AuthRequest, res) => {
  try {
    const loans = await Loan.find({ beneficiaryUid: req.user!.uid }).sort({ createdAt: -1 });
    return res.json({ loans });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch loans' });
  }
});

// GET /api/loans/:id — single loan detail
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    if (loan.beneficiaryUid !== req.user!.uid && req.user!.role === 'beneficiary') {
      return res.status(403).json({ message: 'Access denied' });
    }
    return res.json({ loan });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch loan' });
  }
});

// POST /api/loans — add loan (officer/admin only)
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role === 'beneficiary') {
    return res.status(403).json({ message: 'Only officers can add loans' });
  }
  try {
    const loan = await Loan.create(req.body);
    return res.status(201).json({ loan });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
});

// PATCH /api/loans/:id/progress — update loan progress (officer)
router.patch('/:id/progress', requireAuth, async (req: AuthRequest, res) => {
  if (req.user!.role === 'beneficiary') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  try {
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { progress: req.body.progress, status: req.body.status },
      { new: true }
    );
    return res.json({ loan });
  } catch (err) {
    return res.status(500).json({ message: 'Update failed' });
  }
});

export default router;
