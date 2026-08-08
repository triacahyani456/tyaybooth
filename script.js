// Config Firebase
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

const video = document.getElementById('webcam');
const canvas = document.getElementById('photo-strip-canvas');
const ctx = canvas.getContext('2d');
let capturedPhotos = [];
let currentFrame = 'cute-pink';

// ==========================================
// FIX KAMERA HP & DESKTOP
// ==========================================
async function initCamera() {
  try {
    // Constraint khusus HP: memprioritaskan kamera depan (user)
    const constraints = {
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    
    // Memastikan video langsung di-play di HP (khusus Safari/Chrome Mobile)
    await video.play();
  } catch (err) {
    console.error("Camera error:", err);
    alert("Kamera tidak muncul! Pastikan:\n1. Mengizinkan akses kamera di browser.\n2. Jika dibuka di HP, jalankan lewat HTTPS atau Local Server (VS Code Live Server).");
  }
}

// Panggil fungsi kamera saat halaman selesai dimuat
window.addEventListener('DOMContentLoaded', initCamera);

function selectFrame(frameStyle) {
  currentFrame = frameStyle;
  if (capturedPhotos.length === 3) {
    renderPhotoStrip();
  }
}

// ==========================================
// LOGIKA JEPRET FOTO
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
  // Ambil ukuran asli video webcam
  tempCanvas.width = video.videoWidth || 1280;
  tempCanvas.height = video.videoHeight || 960;
  const tempCtx = tempCanvas.getContext('2d');
  
  // Flip Horizontal (Mirroring)
  tempCtx.translate(tempCanvas.width, 0);
  tempCtx.scale(-1, 1);
  tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
  
  capturedPhotos.push(tempCanvas.toDataURL('image/png'));
}

// ==========================================
// RENDER CANVAS STRIP
// ==========================================
function renderPhotoStrip() {
  const w = 600;
  const h = 1800;
  canvas.width = w;
  canvas.height = h;

  // Background Frame
  if (currentFrame === 'cute-pink') ctx.fillStyle = '#fbcfe8';
  else if (currentFrame === 'retro-black') ctx.fillStyle = '#1e293b';
  else ctx.fillStyle = '#ffffff';

  ctx.fillRect(0, 0, w, h);

  const photoW = 520;
  const photoH = 390;
  const startX = 40;
  const startY = 120;
  const gap = 40;

  let loadedCount = 0;
  capturedPhotos.forEach((src, idx) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const y = startY + idx * (photoH + gap);
      ctx.drawImage(img, startX, y, photoW, photoH);
      loadedCount++;

      if (loadedCount === capturedPhotos.length) {
        // Teks Brand Tyayabooth
        ctx.font = 'bold 42px "Pacifico", cursive, sans-serif';
        ctx.fillStyle = currentFrame === 'retro-black' ? '#ffffff' : '#ec4899';
        ctx.textAlign = 'center';
        ctx.fillText('Tyayabooth ✨', w / 2, h - 80);

        const dataUrl = canvas.toDataURL('image/png');
        const previewContainer = document.getElementById('preview-container');
        previewContainer.innerHTML = `<img src="${dataUrl}" class="w-full h-auto rounded-xl shadow-md" />`;
        
        document.getElementById('download-link').href = dataUrl;
        document.getElementById('result-actions').classList.remove('hidden');
      }
    };
  });
}

// ==========================================
// UPLOAD FIREBASE & QR CODE
// ==========================================
async function uploadToFirebase() {
  if (!storage) {
    alert("Isi firebaseConfig di script.js terlebih dahulu!");
    return;
  }

  const btn = document.getElementById('btn-upload');
  btn.innerText = "⏳ Mengunggah...";
  btn.disabled = true;

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const fileName = `tyayabooth_${Date.now()}.png`;
    const storageRef = storage.ref(`photobooth/${fileName}`);
    
    await storageRef.putString(dataUrl, 'data_url');
    const downloadURL = await storageRef.getDownloadURL();

    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: downloadURL,
      width: 140,
      height: 140
    });

    document.getElementById('qr-box').classList.remove('hidden');
    btn.innerText = "✅ Berhasil Diunggah!";
  } catch (error) {
    alert("Gagal upload: " + error.message);
    btn.innerText = "☁️ Upload & Buat QR Code";
    btn.disabled = false;
  }
}