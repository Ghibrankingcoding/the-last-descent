/* Konfigurasi, state awal, referensi DOM, posisi, dan mapping asset. */

function resolveAssetPath(source) {
  try {
    return new URL(source, document.baseURI).href;
  } catch (error) {
    return source;
  }
}

function getStoredVolume(key, fallback) {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  const percentage = Number(stored);
  return Number.isFinite(percentage)
    ? Math.max(0, Math.min(1, percentage / 100))
    : fallback;
}

// Dinaikkan ketika alur pra-misi Level 3 berubah. Save dari alur lama akan
// mengulang bagian pintu dan pencarian kaca agar Trial tidak bisa terlewati.
const currentLightDoorFlowVersion = 2;
const currentHeritageDoorFlowVersion = 2;

const trials = [
  {
    place: "Rumah",
    name: "Trial of Fire",
    field: "Proses pembakaran dan energi panas",
    reward: "Obor",
    mapPiece: true,
    note: "Pembakaran terjadi ketika bahan bakar bereaksi dengan oksigen setelah mendapat panas awal. Energi kimia kemudian berubah menjadi panas dan cahaya.",
    story: "Badai sudah lewat. Di rumah yang gelap, Raka menemukan peta kuno yang terbakar sebagian."
  },
  {
    place: "Hutan",
    name: "Trial of Nature",
    field: "Serat alami dan kekuatan material tumbuhan",
    reward: "Jembatan",
    mapPiece: true,
    note: "Yang rapuh bisa menjadi kuat jika disatukan dengan pola yang benar.",
    story: "Daun basah dan akar tua menutup jalan. Raka harus membuat alat dari alam tanpa merusaknya."
  },
  {
    place: "Sungai dan Air Terjun",
    name: "Trial of Light",
    field: "Refleksi cahaya dan energi matahari",
    reward: "Kunci Cahaya",
    mapPiece: true,
    note: "Cahaya tidak selalu bergerak lurus menuju jawaban. Kadang ia perlu dipantulkan.",
    story: "Di balik air terjun, pintu batu hanya bereaksi pada arah cahaya yang tepat."
  },
  {
    place: "Lembah Batu Kuno",
    name: "Trial of Heritage",
    field: "Simbol budaya dan warisan leluhur",
    reward: "Batu Ukir",
    mapPiece: true,
    note: "Ingatlah tanda-tanda leluhurmu. Keluarga adalah jejak yang tidak selalu tertulis.",
    story: "Batu-batu kuno menyimpan simbol keluarga. Salah membaca berarti kehilangan petunjuk."
  },
  {
    place: "Goa Purba",
    name: "Trial of Survival",
    field: "Refleks, fokus, dan keselamatan saat runtuhan batu",
    reward: "Potongan Peta Terakhir",
    mapPiece: true,
    note: "Keberanian bukan berlari tanpa arah, tapi tetap tenang saat bahaya jatuh dari segala sisi.",
    story: "Goa Purba mulai runtuh. Raka harus melewati hujan batu sebelum jalan menuju keluarganya tertutup."
  }
];

const scienceResults = {
  1: {
    source: "Serat Daun",
    title: "Serat Alami dan Gaya Tarik",
    summary: "Serat daun tersusun dari jaringan memanjang. Ketika beberapa serat dipilin searah, beban tarikan tersebar ke lebih banyak serat sehingga tali menjadi lebih kuat dan tidak mudah putus.",
    steps: ["Serat panjang", "Dipilin rapat", "Beban tersebar"],
    note: "Prinsip yang sama dipakai pada tali, benang, dan bahan komposit berserat."
  },
  2: {
    source: "Cermin",
    title: "Pemantulan Cahaya",
    summary: "Cermin mengubah arah rambat cahaya melalui pemantulan. Sudut datang cahaya terhadap garis normal selalu sama dengan sudut pantulnya.",
    steps: ["Cahaya datang", "Mengenai cermin", "Dipantulkan"],
    note: "Mengubah kemiringan cermin akan mengubah arah cahaya menuju sasaran."
  },
  3: {
    source: "Lembah Batu",
    title: "Pelapukan dan Pembentukan Lembah",
    summary: "Air, angin, dan perubahan suhu perlahan memperbesar retakan batu. Material yang lapuk kemudian terbawa erosi sehingga permukaan batu dan lembah berubah dari waktu ke waktu.",
    steps: ["Batu retak", "Mengalami pelapukan", "Terbentuk lembah"],
    note: "Batuan yang keras dapat menyimpan ukiran lebih lama, tetapi tetap berubah akibat lingkungan."
  },
  4: {
    source: "Goa Purba",
    title: "Gravitasi dan Runtuhan Goa",
    summary: "Air dapat melarutkan batu kapur dan memperlebar celah di dalam goa. Ketika batu kehilangan penyangga, gaya gravitasi menariknya jatuh ke bawah.",
    steps: ["Celah melebar", "Penyangga melemah", "Batu jatuh"],
    note: "Bayangan, bunyi retakan, dan serpihan kecil dapat menjadi tanda awal terjadinya runtuhan."
  }
};

const mapPieceMessages = [
  "Bagian pertama peta menunjukkan jalan keluar dari rumah menuju hutan.",
  "Bagian kedua peta menunjukkan jalur hutan menuju sungai dan air terjun.",
  "Bagian ketiga peta membuka jalur dari sungai menuju lembah batu kuno.",
  "Bagian keempat peta menunjukkan pintu masuk menuju Goa Purba.",
  "Potongan terakhir menyatukan jalur menuju ruang terdalam tempat keluarga Raka berada."
];

const state = {
  current: 0,
  mapPosition: 0,
  mapX: 13,
  mapY: 74,
  mapProgress: 0,
  sideX: 210,
  sideY: 0,
  sideVX: 0,
  sideVY: 0,
  sideArea: 0,
  sideWorldVersion: 3,
  hpUnits: 9,
  hpSystemVersion: 2,
  lives: 3,
  completed: [],
  inventory: [],
  notes: [],
  mapPieces: 0,
  housePhase: "inside",
  houseMaterials: [],
  natureInspected: false,
  natureMaterials: [],
  natureBridgeCrafted: false,
  natureBridgeInstalled: false,
  lightDoorInspected: false,
  lightFragments: [],
  lightDoorPhase: "closed",
  lightDoorFlowVersion: currentLightDoorFlowVersion,
  heritageDoorInspected: false,
  heritageMaterials: [],
  heritageDoorPhase: "closed",
  heritageDoorFlowVersion: currentHeritageDoorFlowVersion,
  ended: false,
  endingGood: null,
  slotId: null,
  updatedAt: null
};

const prologueDialogs = [
  "Hari ini cuacanya bagus sekali. Besok kita bisa pergi ke kebun bersama.",
  "Jangan terlalu jauh, Raka. Sebelum sore kita harus sudah kembali.",
  "Iya, Bu. Aku ingin sekali ikut Ayah ke kebun.",
  "Raka, setelah makan jangan lupa merapikan barang-barangmu.",
  "Iya, Bu. Tapi nanti aku mau membantu Ayah.",
  "Hahaha, baiklah. Kalau begitu besok kita pergi bersama.",
  "Sepertinya cuaca berubah lebih cepat dari perkiraan.",
  "Langitnya semakin gelap. Sebaiknya kita masuk ke rumah.",
  "Ayah, apakah akan turun hujan?",
  "Raka, tetap dekat dengan Ayah dan Ibu.",
  "Tenang. Kita tunggu badai ini berlalu di dalam rumah.",
  "Baik, Yah. Aku tidak akan pergi ke mana-mana.",
  "Ayah... suara anginnya semakin keras.",
  "Jangan takut, Raka. Tetap bersama kami.",
  "Kita akan melewati badai ini bersama-sama.",
  "Raka! Pegang tangan Ibu!",
  "Jangan lepaskan kami!",
  "Ayah! Ibu!",
  "Ayah... Ibu...?",
  "Mereka ke mana?",
  "Aku harus mencari mereka.",
  "Ini... buku catatan Nenek?",
  "Kenapa peta ini seperti menunjukkan jalan ke hutan?",
  "Mungkin ini satu-satunya petunjuk yang aku punya.",
  "Apa... cahaya itu?",
  "Kenapa buku Nenek tiba-tiba menyala?",
  "Ada seseorang di sana...?",
  "Raka...",
  "Nenek?! Tapi... Nenek sudah lama tidak ada.",
  "Waktuku di dunia ini telah selesai, tetapi aku masih dapat membantumu menemukan keluargamu.",
  "Jika ingin menemukan keluargamu, ikutilah jalan yang ditunjukkan oleh peta ini.",
  "Apa yang harus aku lakukan?",
  "Selesaikan lima Trial. Setiap Trial akan memberimu petunjuk dan satu bagian dari jalan menuju mereka."
];

const prologueSpeakers = [
  "Ayah", "Ibu", "Raka",
  "Ibu", "Raka", "Ayah",
  "Ayah", "Ibu", "Raka",
  "Ibu", "Ayah", "Raka",
  "Raka", "Ayah", "Ibu",
  "Ayah", "Ibu", "Raka",
  "Raka", "Raka", "Raka",
  "Raka", "Raka", "Raka",
  "Raka", "Raka", "Raka",
  "Nenek", "Raka", "Nenek",
  "Nenek", "Raka", "Nenek"
];

const dialogPortraitAssets = {
  ayahHappy: "Assets TLD/character/dialog_ayah_happy.png",
  ayahProtective: "Assets TLD/character/dialog_ayah_protective.png",
  ayahRelieved: "Assets TLD/character/dialog_ayah_relieved.png",
  ayahWorried: "Assets TLD/character/dialog_ayah_worried.png",
  ibuHappy: "Assets TLD/character/dialog_ibu_happy.png",
  ibuProtective: "Assets TLD/character/dialog_ibu_protective.png",
  ibuRelieved: "Assets TLD/character/dialog_ibu_relieved.png",
  ibuWorried: "Assets TLD/character/dialog_ibu_worried.png",
  nenekEncouraging: "Assets TLD/character/dialog_nenek_encouraging.png",
  nenekFarewell: "Assets TLD/character/dialog_nenek_farewell.png",
  nenekGentle: "Assets TLD/character/dialog_nenek_gentle.png",
  nenekSerious: "Assets TLD/character/dialog_nenek_serious.png",
  rakaCurious: "Assets TLD/character/dialog_raka_curious.png",
  rakaDetermined: "Assets TLD/character/dialog_raka_determined.png",
  rakaHappy: "Assets TLD/character/dialog_raka_happy.png",
  rakaPanic: "Assets TLD/character/dialog_raka_panic.png",
  rakaRelieved: "Assets TLD/character/dialog_raka_relieved.png",
  rakaSad: "Assets TLD/character/dialog_raka_sad.png",
  rakaSurprised: "Assets TLD/character/dialog_raka_surprised.png",
  rakaWorried: "Assets TLD/character/dialog_raka_worried.png"
};

const prologuePortraits = [
  dialogPortraitAssets.ayahHappy, dialogPortraitAssets.ibuProtective, dialogPortraitAssets.rakaHappy,
  dialogPortraitAssets.ibuProtective, dialogPortraitAssets.rakaHappy, dialogPortraitAssets.ayahHappy,
  dialogPortraitAssets.ayahWorried, dialogPortraitAssets.ibuWorried, dialogPortraitAssets.rakaCurious,
  dialogPortraitAssets.ibuProtective, dialogPortraitAssets.ayahProtective, dialogPortraitAssets.rakaWorried,
  dialogPortraitAssets.rakaPanic, dialogPortraitAssets.ayahProtective, dialogPortraitAssets.ibuProtective,
  dialogPortraitAssets.ayahWorried, dialogPortraitAssets.ibuWorried, dialogPortraitAssets.rakaPanic,
  dialogPortraitAssets.rakaSad, dialogPortraitAssets.rakaWorried, dialogPortraitAssets.rakaDetermined,
  dialogPortraitAssets.rakaCurious, dialogPortraitAssets.rakaCurious, dialogPortraitAssets.rakaDetermined,
  dialogPortraitAssets.rakaSurprised, dialogPortraitAssets.rakaSurprised, dialogPortraitAssets.rakaWorried,
  dialogPortraitAssets.nenekGentle, dialogPortraitAssets.rakaSurprised, dialogPortraitAssets.nenekGentle,
  dialogPortraitAssets.nenekEncouraging, dialogPortraitAssets.rakaCurious, dialogPortraitAssets.nenekSerious
];

function getDialogPortrait(speaker, text = "") {
  const normalizedSpeaker = String(speaker).toLowerCase();
  const normalizedText = String(text).toLowerCase();
  if (normalizedSpeaker.includes("nenek") || normalizedSpeaker.includes("cahaya")) {
    if (/pulang|terakhir|selesai|menunggumu/.test(normalizedText)) return dialogPortraitAssets.nenekFarewell;
    if (/jangan|bahaya|harus|selesaikan|belum dapat|tidak dapat|hati-hati/.test(normalizedText)) return dialogPortraitAssets.nenekSerious;
    if (/bagus|terus|lanjut|berhasil|bisa|ikutilah|pergilah/.test(normalizedText)) return dialogPortraitAssets.nenekEncouraging;
    return dialogPortraitAssets.nenekGentle;
  }
  if (normalizedSpeaker.includes("ayah")) {
    if (/syukur|pulang|bersama|selamat/.test(normalizedText)) return dialogPortraitAssets.ayahRelieved;
    if (/jangan|pegang|tenang|tetap/.test(normalizedText)) return dialogPortraitAssets.ayahProtective;
    if (/badai|gelap|angin|berubah|raka!/.test(normalizedText)) return dialogPortraitAssets.ayahWorried;
    return dialogPortraitAssets.ayahHappy;
  }
  if (normalizedSpeaker.includes("ibu")) {
    if (/syukur|pulang|bersama|selamat|terima kasih/.test(normalizedText)) return dialogPortraitAssets.ibuRelieved;
    if (/jangan|dekat|masuk|tetap/.test(normalizedText)) return dialogPortraitAssets.ibuProtective;
    if (/badai|gelap|angin|lepaskan|raka!/.test(normalizedText)) return dialogPortraitAssets.ibuWorried;
    return dialogPortraitAssets.ibuHappy;
  }
  if (/berhasil|lengkap|akhirnya|terima kasih|pulang bersama|sudah|tidak sendirian/.test(normalizedText)) return dialogPortraitAssets.rakaRelieved;
  if (/belum|hilang|sendiri|ke mana|tidak ada/.test(normalizedText)) return dialogPortraitAssets.rakaSad;
  if (/ayah!|ibu!|takut|bahaya|runtuh|terkena|tolong|lepaskan/.test(normalizedText)) return dialogPortraitAssets.rakaPanic;
  if (/apa|kenapa|bagaimana|siapa|peta|cahaya|pintu|\?/.test(normalizedText)) return dialogPortraitAssets.rakaCurious;
  if (/harus|akan|lanjut|pergi|mencari|menemukan|di dalam gua|siap/.test(normalizedText)) return dialogPortraitAssets.rakaDetermined;
  return dialogPortraitAssets.rakaWorried;
}

const prologueSlides = prologueDialogs.map((text, index) => ({
  text,
  speaker: prologueSpeakers[index],
  background: Math.floor(index / 3) + 1,
  portraitAsset: prologuePortraits[index]
}));

const level3CutsceneSlides = [
  {
    kicker: "Level 3 - Pantulan Cahaya",
    speaker: "Lima Pecahan Kaca Tersusun",
    text: "Setelah kelima pecahan kaca disusun pada dudukannya, setiap permukaan menangkap cahaya dari arah yang berbeda. Pantulan itu mulai membentuk satu jalur menuju pusat pintu batu.",
    backgroundAsset: "Assets TLD/background/bg_level_3_setelah_posisi_kaca.png",
    portraitAsset: dialogPortraitAssets.rakaCurious
  },
  {
    kicker: "Level 3 - Pintu Batu",
    speaker: "Jalan Masih Tertutup",
    text: "Awalnya pintu kuno ini tertutup rapat. Tidak ada gagang atau kunci biasa; ukiran berbentuk matahari di tengahnya hanya dapat diaktifkan oleh cahaya.",
    backgroundAsset: "Assets TLD/background/cutscene_level_3_tertutup.png",
    portraitAsset: dialogPortraitAssets.rakaWorried
  },
  {
    kicker: "Level 3 - Jalur Cahaya",
    speaker: "Pantulan Mengaktifkan Pintu",
    text: "Sudut kelima pecahan kaca membuat cahaya memantul secara berurutan. Berkat susunan yang tepat, sinar terakhir mencapai lambang di tengah pintu dan mengaktifkan mekanisme kunonya.",
    backgroundAsset: "Assets TLD/background/cutscene_level_3_cahaya.png",
    portraitAsset: dialogPortraitAssets.rakaSurprised
  },
  {
    kicker: "Level 3 - Jalan Terbuka",
    speaker: "Pintu Berhasil Dibuka",
    text: "Cahaya telah membuka segel batu. Pintu akhirnya terbuka dan Raka dapat melanjutkan perjalanan menuju lembah di baliknya.",
    backgroundAsset: "Assets TLD/background/cutscene_level_3_terbuka.png",
    portraitAsset: dialogPortraitAssets.rakaRelieved
  }
];

const level4CutsceneSlides = [
  {
    kicker: "Level 4 - Jejak Leluhur",
    speaker: "Relung Batu Masih Kosong",
    text: "Pintu lembah menyimpan delapan relung batu yang telah lama kosong. Setiap relung memiliki bentuk berbeda dan hanya dapat menerima simbol leluhur yang tepat.",
    backgroundAsset: "Assets TLD/background/cutscene_level_4_kosong.png",
    portraitAsset: dialogPortraitAssets.rakaCurious
  },
  {
    kicker: "Level 4 - Simbol Dipulihkan",
    speaker: "Delapan Batu Kembali Lengkap",
    text: "Raka menempatkan Batu Matahari, Sungai, Gunung, Rumah, Api, Daun, Batu, dan Bulan pada relungnya. Susunan lengkap itu menghidupkan kembali ukiran warisan di permukaan pintu.",
    backgroundAsset: "Assets TLD/background/cutscene_level_4_lengkap.png",
    portraitAsset: dialogPortraitAssets.rakaDetermined
  },
  {
    kicker: "Level 4 - Jalan Terbuka",
    speaker: "Pintu Lembah Berhasil Dibuka",
    text: "Ketika seluruh simbol berada pada posisi yang benar, mekanisme batu kuno bergerak dan membuka jalan. Raka kini dapat melanjutkan perjalanan menuju Goa Purba.",
    backgroundAsset: "Assets TLD/background/cutscene_level_4_terbuka.png",
    portraitAsset: dialogPortraitAssets.rakaRelieved
  }
];

const level5MapCutsceneSlides = [
  {
    kicker: "Level 5 - Peta Lengkap",
    speaker: "Raka",
    text: "Akhirnya... petanya lengkap.",
    backgroundAsset: "Assets TLD/background/cutscene_level_5_nenek_map_lengkap.png"
  },
  {
    kicker: "Level 5 - Peta Lengkap",
    speaker: "Raka",
    text: "Tapi... Ayah dan Ibu masih belum kutemukan.",
    backgroundAsset: "Assets TLD/background/cutscene_level_5_nenek_map_lengkap.png"
  },
  {
    kicker: "Nenek Muncul",
    speaker: "Nenek",
    text: "Perjalananmu belum selesai, Raka.",
    backgroundAsset: "Assets TLD/background/cutscene_level_5_nenek_map_lengkap.png"
  },
  {
    kicker: "Level 5 - Pesan Terakhir",
    speaker: "Raka",
    text: "Nenek?",
    backgroundAsset: "Assets TLD/background/cutscene_level_5_nenek_map_lengkap.png"
  },
  {
    kicker: "Level 5 - Pesan Terakhir",
    speaker: "Nenek",
    text: "Baliklah petanya. Ada pesan terakhir di sana.",
    backgroundAsset: "Assets TLD/background/cutscene_level_5_nenek_map_lengkap.png"
  },
  {
    kicker: "Level 5 - Pesan Terakhir",
    speaker: "Raka",
    text: "Jadi Ayah dan Ibu ada di dalam gua ini.",
    backgroundAsset: "Assets TLD/background/cutscene_level_5_nenek_map_lengkap.png"
  },
  {
    kicker: "Level 5 - Pesan Terakhir",
    speaker: "Nenek",
    text: "Benar. Pergilah, Raka.",
    backgroundAsset: "Assets TLD/background/cutscene_level_5_nenek_map_lengkap.png"
  },
  {
    kicker: "Level 5 - Pesan Terakhir",
    speaker: "Raka",
    text: "Terima kasih, Nek.",
    backgroundAsset: "Assets TLD/background/cutscene_level_5_nenek_map_lengkap.png"
  },
  {
    kicker: "Level 5 - Pesan Terakhir",
    speaker: "Nenek",
    text: "Mereka sudah menunggumu.",
    backgroundAsset: "Assets TLD/background/cutscene_level_5_nenek_map_lengkap.png"
  }
];

const level5ReunionCutsceneSlides = [
  {
    kicker: "Level 5 - Pertemuan",
    speaker: "Raka",
    text: "Ayah... Ibu! Akhirnya aku menemukan kalian.",
    backgroundAsset: "Assets TLD/background/bg_level_5(4).png"
  },
  {
    kicker: "Level 5 - Pertemuan",
    speaker: "Ibu",
    text: "Raka! Syukurlah kamu selamat.",
    backgroundAsset: "Assets TLD/background/bg_level_5(4).png"
  },
  {
    kicker: "Level 5 - Pertemuan",
    speaker: "Ayah",
    text: "Kami terus menunggumu. Kemarilah, Nak.",
    backgroundAsset: "Assets TLD/background/bg_level_5(4).png"
  },
  {
    kicker: "Level 5 - Pertemuan",
    speaker: "Raka",
    text: "Aku tidak sendirian. Nenek menunjukkan jalan kepadaku.",
    backgroundAsset: "Assets TLD/background/bg_level_5(4).png"
  },
  {
    kicker: "Level 5 - Keluarga",
    speaker: "Ibu",
    text: "Terima kasih sudah datang mencari kami, Raka.",
    backgroundAsset: "Assets TLD/background/bg_level_5(5).png"
  },
  {
    kicker: "Level 5 - Keluarga",
    speaker: "Ayah",
    text: "Sekarang kita pulang bersama.",
    backgroundAsset: "Assets TLD/background/bg_level_5(5).png"
  },
  {
    kicker: "Level 5 - Keluarga",
    speaker: "Raka",
    text: "Iya. Kita pulang bersama.",
    backgroundAsset: "Assets TLD/background/bg_level_5(5).png"
  }
];

let prologueIndex = 0;
let prologueMode = "opening";
let typewriterTimer = null;
let typewriterDone = true;
let audioContext = null;
let sfxMasterGain = null;
let ambientOscillator = null;
let ambientOscillatorTwo = null;
let ambientGain = null;
let ambientPulseTimer = null;
let currentAmbient = "menu";
let activeDodgeCleanup = null;
let activeLevel5WalkCleanup = null;
let activeMusic = null;
let activeMissionTimer = null;
let missionPenaltyFlashTimeout = null;
let missionPenaltyAlertTimeout = null;
let lastButtonClickSoundAt = -Infinity;
let visibleSaveCount = 5;
let sideReferenceViewportHeight = null;
let viewportSyncFrame = null;
let sceneLoadingTimer = null;
let activeEndingCleanup = null;
let postTrialExitArea = null;

const musicAssets = {
  menu: "Assets TLD/music/main menu.mp3",
  prologueHappy: "Assets TLD/music/prolog bahagia.mp3",
  prologueSad: "Assets TLD/music/prolog sedih.mp3",
  travel: "Assets TLD/music/main song (animasi gerak).mp3",
  fire: "Assets TLD/music/misi 1.mp3",
  nature: "Assets TLD/music/misi 2.mp3",
  light: "Assets TLD/music/misi 3.mp3",
  heritage: "Assets TLD/music/misi 4.mp3",
  sound: "Assets TLD/music/misi 5.mp3",
  ending: "Assets TLD/music/happy ending.mp3",
  credits: "Assets TLD/music/good_life_kredit.mp3",
  badEnding: "Assets TLD/music/bad ending.mp3"
};

const clickAssets = {
  action: "Assets TLD/music/click 1.mp3",
  success: "Assets TLD/music/click 2.mp3",
  error: "Assets TLD/music/click 3.mp3"
};

const startupAssetManifest = [
  "Assets TLD/background/cakrawalaa.png",
  "Assets TLD/background/loading_screen.png",
  "Assets TLD/background/homescreen_2.png",
  "Assets TLD/background/logo_thelastdescent.png",
  "Assets TLD/items/buttonMulai.png",
  "Assets TLD/items/buttonLanjutkan.png",
  "Assets TLD/items/buttonPengaturan.png",
  "Assets TLD/items/buttonKredit2.png",
  "Assets TLD/items/instagram.png",
  "Assets TLD/items/kursor_tangan_seimbang.svg",
  "Assets TLD/items/level_1.png",
  "Assets TLD/items/level_2.png",
  "Assets TLD/items/level_3.png",
  "Assets TLD/items/level_4.png",
  "Assets TLD/items/level_5.png",
  "Assets TLD/items/map.png",
  "Assets TLD/background/bg_awal_1.png",
  "Assets TLD/background/bg_awal_2.png",
  "Assets TLD/background/bg_awal_3.png",
  "Assets TLD/background/bg_awal_4.png",
  "Assets TLD/background/bg_awal_5.png",
  "Assets TLD/background/bg_awal_6.png",
  "Assets TLD/background/bg_awal_7.png",
  "Assets TLD/background/bg_awal_8.png",
  "Assets TLD/background/bg_awal_9.png",
  "Assets TLD/background/bg_awal_10.png",
  "Assets TLD/background/bg_awal_11.png",
  "Assets TLD/background/luar_rumah.png",
  "Assets TLD/background/luar_rumah_2.png",
  "Assets TLD/background/bg_level1_fix.jpeg",
  "Assets TLD/background/bg_level2_fix.jpeg",
  "Assets TLD/background/bg_level_2_selesai (2).png",
  "Assets TLD/background/bg_level_3_tertutup_new.png",
  "Assets TLD/background/bg_level_3_terbuka_1_new.png",
  "Assets TLD/background/bg_level4_tertutup_fixbanget.png",
  "Assets TLD/background/bg_level_4_terbuka_new.png",
  "Assets TLD/background/goa_1_new.png",
  "Assets TLD/background/gua(2)_new.png",
  "Assets TLD/items/batu_kecil.png",
  "Assets TLD/items/batu_sedang.png",
  "Assets TLD/items/batu_besar.png",
  "Assets TLD/character/raka_idle.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_walk_01.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_walk_02.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_walk_03.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_walk_04.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_walk_05.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_walk_06.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_walk_07.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_walk_08.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_torch_idle.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_torch_walk_01.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_torch_walk_02.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_torch_walk_03.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_torch_walk_04.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_torch_walk_05.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_torch_walk_06.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_torch_walk_07.png?v=20260922-raka-v2",
  "Assets TLD/character/raka_torch_walk_08.png?v=20260922-raka-v2"
];

const el = {
  startupLoader: document.getElementById("startupLoader"),
  startupBrandSplash: document.getElementById("startupBrandSplash"),
  startupGameSplash: document.getElementById("startupGameSplash"),
  startupProgress: document.getElementById("startupProgress"),
  startupProgressBar: document.getElementById("startupProgressBar"),
  startupLoadingStatus: document.getElementById("startupLoadingStatus"),
  startupFullscreenPrompt: document.getElementById("startupFullscreenPrompt"),
  startupEnterPrompt: document.getElementById("startupEnterPrompt"),
  mainMenu: document.getElementById("mainMenu"),
  menuVideo: document.getElementById("menuVideo"),
  menuStart: document.getElementById("menuStart"),
  menuSettings: document.getElementById("menuSettings"),
  menuLoad: document.getElementById("menuLoad"),
  menuCredits: document.getElementById("menuCredits"),
  worldMap: document.getElementById("worldMap"),
  hubMapScreen: document.getElementById("hubMapScreen"),
  hubMapTitle: document.getElementById("hubMapTitle"),
  hubHealth: document.getElementById("hubHealth"),
  hubMapPieces: document.getElementById("hubMapPieces"),
  hubMapPieceLayers: document.getElementById("hubMapPieceLayers"),
  hubMapNodes: document.getElementById("hubMapNodes"),
  hubMapProgress: document.getElementById("hubMapProgress"),
  hubMapInstruction: document.getElementById("hubMapInstruction"),
  hubContinueEnding: document.getElementById("hubContinueEnding"),
  hubSettings: document.getElementById("hubSettings"),
  mapBackdrop: document.getElementById("mapBackdrop"),
  mapPlaceName: document.getElementById("mapPlaceName"),
  sideLives: document.getElementById("sideLives"),
  sideHealth: document.getElementById("sideHealth"),
  sideMapPieces: document.getElementById("sideMapPieces"),
  mapRoute: document.getElementById("mapRoute"),
  mapPlayer: document.getElementById("mapPlayer"),
  collisionDebugLayer: document.getElementById("collisionDebugLayer"),
  collisionDebugPlayer: document.getElementById("collisionDebugPlayer"),
  collisionDebugHud: document.getElementById("collisionDebugHud"),
  collisionDebugInfo: document.getElementById("collisionDebugInfo"),
  mapGuide: document.getElementById("mapGuide"),
  mapGuideTitle: document.getElementById("mapGuideTitle"),
  mapGuideProgress: document.getElementById("mapGuideProgress"),
  mapPrompt: document.getElementById("mapPrompt"),
  mapSettings: document.getElementById("mapSettings"),
  mapPopup: document.getElementById("mapPopup"),
  mapPopupClose: document.getElementById("mapPopupClose"),
  mapPopupKicker: document.getElementById("mapPopupKicker"),
  mapPopupTitle: document.getElementById("mapPopupTitle"),
  mapPopupText: document.getElementById("mapPopupText"),
  mapPopupStart: document.getElementById("mapPopupStart"),
  mapPopupNote: document.getElementById("mapPopupNote"),
  prologue: document.getElementById("prologue"),
  prologueScene: document.querySelector(".prologue-scene"),
  prologuePortrait: document.getElementById("prologuePortrait"),
  prologueKicker: document.getElementById("prologueKicker"),
  prologueTitle: document.getElementById("prologueTitle"),
  prologueText: document.getElementById("prologueText"),
  prologueProgress: document.getElementById("prologueProgress"),
  prologueSkip: document.getElementById("prologueSkip"),
  prologueNext: document.getElementById("prologueNext"),
  endingSequence: document.getElementById("endingSequence"),
  happyEndingVideo: document.getElementById("happyEndingVideo"),
  creditEndingVideo: document.getElementById("creditEndingVideo"),
  endingLogoStage: document.getElementById("endingLogoStage"),
  creditSkipHint: document.getElementById("creditSkipHint"),
  scene: document.getElementById("scene"),
  raka: document.getElementById("raka"),
  locationName: document.getElementById("locationName"),
  lives: document.getElementById("lives"),
  panelHealth: document.getElementById("panelHealth"),
  mapPieces: document.getElementById("mapPieces"),
  inventory: document.getElementById("inventory"),
  storyText: document.getElementById("storyText"),
  startTrial: document.getElementById("startTrial"),
  noteButton: document.getElementById("noteButton"),
  resetButton: document.getElementById("resetButton"),
  route: document.getElementById("route"),
  modal: document.getElementById("modal"),
  modalBox: document.getElementById("modalBox"),
  closeModal: document.getElementById("closeModal"),
  modalKicker: document.getElementById("modalKicker"),
  modalTitle: document.getElementById("modalTitle"),
  modalText: document.getElementById("modalText"),
  trialMount: document.getElementById("trialMount"),
  settingsOverlay: document.getElementById("settingsOverlay"),
  mainVolumeSlider: document.getElementById("mainVolumeSlider"),
  mainVolumeValue: document.getElementById("mainVolumeValue"),
  sfxVolumeSlider: document.getElementById("sfxVolumeSlider"),
  sfxVolumeValue: document.getElementById("sfxVolumeValue"),
  dialogueSpeedSelect: document.getElementById("dialogueSpeedSelect"),
  tutorialHintToggle: document.getElementById("tutorialHintToggle"),
  tutorialHintValue: document.getElementById("tutorialHintValue"),
  screenShakeToggle: document.getElementById("screenShakeToggle"),
  screenShakeValue: document.getElementById("screenShakeValue"),
  muteAllToggle: document.getElementById("muteAllToggle"),
  muteAllValue: document.getElementById("muteAllValue"),
  fullscreenToggle: document.getElementById("fullscreenToggle"),
  fullscreenValue: document.getElementById("fullscreenValue"),
  closeSettings: document.getElementById("closeSettings"),
  exitToMenu: document.getElementById("exitToMenu"),
  creditsOverlay: document.getElementById("creditsOverlay"),
  closeCredits: document.getElementById("closeCredits"),
  pauseOverlay: document.getElementById("pauseOverlay"),
  resumeGame: document.getElementById("resumeGame"),
  pauseSettings: document.getElementById("pauseSettings"),
  pauseExit: document.getElementById("pauseExit"),
  loadOverlay: document.getElementById("loadOverlay"),
  saveList: document.getElementById("saveList"),
  showMoreSaves: document.getElementById("showMoreSaves"),
  closeLoad: document.getElementById("closeLoad"),
  confirmOverlay: document.getElementById("confirmOverlay"),
  cancelExit: document.getElementById("cancelExit"),
  confirmExit: document.getElementById("confirmExit")
};

const saveKey = "the-last-descent-save";
const saveSlotsKey = "the-last-descent-save-slots";
const legacyVolumeKey = "the-last-descent-volume";
const mainVolumeKey = "the-last-descent-main-volume";
const sfxVolumeKey = "the-last-descent-sfx-volume";
const muteAllKey = "the-last-descent-mute-all";
const dialogueSpeedKey = "the-last-descent-dialogue-speed";
const tutorialHintKey = "the-last-descent-tutorial-hint";
const screenShakeKey = "the-last-descent-screen-shake";
const hpUnitsPerChance = 3;
const maxChances = 3;
const maxHpUnits = hpUnitsPerChance * maxChances;
const failureDamageByLevel = [1, 1, 2, 2, 3];
const legacyVolume = getStoredVolume(legacyVolumeKey, 0.7);
let mainVolume = getStoredVolume(mainVolumeKey, legacyVolume);
let sfxVolume = getStoredVolume(sfxVolumeKey, legacyVolume);
let muteAll = localStorage.getItem(muteAllKey) === "true";
const storedDialogueSpeed = localStorage.getItem(dialogueSpeedKey);
let dialogueSpeed = ["slow", "normal", "fast"].includes(storedDialogueSpeed) ? storedDialogueSpeed : "normal";
let tutorialHintsEnabled = localStorage.getItem(tutorialHintKey) !== "false";
let screenShakeEnabled = localStorage.getItem(screenShakeKey) !== "false";

const positions = [
  { left: 50, top: 10 },
  { left: 42, top: 29 },
  { left: 56, top: 48 },
  { left: 45, top: 67 },
  { left: 58, top: 84 }
];

const mapPositions = [
  { x: 9, y: 84, label: "Awal", title: "Gerbang Awal", labelX: 9, labelY: 88 },
  { x: 18, y: 58, label: "Rumah", labelX: 10, labelY: 43 },
  { x: 50, y: 36, label: "Hutan", labelX: 34, labelY: 19 },
  { x: 49, y: 73, label: "Sungai", labelX: 41, labelY: 84 },
  { x: 74, y: 62, label: "Lembah", labelX: 74, labelY: 64 },
  { x: 86, y: 27, label: "Goa", labelX: 81, labelY: 13 }
];

const mapPath = [
  { x: 9, y: 84 },
  { x: 14, y: 76 },
  { x: 20, y: 67 },
  { x: 18, y: 58 },
  { x: 27, y: 64 },
  { x: 36, y: 66 },
  { x: 43, y: 70 },
  { x: 49, y: 73 },
  { x: 55, y: 69 },
  { x: 63, y: 66 },
  { x: 74, y: 62 },
  { x: 80, y: 54 },
  { x: 84, y: 42 },
  { x: 86, y: 27 }
];

const mapBranches = [
  [
    { x: 27, y: 64 },
    { x: 36, y: 56 },
    { x: 44, y: 47 },
    { x: 50, y: 36 }
  ],
  [
    { x: 44, y: 47 },
    { x: 47, y: 56 },
    { x: 45, y: 65 },
    { x: 49, y: 73 }
  ]
];

const hubLocations = [
  { x: 14.2, y: 82.3, short: "Rumah", action: "MASUK RUMAH", icon: "Assets TLD/items/level_1.png" },
  { x: 42.7, y: 53.1, short: "Hutan", action: "LANJUT KE HUTAN", icon: "Assets TLD/items/level_2.png" },
  { x: 53.2, y: 41.1, short: "Air Terjun", action: "LANJUT KE AIR TERJUN", icon: "Assets TLD/items/level_3.png" },
  { x: 73.7, y: 47.2, short: "Lembah", action: "LANJUT KE LEMBAH", icon: "Assets TLD/items/level_4.png" },
  { x: 93.6, y: 18.1, short: "Goa", action: "LANJUT KE GOA", icon: "Assets TLD/items/level_5.png" }
];

const mapKeys = new Set();
const suppressedMapKeys = new Set();
let mapMoveFrame = null;
let lastMapModalIndex = null;
let lastMapSaveAt = 0;
let lastMapFrameTime = 0;
let activeSideTrigger = null;
let activeHouseInteraction = null;
let activeForestInteraction = null;
let activeLightInteraction = null;
let activeHeritageInteraction = null;
let sideCameraX = 0;
let activeWitchDialog = false;
let activeDialogSpeaker = "Cahaya Nenek";
let activeDialogOnClose = null;
let pendingWitchDialog = "";
let lastBoundaryDialogAt = 0;
let rakaWalkClock = 0;
let collisionDebugEnabled = false;
const shownTravelHints = new Set();
const sideWorld = {
  baseWidth: 1800,
  width: 1800,
  houseRouteWidth: 2800,
  height: 720,
  playerWidth: 54,
  playerHeight: 108,
  moveSpeed: 0.28,
  acceleration: 0.00092,
  friction: 0.00072,
  groundY: 588
};

const wideSideWorldWidth = 3195;
const caveSideWorldWidth = 2611;

function scaleWideSideX(value) {
  return Math.round(value * wideSideWorldWidth / sideWorld.baseWidth);
}

function scaleCaveSideX(value) {
  return Math.round(value * caveSideWorldWidth / sideWorld.baseWidth);
}

const natureWorld = {
  fiberX: scaleWideSideX(300),
  woodX: scaleWideSideX(560),
  craftX: scaleWideSideX(710),
  inspectX: scaleWideSideX(855),
  chasmLeft: scaleWideSideX(900),
  chasmRight: scaleWideSideX(1095)
};

function syncSideWorldViewport(resetReference = false) {
  const viewportHeight = Math.max(1, window.innerHeight || 720);
  if (resetReference || !sideReferenceViewportHeight) sideReferenceViewportHeight = viewportHeight;
  const scale = viewportHeight / sideReferenceViewportHeight;
  sideWorld.height = Math.max(720, viewportHeight);
  sideWorld.groundY = Math.max(520, Math.min(sideWorld.height - 54, Math.round(588 * scale)));
}

const sideAreas = [
  {
    name: "Rumah Raka",
    className: "scene-house",
    worldWidth: sideWorld.baseWidth,
    triggerX: 1040,
    triggerWidth: 260,
    advanceX: 1660,
    object: "Rumah Raka",
    popup: "Rumah Raka - Tekan E untuk memulai Trial of Fire",
    dialog: "Bangun, Raka... rumahmu ada di depan sana. Di rumah itu kau akan menemukan cara membuat cahaya.",
    afterDialog: "Obor itu akan menuntunmu ke hutan. Teruslah ke kanan, jangan kembali terlalu jauh.",
    hints: [
      { x: 520, text: "Terus ikuti jalan di dalam rumah. Bahan untuk obor ada di depan." }
    ]
  },
  {
    name: "Hutan Gelap",
    className: "scene-forest",
    worldWidth: wideSideWorldWidth,
    triggerX: scaleWideSideX(855),
    triggerWidth: scaleWideSideX(170),
    advanceX: scaleWideSideX(1660),
    object: "Jurang Hutan",
    popup: "Jurang Hutan - Periksa tepinya dan buat jalan untuk menyeberang",
    dialog: "Jalan di depan terputus oleh jurang. Periksa tepinya sebelum mencari bahan di sekitar hutan.",
    afterDialog: "Jembatan sudah terpasang. Lanjut ke kanan, suara air terjun menunggu di depan.",
    hints: []
  },
  {
    name: "Sungai dan Air Terjun",
    className: "scene-river",
    worldWidth: wideSideWorldWidth,
    triggerX: scaleWideSideX(1500),
    triggerWidth: scaleWideSideX(200),
    advanceX: scaleWideSideX(1660),
    object: "Kristal Air Terjun",
    popup: "Pintu Cahaya - Periksa mekanisme pintu batu di ujung jalan",
    dialog: "Jalan di depan tampak kosong. Susuri tepian sungai dan periksa pintu batu di dekat air terjun.",
    afterDialog: "Kunci cahaya telah terbentuk. Teruskan perjalananmu menuju lembah.",
    hints: [
      { x: scaleWideSideX(520), text: "Dengarkan arah suara air terjun. Pintu batu berada di ujung jalan." },
      { x: scaleWideSideX(900), text: "Terus berjalan dan periksa pintunya lebih dahulu." }
    ]
  },
  {
    name: "Lembah Batu Kuno",
    className: "scene-heritage",
    worldWidth: wideSideWorldWidth,
    triggerX: 2860,
    triggerWidth: 230,
    advanceX: 2920,
    object: "Pintu Batu Kuno",
    popup: "Pintu Batu Kuno - Periksa relung simbol pada pintu di ujung lembah",
    dialog: "Lembah ini tampak kosong. Berjalanlah ke pintu kuno di ujung kanan dan periksa mengapa pintunya tidak terbuka.",
    afterDialog: "Simbol keluarga sudah menyala. Goa Purba berada di kanan, tapi jalannya tidak ramah.",
    hints: [
      { x: scaleWideSideX(730), text: "Pintu kuno berada di ujung kanan lembah. Periksa pintunya terlebih dahulu." }
    ]
  },
  {
    name: "Goa Purba",
    className: "scene-cave",
    worldWidth: caveSideWorldWidth,
    triggerX: 1370,
    triggerWidth: 260,
    advanceX: 1440,
    object: "Lorong Goa Purba",
    popup: "Lorong Goa Purba - Tekan E untuk memulai Trial of Survival",
    dialog: "Kita sudah dekat, Raka. Lihat bayangan batu sebelum jatuh.",
    afterDialog: "Peta keluarga lengkap. Jalan terdalam terbuka untukmu.",
    hints: [
      { x: scaleCaveSideX(560), text: "Obormu masih menyala. Tetap dekat dengan cahaya." },
      { x: scaleCaveSideX(980), text: "Goa ini tidak akan membiarkanmu lewat begitu saja." }
    ]
  }
];

const toolAssets = {
  Kayu: "Assets TLD/items/kayu.png",
  Kain: "Assets TLD/items/kain.png",
  Minyak: "Assets TLD/items/minyak.png",
  Percikan: "Assets TLD/items/percikan.png",
  "Obor Mati": "Assets TLD/items/obor_mati.png",
  Air: "assets/tool-water.svg",
  "Batu dingin": "assets/tool-stone.svg",
  Tanah: "assets/tool-soil.svg"
};

const natureAssets = {
  "Serat Tumbuhan": "Assets TLD/items/serat_tumbuhan.png",
  "Pilin Serat": "Assets TLD/items/serat_dipilin.png",
  "Kayu Jembatan": "Assets TLD/items/kayu_jembatan.png",
  "Ikat Rangka": "Assets TLD/items/jembatan_proses.png",
  "Jembatan Jadi": "Assets TLD/items/jembatan_jadi.png"
};

const lightAssets = [
  "Assets TLD/items/pecahan_kaca_1.png",
  "Assets TLD/items/pecahan_kaca_2.png",
  "Assets TLD/items/pecahan_kaca_3.png",
  "Assets TLD/items/pecahan_kaca_4.png",
  "Assets TLD/items/pecahan_kaca_5.png"
];

const lightCollectibles = lightAssets.map((asset, index) => ({
  name: `Pecahan Kaca ${index + 1}`,
  x: scaleWideSideX(280 + index * 240),
  asset
}));

const heritageCollectibles = [
  { name: "Matahari", x: 360 },
  { name: "Sungai", x: 630 },
  { name: "Gunung", x: 900 },
  { name: "Rumah", x: 1170 },
  { name: "Api", x: 1440 },
  { name: "Daun", x: 1710 },
  { name: "Batu", x: 1980 },
  { name: "Bulan", x: 2250 }
];

const heritageAssets = {
  Matahari: "Assets TLD/items/batu_matahari.png",
  Sungai: "Assets TLD/items/batu_sungai.png",
  Gunung: "Assets TLD/items/batu_gunung.png",
  Rumah: "Assets TLD/items/batu_rumah.png",
  Api: "Assets TLD/items/batu_api.png",
  Daun: "Assets TLD/items/batu_daun.png",
  Batu: "Assets TLD/items/batu_batu.png",
  Bulan: "Assets TLD/items/batu_bulan.png"
};

const rewardAssets = {
  Obor: "Assets TLD/items/obor_nyala.png",
  "Obor Mati": "Assets TLD/items/obor_mati.png",
  Jembatan: "Assets TLD/items/jembatan_jadi.png",
  "Kunci Cahaya": "assets/item-kunci-cahaya.svg",
  "Batu Ukir": "Assets TLD/items/batu_simbol.png",
  "Potongan Peta Terakhir": "Assets TLD/items/map_piece_5.png",
  "Peta terbakar": "Assets TLD/items/map_piece_1.png"
};

const mapAssets = {
  pieces: [
    "",
    "Assets TLD/items/map_piece_1.png",
    "Assets TLD/items/map_piece_2.png",
    "Assets TLD/items/map_piece_3.png",
    "Assets TLD/items/map_piece_4.png",
    "Assets TLD/items/map_piece_5.png"
  ],
  complete: "Assets TLD/items/map.png"
};

const rakaFrames = {
  idle: "Assets TLD/character/raka_idle.png?v=20260922-raka-v2",
  walk1: "Assets TLD/character/raka_walk_01.png?v=20260922-raka-v2",
  walk2: "Assets TLD/character/raka_walk_02.png?v=20260922-raka-v2",
  walk3: "Assets TLD/character/raka_walk_03.png?v=20260922-raka-v2",
  walk4: "Assets TLD/character/raka_walk_04.png?v=20260922-raka-v2",
  walk5: "Assets TLD/character/raka_walk_05.png?v=20260922-raka-v2",
  walk6: "Assets TLD/character/raka_walk_06.png?v=20260922-raka-v2",
  walk7: "Assets TLD/character/raka_walk_07.png?v=20260922-raka-v2",
  walk8: "Assets TLD/character/raka_walk_08.png?v=20260922-raka-v2",
  hurt: "Assets TLD/character/raka_idle.png?v=20260922-raka-v2",
  interact: "Assets TLD/character/raka_idle.png?v=20260922-raka-v2",
  torch: "Assets TLD/character/raka_torch_idle.png?v=20260922-raka-v2",
  torchWalk1: "Assets TLD/character/raka_torch_walk_01.png?v=20260922-raka-v2",
  torchWalk2: "Assets TLD/character/raka_torch_walk_02.png?v=20260922-raka-v2",
  torchWalk3: "Assets TLD/character/raka_torch_walk_03.png?v=20260922-raka-v2",
  torchWalk4: "Assets TLD/character/raka_torch_walk_04.png?v=20260922-raka-v2",
  torchWalk5: "Assets TLD/character/raka_torch_walk_05.png?v=20260922-raka-v2",
  torchWalk6: "Assets TLD/character/raka_torch_walk_06.png?v=20260922-raka-v2",
  torchWalk7: "Assets TLD/character/raka_torch_walk_07.png?v=20260922-raka-v2",
  torchWalk8: "Assets TLD/character/raka_torch_walk_08.png?v=20260922-raka-v2"
};

const rakaAnimation = {
  referenceWidth: 166,
  frameDuration: 84,
  sequences: {
    // Frame 01 dan 02 identik. Frame 02 dilewati agar langkah tidak tertahan.
    normal: ["walk7", "walk8", "walk1", "walk3", "walk4", "walk5", "walk6"],
    // Mulai dari pose yang paling dekat dengan idle supaya transisi awal lembut.
    torch: ["torchWalk7", "torchWalk8", "torchWalk1", "torchWalk2", "torchWalk3", "torchWalk4", "torchWalk5", "torchWalk6"]
  },
  footOffsets: {
    idle: 0,
    walk1: 8,
    walk2: 8,
    walk3: 8,
    walk4: 10,
    walk5: 7,
    walk6: 9,
    walk7: 5,
    walk8: 7,
    torch: 0,
    torchWalk1: 8,
    torchWalk2: 3,
    torchWalk3: 4,
    torchWalk4: 5,
    torchWalk5: 3,
    torchWalk6: 2,
    torchWalk7: 3,
    torchWalk8: 4
  }
};

function getRakaWalkSequence(hasTorch = false) {
  return hasTorch ? rakaAnimation.sequences.torch : rakaAnimation.sequences.normal;
}

function getRakaWalkFrame(walkClock, hasTorch = false) {
  const sequence = getRakaWalkSequence(hasTorch);
  const index = Math.floor(Math.max(0, walkClock) / rakaAnimation.frameDuration) % sequence.length;
  return sequence[index];
}

function getRakaWalkCycleDuration(hasTorch = false) {
  return getRakaWalkSequence(hasTorch).length * rakaAnimation.frameDuration;
}

function getScaledRakaFootOffset(frameKey, renderedWidth = rakaAnimation.referenceWidth) {
  const baseOffset = rakaAnimation.footOffsets[frameKey] || 0;
  return baseOffset * renderedWidth / rakaAnimation.referenceWidth;
}
