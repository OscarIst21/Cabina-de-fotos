const video = document.getElementById('video');
const canvas = document.getElementById('photo-canvas');
const ctx = canvas.getContext('2d');
const captureBtn = document.getElementById('capture-btn');
const retakeBtn = document.getElementById('retake-btn');
const printBtn = document.getElementById('print-btn');
const clearBtn = document.getElementById('clear-btn');
const colorPicker = document.getElementById('color-picker');
const brushSize = document.getElementById('brush-size');
const cameraView = document.getElementById('camera-view');
const editView = document.getElementById('edit-view');
const cameraControls = document.getElementById('camera-controls');
const editControls = document.getElementById('edit-controls');
const countdownOverlay = document.getElementById('countdown');
const flashOverlay = document.getElementById('flash-overlay');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let originalFrame = null;

// Inicializar cámara
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1920 }, 
                height: { ideal: 1080 },
                facingMode: "user" 
            } 
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        alert("No se pudo acceder a la cámara.");
    }
}

// Capturar foto con cuenta regresiva
captureBtn.addEventListener('click', () => {
    let timeLeft = 5;
    captureBtn.disabled = true;
    countdownOverlay.style.display = 'block';
    countdownOverlay.textContent = timeLeft;

    const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            countdownOverlay.textContent = timeLeft;
            // Activar flash en el último segundo (cuando timeLeft es 1 y ha pasado medio segundo, o simplemente al llegar a 0)
            if (timeLeft === 1) {
                setTimeout(() => {
                    flashOverlay.style.display = 'block';
                }, 500); // Flash 500ms antes de la foto
            }
        } else {
            clearInterval(timer);
            countdownOverlay.style.display = 'none';
            captureBtn.disabled = false;
            takePhoto();
            // Desactivar flash después de tomar la foto
            setTimeout(() => {
                flashOverlay.style.display = 'none';
            }, 100);
        }
    }, 1000);
});

function takePhoto() {
    // Configurar dimensiones del canvas para que coincidan con el video real
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dibujar el video actual en el canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Guardar el frame original para poder "limpiar" el dibujo
    originalFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Cambiar vistas y controles
    cameraView.classList.remove('active');
    cameraControls.classList.remove('active');
    editView.classList.add('active');
    editControls.classList.add('active');
}

// Repetir foto
retakeBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    originalFrame = null;
    
    editView.classList.remove('active');
    editControls.classList.remove('active');
    cameraView.classList.add('active');
    cameraControls.classList.add('active');
});

// Lógica de dibujo corregida
function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    
    // Obtener posición del mouse/toque relativa al elemento canvas
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Calcular escala entre el tamaño CSS y el tamaño real de los píxeles del canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

function draw(e) {
    if (!isDrawing) return;

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value * (canvas.width / 1000); // Escalar grosor según resolución
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastX = x;
    lastY = y;
}

// Eventos de ratón
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const { x, y } = getCoordinates(e);
    lastX = x;
    lastY = y;
});

canvas.addEventListener('mousemove', draw);
window.addEventListener('mouseup', () => isDrawing = false);

// Eventos táctiles
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    const { x, y } = getCoordinates(e);
    lastX = x;
    lastY = y;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
});

canvas.addEventListener('touchend', () => isDrawing = false);

// Limpiar dibujo
clearBtn.addEventListener('click', () => {
    if (originalFrame) {
        ctx.putImageData(originalFrame, 0, 0);
    }
});

// Imprimir
printBtn.addEventListener('click', () => {
    window.print();
});

// Iniciar cámara
startCamera();
