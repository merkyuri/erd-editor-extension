const vscode = require("vscode");

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function isErdUri(uri) {
  return uri.path.endsWith(".erd");
}

function isOutputPanel(uri) {
  return uri.toString().startsWith("output:extension-output-");
}

function getErdTranslator(extensionId) {
  const configuration = vscode.workspace.getConfiguration(extensionId);
  const erdPath = configuration.get("erdPath");

  if (erdPath === null || erdPath === undefined) {
    return "erd";
  } else {
    return erdPath;
  }
}

function getGraphviz(extensionId) {
  const configuration = vscode.workspace.getConfiguration(extensionId);
  const dotPath = configuration.get("dotPath");

  if (dotPath === null || dotPath === undefined) {
    return "dot";
  } else {
    return dotPath;
  }
}

async function getSourceText(uri) {
  const sourceUri = uri;
  const sourceDocument = await vscode.workspace.openTextDocument(sourceUri);
  const sourceText = sourceDocument.getText();

  return sourceText;
}

let outputPanel = vscode.window.createOutputChannel("erdEditor");

module.exports = {
  getNonce,
  isErdUri,
  isOutputPanel,
  getErdTranslator,
  getGraphviz,
  getSourceText,
  outputPanel,
};
