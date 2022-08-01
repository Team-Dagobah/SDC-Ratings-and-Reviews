// External modules
const express = require('express');
const port = 3000;

// Instance modules
const app = express();
app.use(express.json());
// Internal Modules
const {getReviews, getMetadata} = require('./db.js');
console.log('getReviews():', getReviews());
// Route Handlers
app.use(express.static('dist'));

// GET reviews
app.get('/reviews', (req, res) =>{
  console.log('req.query:', req.query);
  const product_id = req.query.product_id;
  const count = req.query.count;
  getReviews(product_id, count)
    .then((reviews) => {
      var revData = {
        product: product_id,
        page: null,
        count: reviews.rows[0].json_agg.length,
        results: reviews.rows[0].json_agg
      }
      res.status(200).send(revData);
    })
    .catch((err) => {
      console.log('error:', err);
    });
});

// GET metadata
app.get('/reviews/meta', (req, res) => {
  getMetadata(req.query)
    .then((characteristics) => {
      console.log('GET for /review/meta recieved!:', characteristics.rows);
      res.status(200).send(characteristics.rows);
    })
    .catch((err) => {
      console.log('error:', err);
    });
});

app.listen(port, () => {
  console.log(`Reviews_Database, local host: ${port} running...`);
});