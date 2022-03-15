const vscode = require("vscode");

// const CommandManager = require("./CommandManager.js");
// const DiagramPreviewManager = require("./DiagramPreviewManager.js");

class ActivateCommand {
  constructor(webviewManager) {
    this.webviewManager = webviewManager;
  }

  getActiveEditorUri() {
    return (
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.document.uri
    );
  }
}

class ActivatePreviewCommand extends ActivateCommand {
  id = "erdEditor.webview";

  activatePreview(webviewManager, uri, viewColumn) {
    webviewManager.activatePreview(uri, viewColumn);
  }

  execute(uri) {
    const resource = uri || this.getActiveEditorUri();

    if (resource) {
      this.activatePreview(
        this.webviewManager,
        resource,
        vscode.ViewColumn.Beside
      );
    }
  }
}

module.exports = {
  ActivateCommand,
  ActivatePreviewCommand,
};
