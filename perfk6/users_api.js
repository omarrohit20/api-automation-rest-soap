import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: [
    'p(95)<800'
    ]
  }
};

export default function () {
  const url = 'https://api.example.com/users';
  const headers = {
  "Content-Type": "application/json"
};
  const payload = "{";
  const params = { headers };
  const res = http.request('POST', url, payload, params);

  check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 800ms': (r) => r.timings.duration < 800
  });
  sleep(1);
}