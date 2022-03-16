const vscode = require("vscode");

class SaveCommand {
  // eslint-disable-next-line no-unused-vars
  constructor(webviewManager) {}

  getActiveEditorUri() {
    return (
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.document.uri
    );
  }
}

module.exports = SaveCommand;
