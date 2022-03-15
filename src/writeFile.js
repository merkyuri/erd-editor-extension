const fs = require("fs");
const { writeFileSync } = require("fs");
const child_process = require("child_process");

const vscode = require("vscode");

const {
  getErdTranslator,
  getGraphviz,
  getSourceText,
  outputPanel,
} = require("./util.js");

const extensionId = "erdEditor";

const writeFile = async function (uri, fileName, fileFormat) {
  const sourceText = await getSourceText(uri);
  const erdTranslator = getErdTranslator(extensionId);
  const graphviz = getGraphviz(extensionId);
  const erdProcess = child_process.spawn(erdTranslator, ["-f", "dot"]);
  const dotProcess = child_process.spawn(graphviz, ["-f", fileFormat]);

  let errorHandler = (commandName, error) => {
    const codeProperty = "code";

    if (error[codeProperty] === "ENOENT") {
      vscode.window.showErrorMessage(`File not found: ${commandName} command`);
    } else {
      vscode.window.showErrorMessage(error.message);
    }
  };

  erdProcess.on("error", (error) => errorHandler("erd", error));
  dotProcess.on("error", (error) => errorHandler("dot", error));

  try {
    erdProcess.stdin.end(sourceText);
    erdProcess.stdout.pipe(dotProcess.stdin);

    let erdStdout = "";
    erdProcess.stdout.on("data", (data) => {
      if (data.toString().length > 0) {
        erdStdout += data.toString();
      }
    });

    erdProcess.on("close", (code) => {
      if (code === 1) {
        outputPanel.clear();
        outputPanel.append(erdStdout);

        dotProcess.stdin.end();
        vscode.window.showErrorMessage(erdStdout);
      }
    });

    let svgText = "";
    const writeStream = fs.createWriteStream(fileName, { encoding: "binary" });

    dotProcess.stdout.on("data", (data) => {
      if (fileFormat === "svg") {
        svgText += data.toString();
      } else {
        writeStream.write(data);
      }
    });

    dotProcess.on("close", (code) => {
      if (code === 0) {
        if (fileFormat === "svg") {
          writeFileSync(fileName, svgText, { encoding: "utf-8" });
        } else {
          writeStream.end();
        }

        vscode.window.showInformationMessage(`SVG file saved as ${fileName}`);
      } else {
        vscode.window.showErrorMessage(
          `Error: code ${code}. Please check previewer.`
        );
      }
    });
  } catch (error) {
    erdProcess.kill("SIGKILL");
    dotProcess.kill("SIGKILL");

    vscode.window.showErrorMessage(error);
  }
};

module.exports = writeFile;
