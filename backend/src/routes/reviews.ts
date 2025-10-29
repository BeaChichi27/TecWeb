import { Router } from 'express';
import Review from '../models/review';
import Vote from '../models/vote';
import Restaurant from '../models/restaurant';
import User from '../models/user';
import { authenticateToken } from '../middleware/secure';
import { Sequelize } from 'sequelize';

const router = Router();

/* 
 * POST /api/reviews
 * Crea una nuova recensione per un ristorante (richiede autenticazione)
 */
router.post('/', authenticateToken, async (req, res) => {
    const { content, rating, restaurantId } = req.body;
    const authorUserID = (req as any).user.userId;

    try {
        const restaurant = await Restaurant.findByPk(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Ristorante non trovato!' });
        }
        
        const review = await Review.create({ 
            content, 
            rating,
            restaurantID: restaurantId, 
            authorUserID 
        });
        
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel creare la review', error });
    }
});

/* 
 * GET /api/reviews/restaurant/:restaurantId
 * Ottiene tutte le recensioni di un ristorante con paginazione e ordinamento
 */
router.get('/restaurant/:restaurantId', async (req, res) => {
    const { restaurantId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'votes';
    const offset = (page - 1) * limit;
    
    try {
        // Query per ottenere recensioni con conteggio voti e info utente
        const { count, rows } = await Review.findAndCountAll({
            where: { restaurantID: restaurantId },
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['userID', 'username']
                },
                {
                    model: Vote,
                    as: 'vote',
                    attributes: ['voteType', 'voterUserID']
                }
            ],
            limit,
            offset,
            order: sortBy === 'date' 
                ? [['createdAt', 'DESC']] 
                : [[Sequelize.literal('(SELECT COUNT(*) FROM Votes WHERE Votes.reviewID = Review.reviewID AND Votes.voteType = "upvote") - (SELECT COUNT(*) FROM Votes WHERE Votes.reviewID = Review.reviewID AND Votes.voteType = "downvote")'), 'DESC']],
            distinct: true
        });

        // Mappo i dati per il frontend
        const reviews = rows.map(review => {
            const reviewData = review.toJSON() as any;
            
            // Calcolo upvotes e downvotes
            const upvotes = reviewData.vote?.filter((v: any) => v.voteType === 'upvote').length || 0;
            const downvotes = reviewData.vote?.filter((v: any) => v.voteType === 'downvote').length || 0;
            
            return {
                id: reviewData.reviewID,
                restaurantId: reviewData.restaurantID,
                userId: reviewData.authorUserID,
                username: reviewData.author?.username || 'Utente',
                content: reviewData.content,
                rating: reviewData.rating,
                upvotes,
                downvotes,
                userVote: 0, // Verrà calcolato dal frontend se l'utente è loggato
                createdAt: reviewData.createdAt,
                updatedAt: reviewData.updatedAt
            };
        });

        res.json({ 
            reviews, 
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews', error });
    }
});

/* 
 * DELETE /api/reviews/:id
 * Elimina una recensione (solo l'autore può eliminarla)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const authorUserID = (req as any).user.userId;

    try {
        const review = await Review.findOne({ where: { reviewID: id, authorUserID } });
        if (!review) {
            return res.status(404).json({ message: 'Review not found or user not authorized' });
        }
        await review.destroy();
        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review', error });
    }
});

/* 
 * POST /api/reviews/:id/vote
 * Crea o aggiorna un voto per una recensione (richiede autenticazione)
 */
router.post('/:id/vote', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { voteType } = req.body; 
    const voterUserID = (req as any).user.userId;

    try {
        const review = await Review.findByPk(id);
        if (!review) {
            return res.status(404).json({ message: 'Recensione non trovata' });
        }
        const existingVote = await Vote.findOne({ where: { reviewID: id, voterUserID } });
        if (existingVote) {
            if (existingVote.voteType === voteType) {
                await existingVote.destroy();
                return res.json({ message: 'Voto rimosso' });
            } else {
                existingVote.voteType = voteType;
                await existingVote.save();
                return res.json(existingVote);
            }
        }

        const vote = await Vote.create({ voteType, reviewID: id, voterUserID });
        res.status(201).json(vote);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel caricare il voto', error });
    }
});

/* 
 * GET /api/reviews/:id/votes
 * Ottiene il conteggio dei voti (upvote/downvote) per una recensione specifica
 */
router.get('/:id/votes', async (req, res) => {
    const { id } = req.params;  
    try {
        const voteCounts = await Vote.count({
            where: { reviewID: id },
            group: ['voteType'],
        });

        const upvoteCount = (voteCounts.find((v: any) => v.voteType === 'upvote')?.count || 0) as number;
        const downvoteCount = (voteCounts.find((v: any) => v.voteType === 'downvote')?.count || 0) as number;

        res.json({ reviewID: id, upvoteCount, downvoteCount });
        } catch (error) {
        res.status(500).json({ message: 'Error fetching votes', error });
    }
});

/* 
 * GET /api/reviews/user/:userId
 * Ottiene tutte le recensioni scritte da un utente specifico
 */
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    console.log(`📊 GET /api/reviews/user/${userId} - page: ${page}, limit: ${limit}`);

    try {
        const { count, rows } = await Review.findAndCountAll({
            where: { authorUserID: userId },
            include: [
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['restaurantID', 'name']
                },
                {
                    model: User,
                    as: 'author',
                    attributes: ['userID', 'username']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        const reviews = rows.map((review: any) => ({
            id: review.reviewID,
            content: review.content,
            rating: review.rating,
            restaurantId: review.restaurantID,
            restaurantName: review.restaurant?.name || 'Ristorante sconosciuto',
            authorId: review.authorUserID,
            authorName: review.author?.username || 'Utente sconosciuto',
            createdAt: review.createdAt,
            updatedAt: review.updatedAt
        }));

        console.log(`✅ Trovate ${count} recensioni per utente ${userId}`);

        res.json({
            reviews,
            total: count,
            page,
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('❌ Errore nel recupero delle recensioni utente:', error);
        res.status(500).json({ message: 'Errore nel recuperare le recensioni', error });
    }
});

export default router;
