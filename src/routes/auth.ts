import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone required' });
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    (global as any).otpStore = (global as any).otpStore || {};
    (global as any).otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    console.log(`OTP for ${phone}: ${otp}`);
    return res.json({ message: 'OTP sent', testOtp: otp });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });
  try {
    const store = (global as any).otpStore || {};
    const record = store[phone];
    if (!record) return res.status(400).json({ message: 'OTP not found. Request a new one.' });
    if (Date.now() > record.expires) return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    if (record.otp !== otp) return res.status(400).json({ message: 'Incorrect OTP' });

    delete store[phone];
    const user = await User.findOne({ phone });
    if (user) {
      const token = jwt.sign(
        { uid: user.uid, role: user.role, _id: user._id.toString() },
        process.env.JWT_SECRET as string,
        { expiresIn: '30d' } as any
      );
      return res.json({ exists: true, token, user });
    }
    return res.json({ exists: false, tempToken: Buffer.from(phone).toString('base64') });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  const { phone, tempToken, name, aadhaarLast4, district, state } = req.body;

  if (!phone || !name || !aadhaarLast4 || !district || !state) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (aadhaarLast4.length !== 4 || !/^\d{4}$/.test(aadhaarLast4)) {
    return res.status(400).json({ message: 'Invalid Aadhaar digits' });
  }

  try {
    // Verify temp token matches phone
    const decodedPhone = Buffer.from(tempToken || '', 'base64').toString();
    if (decodedPhone !== phone) {
      return res.status(401).json({ message: 'Invalid session. Please login again.' });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }

    const uid = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const user = await User.create({
      uid,
      phone,
      name: name.trim(),
      aadhaarLast4,
      district: district.trim(),
      state,
      role: 'beneficiary',
      complianceScore: 0,
    });

    const token = jwt.sign(
      { uid: user.uid, role: user.role, _id: user._id.toString() },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' } as any
    );

    return res.status(201).json({
      token,
      user: {
        uid: user.uid,
        phone: user.phone,
        name: user.name,
        aadhaarLast4: user.aadhaarLast4,
        district: user.district,
        state: user.state,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

export default router;