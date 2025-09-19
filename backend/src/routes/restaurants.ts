import { Router } from 'express';
import Restaurant from '../models/restaurant';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/secure';

const router = Router();

/* Configurazione di multer per l'upload delle immagini */

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

/* Middleware per gestire l'upload delle immagini */

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed.'));
    }
  }
});

/* Endpoint per creare un nuovo ristorante con immagine */

router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, description, latitude, longitude } = req.body;
  const creatorUserID = (req as any).user.userId;

  if (!req.file) {
    return res.status(400).json({ message: 'L\'immagine è obbligatoria e deve essere in formato JPEG o PNG.' });
  }

  const imagePath = req.file.path;

  try {
    const restaurant = await Restaurant.create({ name, description, latitude, longitude, imagePath, creatorUserID });
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Error creating restaurant', error });
  }
});

/* Endpoint per ottenere tutti i ristoranti */

router.get('/', async (req, res) => {
    const { name } = req.query;
    try {
        let restaurants;
        if (name) {
            restaurants = await Restaurant.findAll({ where: { name: name } });
        } else {
            restaurants = await Restaurant.findAll();
        }
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching restaurants', error });
    }
});

/* Endpoint per ottenere un ristorante specifico con descrizione, latitudine, longitudine e percorso immagine */

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const restaurant = await Restaurant.findOne({
            where: { restaurantID: id },
            attributes: ['name', 'description', 'latitude', 'longitude', 'imagePath']
        });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching restaurant', error });
    }
});

/* Endpoint per eliminare un ristorante (solo il creatore può eliminarlo) */

router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const creatorUserID = (req as any).user.userId;

    try {
        const restaurant = await Restaurant.findOne({ where: { restaurantID: id, creatorUserID } });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found or user not authorized' });
        }
        await restaurant.destroy();
        res.json({ message: 'Restaurant deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting restaurant', error });
    }
});

export default router;
