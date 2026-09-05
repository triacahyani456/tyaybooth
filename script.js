// ==========================================
// 1. FIREBASE & SUPABASE CONFIG
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let storage = null;
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
  storage = firebase.storage();
}

// Inisialisasi Supabase Client via CDN Global (window.supabase)
const supabaseUrl = 'https://rumifogmharcbeircfkb.supabase.co';
const supabaseKey = 'sb_publishable_-sOHWB3HMq6-B1p6lrLo0A_pagYED9Q';
const sbClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const video = document.getElementById('webcam');
const canvas = document.getElementById('photo-strip-canvas');
const ctx = canvas.getContext('2d');
let capturedPhotos = [];
let currentFrameId = 'postal-frame';
let currentFrameData = null;
let frameDatabase = [];

// ==========================================
// 2. LOAD FRAME LANGSUNG (TANPA RIBET DATABASE)
// ==========================================
async function loadFramesFromSupabase() {
  frameDatabase = [
    {
      id: 'postal-frame',
      category: 'vintage',
      name: 'Classical Music Stamp',
      uses: '1,240 uses',
      bg: '#fbf9f1',
      accent: '#b91c1c',
      frame_image_url: 'https://rumifogmharcbeircfkb.supabase.co/storage/v1/object/public/frames/aeriyha_pindown.io_1788588171.jpg'
    }
  ];
  renderFrameGrid('all');
}

// Render Grid Katalog Card
function renderFrameGrid(filter = 'all') {
  const grid = document.getElementById('frame-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = filter === 'all' ? frameDatabase : frameDatabase.filter(f => f.category === filter);

  filtered.forEach(frame => {
    const card = document.createElement('div');
    card.className = "bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 cursor-pointer group";
    
    card.innerHTML = `
      <div class="w-full h-56 rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden shadow-inner border border-slate-100" style="background-color: ${frame.bg};">
        <div class="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">
          ${frame.category}
        </div>
        
        <div class="w-16 h-40 bg-white shadow-md rounded-md p-1.5 flex flex-col gap-1.5 justify-between border border-black/5 group-hover:scale-105 transition-transform">
          <div class="w-full h-10 bg-slate-200 rounded-sm"></div>
          <div class="w-full h-10 bg-slate-200 rounded-sm"></div>
          <div class="w-full h-10 bg-slate-200 rounded-sm"></div>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <h3 class="font-serif font-bold text-slate-900 text-sm group-hover:text-rose-500 transition">${frame.name}</h3>
          <span class="text-[10px] text-slate-400 font-medium">${frame.uses}</span>
        </div>
        <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <span class="text-[11px] text-slate-500 font-medium">3 photos</span>
          <span class="text-[11px] font-bold text-slate-900 group-hover:underline">Gunakan &rarr;</span>
        </div>
      </div>
    `;

    card.onclick = () => selectAndProceed(frame);
    grid.appendChild(card);
  });
}

function filterFrames(category, event) {
  document.querySelectorAll('.category-btn').forEach(b => {
    b.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
    b.classList.add('bg-white', 'border', 'border-slate-200', 'text-slate-600');
  });
  if(event && event.currentTarget) {
    event.currentTarget.classList.remove('bg-white', 'border', 'border-slate-200', 'text-slate-600');
    event.currentTarget.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
  }
  renderFrameGrid(category);
}

// ==========================================
// 3. MODAL BUAT TEMPLATE KUSTOM
// ==========================================
function openTemplateModal() {
  document.getElementById('template-modal').classList.remove('hidden');
}

function closeTemplateModal() {
  document.getElementById('template-modal').classList.add('hidden');
}

function handleCreateTemplate(event) {
  event.preventDefault();
  alert("Fitur kustom template disederhanakan. Frame utamamu sudah siap dipakai!");
  closeTemplateModal();
}

// ==========================================
// 4. NAVIGASI & KAMERA
// ==========================================
function selectAndProceed(frame) {
  currentFrameId = frame.id;
  currentFrameData = frame;

  document.getElementById('active-frame-name').innerText = frame.name;
  document.getElementById('view-select-frame').classList.add('hidden');
  document.getElementById('view-camera').classList.remove('hidden');

  initCamera();
}

function backToFrameSelection() {
  document.getElementById('view-camera').classList.add('hidden');
  document.getElementById('view-select-frame').classList.remove('hidden');
  
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
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
    alert("Gagal mengaktifkan kamera!");
  }
}

// ==========================================
// 5. PROSES FOTO & RENDER (URUTAN LAYER DIBALIK)
// ==========================================
async function startPhotoProcess() {
  capturedPhotos = [];
  const btn = document.getElementById('btn-snap');
  btn.disabled = true;
  btn.classList.add('opacity-50');

  for (let i = 0; i < 3; i++) {
    await runCountdown(3);
    triggerFlash();
    capturePhoto();
    await new Promise(r => setTimeout(r, 800));
  }

  renderPhotoStrip();
  btn.disabled = false;
  btn.classList.remove('opacity-50');
}

function runCountdown(seconds) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('countdown-overlay');
    const text = document.getElementById('countdown-text');
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
  flash.classList.remove('opacity-0');
  flash.classList.add('opacity-100');
  setTimeout(() => {
    flash.classList.remove('opacity-100');
    flash.classList.add('opacity-0');
  }, 150);
}

function capturePhoto() {
  const tempCanvas = document.createElement('canvas');
  const targetW = 380;
  const targetH = 265;
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

function renderPhotoStrip() {
  const w = 600;
  const h = 1200;
  canvas.width = w;
  canvas.height = h;

  // 1. Gambar frame di latar belakang terlebih dahulu
  const frameImg = new Image();
  frameImg.crossOrigin = "anonymous";
  frameImg.src = currentFrameData.frame_image_url;
  
  frameImg.onload = () => {
    ctx.drawImage(frameImg, 0, 0, w, h);

    // 2. Timpa foto-foto di atas area lubang frame
    const photoW = 380;
    const photoH = 265;
    const startX = (w - photoW) / 2;
    const startY = 195; 
    const gap = 38;     

    let loadedPhotos = 0;
    capturedPhotos.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const y = startY + idx * (photoH + gap);
        ctx.drawImage(img, startX, y, photoW, photoH);
        loadedPhotos++;

        if (loadedPhotos === capturedPhotos.length) {
          finishRender();
        }
      };
    });
  };
  
  frameImg.onerror = () => {
    alert("Gagal memuat gambar frame dari Supabase.");
    finishRender();
  };
}

function finishRender() {
  const dataUrl = canvas.toDataURL('image/png');
  document.getElementById('preview-container').innerHTML = `<img src="${dataUrl}" class="w-full h-auto rounded-xl shadow-md border border-slate-100" />`;
  document.getElementById('download-link').href = dataUrl;
  document.getElementById('result-actions').classList.remove('hidden');
}

// ==========================================
// 6. FIREBASE & QR CODE
// ==========================================
async function uploadToFirebase() {
  if (!storage) {
    alert("Isi firebaseConfig di script.js terlebih dahulu.");
    return;
  }

  const btn = document.getElementById('btn-upload');
  btn.innerText = "Mengunggah...";
  btn.disabled = true;

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const fileName = `tyayabooth_${Date.now()}.png`;
    const storageRef = storage.ref(`photobooth/${fileName}`);
    await storageRef.putString(dataUrl, 'data_url');
    const downloadURL = await storageRef.getDownloadURL();

    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, { text: downloadURL, width: 130, height: 130 });

    document.getElementById('qr-box').classList.remove('hidden');
    btn.innerText = "Berhasil Diunggah";
  } catch (error) {
    alert("Gagal upload: " + error.message);
    btn.innerText = "Upload & Buat QR Code";
    btn.disabled = false;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadFramesFromSupabase();
});