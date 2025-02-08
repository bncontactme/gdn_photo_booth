const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('capture');

navigator.mediaDevices.getUserMedia({ video: { width: window.innerWidth, height: window.innerHeight } })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => console.error("Error accessing webcam: ", err));

captureButton.addEventListener('click', () => {
    startCountdown(3);
});

document.getElementById("switch-scene").addEventListener("click", () => {
    fetch("/rotate-scene")
        .then(response => response.json())
        .then(data => console.log(`Escena actual: ${data.scene}`))
        .catch(error => console.error("Error al cambiar de escena:", error));
});


function startCountdown(seconds) {
    captureButton.disabled = true;
    let count = seconds;

    const countdownInterval = setInterval(() => {
        if (count > 0) {
            captureButton.textContent = `📸 ${count}...`;
            count--;
        } else {
            clearInterval(countdownInterval);
            captureImage();
            captureButton.textContent = "FOTO GUARDADA!!!";
            captureButton.style.backgroundColor = "#d3d3d3";
            captureButton.style.color = "#a9a9a9";

            // Reset the button after 5 seconds
            setTimeout(() => {
                resetButton();
            }, 5000);
        }
    }, 1000);
}

function captureImage() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');

    fetch('/save-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log("Image saved at:", data.path);
        } else {
            console.error("Error saving image:", data.error);
        }
    })
    .catch(err => console.error("Error sending image:", err));
}

function resetButton() {
    captureButton.textContent = "💗 TOMA TU FOTO 💗";
    captureButton.disabled = false;
    captureButton.style.backgroundColor = "white";
    captureButton.style.color = "black";
}
