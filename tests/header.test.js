const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('localhost:3000');
});

afterEach(async () => {
  await page.close();
});

test('Should show correct text in header', async () => {
  const text = await page.$eval('a.brand-logo', el => el.innerHTML);
  expect(text).toEqual('Blogster');
});

test('Should go to google accounts', async () => {
  await page.click('.right a');

  const url = page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test('Should show logout button after login', async () => {
  await page.login();
  const elSelector = 'a[href="/auth/logout"]';
  await page.waitFor(elSelector);

  const text = await page.$eval(elSelector, el => el.innerHTML);
  expect(text).toEqual('Logout');
});
