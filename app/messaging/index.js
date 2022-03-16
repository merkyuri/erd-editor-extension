import { EventEmitter } from "events";

import vscode from "../vscode-api/vscode-api.js";

class MessageBroker extends EventEmitter {
  constructor() {
    super();

    window.addEventListener("message", (event) => {
      const { command, payload } = event.data;

      this.emit(command, payload);
    });
  }

  send(message) {
    vscode.postMessage(message);
  }
}

export default new MessageBroker();
