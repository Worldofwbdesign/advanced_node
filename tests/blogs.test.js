const Page = require('./helpers/page');

let page;

beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

afterEach(async () => {
  await page.close();
});

describe('Logged in', () => {
  beforeEach(async () => {
    await page.login();
    await page.click('a.btn-floating');
  });

  test('Should show add blog form if logged in', async () => {
    const text = await page.getElContent('form label');
    expect(text).toEqual('Blog Title');
  });

  describe('And with valid values', () => {
    beforeEach(async () => {
      await page.type('.title input', 'My title');
      await page.type('.content input', 'My content');
      await page.click('form button');
    });

    test('Should show information for submit', async () => {
      const text = await page.getElContent('h5');
      expect(text).toEqual('Please confirm your entries');
    });

    test('After submit should add blog to index page', async () => {
      await page.click('button.green');
      await page.waitFor('.card');

      const title = await page.getElContent('.card-title');
      const content = await page.getElContent('.card-content p');

      expect(title).toEqual('My title');
      expect(content).toEqual('My content');
    });
  });

  describe('And with invalid values', () => {
    beforeEach(async () => {
      await page.click('form button');
    });

    test('Should show an error messages', async () => {
      const errorText = 'You must provide a value';
      const titleError = await page.getElContent('.title .red-text');
      const contentError = await page.getElContent('.content .red-text');

      expect(titleError).toEqual(errorText);
      expect(contentError).toEqual(errorText);
    });
  });
});

describe('Unlogged', () => {
  test('Should show error after post request', async () => {
    const result = await page.evaluate(() =>
      fetch('/api/blogs', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'My title', content: 'My content' })
      }).then(res => res.json())
    );

    expect(result).toEqual({ error: 'You must log in!' });
  });

  test('Should show error after get request', async () => {
    const result = await page.evaluate(() =>
      fetch('/api/blogs', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
    );

    expect(result).toEqual({ error: 'You must log in!' });
  });
});
