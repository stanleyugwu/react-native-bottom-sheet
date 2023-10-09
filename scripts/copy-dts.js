const fs = require('fs-extra');
const path = require('path');

const sourceDirectory = './src'; // Change this to your source directory
const destinationDirectory = './lib/typescript'; // Change this to your destination directory

// Ensure the destination directory exists, create it if it doesn't
fs.ensureDirSync(destinationDirectory);

// Function to copy .d.ts files recursively
function copyDeclarationFiles(src, dest) {
  const files = fs.readdirSync(src);

  files.forEach((file) => {
    const sourceFilePath = path.join(src, file);
    const destinationFilePath = path.join(dest, file);

    if (fs.statSync(sourceFilePath).isDirectory()) {
      // If it's a directory, copy its contents recursively
      fs.ensureDirSync(destinationFilePath);
      copyDeclarationFiles(sourceFilePath, destinationFilePath);
    } else if (path.extname(file) === '.d.ts') {
      // If it's a .d.ts file, copy it to the destination directory
      fs.copyFileSync(sourceFilePath, destinationFilePath);
    }
  });
}

// Start copying recursively
copyDeclarationFiles(sourceDirectory, destinationDirectory);

console.log('Declaration files copied recursively.');
