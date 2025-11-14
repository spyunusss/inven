// Import SDK yang diperlukan
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, push, onValue, remove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// CONFIG kamu (pakai punyamu yang ini)
const firebaseConfig = {
  apiKey: "AIzaSyDfl29Rv0CNiHDQwCKwdhB0kuWY47xWwi0",
  authDomain: "inventory-yunus.firebaseapp.com",
  databaseURL: "https://inventory-yunus-default-rtdb.firebaseio.com",
  projectId: "inventory-yunus",
  storageBucket: "inventory-yunus.firebasestorage.app",
  messagingSenderId: "500873917798",
  appId: "1:500873917798:web:3a93a99e78fd83df0044a7",
  measurementId: "G-2BJGLRVHP8"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Ambil element input
const namaInput = document.getElementById("nama");
const stokInput = document.getElementById("stok");
const list = document.getElementById("list");

// Fungsi tambah ke database
window.tambahBarang = function () {
  const data = {
    nama: namaInput.value,
    stok: Number(stokInput.value)
  };

  push(ref(db, "barang"), data);

  namaInput.value = "";
  stokInput.value = "";
};

// Tampilkan data realtime
onValue(ref(db, "barang"), (snapshot) => {
  list.innerHTML = "";
  snapshot.forEach((child) => {
    const item = child.val();
    const key = child.key;

    list.innerHTML += `
      <tr>
        <td>${item.nama}</td>
        <td>${item.stok}</td>
        <td><button onclick="hapus('${key}')">Hapus</button></td>
      </tr>
    `;
  });
});

// Hapus
window.hapus = function(id) {
  remove(ref(db, "barang/" + id));
};