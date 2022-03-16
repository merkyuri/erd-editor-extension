const path = require("path");

const vscode = require("vscode");

const { getNonce } = require("./util.js");

class DiagramPreviewPanel {
  static contentProviderKey = "erdEditor-schemaHelper";
  _onDisposeEmitter = new vscode.EventEmitter();
  onDispose = this._onDisposeEmitter.event;
  _onDidChangeViewStateEmitter = new vscode.EventEmitter();
  onDidChangeViewState = this._onDidChangeViewStateEmitter.event;
  _postponedMessage;

  static async create(source, viewColumn, extensionPath) {
    const panel = vscode.window.createWebviewPanel(
      DiagramPreviewPanel.contentProviderKey,
      DiagramPreviewPanel.getPreviewTitle(source.path),
      viewColumn,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(extensionPath, "dist", "app")),
        ],
      }
    );

    return new DiagramPreviewPanel(source, panel, extensionPath);
  }

  static async revive(resource, panel, extensionPath) {
    return new DiagramPreviewPanel(resource, panel, extensionPath);
  }

  static getPreviewTitle(path) {
    return `Preview ${path.replace(/^.*[\\\/]/, "")}`;
  }

  constructor(_resource, _panel, _extensionPath) {
    this._panel = _panel;
    this._extensionPath = _extensionPath;
    this._panel.webview.html = this.getHtmlForWebview();
    this._panel.onDidChangeViewState((event) => {
      this._onDidChangeViewStateEmitter.fire(event);

      if (event.webviewPanel.visible && this._postponedMessage) {
        this.postMessage(this._postponedMessage);
        delete this._postponedMessage;
      }
    });

    this._panel.onDidDispose(() => {
      this._onDisposeEmitter.fire();
      this.dispose();
    });
  }

  get source() {
    return this._resource;
  }

  get panel() {
    return this._panel;
  }

  async update(resource) {
    if (resource) {
      this._resource = resource;
    }

    this._panel.title = DiagramPreviewPanel.getPreviewTitle(
      this._resource.fsPath
    );
  }

  dispose() {
    this._panel.dispose();
  }

  postMessage(message) {
    if (this._panel.visible) {
      this._panel.webview.postMessage(message);
    } else {
      this._postponedMessage = message; // saving the last update and flush it once panel become visible
    }
  }

  getHtmlForWebview() {
    const webview = this._panel.webview;

    const basePath = vscode.Uri.file(
      path.join(this._extensionPath, "dist", "app")
    );
    const scriptPath = vscode.Uri.file(
      path.join(this._extensionPath, "dist", "app", "index.bundle.js")
    );

    const baseUri = webview.asWebviewUri(basePath);
    const scriptUri = webview.asWebviewUri(scriptPath);

    const nonce = getNonce();

    return /* html */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ERD Editor-Schema Helper</title>
        <base href="${baseUri}">
      </head>
      <body>
        <div id="root"></div>
        <script>
          const vscode = acquireVsCodeApi();
        </script>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>
    `;
  }
}

module.exports = DiagramPreviewPanel;
