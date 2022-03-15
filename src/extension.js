const vscode = require("vscode");

const CommandManager = require("./CommandManager.js");
const { ActivatePreviewCommand } = require("./commands.js");
const DiagramPreviewManager = require("./DiagramPreviewManager.js");

function activate(context) {
  console.log("Congratulations, your extension is now active!");

  const previewManager = new DiagramPreviewManager(context);
  const commandManager = new CommandManager();

  vscode.window.registerWebviewPanelSerializer(
    "erdEditor-schemaHelper",
    previewManager
  );

  context.subscriptions.push(commandManager);
  commandManager.register(new ActivatePreviewCommand(previewManager));

  context.subscriptions.push(
    vscode.commands.registerCommand("erdEditor.helloworld", () => {
      vscode.window.showInformationMessage(
        "Welcome to ERD Editor-Schema Helper extension."
      );
    })
  );
}

function deactivate() {
  console.info("Extension is deactivating.");
}

module.exports = {
  activate,
  deactivate,
};
