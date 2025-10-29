import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import { UniqueConstraintError } from 'sequelize';

const router = Router();

/* 
 * POST /api/auth/register
 * Registra un nuovo utente nel sistema
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Username, password ed email sono obbligatori' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      email
    });

    res.status(201).json({
      message: 'Utente creato con successo',
      userId: user.userID
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      res.status(409).json({ message: 'Username o email sono già in uso' });
    } else {
      console.error('Errore registrazione:', error);
      res.status(500).json({ message: 'Errore interno del server' });
    }
  }
});

/* 
 * POST /api/auth/login
 * Autentica un utente e restituisce un token JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username e password sono obbligatori' });
    }

    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Nome utente o password non validi' });
    }

    const token = jwt.sign(
      { userId: user.userID },
      'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login effettuato con successo',
      token,
      userId: user.userID
    });
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
});

export default router;
