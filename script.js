// ==========================================
// 1. FIREBASE CONFIG
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

const video = document.getElementById('webcam');
const canvas = document.getElementById('photo-strip-canvas');
const ctx = canvas.getContext('2d');
let capturedPhotos = [];
let currentFrame = 'cute-pink';

// ==========================================
// 2. AKSES KAMERA HP & LAPTOP
// ==========================================
async function initCamera() {
  try {
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
    await video.play();
  } catch (err) {
    console.error("Camera Error:", err);
    alert("Gagal mengaktifkan kamera! Pastikan memberi izin kamera & web dijalankan via HTTPS / Live Server.");
  }
}

window.addEventListener('DOMContentLoaded', initCamera);

function selectFrame(frameStyle) {
  currentFrame = frameStyle;
  if (capturedPhotos.length === 3) {
    renderPhotoStrip();
  }
}

// ==========================================
// 3. LOGIKA FOTO & COUNTDOWN
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
  const targetW = 800;
  const targetH = 600;
  tempCanvas.width = targetW;
  tempCanvas.height = targetH;
  
  const tempCtx = tempCanvas.getContext('2d');
  
  tempCtx.translate(targetW, 0);
  tempCtx.scale(-1, 1);

  const vW = video.videoWidth || targetW;
  const vH = video.videoHeight || targetH;
  const videoAspect = vW / vH;
  const targetAspect = targetW / targetH;

  let sx, sy, sWidth, sHeight;

  if (videoAspect > targetAspect) {
    sHeight = vH;
    sWidth = vH * targetAspect;
    sx = (vW - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = vW;
    sHeight = vW / targetAspect;
    sx = 0;
    sy = (vH - sHeight) / 2;
  }

  tempCtx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
  capturedPhotos.push(tempCanvas.toDataURL('image/png'));
}

// ==========================================
// 4. RENDER CANVAS PHOTO STRIP
// ==========================================
function renderPhotoStrip() {
  const w = 600;
  const h = 1800;
  canvas.width = w;
  canvas.height = h;

  if (currentFrame === 'denim-y2k') {
    // --- TEMA DENIM Y2K ---
    ctx.fillStyle = '#46688c';
    ctx.fillRect(0, 0, w, h);

    // Garis tekstur jeans
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    for (let i = -h; i < w + h; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }

    // Jahitan putih luar
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    roundRect(ctx, 20, 20, w - 40, h - 40, 20, false, true);
    ctx.setLineDash([]);

    const photoW = 460;
    const photoH = 350;
    const startX = (w - photoW) / 2;
    const startY = 160;
    const gap = 60;

    let loadedPhotos = 0;
    capturedPhotos.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const y = startY + idx * (photoH + gap);

        ctx.fillStyle = '#2d4561';
        roundRect(ctx, startX - 12, y - 12, photoW + 24, photoH + 24, 16, true, false);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        roundRect(ctx, startX - 6, y - 6, photoW + 12, photoH + 12, 12, false, true);
        ctx.setLineDash([]);

        ctx.drawImage(img, startX, y, photoW, photoH);
        loadedPhotos++;

        if (loadedPhotos === capturedPhotos.length) {
          // Stiker E S H
          const letters = ['E', 'S', 'H'];
          const colors = ['#f472b6', '#3b82f6', '#facc15'];
          letters.forEach((let, i) => {
            ctx.fillStyle = colors[i];
            ctx.beginPath();
            ctx.arc(45, 180 + i * 40, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(let, 45, 186 + i * 40);
          });

          // Stiker ✨
          ctx.fillStyle = '#fef08a';
          ctx.font = '32px sans-serif';
          ctx.fillText('✨', w - 50, 120);

          // Stiker 💖
          ctx.fillStyle = '#f472b6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          roundRect(ctx, 40, 520, 80, 70, 20, true, true);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px sans-serif';
          ctx.fillText('💖', 80, 568);

          // Stiker Angka
          const numbers = ['13', '01', '09'];
          numbers.forEach((num, i) => {
            ctx.fillStyle = '#fef08a';
            roundRect(ctx, w - 85, 500 + i * 45, 45, 30, 6, true, false);
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 16px monospace';
            ctx.fillText(num, w - 62, 521 + i * 45);
          });

          // Hati 🤍
          ctx.font = '50px sans-serif';
          ctx.fillText('🤍', w - 90, h - 230);

          // Footer
          const footerY = startY + 3 * (photoH + gap) + 10;
          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('Locker 17', 60, footerY);

          ctx.font = 'bold italic 48px "Pacifico", cursive, sans-serif';
          ctx.fillStyle = '#f472b6';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 6;
          ctx.strokeText('Sweetheart!', w / 2, footerY + 60);
          ctx.fillText('Sweetheart!', w / 2, footerY + 60);

          ctx.fillStyle = '#1e293b';
          roundRect(ctx, 60, footerY + 80, 160, 36, 8, true, false);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('#Tyayabooth', 140, footerY + 104);

          finishRender();
        }
      };
    });

  } else if (currentFrame === 'train-ticket') {
    // --- TEMA TRAIN TICKET ---
    const maroonColor = '#6b1d22';
    const creamColor = '#fdfbf2';

    ctx.fillStyle = creamColor;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = maroonColor;
    ctx.lineWidth = 10;
    roundRect(ctx, 30, 30, w - 60, h - 60, 40, false, true);

    ctx.fillStyle = maroonColor;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE', w / 2, 90);
    ctx.font = '900 48px sans-serif';
    ctx.fillText('SNAP EXPRESS', w / 2, 140);
    ctx.font = '40px sans-serif';
    ctx.fillText('🚂', w / 2, 190);

    ctx.beginPath();
    ctx.moveTo(w / 2 - 100, 210);
    ctx.lineTo(w / 2 + 100, 210);
    ctx.lineWidth = 3;
    ctx.stroke();

    const photoW = 480;
    const photoH = 380;
    const startX = (w - photoW) / 2;
    const startY = 240;
    const gap = 30;

    let loadedCount = 0;
    capturedPhotos.forEach((src, idx) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const y = startY + idx * (photoH + gap);

        ctx.strokeStyle = maroonColor;
        ctx.lineWidth = 8;
        roundRect(ctx, startX - 4, y - 4, photoW + 8, photoH + 8, 12, false, true);

        ctx.drawImage(img, startX, y, photoW, photoH);
        loadedCount++;

        if (loadedCount === capturedPhotos.length) {
          const footerY = startY + 3 * (photoH + gap) + 20;

          ctx.fillStyle = maroonColor;
          ctx.font = 'bold 36px sans-serif';
          ctx.fillText('TRAIN TICKET', w / 2, footerY);

          ctx.font = '24px sans-serif';
          ctx.fillText('★ ★ ★', w / 2, footerY + 35);

          const boxW = 340;
          const boxH = 60;
          const boxX = (w - boxW) / 2;
          const boxY = footerY + 55;

          ctx.strokeStyle = maroonColor;
          ctx.lineWidth = 6;
          roundRect(ctx, boxX, boxY, boxW, boxH, 20, false, true);

          ctx.font = '900 24px sans-serif';
          ctx.fillText('TYAYABOOTH • SEAT A33', w / 2, boxY + 38);

          finishRender();
        }
      };
    });

  } else {
    // --- FRAME STANDAR ---
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
          ctx.font = 'bold 42px "Pacifico", cursive, sans-serif';
          ctx.fillStyle = currentFrame === 'retro-black' ? '#ffffff' : '#ec4899';
          ctx.textAlign = 'center';
          ctx.fillText('Tyayabooth ✨', w / 2, h - 80);

          finishRender();
        }
      };
    });
  }
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function finishRender() {
  const dataUrl = canvas.toDataURL('image/png');
  const previewContainer = document.getElementById('preview-container');
  previewContainer.innerHTML = `<img src="${dataUrl}" class="w-full h-auto rounded-xl shadow-md" />`;

  document.getElementById('download-link').href = dataUrl;
  document.getElementById('result-actions').classList.remove('hidden');
}

// ==========================================
// 5. UPLOAD TO FIREBASE & QR CODE
// ==========================================
async function uploadToFirebase() {
  if (!storage) {
    alert("Isi `firebaseConfig` di bagian atas script.js dengan milikmu terlebih dahulu!");
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