import * as test from 'ava';
import { appAcceptanceTest } from 'denali';

appAcceptanceTest(test);

test('GET /posts > should list posts', async (t) => {
  let result = await t.context.app.get('/posts');

  t.is(result.status, 200);
  // t.is(result.body.foo, 'bar');
});
