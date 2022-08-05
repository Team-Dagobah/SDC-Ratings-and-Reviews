// External modules
require('newrelic');
const express = require('express');
const port = 3000;
// Instance modules
const app = express();
app.use(express.json());
// Internal Modules
const {getReviews, getMetadata, postReview, helpVote} = require('./db.js');
// Route Handlers
app.use(express.static('dist'));

// GET reviews
app.get('/reviews', (req, res) =>{
  console.log('req.query:', req.query);
  const product_id = req.query.product_id;
  const count = req.query.count;
  var revData;
  getReviews(product_id, count)
    .then((reviews) => {
      console.log('reviews', reviews.rows);
      if (!reviews.rows[0].json_agg) {
        res.status(200).send({});
      } else {
        revData = {
          product: product_id,
          page: null,
          count: reviews.rows[0].json_agg.length,
          results: reviews.rows[0].json_agg
        }
          res.status(200).send(revData);
      }
    })
    .catch((err) => {
      console.log('error:', err);
    });
});

// POST reviews
app.post('/reviews', (req, res) => {
  // console.log('req.body:', req.body);
  postReview(req.body)
  res.status(200).send('Post received');
});

// PUT helpfulness
app.put('/reviews', (req, res) => {
  console.log('req.body:', req.body);
  helpVote(req.body);
  res.status(200).send('Helpful vote added !')
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

