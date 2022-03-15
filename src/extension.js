const vscode = require("vscode");

const DiagramEditorProvider = require("./DiagramEditorProvider.js");

function activate(context) {
  console.log("Congratulations, your extension is now active!");

  context.subscriptions.push(
    vscode.commands.registerCommand("erdEditor.helloworld", () => {
      vscode.window.showInformationMessage(
        "Welcome to ERD Editor-Schema Helper extension."
      );
    })
  );

  context.subscriptions.push(DiagramEditorProvider.register(context));
}

function deactivate() {
  console.info("Extension is deactivating.");
}

module.exports = {
  activate,
  deactivate,
};
