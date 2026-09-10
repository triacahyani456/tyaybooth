// ==========================================
// 1. SUPABASE & FIREBASE CONFIG
// ==========================================
const supabaseUrl = 'https://rumifogmharcbeircfkb.supabase.co';
const supabaseKey = 'sb_publishable_-sOHWB3HMq6-B1p6lrLo0A_pagYED9Q';
const sbClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Konfigurasi Firebase (Opsional untuk Upload QR Code)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let storage = null;
if (firebaseConfig.apiKey !== "YOUR_API_KEY" && typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  storage = firebase.storage();
}

const video = document.getElementById('webcam');
const canvas = document.getElementById('photo-strip-canvas');
const ctx = canvas.getContext('2d');

let capturedPhotos = [];
let currentFrameId = 'frame-nadin';
let currentFrameData = null;
let frameDatabase = [];
let targetRetakeIndex = null;

// ==========================================
// 2. LOAD FRAME DATABASE & KOORDINAT KOTAK
// ==========================================
async function loadFramesFromSupabase() {
  frameDatabase = [
    {
      id: 'frame-nadin',
      category: 'pinterest',
      name: 'Nadin Amizah Music Frame',
      uses: '1,240 uses',
      photoCount: 3,
      bg: '#fbf9f1',
      accent: '#b91c1c',
      frame_image_url: 'https://rumifogmharcbeircfkb.supabase.co/storage/v1/object/public/frames/Nadin.png',
      slotY: [180, 620, 1060]
    },
    {
      id: 'frame-hindia',
      category: 'pinterest',
      name: 'Hindia Music Frame',
      uses: '310 uses',
      photoCount: 3,
      bg: '#fbf9f1',
      accent: '#b91c1c',
      frame_image_url: 'https://rumifogmharcbeircfkb.supabase.co/storage/v1/object/public/frames/Hindia.png',
      slotY: [180, 620, 1060]
    },
    {
      id: 'frame-cute',
      category: 'y2k',
      name: 'Cute Aesthetic Frame',
      uses: '520 uses',
      photoCount: 3,
      bg: '#e0f2fe',
      accent: '#0284c7',
      frame_image_url: 'https://rumifogmharcbeircfkb.supabase.co/storage/v1/object/public/frames/Cute.png',
      slotY: [180, 620, 1060]
    },
    {
      id: 'frame-vintage-love',
      category: 'vintage',
      name: 'Vintage Love Aesthetic',
      uses: '850 uses',
      photoCount: 3,
      bg: '#fbf9f1',
      accent: '#e11d48',
      frame_image_url: 'https://rumifogmharcbeircfkb.supabase.co/storage/v1/object/public/frames/Vintage.png',
      slotY: [180, 620, 1060]
    },
    {
      id: 'frame-vintage-1',
      category: 'vintage',
      name: 'Vintage Classic 1',
      uses: '410 uses',
      photoCount: 3,
      bg: '#fbf9f1',
      accent: '#9a3412',
      frame_image_url: 'https://rumifogmharcbeircfkb.supabase.co/storage/v1/object/public/frames/1.png',
      // KHUSUS VINTAGE 1: Digeser ke tengah kotak (lebih ke bawah)
      slotY: [250, 690, 1130] 
    },
    {
      id: 'frame-vintage-2',
      category: 'vintage',
      name: 'Vintage Classic 2',
      uses: '380 uses',
      photoCount: 2, // KHUSUS 2 JEPRETAN
      bg: '#fbf9f1',
      accent: '#9a3412',
      frame_image_url: 'https://rumifogmharcbeircfkb.supabase.co/storage/v1/object/public/frames/2.png',
      slotY: [180, 620] 
    }
  ];

  renderFrameGrid('all');
}

function renderFrameGrid(filter = 'all') {
  const grid = document.getElementById('frame-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = filter === 'all' 
    ? frameDatabase 
    : frameDatabase.filter(f => f.category.toLowerCase() === filter.toLowerCase());

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-10 text-xs text-slate-400">Belum ada template pada kategori ini.</div>`;
    return;
  }

  filtered.forEach(frame => {
    const card = document.createElement('div');
    card.className = "bg-white border border-slate-200/80 rounded-3xl p-4 flex flex-col justify-between hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer group relative overflow-hidden";
    
    card.innerHTML = `
      <div class="w-full h-72 rounded-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden shadow-inner border border-slate-100/80" style="background-color: ${frame.bg || '#fbf9f1'};">
        <div class="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm z-10">
          <svg class="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          ${frame.uses || '100+ uses'}
        </div>
        <img src="${frame.frame_image_url}" crossorigin="anonymous" class="h-60 w-auto object-contain drop-shadow-md rounded-lg group-hover:scale-105 transition-transform duration-300" />
      </div>

      <div class="mt-4 px-1 flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <h3 class="font-serif font-bold text-slate-900 text-sm group-hover:text-rose-500 transition">${frame.name}</h3>
        </div>
        <div class="flex items-center justify-between mt-1 text-xs text-slate-400 font-medium">
          <span>${frame.photoCount} photos</span>
          <span class="text-xs font-bold text-slate-900 group-hover:underline flex items-center gap-1">Gunakan &rarr;</span>
        </div>
      </div>
    `;

    card.onclick = () => selectAndProceed(frame);
    grid.appendChild(card);
  });
}

function filterFrames(category, btnElement) {
  document.querySelectorAll('.category-btn').forEach(b => {
    b.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
    b.classList.add('bg-white', 'border', 'border-slate-200', 'text-slate-600', 'hover:bg-slate-50');
  });
  
  const targetBtn = btnElement || event?.currentTarget;
  if (targetBtn) {
    targetBtn.classList.remove('bg-white', 'border', 'border-slate-200', 'text-slate-600', 'hover:bg-slate-50');
    targetBtn.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
  }

  renderFrameGrid(category);
}

// ==========================================
// 3. MODAL BUAT TEMPLATE KUSTOM
// ==========================================
function openTemplateModal() {
  const modal = document.getElementById('template-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeTemplateModal() {
  const modal = document.getElementById('template-modal');
  if (modal) modal.classList.add('hidden');
}

function handleCreateTemplate(event) {
  event.preventDefault();
  const name = document.getElementById('tpl-name').value;
  const category = document.getElementById('tpl-category').value;
  const bg = document.getElementById('tpl-bg').value;
  const accent = document.getElementById('tpl-accent').value;

  const newCustomFrame = {
    id: 'custom-' + Date.now(),
    category: category,
    name: name,
    uses: '1 use',
    photoCount: 3,
    bg: bg,
    accent: accent,
    frame_image_url: 'https://rumifogmharcbeircfkb.supabase.co/storage/v1/object/public/frames/Nadin.png',
    slotY: [180, 620, 1060]
  };

  frameDatabase.unshift(newCustomFrame);
  closeTemplateModal();
  renderFrameGrid('all');
  selectAndProceed(newCustomFrame);
}

// ==========================================
// 4. NAVIGASI & KAMERA
// ==========================================
function selectAndProceed(frame) {
  currentFrameId = frame.id;
  currentFrameData = frame;
  targetRetakeIndex = null;

  const frameNameEl = document.getElementById('active-frame-name');
  if (frameNameEl) frameNameEl.innerText = frame.name;

  const btnSnap = document.getElementById('btn-snap');
  if (btnSnap) {
    btnSnap.innerText = `Mulai Sesi Foto (${frame.photoCount} Jepretan)`;
  }

  document.getElementById('view-select-frame').classList.add('hidden');
  document.getElementById('view-camera').classList.remove('hidden');

  document.getElementById('result-actions').classList.add('hidden');
  document.getElementById('preview-container').innerHTML = '<span class="text-xs font-medium text-slate-400">Hasil jepretan akan muncul di sini</span>';

  initCamera();
}

function backToFrameSelection() {
  document.getElementById('view-camera').classList.add('hidden');
  document.getElementById('view-select-frame').classList.remove('hidden');
  
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
}

function retakePhotos() {
  capturedPhotos = [];
  targetRetakeIndex = null;
  document.getElementById('result-actions').classList.add('hidden');
  document.getElementById('preview-container').innerHTML = '<span class="text-xs font-medium text-slate-400">Hasil jepretan akan muncul di sini</span>';
  document.getElementById('view-camera').classList.remove('hidden');
  initCamera();
}

function triggerSingleRetake(index) {
  targetRetakeIndex = index;
  document.getElementById('result-actions').classList.add('hidden');
  document.getElementById('view-camera').classList.remove('hidden');
  initCamera();
}

async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    alert("Gagal mengaktifkan kamera! Pastikan izin akses kamera diaktifkan pada browser Anda.");
  }
}

// ==========================================
// 5. PROSES FOTO & RENDER KANVAS (LANDSCAPE RATIO)
// ==========================================
async function startPhotoProcess() {
  const totalShots = currentFrameData?.photoCount || 3;
  const btn = document.getElementById('btn-snap');

  if (targetRetakeIndex !== null) {
    if (btn) {
      btn.disabled = true;
      btn.classList.add('opacity-50');
    }

    await runCountdown(3);
    triggerFlash();
    capturePhotoAt(targetRetakeIndex);

    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-50');
    }

    targetRetakeIndex = null;
    renderPhotoStrip();
    return;
  }

  capturedPhotos = [];
  if (btn) {
    btn.disabled = true;
    btn.classList.add('opacity-50');
  }

  for (let i = 0; i < totalShots; i++) {
    await runCountdown(3);
    triggerFlash();
    capturePhoto();
    if (i < totalShots - 1) {
      await new Promise(r => setTimeout(r, 800));
    }
  }

  if (btn) {
    btn.disabled = false;
    btn.classList.remove('opacity-50');
  }

  renderPhotoStrip();
}

function runCountdown(seconds) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('countdown-overlay');
    const text = document.getElementById('countdown-text');
    if (!overlay || !text) {
      resolve();
      return;
    }
    overlay.classList.remove('hidden');
    let count = seconds;
    text.innerText = count;

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        text.innerText = count;
      } else {
        clearInterval(interval);
        overlay.classList.add('hidden');
        resolve();
      }
    }, 1000);
  });
}

function triggerFlash() {
  const flash = document.getElementById('flash-effect');
  if (!flash) return;
  flash.classList.remove('opacity-0');
  flash.classList.add('opacity-100');
  setTimeout(() => {
    flash.classList.remove('opacity-100');
    flash.classList.add('opacity-0');
  }, 150);
}

function capturePhoto() {
  const tempCanvas = document.createElement('canvas');
  const targetW = 500;
  const targetH = 335; // Ukuran landscape
  tempCanvas.width = targetW;
  tempCanvas.height = targetH;
  const tempCtx = tempCanvas.getContext('2d');

  const vW = video.videoWidth || 1280;
  const vH = video.videoHeight || 720;
  const targetRatio = targetW / targetH;
  const videoRatio = vW / vH;

  let sourceW, sourceH, sourceX, sourceY;

  if (videoRatio > targetRatio) {
    sourceH = vH;
    sourceW = vH * targetRatio;
    sourceX = (vW - sourceW) / 2;
    sourceY = 0;
  } else {
    sourceW = vW;
    sourceH = vW / targetRatio;
    sourceX = 0;
    sourceY = (vH - sourceH) / 2;
  }

  tempCtx.translate(targetW, 0);
  tempCtx.scale(-1, 1);

  tempCtx.drawImage(
    video,
    sourceX, sourceY, sourceW, sourceH,
    0, 0, targetW, targetH
  );

  capturedPhotos.push(tempCanvas.toDataURL('image/png'));
}

function capturePhotoAt(index) {
  const tempCanvas = document.createElement('canvas');
  const targetW = 500;
  const targetH = 335;
  tempCanvas.width = targetW;
  tempCanvas.height = targetH;
  const tempCtx = tempCanvas.getContext('2d');

  const vW = video.videoWidth || 1280;
  const vH = video.videoHeight || 720;
  const targetRatio = targetW / targetH;
  const videoRatio = vW / vH;

  let sourceW, sourceH, sourceX, sourceY;

  if (videoRatio > targetRatio) {
    sourceH = vH;
    sourceW = vH * targetRatio;
    sourceX = (vW - sourceW) / 2;
    sourceY = 0;
  } else {
    sourceW = vW;
    sourceH = vW / targetRatio;
    sourceX = 0;
    sourceY = (vH - sourceH) / 2;
  }

  tempCtx.translate(targetW, 0);
  tempCtx.scale(-1, 1);

  tempCtx.drawImage(
    video,
    sourceX, sourceY, sourceW, sourceH,
    0, 0, targetW, targetH
  );

  capturedPhotos[index] = tempCanvas.toDataURL('image/png');
}

function renderPhotoStrip() {
  const w = 600;
  const h = 1800;
  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);

  drawFrameOverlay(w, h, () => {
    const photoW = 500;
    const photoH = 335;
    const startX = 50;

    const slotYCoordinates = currentFrameData?.slotY || [180, 620, 1060];

    let loadedPhotos = 0;

    capturedPhotos.forEach((src, idx) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        let y = slotYCoordinates[idx] || 180;
        ctx.drawImage(img, startX, y, photoW, photoH);
        loadedPhotos++;

        if (loadedPhotos === capturedPhotos.length) {
          finishRender();
        }
      };
    });
  });
}

function drawFrameOverlay(w, h, callback) {
  const frameImg = new Image();
  frameImg.crossOrigin = "anonymous";
  frameImg.src = currentFrameData.frame_image_url;
  
  frameImg.onload = () => {
    ctx.drawImage(frameImg, 0, 0, w, h);
    if (callback) callback();
  };
  
  frameImg.onerror = () => {
    console.warn("Gagal memuat gambar frame, merender tanpa frame.");
    if (callback) callback();
  };
}

function finishRender() {
  const dataUrl = canvas.toDataURL('image/png');
  
  let individualPhotosHtml = '';
  capturedPhotos.forEach((photoSrc, idx) => {
    individualPhotosHtml += `
      <div class="flex flex-col items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition">
        <span class="text-[11px] font-bold text-slate-700">Foto #${idx + 1}</span>
        <img src="${photoSrc}" class="w-20 h-14 object-cover rounded-lg border border-slate-100" />
        <button onclick="triggerSingleRetake(${idx})" class="w-full text-[10px] bg-slate-900 text-white font-semibold py-1.5 px-2 rounded-xl hover:bg-rose-500 transition flex items-center justify-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Ulangi
        </button>
      </div>
    `;
  });

  document.getElementById('preview-container').innerHTML = `
    <div class="flex flex-col items-center gap-4 w-full">
      <img src="${dataUrl}" class="w-full h-auto max-h-96 object-contain rounded-xl shadow-md border border-slate-100" />
      <div class="w-full bg-slate-50 p-4 rounded-3xl border border-slate-200/60 flex flex-col items-center">
        <p class="text-xs font-bold text-slate-700 mb-3">Mau ganti salah satu foto yang kurang pas?</p>
        <div class="grid grid-cols-${capturedPhotos.length} gap-2.5 w-full justify-center">
          ${individualPhotosHtml}
        </div>
      </div>
    </div>
  `;
  
  const downloadLink = document.getElementById('download-link');
  if (downloadLink) downloadLink.href = dataUrl;
  
  document.getElementById('result-actions').classList.remove('hidden');
  
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
}

// ==========================================
// 6. FIREBASE & QR CODE
// ==========================================
async function uploadToFirebase() {
  if (!storage) {
    alert("Isi konfigurasi firebaseConfig di script.js terlebih dahulu untuk menggunakan fitur upload QR.");
    return;
  }

  const btn = document.getElementById('btn-upload');
  if (!btn) return;
  
  btn.innerText = "Mengunggah...";
  btn.disabled = true;

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const fileName = `tyayabooth_${Date.now()}.png`;
    const storageRef = storage.ref(`photobooth/${fileName}`);
    await storageRef.putString(dataUrl, 'data_url');
    const downloadURL = await storageRef.getDownloadURL();

    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, { text: downloadURL, width: 130, height: 130 });
    }

    const qrBox = document.getElementById('qr-box');
    if (qrBox) qrBox.classList.remove('hidden');
    
    btn.innerText = "Berhasil Diunggah!";
  } catch (error) {
    alert("Gagal upload: " + error.message);
    btn.innerText = "Upload & Generate QR Code";
    btn.disabled = false;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadFramesFromSupabase();
});