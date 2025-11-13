// Fungsi format Rupiah
function formatRupiah(angka) {
    let number_string = angka.replace(/[^,\d]/g, '').toString(),
        split = number_string.split(','),
        sisa = split[0].length % 3,
        rupiah = split[0].substr(0, sisa),
        ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
        let separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
    return rupiah;
}

// Data awal kosong, load dari API
let barang = [];
let kategori = [];
let masuk = [];
let keluar = [];
let supplier = [];
let users = [];
let currentUser = null;

// Load data saat halaman load
window.onload = () => {
    loadBarang();
    loadKategori();
    // dll.
};

async function loadBarang() {
    try {
        const response = await fetch('/api/barang');
        barang = await response.json();
        renderBarang();
    } catch (e) {
        console.error('Error loading barang:', e);
    }
}

async function saveBarang(index) {
    const nama = document.getElementById('nama').value;
    const kategori = document.getElementById('kategoriSelect').value;
    const stok = parseInt(document.getElementById('stok').value);
    const harga = parseInt(document.getElementById('harga').value);
    const data = { nama, kategori, stok, harga };
    try {
        await fetch('/api/barang', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        loadBarang();  // Reload data
        closeForm();
    } catch (e) {
        console.error('Error saving barang:', e);
    }
}

// Update fungsi lain serupa (loadKategori, saveKategori, dll.)
async function loadKategori() {
    const response = await fetch('/api/kategori');
    kategori = await response.json();
    renderKategori();
}

// Tambah endpoint di server.js untuk kategori, masuk, dll.

// Login
function login() {
    const role = document.getElementById('loginRole').value;
    const password = document.getElementById('loginPassword').value;
    if (password === '123') {
        currentUser = role;
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'flex';
        showPage('dashboard');
    } else {
        alert('Password salah!');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('mainContainer').style.display = 'none';
    document.getElementById('loginModal').style.display = 'block';
}

// Toggle Theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// Navigasi
function showPage(pageId) {
    if (currentUser === 'Kasir' && !['dashboard', 'keluar', 'laporan'].includes(pageId)) {
        alert('Akses ditolak!');
        return;
    }
    if (currentUser === 'Petugas Gudang' && !['dashboard', 'masuk', 'keluar'].includes(pageId)) {
        alert('Akses ditolak!');
        return;
    }
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'dashboard') updateDashboard();
    if (pageId === 'barang') renderBarang();
    if (pageId === 'kategori') renderKategori();
    if (pageId === 'masuk') renderMasuk();
    if (pageId === 'keluar') renderKeluar();
    if (pageId === 'supplier') renderSupplier();
    if (pageId === 'user') renderUsers();
}

// Dashboard
function updateDashboard() {
    const totalBarang = barang.length;
    const totalStok = barang.reduce((sum, b) => sum + (b.stok || 0), 0);
    const nilaiInventory = barang.reduce((sum, b) => sum + ((b.stok || 0) * (b.harga || 0)), 0);
    document.getElementById('totalBarang').textContent = totalBarang;
    document.getElementById('totalStok').textContent = totalStok;
    document.getElementById('nilaiInventory').textContent = 'Rp ' + nilaiInventory.toLocaleString();
    checkStokAlert();
    renderChart();
}

function checkStokAlert() {
    const alertDiv = document.getElementById('stokAlert');
    const lowStock = barang.some(b => b.stok < 10);
    alertDiv.style.display = lowStock ? 'block' : 'none';
}

function renderChart() {
    const ctx = document.getElementById('stokChart').getContext('2d');
    const kategoriStok = {};
    barang.forEach(b => {
        kategoriStok[b.kategori] = (kategoriStok[b.kategori] || 0) + b.stok;
    });
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(kategoriStok),
            datasets: [{
                label: 'Stok per Kategori',
                data: Object.values(kategoriStok),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        }
    });
}

// Barang
function renderBarang() {
    const tbody = document.querySelector('#barangTable tbody');
    tbody.innerHTML = '';
    barang.forEach((b, i) => {
        tbody.innerHTML += `<tr><td>${b.nama}</td><td>${b.kategori}</td><td>${b.stok}</td><td>Rp ${b.harga.toLocaleString()}</td><td><button onclick="editBarang(${i})">Edit</button><button onclick="deleteBarang(${i})">Hapus</button></td></tr>`;
    });
    const select = document.getElementById('filterKategori');
    select.innerHTML = '<option value="">Semua Kategori</option>' + kategori.map(k => `<option>${k}</option>`).join('');
}

function filterBarang() {
    const query = document.getElementById('searchBarang').value.toLowerCase();
    const kategoriFilter = document.getElementById('filterKategori').value;
    const rows = document.querySelectorAll('#barangTable tbody tr');
    rows.forEach(row => {
        const nama = row.cells[0].textContent.toLowerCase();
        const kat = row.cells[1].textContent;
        row.style.display = (nama.includes(query) && (!kategoriFilter || kat === kategoriFilter)) ? '' : 'none';
    });
}

function showForm(type, index = null) {
    const form = document.getElementById('dynamicForm');
    form.innerHTML = '';
    let data = null;
    if (index !== null) {
        if (type === 'barang') data = barang[index];
        else if (type === 'kategori') data = kategori[index];
        else if (type === 'supplier') data = supplier[index];
        else if (type === 'user') data = users[index];
    }
    if (type === 'barang') {
        form.innerHTML = `
            <h2>${index !== null ? 'Edit' : 'Tambah'} Barang</h2>
            <input type="text" id="nama" placeholder="Nama Barang" value="${data ? data.nama : ''}" required>
            <select id="kategoriSelect">${kategori.map(k => `<option ${data && data.kategori === k ? 'selected' : ''}>${k}</option>`).join('')}</select>
            <input type="number" id="stok" placeholder="Stok" value="${data ? data.stok : ''}" required>
            <input type="text" id="harga" placeholder="Harga" value="${data ? formatRupiah(data.harga.toString()) : ''}" onkeyup="this.value = formatRupiah(this.value)" required>
            <button type="submit">Simpan</button>
        `;
        form.onsubmit = (e) => { e.preventDefault(); saveBarang(index); };
    } else if (type === 'kategori') {
        form.innerHTML = `
            <h2>${index !== null ? 'Edit' : 'Tambah'} Kategori</h2>
            <input type="text" id="kategoriNama" placeholder="Nama Kategori" value="${data || ''}" required>
            <button type="submit">Simpan</button>
        `;
        form.onsubmit = (e) => { e.preventDefault(); saveKategori(index); };
    } else if (type === 'masuk') {
        form.innerHTML = `
            <h2>Catat Barang Masuk</h2>
            <select id="barangSelect">${barang.map((b, i) => `<option value="${i}">${b.nama}</option>`).join('')}</select>
            <input type="number" id="jumlahMasuk" placeholder="Jumlah" required>
            <select id="supplierSelect">${supplier.map((s, i) => `<option value="${i}">${s.nama}</option>`).join('')}</select>
            <input type="date" id="tanggalMasuk" required>
            <button type="submit">Simpan</button>
        `;
        form.onsubmit = (e) => { e.preventDefault(); saveMasuk(); };
    } else if (type === 'keluar') {
        form.innerHTML = `
            <h2>Catat Barang Keluar</h2>
            <select id="barangSelectKeluar">${barang.map((b, i) => `<option value="${i}">${b.nama} (Stok: ${b.stok})</option>`).join('')}</select>
            <input type="number" id="jumlahKeluar" placeholder="Jumlah" required>
            <input type="date" id="tanggalKeluar" required>
            <button type="submit">Simpan</button>
        `;
        form.onsubmit = (e) => { e.preventDefault(); saveKeluar(); };
    } else if (type === 'supplier') {
        form.innerHTML = `
            <h2>${index !== null ? 'Edit' : 'Tambah'} Supplier</h2>
            <input type="text" id="supplierNama" placeholder="Nama Supplier" value="${data ? data.nama : ''}" required>
            <input type="text" id="supplierKontak" placeholder="Kontak" value="${data ? data.kontak : ''}" required>
            <button type="submit">Simpan</button>
        `;
        form.onsubmit = (e) => { e.preventDefault(); saveSupplier(index); };
    } else if (type === 'user') {
        form.innerHTML = `
            <h2>${index !== null ? 'Edit' : 'Tambah'} User</h2>
            <input type="text" id="userNama" placeholder="Nama User" value="${data ? data.nama : ''}" required>
            <select id="userRole">
                <option ${data && data.role === 'Admin' ? 'selected' : ''}>Admin</option>
                <option ${data && data.role === 'Kasir' ? 'selected' : ''}>Kasir</option>
                <option ${data && data.role === 'Petugas Gudang' ? 'selected' : ''}>Petugas Gudang</option>
            </select>
            <button type="submit">Simpan</button>
        `;
        form.onsubmit = (e) => { e.preventDefault(); saveUser(index); };
    }
    document.getElementById('formModal').style.display = 'block';
}

function saveBarang(index) {
    const nama = document.getElementById('nama').value;
    const kategori = document.getElementById('kategoriSelect').value;
    const stok = parseInt(document.getElementById('stok').value);
    const harga = parseInt(document.getElementById('harga').value.replace(/\./g, ''));
    if (index !== null) {
        barang[index] = { nama, kategori, stok, harga };
    } else {
        barang.push({ nama, kategori, stok, harga });
    }
    localStorage.setItem('barang', JSON.stringify(barang));
    renderBarang();
    updateDashboard();
    closeForm();
}

function editBarang(index) {
    showForm('barang', index);
}

function deleteBarang(index) {
    if (confirm('Hapus barang ini?')) {
        barang.splice(index, 1);
        localStorage.setItem('barang', JSON.stringify(barang));
        renderBarang();
        updateDashboard();
    }
}

// Kategori
function renderKategori() {
    const list = document.getElementById('kategoriList');
    list.innerHTML = kategori.map((k, i) => `<li>${k} <button onclick="editKategori(${i})">Edit</button><button onclick="deleteKategori(${i})">Hapus</button></li>`).join('');
}

function filterKategori() {
    const query = document.getElementById('searchKategori').value.toLowerCase();
    const items = document.querySelectorAll('#kategoriList li');
    items.forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

function saveKategori(index) {
    const nama = document.getElementById('kategoriNama').value;
    if (index !== null) {
        kategori[index] = nama;
    } else {
        kategori.push(nama);
    }
    localStorage.setItem('kategori', JSON.stringify(kategori));
    renderKategori();
    closeForm();
}

function editKategori(index) {
    showForm('kategori', index);
}

function deleteKategori(index) {
    if (confirm('Hapus kategori ini?')) {
        kategori.splice(index, 1);
        localStorage.setItem('kategori', JSON.stringify(kategori));
        renderKategori();
    }
}

// Barang Masuk
function renderMasuk() {
    const tbody = document.querySelector('#masukTable tbody');
    tbody.innerHTML = masuk.map(m => `<tr><td>${m.barang}</td><td>${m.jumlah}</td><td>${m.supplier}</td><td>${m.tanggal}</td></tr>`).join('');
}

function saveMasuk() {
    const barangIndex = document.getElementById('barangSelect').value;
    const jumlah = parseInt(document.getElementById('jumlahMasuk').value);
    const supplierIndex = document.getElementById('supplierSelect').value;
    const tanggal = document.getElementById('tanggalMasuk').value;
    if (barang[barangIndex]) {
        barang[barangIndex].stok += jumlah;
        masuk.push({ barang: barang[barangIndex].nama, jumlah, supplier: supplier[supplierIndex].nama, tanggal });
        localStorage.setItem('barang', JSON.stringify(barang));
        localStorage.setItem('masuk', JSON.stringify(masuk));
        renderMasuk();
        updateDashboard();
        closeForm();
    }
}

// Barang Keluar
function renderKeluar() {
    const tbody = document.querySelector('#keluarTable tbody');
    tbody.innerHTML = keluar.map(k => `<tr><td>${k.barang}</td><td>${k.jumlah}</td><td>${k.tanggal}</td></tr>`).join('');
}

function saveKeluar() {
    const barangIndex = document.getElementById('barangSelectKeluar').value;
    const jumlah = parseInt(document.getElementById('jumlahKeluar').value);
    const tanggal = document.getElementById('tanggalKeluar').value;
    if (barang[barangIndex] && barang[barangIndex].stok >= jumlah) {
        barang[barangIndex].stok -= jumlah;
        keluar.push({ barang: barang[barangIndex].nama, jumlah, tanggal });
        localStorage.setItem('barang', JSON.stringify(barang));
        localStorage.setItem('keluar', JSON.stringify(keluar));
        renderKeluar();
        updateDashboard();
        closeForm();
    } else {
        alert('Stok tidak cukup!');
    }
}

// Supplier
function renderSupplier() {
    const tbody = document.querySelector('#supplierTable tbody');
    tbody.innerHTML = supplier.map((s, i) => `<tr><td>${s.nama}</td><td>${s.kontak}</td><td><button onclick="editSupplier(${i})">Edit</button><button onclick="deleteSupplier(${i})">Hapus</button></td></tr>`).join('');
}

function filterSupplier() {
    const query = document.getElementById('searchSupplier').value.toLowerCase();
    const rows = document.querySelectorAll('#supplierTable tbody tr');
    rows.forEach(row => {
        row.style.display = row.cells[0].textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

function saveSupplier(index) {
    const nama = document.getElementById('supplierNama').value;
    const kontak = document.getElementById('supplierKontak').value;
    if (index !== null) {
        supplier[index] = { nama, kontak };
    } else {
        supplier.push({ nama, kontak });
    }
    localStorage.setItem('supplier', JSON.stringify(supplier));
    renderSupplier();
    closeForm();
}

function editSupplier(index) {
    showForm('supplier', index);
}

function deleteSupplier(index) {
    if (confirm('Hapus supplier ini?')) {
        supplier.splice(index, 1);
        localStorage.setItem('supplier', JSON.stringify(supplier));
        renderSupplier();
    }
}

// User
function renderUsers() {
    const tbody = document.querySelector('#userTable tbody');
    tbody.innerHTML = users.map((u, i) => `<tr><td>${u.nama}</td><td>${u.role}</td><td><button onclick="editUser(${i})">Edit</button><button onclick="deleteUser(${i})">Hapus</button></td></tr>`).join('');
}

function filterUser() {
    const query = document.getElementById('searchUser').value.toLowerCase();
    const rows = document.querySelectorAll('#userTable tbody tr');
    rows.forEach(row => {
        row.style.display = row.cells[0].textContent.toLowerCase().includes(query) ? '' : 'none';
    });
}

function saveUser(index) {
    const nama = document.getElementById('userNama').value;
    const role = document.getElementById('userRole').value;
    if (index !== null) {
        users[index] = { nama, role };
    } else {
        users.push({ nama, role });
    }
    localStorage.setItem('users', JSON.stringify(users));
    renderUsers();
    closeForm();
}

function editUser(index) {
    showForm('user', index);
}

function deleteUser(index) {
    if (confirm('Hapus user ini?')) {
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        renderUsers();
    }
}

// Laporan
function generateReport() {
    const type = document.getElementById('laporanType').value;
    const content = document.getElementById('reportContent');
    if (type === 'bulan') {
        const bulanIni = new Date().getMonth() + 1;
        const transaksiMasuk = masuk.filter(m => new Date(m.tanggal).getMonth() + 1 === bulanIni).length;
        const transaksiKeluar = keluar.filter(k => new Date(k.tanggal).getMonth() + 1 === bulanIni).length;
        content.innerHTML = `<h3>Laporan Per Bulan (Bulan ${bulanIni})</h3><p>Barang Masuk: ${transaksiMasuk}</p><p>Barang Keluar: ${transaksiKeluar}</p>`;
    } else if (type === 'stok') {
        const stokRendah = barang.filter(b => b.stok < 10);
        content.innerHTML = `<h3>Stok Rendah</h3><ul>${stokRendah.map(b => `<li>${b.nama}: ${b.stok}</li>`).join('')}</ul>`;
    } else {
        content.innerHTML = `<h3>Transaksi</h3><p>Total Masuk: ${masuk.length}</p><p>Total Keluar: ${keluar.length}</p>`;
    }
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(document.getElementById('reportContent').innerText, 10, 10);
    doc.save('laporan.pdf');
}

function printReport() {
    const content = document.getElementById('reportContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Laporan</title></head><body>' + content + '</body></html>');
    printWindow.document.close();
    printWindow.print();
}

function closeForm() {
    document.getElementById('formModal').style.display = 'none';
}

function sendEmailAlert() {
    alert('Email simulasi dikirim!');
}

function backupData() {
    const data = { barang, kategori, masuk, keluar, supplier, users };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup.json';
    a.click();
}

function restoreData() {
    const file = document.getElementById('restoreFile').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = JSON.parse(e.target.result);
            Object.assign(window, data);
            localStorage.setItem('barang', JSON.stringify(barang));
            localStorage.setItem('kategori', JSON.stringify(kategori));
            localStorage.setItem('masuk', JSON.stringify(masuk));
            localStorage.setItem('keluar', JSON.stringify(keluar));
            localStorage.setItem('supplier', JSON.stringify(supplier));
            localStorage.setItem('users', JSON.stringify(users));
            showPage('dashboard');
            alert('Data berhasil direstore!');
        };
        reader.readAsText(file);
    }
}

function exportCSV(type) {
    let data = [];
    if (type === 'barang') data = barang;
    else if (type === 'kategori') data = kategori.map(k => ({ nama: k }));
    else if (type === 'masuk') data = masuk;
    else if (type === 'keluar') data = keluar;
    else if (type === 'supplier') data = supplier;
    else if (type === 'user') data = users;
    const csv = [Object.keys(data[0] || {}).join(',')].concat(data.map(row => Object.values(row).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}.csv`;
    a.click();
}