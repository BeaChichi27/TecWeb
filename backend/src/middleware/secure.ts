import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/* Middleware per autenticare il token JWT */

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Token non fornito. Accesso non autorizzato.' }); // Unauthorized
  }

  const secret = process.env.JWT_SECRET || 'your_jwt_secret';

  jwt.verify(token, secret, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Token non valido o scaduto.' }); // Forbidden
    }
    (req as any).user = user;
    next();
  });
};