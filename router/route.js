const express = require('express');

const stocksController = require('../controllers/stocksController');

const router = express.Router();

router.get('/test', (req, res) => {
    res.send('Route Working');
});

//Add New Stocks
router.post('/api/addstocks',stocksController.addStock)

//Get Existing Stocks
router.get('/api/getstocks',stocksController.getStocks)

//Edit Existing Stocks
router.put('/api/editstocks/:id',stocksController.editStock)

//Edit Purchased Stocks
router.put("/api/purchased/:id",stocksController.purchaseStock);

//Delete Existing Stocks
router.delete('/api/deletestocks/:id',stocksController.deleteStock)

//Get History
router.get('/api/gethistory',stocksController.getHistory)

//Get All History
router.get('/api/getallhistory',stocksController.getAllHistory)

module.exports = router;