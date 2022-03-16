const path = require("path");
const child_process = require("child_process");

const vscode = require("vscode");

const {
  getNonce,
  getErdTranslator,
  getGraphviz,
  outputPanel,
} = require("./util.js");

class DiagramPreviewPanel {
  static contentProviderKey = "erdEditor";
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

  async getUpdateWebViewMessage(uri) {
    const document = await vscode.workspace.openTextDocument(uri);
    const data = await this.convertToSvg(document.getText());

    return updatePreview({
      uri: uri.toString(),
      data: data,
    });
  }

  setPanelIcon() {
    const root = path.join(this._extensionPath, "media");

    this._panel.iconPath = {
      light: vscode.Uri.file(path.join(root, "Preview.svg")),
      dark: vscode.Uri.file(path.join(root, "Preview_inverse.svg")),
    };
  }

  convertToSvg(erdContent) {
    const erdTranslator = getErdTranslator("erdEditor");
    const graphviz = getGraphviz("erdEditor");

    return new Promise((resolve, reject) => {
      outputPanel.clear();

      const erdProcess = child_process.spawn(erdTranslator, ["-f", "dot"]);
      const dotProcess = child_process.spawn(graphviz, ["-T", "svg"]);

      let errorHandler = (commandName, error) => {
        const codeProperty = "code";

        if (error[codeProperty] === "ENOENT") {
          outputPanel.clear();
          outputPanel.append(`File not found: ${commandName} command`);
          reject(new Error(`File not found: ${commandName} command`));
        } else {
          outputPanel.clear();
          outputPanel.append(error.message);
          reject(new Error(error.message));
        }
      };

      erdProcess.on("error", (error) => errorHandler("erd", error));
      dotProcess.on("error", (error) => errorHandler("dot", error));

      try {
        erdProcess.stdin.end(erdContent);
        erdProcess.stdout.pipe(dotProcess.stdin);

        let erdStdout = "";

        erdProcess.stdout.on("data", (data) => {
          if (data.toString().length > 0) {
            erdStdout += data.toString();
          }
        });
        erdProcess.on("close", (code) => {
          if (code === 1) {
            outputPanel.clear();
            outputPanel.append(erdStdout);

            let errorMessage = `
              <tspan x="10" dy="1.2em">
                  ERD file parse error
              </tspan>
              <tspan x="10" dy="1.2em"></tspan>
            `;
            erdStdout.split("\n").forEach((val) => {
              errorMessage += `
                <tspan x="10" dy="1.2em">
                    ${this.escapeHtml(val)}
                </tspan>
              `;
            });

            let svgText = `
              <svg class="textSVG" width="400pt" height="400pt" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" style='stroke-width: 0px; background-color: white;'>
                  <text font-size="15" x="0" y="10" fill="black">
                    ${errorMessage}
                  </text>
              </svg>
            `;

            dotProcess.stdin.end();
            resolve(svgText);
          }
        });

        let svgText = "";

        dotProcess.stdout.on("data", (data) => {
          svgText += data.toString();
        });

        dotProcess.on("close", (code) => {
          if (code === 0) {
            resolve(svgText);
          }
        });
      } catch (error) {
        outputPanel.clear();
        outputPanel.append(error);

        erdProcess.kill("SIGKILL");
        dotProcess.kill("SIGKILL");

        reject(new Error(error));
      }
    });
  }

  getHtmlForWebview() {
    const nonce = getNonce();
    const webview = this._panel.webview;

    const basePath = vscode.Uri.file(
      path.join(this._extensionPath, "dist", "app")
    );
    const scriptPath = vscode.Uri.file(
      path.join(this._extensionPath, "dist", "app", "bundle.js")
    );
    const stylePath = vscode.Uri.file(
      path.join(this._extensionPath, "app", "components", "styles.css")
    );

    const baseUri = `<base href="${webview.asWebviewUri(basePath)}">`;
    const securityPolicy = `
      <meta
        http-equiv="Content-Security-Policy"
        content="default-src ${webview.cspSource}; img-src ${webview.cspSource} data:; script-src ${webview.cspSource}; style-src ${webview.cspSource};"
      />
    `;
    const styleUri = `<link rel="stylesheet" type="text/css" href="${webview.asWebviewUri(
      stylePath
    )}">`;
    const scriptUri = `<script type="text/javascript" nonce="${nonce}" src="${webview.asWebviewUri(
      scriptPath
    )}"></script>`;

    return `<!DOCTYPE html><html><head>${baseUri}${securityPolicy}${styleUri}</head><body>${scriptUri}</body></html>`;

    // const baseUri = webview.asWebviewUri(basePath);
    // const scriptUri = webview.asWebviewUri(scriptPath);
    // const styleUri = webview.asWebviewUri(stylePath);

    // return /* html */ `
    // <!DOCTYPE html>
    // <html lang="en">
    //   <head>
    //     <meta charset="UTF-8">
    //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //     <link href="${styleUri}" rel="stylesheet" type="text/css">
    //     <title>ERD Editor-Schema Helper</title>
    //     <base href="${baseUri}">
    //   </head>
    //   <body>
    //     <div id="root"></div>
    //     <script>
    //       const vscode = acquireVsCodeApi();
    //     </script>
    //     <script nonce="${nonce}" src="${scriptUri}"></script>
    //   </body>
    // </html>
    // `;
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

function updatePreview(payload) {
  return {
    command: "source:update",
    payload,
  };
}

module.exports = DiagramPreviewPanel;
