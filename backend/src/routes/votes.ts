import { Router } from 'express';
import Vote from '../models/vote';
import Review from '../models/review';
import { authenticateToken } from '../middleware/secure';
import { Op } from 'sequelize';

const router = Router();

/* 
 * POST /api/votes
 * Crea o aggiorna un voto per una recensione
 * Logica:
 * - Se l'utente non ha ancora votato → crea nuovo voto
 * - Se l'utente ha già votato con lo stesso tipo → rimuove il voto (toggle)
 * - Se l'utente ha già votato con tipo diverso → cambia il tipo di voto
 */
router.post('/', authenticateToken, async (req, res) => {
  const { reviewId, voteType } = req.body;
  const voterUserID = (req as any).user.userId;

  if (!reviewId || !voteType) {
    return res.status(400).json({ message: 'reviewId e voteType sono obbligatori' });
  }

  if (voteType !== 'upvote' && voteType !== 'downvote') {
    return res.status(400).json({ message: 'voteType deve essere "upvote" o "downvote"' });
  }

  try {
    // Verifica che la recensione esista
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Recensione non trovata' });
    }

    // Cerca se l'utente ha già votato questa recensione
    const existingVote = await Vote.findOne({
      where: {
        reviewID: reviewId,
        voterUserID: voterUserID
      }
    });

    if (existingVote) {
      // Se l'utente clicca sullo stesso tipo di voto → rimuovi il voto (toggle)
      if ((existingVote as any).voteType === voteType) {
        await existingVote.destroy();
        return res.json({ message: 'Voto rimosso', removed: true });
      } else {
        // Se l'utente clicca su un tipo di voto diverso → aggiorna il voto
        await existingVote.update({ voteType });
        return res.json({
          voteID: (existingVote as any).voteID,
          voteType: voteType,
          reviewID: reviewId,
          voterUserID: voterUserID,
          updated: true
        });
      }
    } else {
      // Crea un nuovo voto
      const newVote = await Vote.create({
        voteType,
        voterUserID,
        reviewID: reviewId
      });

      return res.status(201).json({
        voteID: (newVote as any).voteID,
        voteType: (newVote as any).voteType,
        reviewID: reviewId,
        voterUserID: voterUserID,
        created: true
      });
    }
  } catch (error) {
    console.error('Errore durante la gestione del voto:', error);
    res.status(500).json({ message: 'Errore durante la gestione del voto', error });
  }
});

/* 
 * DELETE /api/votes/review/:reviewId
 * Rimuove il voto dell'utente corrente da una recensione specifica
 */
router.delete('/review/:reviewId', authenticateToken, async (req, res) => {
  const { reviewId } = req.params;
  const voterUserID = (req as any).user.userId;

  try {
    const vote = await Vote.findOne({
      where: {
        reviewID: reviewId,
        voterUserID: voterUserID
      }
    });

    if (!vote) {
      return res.status(404).json({ message: 'Voto non trovato' });
    }

    await vote.destroy();
    res.json({ message: 'Voto rimosso con successo' });
  } catch (error) {
    console.error('Errore durante la rimozione del voto:', error);
    res.status(500).json({ message: 'Errore durante la rimozione del voto', error });
  }
});

/* 
 * GET /api/votes/review/:reviewId/user
 * Ottiene il voto corrente dell'utente per una recensione specifica
 * Restituisce 404 se l'utente non ha votato
 */
router.get('/review/:reviewId/user', authenticateToken, async (req, res) => {
  const { reviewId } = req.params;
  const voterUserID = (req as any).user.userId;

  try {
    const vote = await Vote.findOne({
      where: {
        reviewID: reviewId,
        voterUserID: voterUserID
      }
    });

    if (!vote) {
      return res.status(404).json({ message: 'Nessun voto trovato' });
    }

    res.json({
      voteID: (vote as any).voteID,
      voteType: (vote as any).voteType,
      reviewID: reviewId,
      voterUserID: voterUserID
    });
  } catch (error) {
    console.error('Errore durante il recupero del voto:', error);
    res.status(500).json({ message: 'Errore durante il recupero del voto', error });
  }
});

/* 
 * GET /api/votes/review/:reviewId
 * Ottiene tutti i voti per una recensione specifica
 */
router.get('/review/:reviewId', async (req, res) => {
  const { reviewId } = req.params;

  try {
    const votes = await Vote.findAll({
      where: { reviewID: reviewId }
    });

    const mappedVotes = votes.map((vote: any) => ({
      voteID: vote.voteID,
      voteType: vote.voteType,
      reviewID: vote.reviewID,
      voterUserID: vote.voterUserID,
      createdAt: vote.createdAt
    }));

    res.json(mappedVotes);
  } catch (error) {
    console.error('Errore durante il recupero dei voti:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei voti', error });
  }
});

/* 
 * GET /api/votes/user
 * Ottiene tutti i voti effettuati dall'utente corrente
 */
router.get('/user', authenticateToken, async (req, res) => {
  const voterUserID = (req as any).user.userId;

  try {
    const votes = await Vote.findAll({
      where: { voterUserID: voterUserID }
    });

    const mappedVotes = votes.map((vote: any) => ({
      voteID: vote.voteID,
      voteType: vote.voteType,
      reviewID: vote.reviewID,
      voterUserID: vote.voterUserID,
      createdAt: vote.createdAt
    }));

    res.json(mappedVotes);
  } catch (error) {
    console.error('Errore durante il recupero dei voti utente:', error);
    res.status(500).json({ message: 'Errore durante il recupero dei voti utente', error });
  }
});

export default router;
