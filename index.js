const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3000;

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/create', (req, res) => {
    try {
        const username = req.body.username || 'Anonim'; 
        const randomBytes = crypto.randomBytes(32);
        const rawToken = randomBytes.toString('base64url'); 
        const finalApiKey = `mh_${rawToken}`;
        
        console.log(`[SERVER] API Key baru dibuat untuk ${username}: ${finalApiKey}`);

        res.status(201).json({ 
            success: true,
            apiKey: finalApiKey,
            message: 'API Key berhasil dibuat dan siap disalin.'
        });
        
    } catch (error) {
        console.error('Error saat membuat API Key:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server saat membuat API Key.' 
        });
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`); 
});