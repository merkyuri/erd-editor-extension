const vscode = require("vscode");
// const ERDEditorProvider = require("ERDEditorProvider");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("Congratulations, your extension is now active!");

  let disposable = vscode.commands.registerCommand(
    "erd-editor-schema-helper.webview",
    function () {
      vscode.window.showInformationMessage(
        "Hello World from ERD Editor-Schema Helper!"
      );
    }
  );

  context.subscriptions.push(disposable);

  // context.subscriptions.push(
  //   vscode.commands.registerCommand("erd-editor-schema-helper.webview", () => {
  //     ERDEditorProvider.createAndShow(context.extensionPath);
  //   })
  // );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
