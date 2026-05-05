const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.text({ type: 'text/html', limit: '10mb' }));

app.post('/generuj-pdf', async (req, res) => {
  if (!req.body) {
    return res.status(400).send('Brak kodu HTML w zapytaniu.');
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    const page = await browser.newPage();
    await page.setContent(req.body, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true 
    });
    
    res.contentType('application/pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Błąd generatora:', error);
    res.status(500).send('Wystąpił błąd serwera podczas generowania PDF.');
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(port, () => console.log(`Serwer API działa na porcie ${port}`));
