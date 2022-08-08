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
  const defaultQuery = `SELECT * FROM "Reviews" where produc_id=${product_id}`;

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
const postReview = ({product_id, rating, summary, recommend, reported, response, body, photos, reviewer_name, reviewer_email, helpfulness, characteristics}) => {
  // convert strings to bools
  if (recommend === 'true') {
    recommend = true;
  } else {
    recommend = false;
  }
  if (reported === 'true') {
    reported = true;
  } else {
    reported = false;
  }
  const date = Date.now().toString();
  const queryReviews = `
  insert into "Reviews" (id, product_id, rating, summary, recommend, reported, response, body, date, reviewer_name, reviewer_email, helpfulness)
  values(DEFAULT, ${Number(product_id)}, ${Number(rating)}, '${summary}', ${recommend}, ${reported}, '${response}', '${body}', ${date}, '${reviewer_name}', '${reviewer_email}', ${Number(helpfulness)});
  `;

  // "Reviews" table
  client.query(queryReviews)
    .catch((err) => {throw err});

  // photos table
  photos.forEach((photo) => {
    client.query(`insert into photos(id, reviewer_id, url) values (DEFAULT, ${Number(product_id)}, '${photo}')`)
      .catch((err) => {throw err;})
  });

  // "Characteristics" table
  const characteristicsFitQuery = `insert into "Characteristics" (id, product_id, name) values(DEFAULT, ${product_id}, '${characteristics.Fit}') `;
  client.query(characteristicsFitQuery)
    .catch((err) => {throw err;});

  const characteristicsLengthQuery = `insert into "Characteristics" (id, product_id, name) values(DEFAULT, ${product_id}, '${characteristics.Length}') `;
  client.query(characteristicsLengthQuery)
    .catch((err) => {throw err;});

  const characteristicsComfortQuery = `insert into "Characteristics" (id, product_id, name)     values(DEFAULT, ${product_id}, '${characteristics.Comfort}')`;
  client.query(characteristicsComfortQuery)
    .catch((err) => {throw err;});

 const characteristicsQualityQuery = `insert into "Characteristics" (id, product_id, name)     values(DEFAULT, ${product_id}, '${characteristics.Quality}')`;
  client.query(characteristicsQualityQuery)
    .catch((err) => {throw err;});

  // characteristics_reviews table
  const characteristics_reviewsFitQuery = `insert into characteristics_reviews (id, characteristic_id, review_id, value) values (Default, ${product_id}, ${characteristics.Fit.id}, ${characteristics.Fit.value})`;

  client.query(characteristics_reviewsFitQuery)
    .catch((err) => {throw err;});

  const characteristics_reviewsLengthQuery = `insert into characteristics_reviews (id, characteristic_id, review_id, value) values (Default, ${product_id}, ${characteristics.Length.id}, ${characteristics.Length.value})`;

  client.query(characteristics_reviewsLengthQuery)
    .catch((err) => {throw err;});

  const characteristics_reviewsComfortQuery = `insert into characteristics_reviews (id, characteristic_id, review_id, value) values (Default, ${product_id}, ${characteristics.Comfort.id}, ${characteristics.Comfort.value})`;

  client.query(characteristics_reviewsComfortQuery)
    .catch((err) => {throw err;});

  const characteristics_reviewsQualityQuery = `insert into characteristics_reviews (id, characteristic_id, review_id, value) values (Default, ${product_id}, ${characteristics.Quality.id}, ${characteristics.Quality.value})`;

  client.query(characteristics_reviewsQualityQuery)
    .catch((err) => {throw err;});
};

// PUT helpful
const helpVote = ({product_id, helpfulness, reviewer_name}) => {
const query = `update "Reviews" set helpfulness = helpfulness + ${helpfulness} where product_id =${product_id}'`;
  client.query(query)
    .catch((err) => {console.log('PUT helpfulness error:', err)});
};

// PUT repsonse
const reviewResponse = ({product_id, response}) => {
  console.log('product_id, response:', product_id, response)
  client.query(`update "Reviews" set response ='${response}' where product_id=${product_id}`)
    .catch((err) => {console.log('PUT helpfulness error:', err)});
}

// GET metadata
const getMetadata = ({product_id}) => {
  // console.log('product_id:', product_id);
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
  var characteristics = client.query(metaQuery)
                          .catch((err) => {console.log('reviews/meta error:', err)});
  return characteristics;
}

module.exports = {getReviews, getMetadata, postReview, helpVote, reviewResponse};

