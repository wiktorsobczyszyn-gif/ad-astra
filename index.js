const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.text({ type: 'text/html', limit: '50mb' }));

app.post('/generuj-pdf', async (req, res) => {
    let htmlContent = req.body;

    if (!htmlContent || htmlContent.trim() === '') {
        return res.status(400).send('Brak kodu HTML w zapytaniu.');
    }

    // WAŻNE: Dodajemy "owijkę" HTML, jeśli wysyłasz tylko wewnętrzne tagi (np. z edytora)
    // To wymusza, by Puppeteer poprawnie interpretował style inline
    if (!htmlContent.includes('<html')) {
        htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { margin: 0; padding: 0; font-family: sans-serif; }
            </style>
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>`;
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-zygote',
                '--single-process'
            ]
        });

        // Tworzymy nową "czystą" kartę (incognito context wymusza brak cache)
        const context = await browser.createBrowserContext();
        const page = await context.newPage();

        // 1. Zamiast setContent, ustawiamy przechwytywanie zapytań
        await page.setRequestInterception(true);
        page.once('request', request => {
            request.respond({
                body: htmlContent,
                contentType: 'text/html'
            });
        });

        // 2. Ładujemy sztuczną stronę - to najpewniejszy sposób na renderowanie stylów
        await page.goto('http://localhost', { waitUntil: 'networkidle0' });

        // 3. Wymuszamy, by wszystko się załadowało przed drukiem (grafiki, czcionki)
        await page.evaluateHandle('document.fonts.ready');

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true, // Zapewnia kolory tła
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        res.contentType('application/pdf');
        res.setHeader('Cache-Control', 'no-store'); // Zabezpieczenie przed zachowaniem pliku
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Błąd generatora:', error);
        res.status(500).send('Błąd serwera: ' + error.message);
    } finally {
        if (browser) await browser.close();
    }
});

app.get('/', (req, res) => res.send('System gotowy.'));

app.listen(PORT, () => console.log(`Serwer API działa na porcie ${PORT}`));
