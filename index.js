const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise'); // <-- 1. Import mysql2/promise
const app = express();
const port = 3000;

// --- 2. Konfigurasi Koneksi Database ---
// Buat "pool" koneksi. Ini lebih efisien daripada membuat koneksi baru setiap saat.
const pool = mysql.createPool({
    host: '127.0.0.1',      // Ganti jika perlu (seringkali 'localhost')
    user: 'root',           // Ganti dengan username MySQL Anda
    password: 'password_anda', // GANTI DENGAN PASSWORD ANDA
    database: 'apikey_db',  // Nama database dari Langkah 2
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

// --- 3. Update Rute /create ---
// Kita ubah menjadi fungsi 'async' untuk menangani database
app.post('/create', async (req, res) => {
    
    let connection; // Definisikan koneksi di luar try-catch
    
    try {
        const username = req.body.username || 'Anonim'; 
        
        // Buat API Key (logika Anda sudah benar)
        const randomBytes = crypto.randomBytes(32);
        const rawToken = randomBytes.toString('base64url'); 
        const finalApiKey = `mh_${rawToken}`;
        
        // --- 4. Simpan ke Database ---
        console.log(`[SERVER] Menyimpan API Key untuk ${username}...`);
        
        // Ambil koneksi dari pool
        connection = await pool.getConnection(); 
        
        // Siapkan query SQL (gunakan '?' untuk mencegah SQL Injection)
        const sql = "INSERT INTO api_keys (username, api_key) VALUES (?, ?)";
        
        // Jalankan query
        await connection.execute(sql, [username, finalApiKey]);
        
        console.log(`[SERVER] API Key baru dibuat dan disimpan untuk ${username}: ${finalApiKey}`);

        // Kirim respon SUKSES hanya setelah database berhasil
        res.status(201).json({ 
            success: true,
            apiKey: finalApiKey,
            message: 'API Key berhasil dibuat dan disimpan.' // Update pesan
        });
        
    } catch (error) {
        console.error('Error saat membuat atau menyimpan API Key:', error);
        
        // Kirim respon GAGAL
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server saat memproses kunci.' 
        });
    } finally {
        // --- 5. Selalu Lepaskan Koneksi ---
        // Apapun yang terjadi (sukses atau error), kembalikan koneksi ke pool
        if (connection) {
            connection.release();
            console.log("[SERVER] Koneksi dilepaskan.");
        }
    }
});

// --- 6. Update Cara Menjalankan Server ---
// Kita uji koneksi DB dulu sebelum menyalakan server
async function startServer() {
    try {
        // Coba dapatkan satu koneksi untuk tes
        const connectionTest = await pool.getConnection();
        console.log('Koneksi ke database MySQL berhasil.');
        connectionTest.release();
        
        // Jika koneksi berhasil, jalankan server
        app.listen(port, () => {
            console.log(`Server berjalan di http://localhost:${port}`); 
        });
    } catch (error) {
        console.error('Gagal terhubung ke database:', error.message);
        process.exit(1); // Hentikan aplikasi jika tidak bisa konek ke DB
    }
}

// Jalankan fungsi untuk memulai server
startServer();