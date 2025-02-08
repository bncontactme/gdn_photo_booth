const express = require("express");
const fs = require("fs");
const path = require("path");
const OBSWebSocket = require("obs-websocket-js");
const sharp = require("sharp"); // Import sharp for image manipulation

const app = express();
const port = 3000;
const obs = new OBSWebSocket();

// OBS WebSocket Connection (for OBS 31)
const OBS_WEBSOCKET_PORT = 4444;
const OBS_PASSWORD = "Creativ328"; // Set in OBS WebSocket settings

obs.connect({ address: `localhost:${OBS_WEBSOCKET_PORT}`, password: OBS_PASSWORD })
    .then(() => console.log("Connected to OBS WebSocket (v4.x)"))
    .catch(err => console.error("Failed to connect to OBS:", err));

// Lista de escenas para rotar (reemplaza con los nombres reales en OBS)
const scenes = ["EMO", "GRANNY", "GDN"];
let currentSceneIndex = 0;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname));

// Save image in the "captures" folder
app.post("/save-image", (req, res) => {
    const imageData = req.body.image.replace(/^data:image\/png;base64,/, "");
    const imagePath = path.join(__dirname, "captures", `capture_${Date.now()}.png`);

    // Save the image temporarily before cropping if needed
    fs.mkdirSync(path.dirname(imagePath), { recursive: true });

    fs.writeFile(imagePath, imageData, "base64", (err) => {
        if (err) {
            console.error("Error saving image:", err);
            return res.status(500).json({ success: false, error: err.message });
        }

        console.log(`Image saved at ${imagePath}`);

        // If the current scene is "GDN", crop the image to 1080x1920 and delete the original
        if (scenes[currentSceneIndex] === "GDN") {
            const croppedImagePath = path.join(__dirname, "captures", `cropped_${Date.now()}.png`);

            sharp(imagePath)
                .resize(1080, 1920)  // Crop or resize to 1080x1920
                .toFile(croppedImagePath, (err, info) => {
                    if (err) {
                        console.error("Error cropping image:", err);
                        return res.status(500).json({ success: false, error: err.message });
                    }

                    console.log(`Cropped image saved at ${croppedImagePath}`);

                    // Delete the original image after cropping it
                    fs.unlink(imagePath, (err) => {
                        if (err) {
                            console.error("Error deleting original image:", err);
                        } else {
                            console.log(`Original image deleted: ${imagePath}`);
                        }
                    });

                    // Return the path of the cropped image
                    res.json({ success: true, path: croppedImagePath });
                });
        } else {
            // If not "GDN" scene, return the original image path without cropping
            res.json({ success: true, path: imagePath });
        }
    });
});

// Rota entre escenas en OBS
app.get("/rotate-scene", async (req, res) => {
    try {
        currentSceneIndex = (currentSceneIndex + 1) % scenes.length;
        const nextScene = scenes[currentSceneIndex];

        await obs.send("SetCurrentScene", { "scene-name": nextScene });
        res.json({ success: true, scene: nextScene });
        console.log(`Switched to scene: ${nextScene}`);
    } catch (error) {
        console.error("Error switching scenes:", error);
        res.status(500).json({ success: false, error: "Failed to switch scene." });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
