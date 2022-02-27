const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // console.log(
  //   'Congratulations, your extension "erd-editor-schema-helper" is now active!'
  // );

  let disposable = vscode.commands.registerCommand(
    "erd-editor-schema-helper.helloWorld",
    function () {
      vscode.window.showInformationMessage(
        "Hello World from ERD Editor-Schema Helper!"
      );
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
