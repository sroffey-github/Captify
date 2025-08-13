/* --- IndexedDB Helper Functions --- */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('videoDB', 1);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            db.createObjectStore('videos');
        };
        request.onsuccess = event => resolve(event.target.result);
        request.onerror = event => reject(event.target.error);
    });
}

function saveVideo(file) {
    return openDB().then(db => {
        const tx = db.transaction('videos', 'readwrite');
        const store = tx.objectStore('videos');
        store.put(file, 'uploadedVideo');
        return tx.complete;
    });
}

function loadVideo() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('videos', 'readonly');
            const store = tx.objectStore('videos');
            const request = store.get('uploadedVideo');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    });
}

function deleteVideo() {
    return openDB().then(db => {
        const tx = db.transaction('videos', 'readwrite');
        const store = tx.objectStore('videos');
        store.delete('uploadedVideo');
        return tx.complete;
    });
}

/* --- Alerts --- */
function showAlert(message, type = "info") {
    const existing = document.getElementById("alert");
    if (existing) existing.remove();

    const alert = document.createElement("div");
    alert.id = "alert";
    alert.className = `p-4 rounded mb-4 text-white ${
        type === "error" ? "bg-red-500" :
        type === "success" ? "bg-green-500" :
        "bg-blue-500"
    }`;
    alert.innerText = message;

    document.body.prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

/* --- Color Conversion for FFmpeg --- */
function hexToFFmpegColor(hex) {
    if (!hex) return "&HFFFFFF&"; // fallback white
    hex = hex.replace('#','');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = hex.substring(0,2);
    const g = hex.substring(2,4);
    const b = hex.substring(4,6);
    return `&H${b}${g}${r}&`; // FFmpeg expects BBGGRR
}

/* --- Video Preview & Generate --- */
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const uploadCell = document.getElementById('upload-cell');
    const originalUploadCellHTML = uploadCell.innerHTML;
    const form = document.getElementById('subtitle-form');
    const downloadBtn = document.getElementById('download-btn');
    const generateBtn = form.querySelector('button[type="submit"]');
    let uploadedFile = null;

    /* --- Video Preview --- */
    function createVideoPreview(videoURL) {
        uploadCell.innerHTML = `
            <div class="relative">
                <button id="close-video" class="absolute top-2 right-2 bg-white rounded-full p-1 hover:bg-gray-200 z-10 pointer-events-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <video class="w-full h-auto max-h-[400px] rounded-xl" controls>
                    <source src="${videoURL}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
        `;

        document.getElementById('close-video').addEventListener('click', () => {
            uploadCell.innerHTML = originalUploadCellHTML;
            uploadedFile = null;
            downloadBtn.classList.add('btn-disabled');
            fileInput.value = '';
        });
    }

    /* --- Handle File Upload --- */
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.type !== "video/mp4") {
            showAlert("Please upload an MP4 file.", "error");
            return;
        }

        uploadedFile = file;
        const videoURL = URL.createObjectURL(file);
        createVideoPreview(videoURL);

        downloadBtn.classList.add('btn-disabled');
    });

    /* --- Handle Subtitle Generation --- */
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!uploadedFile) {
            return showAlert("Please upload a video first.", "error");
        }

        // Disable generate button
        generateBtn.disabled = true;
        generateBtn.textContent = "Generating...";

        // Collect style options
        const fontFamily = document.getElementById('font-family-select').value;
        const fontSize = document.getElementById('font-size-slider').value;
        
        const fontColorBtn = document.querySelector('#text-colour-buttons button.selected');
        let fontColor = fontColorBtn ? fontColorBtn.dataset.color : '#FFFFFF';
        fontColor = hexToFFmpegColor(fontColor);

        const bgColorSelect = document.getElementById('background-select');
        let bgColor = '';
        if (bgColorSelect.value === 'Black') bgColor = hexToFFmpegColor('#000000');
        else if (bgColorSelect.value === 'White') bgColor = hexToFFmpegColor('#FFFFFF');
        else if (bgColorSelect.value === 'Custom Colour') {
            // Ask user for custom hex
            let custom = prompt("Enter hex color for background (e.g., #123456):", "#000000");
            if (custom) bgColor = hexToFFmpegColor(custom);
        }

        const positionBtn = document.querySelector('#position-buttons button.btn-active');
        const position = positionBtn ? positionBtn.innerText.toLowerCase() : 'bottom';

        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('font_family', fontFamily);
        formData.append('font_size', fontSize);
        formData.append('font_color', fontColor);
        formData.append('bg_color', bgColor);
        formData.append('position', position);

        try {
            const response = await fetch('/generate', { method: 'POST', body: formData });
            const data = await response.json();

            if (data.status === "error") {
                showAlert(data.message, "error");
                return;
            }

            showAlert(data.message, "success");

            // Enable download
            downloadBtn.classList.remove('btn-disabled');
            downloadBtn.textContent = 'Download Subtitled Video';
            downloadBtn.onclick = () => {
                window.location.href = data.download_url;
            };

        } catch (err) {
            showAlert("Unexpected error: " + err.message, "error");
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate Subtitles";
        }
    });
});
