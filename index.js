const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
// Render domyślnie używa portu 10000, ale process.env.PORT jest bezpieczniejszy
const PORT = process.env.PORT || 10000;

// Konfiguracja do odbierania surowego kodu HTML z PHP
app.use(express.text({ type: 'text/html', limit: '10mb' }));

app.post('/generuj-pdf', async (req, res) => {
    const htmlContent = req.body;

    if (!htmlContent || htmlContent.trim() === '') {
        return res.status(400).send('Brak kodu HTML w zapytaniu.');
    }

    let browser;
    try {
        // Uruchomienie przeglądarki z flagami oszczędzającymi RAM (ważne na Render!)
        browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-zygote',
                '--single-process'
            ]
        });

        const page = await browser.newPage();

        // Kluczowe: traktujemy wejście jako HTML
        await page.setContent(htmlContent, { 
            waitUntil: 'networkidle0' 
        });

        // Generowanie PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        // Wysłanie gotowego pliku do PHP
        res.contentType('application/pdf');
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Błąd generatora:', error);
        res.status(500).send('Błąd serwera podczas generowania PDF: ' + error.message);
    } finally {
        // Zawsze zamykamy przeglądarkę, żeby nie zapchać RAMu
        if (browser) {
            await browser.close();
        }
    }
});

// Strona główna (żeby nie było "Cannot GET /")
app.get('/', (req, res) => {
    res.send('Generator PDF Ad Astra działa! Czekam na zapytania POST.');
});

app.listen(PORT, () => {
    console.log(`Serwer API działa na porcie ${PORT}`);
});
