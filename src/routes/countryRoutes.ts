import express from 'express';

import * as ctrl from '../controllers/countryController';

const router = express.Router();

router.post('/refresh', ctrl.postRefresh);
router.get('/', ctrl.getCountries);
router.get('/image', ctrl.getImage);
router.get('/status', ctrl.getStatus);
router.get('/:name', ctrl.getCountry);
router.delete('/:name', ctrl.deleteCountry);

export default router;
