import express from 'express';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// Configure your PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/yourdb'
});

// Configure your email transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-email-password'
  }
});

// Request OTP endpoint
app.post('/api/request-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const tokenId = uuidv4();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

  // Find user by email
  const userRes = await pool.query('SELECT id FROM auth.users WHERE email = $1', [email]);
  if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const userId = userRes.rows[0].id;

  // Store OTP in DB
  await pool.query(
    'INSERT INTO password_reset_tokens (id, user_id, token, email, expires_at) VALUES ($1, $2, $3, $4, $5)',
    [tokenId, userId, otp, email, expiresAt]
  );

  // Send OTP email
  await transporter.sendMail({
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: email,
    subject: 'Your Password Reset OTP',
    text: `Your OTP code is: ${otp}`
  });

  res.json({ success: true });
});

// Verify OTP endpoint
app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  // Find valid OTP
  const result = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE email = $1 AND token = $2 AND used_at IS NULL AND expires_at > NOW()',
    [email, otp]
  );
  if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired OTP' });

  // Mark OTP as used
  await pool.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
    [result.rows[0].id]
  );

  res.json({ success: true, user_id: result.rows[0].user_id });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
