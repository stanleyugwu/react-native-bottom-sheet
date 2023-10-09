const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

// Define the relative directory path
const directoryName = 'lib';

// Function to check if a directory exists
const directoryExists = (directory) => {
  try {
    fs.accessSync(directory, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};

// Detect the operating system
const platform = os.platform();

// Conditional execution based on the detected OS
if (directoryExists(directoryName)) {
  if (platform === 'win32') {
    // Windows
    exec(`rmdir /s /q "${directoryName}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
    });
  } else if (platform === 'linux' || platform === 'darwin') {
    // Linux or macOS
    exec(`rm -rf "${directoryName}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
    });
  } else {
    console.error('Unsupported operating system');
  }
}
