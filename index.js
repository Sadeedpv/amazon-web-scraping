const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const cron = require("cron");
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCONT_SID;
const authToken = process.env.TWILIO_ACCOUNT_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

const url =
  "https://www.amazon.in/Apple-MacBook-Chip-13-inch-256GB/dp/B08N5XSG8Z/ref=sr_1_2?adgrpid=57685831183&ext_vrnc=hi&hvadid=590769294601&hvdev=c&hvlocphy=9040214&hvnetw=g&hvqmt=b&hvrand=11187149164093783458&hvtargid=kwd-298763413803&hydadcr=26945_2637174&keywords=mac%2Bbook%2Blaptop&qid=1690398587&sr=8-2&th=1";

const main = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url);

  // Cron job for every 5 minutes
  let job = new cron.CronJob(
    "*/5 * * * *",
    () => {
      checkPrice(page);
    },
    null,
    true,
    null,
    null,
    true
  );
  job.start();
};

const checkPrice = async (page) => {
  await page.reload();
  let html = await page.evaluate(() => document.body.innerHTML);
  let $ = cheerio.load(html);

  // Span element with className a-price-whole represent the cost of the price

  let price = $(".a-price-whole").first().text();
  let currentPrice = convertPrice(price);
  if (currentPrice < 90000) {
    console.log(`BUY RIGHT NOW FOR ${currentPrice}!!!`);
    //   SEND EMAIL NOTIFICATION
    sendNotification(price);
    //   SEND SMS
    sendSMS(price);
  }
};

const convertPrice = (num) => {
  let convertedPrice = Number(num.replace(/[^0-9.-]+/g, ""));
  return convertedPrice;
};

async function sendNotification(price) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "*****@gmail.com",
      pass: "*****",
    },
  });

  let textToSend = "Price dropped to " + price;
  let htmlText = `<a href=\"${url}\">Link</a>`;

  let info = await transporter.sendMail({
    from: '"Price Tracker" <*****@gmail.com>',
    to: "*****@gmail.com",
    subject: "Price dropped to " + price,
    text: textToSend,
    html: htmlText,
  });

  console.log("Message sent: %s", info.messageId);
}

async function sendSMS(price) {
  client.messages
    .create({
      body: "Price dropped to " + price,
      from: process.env.TRIAL_NO,
      to: process.env.PHONE_NUMBER,
    })
    .then((msg) => console.log(msg.sid));
}

main();
