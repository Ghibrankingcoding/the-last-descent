# Struktur Project The Last Descent

Project sudah dipisah berdasarkan tanggung jawab agar perubahan berikutnya lebih mudah ditemukan.

```text
The Last Descent/
├── index.html
├── Assets TLD/                 # Asset utama game: background, karakter, item, musik
├── assets/                     # Asset tambahan dan hasil generate lama
├── css/
│   ├── styles.css              # Entry point; hanya mengatur urutan import
│   ├── base.css                # Variabel warna, reset, body
│   ├── loading-screen.css      # Loading screen saat game dibuka
│   ├── components.css          # Tombol dan komponen dasar
│   ├── menu.css                # Main menu, kredit, settings, load game
│   ├── cutscenes.css           # Prolog dan dialog cerita
│   ├── map.css                 # Side map, object, pickup, dan HUD map
│   ├── characters.css          # Raka dan Cahaya Nenek
│   ├── modal.css               # Modal dasar dan timer Trial
│   ├── transitions.css         # Loading scene, reward, reveal peta, ending
│   ├── levels.css              # Tampilan gameplay Level 1 sampai Level 5
│   ├── responsive.css          # Tampilan layar kecil
│   └── hub.css                 # Map Hub, bulatan level, HP, pause
├── js/
│   ├── core/
│   │   ├── data.js             # State awal, konfigurasi, asset, referensi DOM
│   │   ├── health.js           # Sistem dan render HP
│   │   ├── startup.js          # Loading awal dan inisialisasi
│   │   ├── state.js            # Normalisasi state/save lama
│   │   ├── audio.js            # Musik dan SFX
│   │   ├── save-system.js      # Save dan load game
│   │   ├── progress-rewards.js # Damage, progress, reward, dan ending
│   │   └── bootstrap.js        # Event global; dimuat paling akhir
│   ├── map/
│   │   ├── hub.js              # Map Hub dan render area
│   │   └── movement.js         # Movement, collision, dan trigger
│   ├── levels/
│   │   ├── router.js
│   │   ├── level-1-interactions.js
│   │   ├── level-1-fire.js
│   │   ├── level-2-interactions.js
│   │   ├── level-2-nature.js
│   │   ├── level-3-light.js
│   │   ├── level-4-interactions.js
│   │   ├── level-4-heritage.js
│   │   └── level-5-survival.js
│   └── ui/
│       ├── modal-timer.js       # Modal dan timer level
│       ├── settings-menu.js     # Settings, fullscreen, pause, menu
│       ├── cutscenes.js         # Prolog dan cutscene
│       └── menu.js              # Kredit, catatan, reset, start game
└── scripts/                     # Script bantuan pengembangan
```

## Panduan cepat mengubah game

| Yang ingin diubah | File utama |
|---|---|
| Loading screen awal | `css/loading-screen.css` dan `js/core/startup.js` |
| Tombol/main menu/kredit | `css/menu.css` dan `js/ui/menu.js` |
| Kursor dan warna global | `css/base.css` |
| Ukuran atau tampilan Raka/Nenek | `css/characters.css` |
| Map Hub dan bulatan level | `css/hub.css` dan `js/map/hub.js` |
| Pergerakan atau collision | `js/map/movement.js` |
| Level 1 | `js/levels/level-1-fire.js` |
| Level 2 | `js/levels/level-2-nature.js` |
| Level 3 | `js/levels/level-3-light.js` |
| Level 4 | `js/levels/level-4-heritage.js` |
| Level 5 dan batu jatuh | `js/levels/level-5-survival.js` |
| Semua tampilan level | `css/levels.css` |
| Save/load | `js/core/save-system.js` |

Jangan mengubah urutan `<script>` di `index.html` atau urutan `@import` di `css/styles.css` tanpa mengecek dependensinya, karena kode lama masih memakai global scope bersama.

## Aturan path asset

- Dari `index.html` dan file dalam folder `js/`, gunakan `Assets TLD/...` karena URL JavaScript tetap dihitung dari halaman utama.
- Dari file dalam folder `css/`, gunakan `../Assets TLD/...` karena stylesheet berada satu folder lebih dalam.
- Jalankan `node scripts/validate-assets.js` setelah mengganti nama, memindahkan, atau menambahkan asset. Pemeriksa akan memberi tahu jika ada path yang tidak ditemukan.
