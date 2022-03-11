const vscode = require("vscode");
const DiagramEditorProvider = require("DiagramEditorProvider");

function activate(context) {
  console.log("Congratulations, your extension is now active!");

  // context.subscriptions.push(DiagramEditorProvider.register(context));
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "erd-editor-schema-helper.helloworld",
      () => {
        vscode.window.showInformationMessage(
          "Hello World from ERD Editor-Schema Helper!"
        );
      }
    ),
    vscode.commands.registerCommand("erd-editor-schema-helper.editor", () => {
      DiagramEditorProvider.register(context);
    })
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
