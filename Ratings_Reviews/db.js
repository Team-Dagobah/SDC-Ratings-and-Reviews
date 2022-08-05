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

  const reviewsQueryWithCount = `
  select
  json_agg(newtable.results)
  from
  (select json_build_object(
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
    ) results
  from "Reviews" r
  left join (select reviewer_id, json_agg(url) photo from photos ph group by reviewer_id) ph on r.id = ph.reviewer_id
  where product_id=${product_id}limit ${count})newtable
  `;

  const reviewsQuery = `
  select
  json_agg(newtable.results)
  from
  (select json_build_object(
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
    ) results
  from "Reviews" r
  left join (select reviewer_id, json_agg(url) photo from photos ph group by reviewer_id) ph on r.id = ph.reviewer_id
  where product_id=${product_id})newtable
  `;

//  select json_agg(reviewer_name) from ( select reviewer_name from "Reviews" limit 5) r;
  const defaultQuery = `SELECT product_id FROM "Reviews" LIMIT 1`;

  if (count) {
    reviews = await client.query(reviewsQueryWithCount)
                .catch((err) => {throw err});
  } else {
    reviews = await client.query(reviewsQuery)
                .catch((err) => {throw err});
  }
  return reviews;
};

// POST a reviews
const postReview = ({review_id, rating, summary, recommend, response, body, photos}) => {
  console.log('POST a review!', review_id, rating, summary, recommend, response, body, photos);
  const date = new Date();
  const queryReviews = `
  insert into "Reviews" (product_id, rating, summary, recommend, response, body, date)
  values(${review_id}, ${rating}, ${summary}, ${recommend}, ${response}, ${body}, ${date});
  `;

  // const QueryPhotos;

  // const queryChar;
  // client.query(query);
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

module.exports = {getReviews, getMetadata, postReview};

