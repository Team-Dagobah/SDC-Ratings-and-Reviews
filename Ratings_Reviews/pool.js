const { Pool } = require('pg');
const pool = new Pool({
  host: '18.223.169.46',
  user: 'guestsuper',
  password: '*La170292',
  port: 5432,
  database: 'rr',
  connectionTimeOut: 0,
  idleTimeOut: 0
});




pool.connect((error) => {
  if (error) {
    console.log('No connection from postgres!:', error);
  } else {
    console.log('Connected to ec2 postgres from pool...');
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
    reviews = await pool.query(reviewsQueryWithCount)
      .catch((err) => { throw err });
  } else {
    reviews = await pool.query(reviewsQuery)
      .catch((err) => { throw err });
  }
  return reviews;
};

// POST a reviews
const postReview = ({ product_id, rating, summary, recommend, reported, response, body, photos, reviewer_name, reviewer_email, helpfulness, characteristics }) => {
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
  pool.query(queryReviews)
    .catch((err) => { throw err });

  // photos table
  photos.forEach((photo) => {
    pool.query(`insert into photos(id, reviewer_id, url) values (DEFAULT, ${Number(product_id)}, '${photo}')`)
      .catch((err) => { throw err; })
  });

  // "Characteristics" table
  const characteristicsFitQuery = `insert into "Characteristics" (id, product_id, name) values(DEFAULT, ${product_id}, '${characteristics.Fit}') `;
  pool.query(characteristicsFitQuery)
    .catch((err) => { throw err; });

  const characteristicsLengthQuery = `insert into "Characteristics" (id, product_id, name) values(DEFAULT, ${product_id}, '${characteristics.Length}') `;
  pool.query(characteristicsLengthQuery)
    .catch((err) => { throw err; });

  const characteristicsComfortQuery = `insert into "Characteristics" (id, product_id, name) values(DEFAULT, ${product_id}, '${characteristics.Comfort}')`;
  pool.query(characteristicsComfortQuery)
    .catch((err) => { throw err; });

  const characteristicsQualityQuery = `insert into "Characteristics" (id, product_id, name) values(DEFAULT, ${product_id}, '${characteristics.Quality}')`;
  pool.query(characteristicsQualityQuery)
    .catch((err) => { throw err; });

  // characteristics_reviews table
  const characteristics_reviewsFitQuery = `insert into characteristics_reviews (id, characteristic_id, review_id, value) values (Default, ${product_id}, ${characteristics.Fit.id}, ${characteristics.Fit.value})`;

  pool.query(characteristics_reviewsFitQuery)
    .catch((err) => { throw err; });

  const characteristics_reviewsLengthQuery = `insert into characteristics_reviews (id, characteristic_id, review_id, value) values (Default, ${product_id}, ${characteristics.Length.id}, ${characteristics.Length.value})`;

  pool.query(characteristics_reviewsLengthQuery)
    .catch((err) => { throw err; });

  const characteristics_reviewsComfortQuery = `insert into characteristics_reviews (id, characteristic_id, review_id, value) values (Default, ${product_id}, ${characteristics.Comfort.id}, ${characteristics.Comfort.value})`;

  pool.query(characteristics_reviewsComfortQuery)
    .catch((err) => { throw err; });

  const characteristics_reviewsQualityQuery = `insert into characteristics_reviews (id, characteristic_id, review_id, value) values (Default, ${product_id}, ${characteristics.Quality.id}, ${characteristics.Quality.value})`;

  pool.query(characteristics_reviewsQualityQuery)
    .catch((err) => { throw err; });
};

// PUT helpful
const helpVote = ({ product_id, helpfulness, reviewer_name }) => {
  const query = `update "Reviews" set helpfulness = helpfulness + ${helpfulness} where product_id =${product_id}'`;
  pool.query(query)
    .catch((err) => { console.log('PUT helpfulness error:', err) });
};

// PUT repsonse
const reviewResponse = ({ product_id, response }) => {
  console.log('product_id, response:', product_id, response)
  pool.query(`update "Reviews" set response ='${response}' where product_id=${product_id}`)
    .catch((err) => { console.log('PUT helpfulness error:', err) });
}

// GET metadata
const getMetadata = ({ product_id }) => {
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
    'Fit',(select json_build_object('id', c.id, 'value', 'average') from "Characteristics" c
       where product_id=${product_id} and name='Fit' limit 1),
    'Length',(select json_build_object('id', c.id, 'value', 'average') from "Characteristics" c
       where product_id=${product_id} and name='Length' limit 1),
    'Comfort',(select json_build_object('id', c.id, 'value', 'average') from "Characteristics" c
       where product_id=${product_id} and name='Comfort' limit 1),
    'Quality',(select json_build_object('id', c.id, 'value', 'average') from "Characteristics" c
       where product_id=${product_id} and name='Quality' limit 1)
    )
  as characteristics
  from "Characteristics" where product_id=${product_id} limit 1)
    )
  from "Reviews"
  where product_id=${product_id} limit 1;
  `;

  var characteristics =
    pool.query(metaQuery)
      .catch((err) => { console.log('reviews/meta error:', err) })
      .then((characteristics) => {
        if (characteristics.rows.length) {
        var FitID;
        var LengthID;
        var ComfortID;
        var QualityID;
        var fitquery;
        var lengthquery;
        var ComfortQuery;
        var Qualityquery;
        if (characteristics.rows[0].json_build_object.characteristics.Fit) {
          FitID = characteristics.rows[0].json_build_object.characteristics.Fit.id;
          const FitAVGQuery = `select  avg(value) from characteristics_reviews where characteristic_id=${FitID}`;
          fitquery = pool.query(FitAVGQuery)
            .then((value) => {
              console.log('FIT id:', value.rows[0].avg);
              const FitValue = value.rows[0].avg;
              characteristics.rows[0].json_build_object.characteristics.Fit.value = FitValue;
              return characteristics;
            })
        } else {
          fitquery = 1;
        }
        if (characteristics.rows[0].json_build_object.characteristics.Length) {
          LengthID = characteristics.rows[0].json_build_object.characteristics.Length.id;
          const LengthAVGQuery = `select avg(value) from characteristics_reviews where characteristic_id=${LengthID}`;
          lengthquery = pool.query(LengthAVGQuery)
            .then((value) => {
              console.log('LENGTH id:', value.rows[0].avg);
              const LengthValue = value.rows[0].avg;
              characteristics.rows[0].json_build_object.characteristics.Length.value = LengthValue;
            });
        } else {
          lengthquery = 1;
        }
        if (characteristics.rows[0].json_build_object.characteristics.Comfort) {
          ComfortID = characteristics.rows[0].json_build_object.characteristics.Comfort.id;
          const ComfortAVGQuery = `select  avg(value) from characteristics_reviews where characteristic_id=${ComfortID}`;
          ComfortQuery = pool.query(ComfortAVGQuery)
            .then((value) => {
              console.log('COMFORT id:', value.rows[0].avg);
              const ComfortValue = value.rows[0].avg;
              characteristics.rows[0].json_build_object.characteristics.Comfort.value = ComfortValue;
            });
        } else {
          ComfortQuery = 1;
        }
        if (characteristics.rows[0].json_build_object.characteristics.Quality) {
          QualityID = characteristics.rows[0].json_build_object.characteristics.Quality.id;
          const QualityAVGQuery = `select  avg(value) from characteristics_reviews where characteristic_id=${QualityID}`;
          Qualityquery = pool.query(QualityAVGQuery)
            .then((value) => {
              console.log('QUALITY id:', value.rows[0].avg);
              const QualityValue = value.rows[0].avg;
              characteristics.rows[0].json_build_object.characteristics.Quality.value = QualityValue;
            })
        } else {
          Qualityquery = 1;
        }

        const promises = [fitquery, lengthquery, ComfortQuery, Qualityquery]
        var fulfilledpromise = Promise.all(promises)
          .then((results) => {
            console.log('return DATA /meta', characteristics.rows[0].json_build_object);
            return characteristics.rows[0].json_build_object;
          })
        return fulfilledpromise;
        } else {
          return characteristics;
        }
      })

  return characteristics;
}

module.exports = { getReviews, getMetadata, postReview, helpVote, reviewResponse };


