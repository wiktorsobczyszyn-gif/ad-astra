const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

// TO JEST KLUCZOWE: Serwer musi umieć przyjąć surowy tekst HTML
app.use(express.text({ type: 'text/html', limit: '10mb' }));

app.post('/generuj-pdf', async (req, res) => {
    let browser;
    try {
        const htmlContent = req.body; // Tutaj trafia Twój kod z PHP

        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--no-zygote']
        });
        
        const page = await browser.newPage();
        
        // Ustawiamy treść jako HTML, a nie jako tekst
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        res.contentType("application/pdf");
        res.send(pdf);
    } catch (e) {
        res.status(500).send("Błąd generatora: " + e.message);
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Serwer API działa na porcie ${PORT}`));
