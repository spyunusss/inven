const express = require('express');
const mysql = require('mysql');
const app = express();
app.use(express.json());
app.use(express.static('public'));  // Untuk file HTML/CSS/JS

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123',  // Ganti dengan password Anda
    database: 'inventory_db'
});
db.connect();

app.get('/api/barang', (req, res) => {
    db.query('SELECT * FROM barang', (err, results) => res.json(results));
});
app.post('/api/barang', (req, res) => {
    const { nama, kategori, stok, harga } = req.body;
    db.query('INSERT INTO barang (nama, kategori, stok, harga) VALUES (?, ?, ?, ?)', [nama, kategori, stok, harga], () => res.json({ success: true }));
});
// Tambah endpoint lain untuk kategori, masuk, dll. (mirip)

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

app.get('/api/kategori', (req, res) => {
    db.query('SELECT * FROM kategori', (err, results) => res.json(results));
});
app.post('/api/kategori', (req, res) => {
    const { nama } = req.body;
    db.query('INSERT INTO kategori (nama) VALUES (?)', [nama], () => res.json({ success: true }));
});
// Tambah untuk masuk, keluar, supplier, users