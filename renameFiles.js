const fs = require('fs');
const path = require('path');

function renameFilesInDirectory(directory) {
    // Read all files and directories within the given directory
    fs.readdir(directory, { withFileTypes: true }, (err, files) => {
        if (err) {
            console.error(`Error reading directory ${directory}:`, err);
            return;
        }

        files.forEach(file => {
            const currentPath = path.join(directory, file.name);

            if (file.isDirectory()) {
                // Recursively call the function for subdirectories
                renameFilesInDirectory(currentPath);
            } else if (file.isFile()) {
                // Rename both cases: with or without an underscore
                let newFileName = file.name;

                if (newFileName.includes('iotans')) {
                    newFileName = newFileName.replace('iotans', 'iota-names');
                }

                if (newFileName.includes('iotans_')) {
                    newFileName = newFileName.replace('iotans_', 'iota_names_');
                }

                // Only rename if the name has changed
                if (newFileName !== file.name) {
                    const newPath = path.join(directory, newFileName);
                    fs.rename(currentPath, newPath, (err) => {
                        if (err) {
                            console.error(`Error renaming file ${currentPath}:`, err);
                        } else {
                            console.log(`Renamed: ${currentPath} -> ${newPath}`);
                        }
                    });
                }
            }
        });
    });
}

// Main function to start the renaming process
const directory = process.argv[2] || '.';

if (fs.existsSync(directory) && fs.lstatSync(directory).isDirectory()) {
    renameFilesInDirectory(directory);
} else {
    console.log('Please provide a valid directory path.');
}
