const vscode = require("vscode");

class CommandManager {
  commands = new Map();

  dispose() {
    for (const registration of this.commands.values()) {
      registration.dispose();
    }

    this.commands.clear();
  }

  register(command) {
    this.registerCommand(command.id, command.execute, command);

    return command;
  }

  registerCommand(id, impl, thisArg) {
    this.commands.set(id, vscode.commands.registerCommand(id, impl, thisArg));
  }
}

module.exports = CommandManager;
