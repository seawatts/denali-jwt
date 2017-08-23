import test from 'ava';
import { appAcceptanceTest } from 'denali';
import { sign } from 'jsonwebtoken';

appAcceptanceTest(test);

function createJwt(object: any, secret: string = '123') {
  return sign(object, secret);
}

test.skip('GET /posts > without jwt returns 401', async (t) => {
  let result = await t.context.app.get('/posts');
  t.is(result.status, 401);
});

test('GET /posts > with jwt returns 200', async (t) => {
  let jwt = {};
  t.context.app.setHeader('authorization', `Bearer ${createJwt(jwt)}`)
  let result = await t.context.app.get('/posts');
  let result2 = await t.context.app.get('/posts');
  t.is(result.status, 200);
  t.is(result2.status, 200);
});

test.skip('GET /posts > with a bad jwt returns 401', async (t) => {
  let jwt = {};
  t.context.app.setHeader('authorization', `123`);
  let result = await t.context.app.get('/posts');
  t.is(result.status, 401);
});
