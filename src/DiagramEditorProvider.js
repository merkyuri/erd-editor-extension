const vscode = require("vscode");

const { Disposable, disposeAll } = require("./dispose");
const getNonce = require("./util");

class DiagramEditorDocument extends Disposable {
  /**
   * @param {any} uri
   * @param {string} initialContent
   * @param {any} delegate
   */
  constructor(uri, initialContent, delegate) {
    super();
    this._edits = [];
    this._savedEdits = [];
    this._onDidDispose = this._register(new vscode.EventEmitter());
    this.onDidDispose = this._onDidDispose.event;
    this._onDidChangeDocument = this._register(new vscode.EventEmitter());
    this.onDidChangeContent = this._onDidChangeDocument.event;
    this._onDidChange = this._register(new vscode.EventEmitter());
    this.onDidChange = this._onDidChange.event;
    this._uri = uri;
    this._documentData = initialContent;
    this._delegate = delegate;
  }

  /**
   * @param {any} uri
   * @param {string} backupId
   * @param {{ getFileData: () => Promise<any>; }} delegate
   */
  static async create(uri, backupId, delegate) {
    const dataFile =
      typeof backupId === "string" ? vscode.Uri.parse(backupId) : uri;
    const buffer = await vscode.workspace.fs.readFile(dataFile);
    const value = Buffer.from(buffer).toString("utf8");

    return new DiagramEditorDocument(uri, value, delegate);
  }

  get uri() {
    return this._uri;
  }

  get documentData() {
    return this._documentData;
  }

  dispose() {
    this._onDidDispose.fire();
    super.dispose();
  }

  makeEdit() {
    this._onDidChange.fire();
  }

  /**
   * @param {any} cancellation
   */
  async save(cancellation) {
    await this.saveAs(this.uri, cancellation);
    this._savedEdits = Array.from(this._edits);
  }

  /**
   * @param {vscode.Uri} targetResource
   * @param {{ isCancellationRequested: any; }} cancellation
   */
  async saveAs(targetResource, cancellation) {
    const value = await this._delegate.getFileData();
    if (cancellation.isCancellationRequested) {
      return;
    }
    await vscode.workspace.fs.writeFile(
      targetResource,
      Buffer.from(JSON.stringify(JSON.parse(value), null, 2), "utf8")
    );
  }

  /**
   * @param {any} _cancellation
   */
  // eslint-disable-next-line no-unused-vars
  async revert(_cancellation) {
    const buffer = await vscode.workspace.fs.readFile(this.uri);
    const value = Buffer.from(buffer).toString("utf8");
    this._documentData = value;
    this._edits = this._savedEdits;
    this._onDidChangeDocument.fire({
      content: value,
      edits: this._edits,
    });
  }

  /**
   * @param {vscode.Uri} destination
   * @param {any} cancellation
   */
  async backup(destination, cancellation) {
    await this.saveAs(destination, cancellation);
    return {
      id: destination.toString(),
      delete: async () => {
        try {
          await vscode.workspace.fs.delete(destination);
        } catch {
          // noop
        }
      },
    };
  }
}

class DiagramEditorProvider {
  /**
   * @param {any} _context
   */
  constructor(_context) {
    this._context = _context;
    this.webviews = new WebviewCollection();
    this._onDidChangeCustomDocument = new vscode.EventEmitter();
    this.onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
    this._requestId = 1;
    this._callbacks = new Map();
  }

  /**
   * @param {vscode.ExtensionContext} context
   */
  static register(context) {
    return vscode.window.registerCustomEditorProvider(
      DiagramEditorProvider.viewType,
      // @ts-ignore !WARNING!
      new DiagramEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: false,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    );
  }

  /**
   * @param {any} uri
   * @param {{ backupId: any; }} openContext
   * @param {any} _token
   */
  // eslint-disable-next-line no-unused-vars
  async openCustomDocument(uri, openContext, _token) {
    const document = await DiagramEditorDocument.create(
      uri,
      openContext.backupId,
      {
        getFileData: async () => {
          const webviewsForDocument = Array.from(
            this.webviews.get(document.uri)
          );
          if (!webviewsForDocument.length) {
            throw new Error("Could not find webview to save for");
          }

          const panel = webviewsForDocument[0];
          const response = await this.postMessageWithResponse(
            panel,
            "getFileData",
            {}
          );
          return response.value;
        },
      }
    );

    const listeners = [];
    listeners.push(
      document.onDidChange((/** @type {any} */ e) => {
        this._onDidChangeCustomDocument.fire({
          document,
          ...e,
        });
      })
    );
    listeners.push(
      document.onDidChangeContent((/** @type {{ content: any; }} */ e) => {
        for (const webviewPanel of this.webviews.get(document.uri)) {
          this.postMessage(webviewPanel, "update", {
            value: e.content,
          });
        }
      })
    );
    document.onDidDispose(() => disposeAll(listeners));
    return document;
  }

  // eslint-disable-next-line no-unused-vars
  async resolveCustomEditor(document, webviewPanel, _token) {
    this.webviews.add(document.uri, webviewPanel);
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
    webviewPanel.webview.onDidReceiveMessage((e) =>
      this.onMessage(document, e)
    );
    webviewPanel.webview.onDidReceiveMessage((e) => {
      if (e.type === "ready") {
        if (document.uri.scheme === "untitled") {
          this.postMessage(webviewPanel, "init", {
            untitled: true,
            editable: true,
          });
        } else {
          const editable = vscode.workspace.fs.isWritableFileSystem(
            document.uri.scheme
          );
          this.postMessage(webviewPanel, "init", {
            value: document.documentData,
            editable,
          });
        }
      }
    });
  }

  saveCustomDocument(document, cancellation) {
    return document.save(cancellation);
  }
  saveCustomDocumentAs(document, destination, cancellation) {
    return document.saveAs(destination, cancellation);
  }
  revertCustomDocument(document, cancellation) {
    return document.revert(cancellation);
  }
  backupCustomDocument(document, context, cancellation) {
    return document.backup(context.destination, cancellation);
  }
  /**
   * @param {{ webview: { postMessage: (arg0: { type: any; requestId: number; body: any; }) => void; }; }} panel
   * @param {string} type
   * @param {{}} body
   */
  postMessageWithResponse(panel, type, body) {
    const requestId = this._requestId++;
    const p = new Promise((resolve) => this._callbacks.set(requestId, resolve));
    panel.webview.postMessage({ type, requestId, body });
    return p;
  }
  postMessage(panel, type, body) {
    panel.webview.postMessage({ type, body });
  }
  /* eslint-disable indent*/
  onMessage(document, message) {
    switch (message.type) {
      case "value":
        document.makeEdit();
        return;
      case "response": {
        const callback = this._callbacks.get(message.requestId);
        callback?.(message.body);
        return;
      }
    }
  }
  /* eslint-disable indent*/

  getHtmlForWebview(webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "media", "sudo_boo.jpeg")
    );
    const nonce = getNonce();

    return /* html */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ERD Editor-Schema Helper</title>
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

DiagramEditorProvider.viewType = "erd-editor-schema-helper.editor";
class WebviewCollection {
  constructor() {
    this._webviews = new Set();
  }

  /**
   * @param {{ toString: () => any; }} uri
   */
  *get(uri) {
    const key = uri.toString();
    for (const entry of this._webviews) {
      if (entry.resource === key) {
        yield entry.webviewPanel;
      }
    }
  }

  /**
   * @param {{ toString: () => any; }} uri
   * @param {{ onDidDispose: (arg0: () => void) => void; }} webviewPanel
   */
  add(uri, webviewPanel) {
    const entry = { resource: uri.toString(), webviewPanel };
    this._webviews.add(entry);
    webviewPanel.onDidDispose(() => {
      this._webviews.delete(entry);
    });
  }
}

module.exports = DiagramEditorProvider;
