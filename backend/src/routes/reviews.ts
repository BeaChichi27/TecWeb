import { Router } from 'express';
import Review from '../models/review';
import Vote from '../models/vote';
import Restaurant from '../models/restaurant';
import { authenticateToken } from '../middleware/secure';
import { Sequelize } from 'sequelize';

const router = Router();

/* Endpoint per creare una nuova review */

router.post('/', authenticateToken, async (req, res) => {
    const { content, restaurantID } = req.body;
    const authorUserID = (req as any).user.userId;

    try {
        const restaurant = await Restaurant.findByPk(restaurantID);
        if (!restaurant) {
            return res.status(404).json({ message: 'Ristorante non trovato!' });
        }
        const review = await Review.create({ content, restaurantID, authorUserID });
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Errore nel creare la review', error });
    }
});

/* Endpoint per visualizzare le reviews */

router.get('/:restaurantId', async (req, res) => {
    const { restaurantId } = req.params;
    try {
        // include svolge una funzione di join tra le tabelle Review e Vote
        // attributes con include e fn permette di contare i voti positivi e negativi
        // group raggruppa i risultati per reviewID per evitare duplicati
        const reviews = await Review.findAll({
            where: { restaurantID: restaurantId },
            include: [
            {
                model: Vote,
                as: 'vote',
                attributes: []
            }
            ],
            attributes: {
            include: [
                [
                Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN `vote`.`voteType` = \'upvote\' THEN 1 END')),
                'upvoteCount'
                ],
                [
                Sequelize.fn('COUNT', Sequelize.literal('CASE WHEN `vote`.`voteType` = \'downvote\' THEN 1 END')),
                'downvoteCount'
                ]
            ]
            },
            group: ['Review.reviewID']
        });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error });
    }
});

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

/* Endpoint per votare una review (like/dislike) */

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

/* Endpoint per contare i voti */

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

   

export default router;
