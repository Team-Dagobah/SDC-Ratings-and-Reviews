const {Client} = require('pg');

const client = new Client ({
  host: 'localhost',
  user: 'postgres',
  port: 5432,
  database: 'Ratings and Reviews'
});

client.connect((error) => {
  if (error) {
    console.log('No connection from postgres!:', error);
  } else {
    console.log('Connected to postgres...');
  }
});

// GET reviews
const getReviews = async (product_id, count) => {
  var reviews;
  const queryWithPhotos = `select
  json_agg(
    json_build_object(
      'review_id', r.id,
      'rating', r.rating,
      'summary', r.summary,
      'recommend', r.recommend,
      'response', r.response,
      'body', r.body,
      'date', r.date,
      'reviewer_name',r.reviewer_name,
      'helpfulness', r.helpfulness,
	  'photos', photo
    )
  ) results
  from "Reviews" r
  left join (select reviewer_id, json_agg(url) photo from photos ph group by reviewer_id) ph on r.id = ph.reviewer_id
  where product_id=${product_id}`;

  const defaultQuery = `SELECT product_id FROM "Reviews" LIMIT 1`;

  if (product_id) {
    reviews = await client.query(queryWithPhotos);
  } else {
    reviews = await client.query(defaultQuery);
  }
  return reviews;
};

// GET metadata
const getMetadata = ({product_id}) => {
  console.log('product_id:', product_id);
  const metaQuery = `
  select
  json_build_object(
    'product_id', product_id,
    'ratings', (select json_build_object(
    '2', (select count(rating) from "Reviews" where rating=2 and product_id=${product_id}),
    '3', (select count(rating) from "Reviews" where rating=3 and product_id=${product_id}),
    '4', (select count(rating) from "Reviews" where rating=4 and product_id=${product_id}),
    '5', (select count(rating) from "Reviews" where rating=5 and product_id=${product_id})
    ) as ratings
    from "Reviews" limit 1),
    'recommended', (select
  json_build_object(
    'false', (select count(recommend) from "Reviews" where recommend=false and product_id=${product_id}),
    'true', (select count(recommend) from "Reviews" where recommend=true and product_id=${product_id})
    ) as recommended
    from "Reviews"
    where product_id=${product_id} limit 1),
    'characteristics', (select json_build_object(
    'Fit',(select json_build_object('id', c.id, 'value', average) from "Characteristics" c
    left join (select characteristic_id, avg(value) average from characteristics_reviews cv group by characteristic_id) cv on c.id = cv.characteristic_id
       where product_id=${product_id} and name='Fit' limit 1),
    'Length',(select json_build_object('id', c.id, 'value', average) from "Characteristics" c
    left join (select characteristic_id, avg(value) average from characteristics_reviews cv group by characteristic_id) cv on c.id = cv.characteristic_id
       where product_id=${product_id} and name='Length' limit 1),
    'Comfort',(select json_build_object('id', c.id, 'value', average) from "Characteristics" c
    left join (select characteristic_id, avg(value) average from characteristics_reviews cv group by characteristic_id) cv on c.id = cv.characteristic_id
       where product_id=${product_id} and name='Comfort' limit 1),
    'Quality',(select json_build_object('id', c.id, 'value', average) from "Characteristics" c
    left join (select characteristic_id, avg(value) average from characteristics_reviews cv group by characteristic_id) cv on c.id = cv.characteristic_id
       where product_id=${product_id} and name='Quality' limit 1)
    )
  as characteristics
  from "Characteristics" where product_id=${product_id} limit 1)
    )
  from "Reviews"
  where product_id=${product_id} limit 1;
  `;
  var characteristics = client.query(metaQuery);
  return characteristics;
}

module.exports = {getReviews, getMetadata};

// EXPLAIN ANALYZE