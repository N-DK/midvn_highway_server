const express = require('express');
const router = express.Router();
const api = require('../app/controllers/APIController');

router.get('/check-way', api.getHighways);
router.get('/search', api.search);
router.post('/highways', api.insertHighway);
router.post('/trunks', api.insertTrunk);
router.get('/highways/pull', api.pullHighways);
router.get('/tollboths/pull', api.pullTollBoths);
router.get('/trunks/pull', api.pullTrunks);
router.get('/highways/get-all', api.getAllHighways);
router.get('/trunks/get-all', api.getAllTrunks);
router.get('/tollboths/get-all', api.getAllTollBoths);
router.put('/highways/delete/:id', api.deleteHighway);
router.put('/trunks/delete/:id', api.deleteTrunk);
router.put('/tollboths/delete/:id', api.deleteTollBoth);
router.put('/highways/update/:id', api.updateHighway);
router.put('/trunks/update/:id', api.updateTrunk);
router.put('/highways/restore/:id', api.restoreHighway);
router.put('/trunks/restore/:id', api.restoreTrunk);
router.put('/tollboths/restore/:id', api.restoreTollBoth);
router.get('/load-test', api.loadTest);
router.get('/', api.index);

module.exports = router;
