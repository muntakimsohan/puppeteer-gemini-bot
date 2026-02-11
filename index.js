const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();
app.use(express.json());

app.post('/generate', async (req, res) => {
  const prompt = req.body.prompt || 'test prompt from n8n';

  try {
    // Render.com-এ Chrome এর path (Dockerfile দিয়ে ইনস্টল করা হলে এখানে থাকে)
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
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      // Render.com-এর container-এ Chrome এই path-এ থাকে
      executablePath: '/usr/bin/google-chrome-stable',
      // pipe ব্যবহার করলে memory কম লাগে
      pipe: true,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    // User-Agent সেট করো যাতে bot detect না করে
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36');

    // Gemini পেজ খোলা
    await page.goto('https://gemini.google.com/app', {
      waitUntil: 'networkidle2',
      timeout: 90000
    });

    // টেক্সট বক্সের জন্য অপেক্ষা + ফোকাস
    await page.waitForSelector('textarea', { timeout: 60000, visible: true });
    await page.focus('textarea');

    // প্রম্পট পেস্ট করা
    await page.evaluate((p) => {
      const textarea = document.querySelector('textarea');
      textarea.value = p;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }, prompt + '\n\ncute premium clipart, valentine theme, watercolor kawaii style, isolated subject, transparent background, high resolution PNG, no text, no watermark');

    // Enter চাপা (Generate)
    await page.keyboard.press('Enter');

    // ইমেজ লোড হওয়া পর্যন্ত অপেক্ষা (অনেক সময় লাগতে পারে)
    await page.waitForSelector('img', { timeout: 180000 });

    // ইমেজ URL নেওয়া
    const imgSrc = await page.evaluate(() => {
      const img = document.querySelector('img[src^="data:"]') || document.querySelector('img');
      return img ? img.src : null;
    });

    await browser.close();

    if (imgSrc) {
      res.json({ image: imgSrc });
    } else {
      res.status(500).json({ error: 'No image found after generation' });
    }
  } catch (error) {
    console.error('Error in /generate:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
