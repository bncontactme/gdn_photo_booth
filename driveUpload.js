const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { oAuth2Client } = require('./auth');

// Google Drive Folder ID (replace with your folder ID)
const FOLDER_ID = '';
const UPLOADED_FILE_PATH = path.join(__dirname, 'uploaded_files.json');

// Initialize Google Drive API client
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

// Load the list of already uploaded files
function loadUploadedFiles() {
  if (fs.existsSync(UPLOADED_FILE_PATH)) {
    return JSON.parse(fs.readFileSync(UPLOADED_FILE_PATH, 'utf-8'));
  }
  return [];
}

// Save the updated list of uploaded files
function saveUploadedFiles(files) {
  fs.writeFileSync(UPLOADED_FILE_PATH, JSON.stringify(files, null, 2), 'utf-8');
}

// Upload a file to Google Drive
async function uploadFile(filePath) {
  const fileName = path.basename(filePath);
  const uploadedFiles = loadUploadedFiles();

  // Skip if already uploaded
  if (uploadedFiles.includes(fileName)) {
    console.log(`Skipping already uploaded file: ${fileName}`);
    return;
  }

  const fileMetadata = {
    name: fileName,
    parents: [FOLDER_ID],
  };
  const media = {
    mimeType: 'image/png',
    body: fs.createReadStream(filePath),
  };

  try {
    const res = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
    console.log(`File uploaded successfully: ${fileName}`);

    // Save this file name to the list of uploaded files
    uploadedFiles.push(fileName);
    saveUploadedFiles(uploadedFiles);
  } catch (error) {
    console.error('Error uploading file:', error.message);
  }
}

// Check for new images in the captures folder and upload them
async function uploadImagesFromFolder() {
  const capturesDir = path.join(__dirname, 'captures');

  if (!fs.existsSync(capturesDir)) {
    console.log('Captures folder does not exist');
    return;
  }

  const files = fs.readdirSync(capturesDir);
  const imageFiles = files.filter(file => file.endsWith('.png'));

  if (imageFiles.length === 0) {
    console.log('No new images to upload');
    return;
  }

  for (const file of imageFiles) {
    const filePath = path.join(capturesDir, file);
    await uploadFile(filePath);
  }
}

module.exports = { uploadImagesFromFolder };
