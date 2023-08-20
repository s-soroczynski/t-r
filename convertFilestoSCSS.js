const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2); // Pobieramy argumenty z konsoli

if (args.length !== 1) {
  console.error("Podaj ścieżkę do folderu głównego jako argument.");
  process.exit(1);
}

const inputFolder = args[0]; // Ścieżka do folderu głównego

function processJSFile(filePath) {
  const jsContent = fs.readFileSync(filePath, "utf-8");
  const baseName = path.basename(filePath, ".js");
  const classIndexMap = {};
  const processedClassIndexMap = {}; // Dodane

  let modifiedContent = jsContent.replace(
    /className=["']([\w\s-]+)["']/g,
    (match, className) => {
      if (!classIndexMap[className]) {
        classIndexMap[className] = 1;
      } else {
        classIndexMap[className]++;
      }

      const newClassName = `${baseName}-class-${classIndexMap[className]}`;
      processedClassIndexMap[className] = classIndexMap[className]; // Dodane
      return `className="${newClassName}"`;
    }
  );

  if (
    Object.keys(processedClassIndexMap).length > 0 ||
    jsContent !== modifiedContent
  ) {
    // Zmienione
    fs.writeFileSync(filePath, modifiedContent);
    console.log(`Plik ${path.basename(filePath)} został zaktualizowany.`);
  }

  if (Object.keys(processedClassIndexMap).length > 0) {
    // Zmienione
    const scssFileName = `${baseName}.scss`;
    const scssFilePath = path.join(path.dirname(filePath), scssFileName);

    let scssContent = fs.existsSync(scssFilePath)
      ? fs.readFileSync(scssFilePath, "utf-8")
      : "";

    for (const className in processedClassIndexMap) {
      // Zmienione
      const classIndex = processedClassIndexMap[className]; // Zmienione
      const newClassName = `${baseName}-class-${classIndex}`;
      scssContent += `.${newClassName} {\n  /* Styl dla klasy ${className} */\n}\n`;
    }

    fs.writeFileSync(scssFilePath, scssContent);
    console.log(
      `Plik ${scssFileName} został zaktualizowany i powiększony o dodane klasy.`
    );
  }
}

function convertFilesToSCSS(folderPath) {
  const files = fs.readdirSync(folderPath);

  files.forEach((file) => {
    const filePath = path.join(folderPath, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isDirectory()) {
      convertFilesToSCSS(filePath); // Rekursywne przeszukiwanie podfolderów
    } else if (file.endsWith(".js")) {
      processJSFile(filePath);
    }
  });
}

convertFilesToSCSS(inputFolder);
