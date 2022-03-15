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

let outputPanel = vscode.window.createOutputChannel("erdEditor");

module.exports = {
  getNonce,
  isErdUri,
  isOutputPanel,
  outputPanel,
};
