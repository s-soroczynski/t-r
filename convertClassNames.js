const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

const rootFolderPath = process.argv[2];
const classNameRegex = /className\s*=\s*["'`](.*?)["'`]/g;

const breakpointMap = {
  sm: "(max-width: 640px)",
  md: "(max-width: 768px)",
  lg: "(max-width: 1024px)",
  xl: "(max-width: 1280px)",
};

if (!rootFolderPath) {
  console.log("Provide the root folder path as a console argument.");
  process.exit(1);
}

function processFilesInFolder(folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(chalk.red("❌ Error reading folder contents:", err));
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) {
          console.error(
            chalk.red("❌ Error getting file information:", statErr)
          );
          return;
        }

        if (stats.isDirectory()) {
          processFilesInFolder(filePath);
        } else if (stats.isFile() && file.endsWith(".js")) {
          processFile(filePath);
        }
      });
    });
  });
}

function processFile(filePath) {
  fs.readFile(filePath, "utf-8", (err, content) => {
    if (err) {
      console.error(chalk.red("❌ Error reading file:", err));
      return;
    }

    const modifiedClassNames = [];
    const modifiedContent = content.replace(
      classNameRegex,
      (match, classNames) => {
        const modifiedClassName = generateModifiedClassName(
          classNames,
          filePath
        );
        modifiedClassNames.push({
          original: classNames,
          modified: modifiedClassName,
        });
        return match.replace(classNames, modifiedClassName);
      }
    );

    if (modifiedClassNames.length > 0) {
      const scssFilePath = path.join(
        path.dirname(filePath),
        path.basename(filePath, path.extname(filePath)) + ".scss"
      );
      const scssContent = generateSCSSContent(modifiedClassNames);
      fs.writeFile(scssFilePath, scssContent, "utf-8", (writeErr) => {
        if (writeErr) {
          console.error(chalk.red("❌ Error creating .scss file:", writeErr));
          return;
        }
        fs.writeFile(filePath, modifiedContent, "utf-8", (writeErr) => {
          if (writeErr) {
            console.error(
              chalk.red("❌ Error saving modified file:", writeErr)
            );
            return;
          }
          console.log(
            chalk.green(
              `✔️ File ${filePath} has been updated, and .scss file has been created.`
            )
          );
        });
      });
    } else {
      console.log(
        chalk.yellow(
          `❌ File ${filePath} does not contain className, so it was not modified.`
        )
      );
    }
  });
}

function generateModifiedClassName(originalClassNames, filePath) {
  const classNamesArray = originalClassNames.split(" ").filter(Boolean);
  const modifiedClassName = `${path.basename(
    filePath,
    path.extname(filePath)
  )}-class-${filePathCounterMap[filePath] || 0}`;
  filePathCounterMap[filePath] = (filePathCounterMap[filePath] || 0) + 1;
  return modifiedClassName;
}

function generateSCSSContent(modifiedClassNames) {
  return modifiedClassNames
    .map(({ original, modified }) => {
      const tailwindClasses = original.split(" ");
      const scssRules = [];
      let defaultRule = null;
      const mediaQueryRules = {};

      tailwindClasses.forEach((tailwindClass) => {
        if (tailwindClass.includes(":")) {
          const [prefix, className] = tailwindClass.split(":");
          if (breakpointMap[prefix]) {
            if (!mediaQueryRules[prefix]) {
              mediaQueryRules[prefix] = [];
            }
            mediaQueryRules[prefix].push(className);
          }
        } else {
          defaultRule = tailwindClass;
        }
      });

      if (defaultRule) {
        scssRules.push(`.${modified} {
  @apply ${defaultRule};
}`);
      }

      Object.keys(mediaQueryRules).forEach((prefix) => {
        const classNameList = mediaQueryRules[prefix].join(" ");
        const mediaQuery = breakpointMap[prefix];
        scssRules.push(`.${modified} {
  @apply ${classNameList};
  @media ${mediaQuery} {
    @apply ${classNameList};
  }
}`);
      });

      return scssRules.join("\n\n");
    })
    .join("\n\n");
}

const filePathCounterMap = {};

processFilesInFolder(rootFolderPath);
