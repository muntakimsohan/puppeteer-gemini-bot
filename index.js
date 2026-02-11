const express = require('express');
const puppeteer = require('puppeteer-core'); // puppeteer-core ব্যবহার করছি, কারণ Chrome আলাদা ইনস্টল হবে
const app = express();
app.use(express.json());

app.post('/generate', async (req, res) => {
  const prompt = req.body.prompt || 'test prompt from n8n';
  
  try {
    // Chrome এর path Render.com-এর container-এ যেখানে ইনস্টল হয়
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions'
      ],
      executablePath: '/usr/bin/google-chrome-stable' // Render-এর container-এ এই path-এ Chrome থাকে
    });

    const page = await browser.newPage();
    
    // Gemini পেজ খোলা
    await page.goto('https://gemini.google.com/app', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // টেক্সট বক্সের জন্য অপেক্ষা
    await page.waitForSelector('textarea', { timeout: 60000, visible: true });
    await page.focus('textarea');

    // প্রম্পট টাইপ করা
    await page.keyboard.type(prompt + '\n\ncute premium clipart, valentine theme, watercolor kawaii style, isolated subject, transparent background, high resolution PNG, no text, no watermark');
    
    // Enter চাপা (Generate-এর জন্য)
    await page.keyboard.press('Enter');

    // ইমেজ লোড হওয়া পর্যন্ত অপেক্ষা
    await page.waitForSelector('img', { timeout: 120000 });

    // ইমেজ URL নেওয়া
    const imgSrc = await page.evaluate(() => {
      const img = document.querySelector('img');
      return img ? img.src : null;
    });

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
