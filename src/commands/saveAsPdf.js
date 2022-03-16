const vscode = require("vscode");

const SaveCommand = require("./save.js");
const writeFile = require("../writeFile.js");

class SaveAsPdfCommand extends SaveCommand {
  id = "erdEditor.savePdf";

  execute(uri) {
    const resource = uri || this.getActiveEditorUri();

    if (!resource) {
      return;
    }

    if (resource && resource.scheme !== "file") {
      vscode.window.showErrorMessage("Please save file before export PDF.");

      return;
    }

    vscode.window
      .showSaveDialog({
        defaultUri: resource,
        filters: {
          Images: ["pdf"],
        },
      })
      .then((uri) => {
        if (uri) {
          writeFile(resource, uri.fsPath, "pdf");
        }
      })
      .then(undefined, (error) => {
        console.log(error);
      });
  }
}

module.exports = SaveAsPdfCommand;
