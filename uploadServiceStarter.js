const { uploadImagesFromFolder } = require('./driveUpload');
const { loadToken } = require('./auth');

// Load token for Google API authentication
loadToken();

// Run the upload every 5 minutes
setInterval(async () => {
  console.log('Checking for new images to upload...');
  await uploadImagesFromFolder();
}, 5 * 60 * 1000); // Every 5 minutes
