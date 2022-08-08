// External modules
require('newrelic');
const express = require('express');
const port = 3000;
const path = require('path');
// Instance modules
const app = express();
app.use(express.json());
// Internal Modules
// const {getReviews, getMetadata, postReview, helpVote, reviewResponse} = require('./db.js');
const {getReviews, getMetadata, postReview, helpVote, reviewResponse} = require('./pool.js');
// Route Handlers
app.use(express.static('dist'));

// Loader.io endpoint
app.get('/loaderio-9d595e86394bec21ab7d0b6965cffa38', (req, res) => {
  res.send('loaderio-9d595e86394bec21ab7d0b6965cffa38');
});

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
        res.status(200).send({});``
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
  console.log('req.body:', req.body);
  postReview(req.body)
  res.status(200).send('Post received');
});

// PUT helpfulness
app.put('/reviews/helpfulness', (req, res) => {
  console.log('req.body:', req.body);
  helpVote(req.body);
  res.status(200).send('Helpful vote added !')
});

// PUT response
app.put('/reviews/response', (req, res) => {
  console.log('req.body:', req.body);
  reviewResponse(req.body);
  res.status(200).send('response added !')
});

// GET metadata
app.get('/reviews/meta', (req, res) => {
  // console.log(' getMetadata(req.query):',  getMetadata(req.query))
  getMetadata(req.query)
    .then((promise) => {
      if (promise.characteristics) {
        return res.status(200).send(promise);
      } else {
        return res.status(200).send([]);
      }
    })
    .catch((err) => {
      console.log('server.js error:', err);
    });
});

app.listen(port, () => {
  console.log(`Reviews_Database, local host: ${port} running...`);
});

