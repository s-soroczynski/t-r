const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const rootFolderPath = process.argv[2];
const classNameRegex = /className\s*=\s*["'`](.*?)["'`]/g;

if (!rootFolderPath) {
  console.log('Provide the root folder path.');
  process.exit(1);
}

function processFilesInFolder(folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(chalk.red('❌ Error reading folder contents:', err));
      return;
    }

    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) {
          console.error(chalk.red('❌ Error getting file information:', statErr));
          return;
        }

        if (stats.isDirectory()) {
          processFilesInFolder(filePath);
        } else if (stats.isFile() && file.endsWith('.js')) {
          processFile(filePath);
        }
      });
    });
  });
}

function processFile(filePath) {
  fs.readFile(filePath, 'utf-8', (err, content) => {
    if (err) {
      console.error(chalk.red('❌ Error reading file:', err));
      return;
    }

    const modifiedClassNames = [];
    const modifiedContent = content.replace(classNameRegex, (match, className) => {
      const modifiedClassName = generateModifiedClassName(className, filePath);
      modifiedClassNames.push({ original: className, modified: modifiedClassName });
      return match.replace(className, modifiedClassName);
    });

    if (modifiedClassNames.length > 0) {
      const scssFilePath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.scss');
      const scssContent = generateSCSSContent(modifiedClassNames);
      fs.writeFile(scssFilePath, scssContent, 'utf-8', writeErr => {
        if (writeErr) {
          console.error(chalk.red('❌ Error creating .scss file:', writeErr));
          return;
        }
        fs.writeFile(filePath, modifiedContent, 'utf-8', writeErr => {
          if (writeErr) {
            console.error(chalk.red('❌ Error saving modified file:', writeErr));
            return;
          }
          console.log(chalk.green(`✔️ File ${filePath} has been updated, and .scss file has been created.`));
        });
      });
    } else {
      console.log(chalk.yellow(`❌ File ${filePath} does not contain className, so it was not modified.`));
    }
  });
}

function generateModifiedClassName(originalClassName, filePath) {
  const classCounter = filePathCounterMap[filePath] || 0;
  filePathCounterMap[filePath] = classCounter + 1;
  return `${path.basename(filePath, path.extname(filePath))}-class-${classCounter}`;
}

function generateSCSSContent(modifiedClassNames) {
  return modifiedClassNames.map(({ original, modified }) => `// Original class: ${original}\n.${modified} {}\n`).join('\n');
}

const filePathCounterMap = {};

processFilesInFolder(rootFolderPath);
