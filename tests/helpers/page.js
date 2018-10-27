const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page, browser);

    return new Proxy(customPage, {
      get: (target, prop) => customPage[prop] || browser[prop] || page[prop]
    });
  }

  constructor(page, browser) {
    this.page = page;
    this.browser = browser;
  }

  async login() {
    const user = await userFactory();
    const { sig, session } = sessionFactory(user);

    await this.setCookie({ name: 'session', value: session });
    await this.setCookie({ name: 'session.sig', value: sig });
    await this.goto('http://localhost:3000/blogs');
  }

  getElContent(path) {
    return this.$eval(path, el => el.innerHTML);
  }
}

module.exports = CustomPage;
