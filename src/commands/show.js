const vscode = require("vscode");

class ShowCommand {
  // eslint-disable-next-line no-unused-vars
  constructor(webviewManager) {}

  getActiveEditorUri() {
    return (
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.document.uri
    );
  }
}

module.exports = ShowCommand;
