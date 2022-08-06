import http from 'k6/http';
import {sleep, check} from 'k6';
import {Counter} from 'k6/metrics';

export const requests = new Counter('http_reqs');

const end = Math.ceil(6000000);
const pivot = Math.floor(2000000);
const product_id = Math.floor(Math.random() * (end - pivot) + pivot);
const url = `http://localhost:3000/reviews/meta/?product_id=${product_id}`;

export const options = {
  stages: [
    {duration: '10s', target: 1000},
  ]
}

export default function () {
 const res = http.get(url);
  sleep(1);
  check(res, {
    'is status 200': r => r.status === 200,
    'transaction time < 200ms': r => r.timings.duration < 200,
    'transaction time < 500ms': r => r.timings.duration < 500,
    'transaction time < 1000ms': r => r.timings.duration < 1000,
    'transaction time < 2000ms': r => r.timings.duration < 2000,
  });
}