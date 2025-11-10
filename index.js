const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise'); 
const app = express();
const port = 3000;


const pool = mysql.createPool({
    host: '127.0.0.1',      
    user: 'root',           
    password: 'Tahu13bulat11', 
    database: 'apikey',
    port : 3308,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.post('/create', async (req, res) => {
    
    let connection; 
    
    try {
        const username = req.body.username || 'Anonim'; 
        const randomBytes = crypto.randomBytes(32);
        const rawToken = randomBytes.toString('base64url'); 
        const finalApiKey = `mh_${rawToken}`;
        
        console.log(`[SERVER] Menyimpan API Key untuk ${username}...`);
        
        connection = await pool.getConnection(); 
        
        const sql = "INSERT INTO api_keys (username, api_key) VALUES (?, ?)";
        
        await connection.execute(sql, [username, finalApiKey]);
        
        console.log(`[SERVER] API Key baru dibuat dan disimpan untuk ${username}: ${finalApiKey}`);

        res.status(201).json({ 
            success: true,
            apiKey: finalApiKey,
            message: 'API Key berhasil dibuat dan disimpan.' 
        });
        
    } catch (error) {
        console.error('Error saat membuat atau menyimpan API Key:', error);
        
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server saat memproses kunci.' 
        });
    } finally {
        if (connection) {
            connection.release();
            console.log("[SERVER] Koneksi dilepaskan.");
        }
    }
});

async function startServer() {
    try {
        const connectionTest = await pool.getConnection();
        console.log('Koneksi ke database MySQL berhasil.');
        connectionTest.release();
        
        app.listen(port, () => {
            console.log(`Server berjalan di http://localhost:${port}`); 
        });
    } catch (error) {
        console.error('Gagal terhubung ke database:', error.message);
        process.exit(1); 
    }
}
startServer();