const vscode = require("vscode");

const ShowCommand = require("./show.js");

class ShowPreviewCommand extends ShowCommand {
  webviewManager;
  id = "erdEditor.webview";

  showPreview(webviewManager, uri, viewColumn) {
    webviewManager.showPreview(uri, viewColumn);
  }

  execute(uri) {
    const resource = uri || this.getActiveEditorUri();

    if (resource) {
      this.showPreview(this.webviewManager, resource, vscode.ViewColumn.Beside);
    }
  }
}

module.exports = ShowPreviewCommand;
