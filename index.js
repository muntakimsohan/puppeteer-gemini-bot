const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();
app.use(express.json());

app.post('/generate', async (req, res) => {
  const prompt = req.body.prompt || 'test prompt from n8n';

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-accelerated-2d-canvas'
      ],
      executablePath: '/usr/bin/google-chrome-stable', // Fly.io-তে এই path-এ Chrome থাকে
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.goto('https://gemini.google.com/app', { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForSelector('textarea', { timeout: 60000 });
    await page.focus('textarea');
    await page.keyboard.type(prompt + '\n\ncute premium clipart, valentine theme, watercolor kawaii style, isolated subject, transparent background, high resolution PNG, no text, no watermark');
    await page.keyboard.press('Enter');
    await page.waitForSelector('img', { timeout: 180000 });
    const imgSrc = await page.evaluate(() => document.querySelector('img')?.src || null);
    await browser.close();

    if (imgSrc) {
      res.json({ image: imgSrc });
    } else {
      res.status(500).json({ error: 'No image found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
