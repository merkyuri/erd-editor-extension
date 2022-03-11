const vscode = require("vscode");

const { Disposable, disposeAll } = require("./dispose");
const getNonce = require("./util");

// class DiagramEditorDocument extends Disposable {
//   constructor(uri, initialContent, delegate) {
//     super();
//     this._edits = [];
//     this._savedEdits = [];
//     this._onDidDispose = this._register(new vscode.EventEmitter());
//     this.onDidDispose = this._onDidDispose.event;
//     this._onDidChangeDocument = this._register(new vscode.EventEmitter());
//     this.onDidChangeContent = this._onDidChangeDocument.event;
//     this._onDidChange = this._register(new vscode.EventEmitter());
//     this.onDidChange = this._onDidChange.event;
//     this._uri = uri;
//     this._documentData = initialContent;
//     this._delegate = delegate;
//   }

//   static async create(uri, backupId, delegate) {
//     const dataFile =
//       typeof backupId === "string" ? vscode.Uri.parse(backupId) : uri;
//     const buffer = await vscode.workspace.fs.readFile(dataFile);
//     const value = Buffer.from(buffer).toString("utf8");

//     return new DiagramEditorDocument(uri, value, delegate);
//   }

//   get uri() {
//     return this._uri;
//   }

//   get documentData() {
//     return this._documentData;
//   }

//   dispose() {
//     this._onDidDispose.fire();
//     super.dispose();
//   }

//   makeEdit() {
//     this._onDidChange.fire();
//   }

//   async save(cancellation) {
//     await this.saveAs(this.uri, cancellation);
//     this._savedEdits = Array.from(this._edits);
//   }

//   async saveAs(targetResource, cancellation) {
//     const value = await this._delegate.getFileData();
//     if (cancellation.isCancellationRequested) {
//       return;
//     }
//     await vscode.workspace.fs.writeFile(
//       targetResource,
//       Buffer.from(JSON.stringify(JSON.parse(value), null, 2), "utf8")
//     );
//   }

//   // eslint-disable-next-line no-unused-vars
//   async revert(_cancellation) {
//     const buffer = await vscode.workspace.fs.readFile(this.uri);
//     const value = Buffer.from(buffer).toString("utf8");
//     this._documentData = value;
//     this._edits = this._savedEdits;
//     this._onDidChangeDocument.fire({
//       content: value,
//       edits: this._edits,
//     });
//   }

//   async backup(destination, cancellation) {
//     await this.saveAs(destination, cancellation);
//     return {
//       id: destination.toString(),
//       delete: async () => {
//         try {
//           await vscode.workspace.fs.delete(destination);
//         } catch {
//           // noop
//         }
//       },
//     };
//   }
// }

// class DiagramEditorProvider {
//   constructor(_context) {
//     this._context = _context;
//     this.webview = new WebviewCollection();
//     this._onDidChangeCustomDocument = new vscode.EventEmitter();
//     this.onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
//     this._requestId = 1;
//     this._callbacks = new Map();
//   }

//   static register(context) {
//     return vscode.window.registerCustomEditorProvider(
//       DiagramEditorProvider.viewType,
//       new DiagramEditorProvider(context),
//       {
//         webviewOptions: {
//           retainContextWhenHidden: false,
//         },
//         supportsMultipleEditorsPerDocument: false,
//       }
//     );
//   }

//   // eslint-disable-next-line no-unused-vars
//   async openCustomDocument(uri, openContext, _token) {
//     const document = await DiagramEditorDocument.create(
//       uri,
//       openContext.backupId,
//       {
//         getFileData: async () => {
//           const webviewForDocument = Array.from(this.webview.get(document.uri));
//           if (!webviewForDocument.length) {
//             throw new Error("Could not find webview to save for");
//           }

//           const panel = webviewForDocument[0];
//           const response = await this.postMessageWithResponse(
//             panel,
//             "getFileData",
//             {}
//           );
//           return response.value;
//         },
//       }
//     );

//     const listeners = [];
//     listeners.push(
//       document.onDidChange((e) => {
//         this._onDidChangeCustomDocument.fire({
//           document,
//           ...e,
//         });
//       })
//     );
//     listeners.push(
//       document.onDidChangeContent((e) => {
//         for (const webviewPanel of this.webview.get(document.uri)) {
//           this.postMessage(webviewPanel, "update", {
//             value: e.content,
//           });
//         }
//       })
//     );
//     document.onDidDispose(() => disposeAll(listeners));
//     return document;
//   }

//   // eslint-disable-next-line no-unused-vars
//   async resolveCustomEditor(document, webviewPanel, _token) {
//     this.webview.add(document.uri, webviewPanel);
//     webviewPanel.webview.options = {
//       enableScripts: true,
//     };
//     webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
//     webviewPanel.webview.onDidReceiveMessage((e) =>
//       this.onMessage(document, e)
//     );
//     webviewPanel.webview.onDidReceiveMessage((e) => {
//       if (e.type === "ready") {
//         if (document.uri.scheme === "untitled") {
//           this.postMessage(webviewPanel, "init", {
//             untitled: true,
//             editable: true,
//           });
//         } else {
//           const editable = vscode.workspace.fs.isWritableFileSystem(
//             document.uri.scheme
//           );
//           this.postMessage(webviewPanel, "init", {
//             value: document.documentData,
//             editable,
//           });
//         }
//       }
//     });
//   }

//   saveCustomDocument(document, cancellation) {
//     return document.save(cancellation);
//   }

//   saveCustomDocumentAs(document, destination, cancellation) {
//     return document.saveAs(destination, cancellation);
//   }

//   revertCustomDocument(document, cancellation) {
//     return document.revert(cancellation);
//   }

//   backupCustomDocument(document, context, cancellation) {
//     return document.backup(context.destination, cancellation);
//   }

//   postMessageWithResponse(panel, type, body) {
//     const requestId = this._requestId++;
//     const p = new Promise((resolve) => this._callbacks.set(requestId, resolve));
//     panel.webview.postMessage({ type, requestId, body });
//     return p;
//   }

//   postMessage(panel, type, body) {
//     panel.webview.postMessage({ type, body });
//   }

//   /* eslint-disable */
//   onMessage(document, message) {
//     switch (message.type) {
//       case "value":
//         document.makeEdit();
//         return;
//       case "response": {
//         const callback = this._callbacks.get(message.requestId);
//         callback?.(message.body);
//         return;
//       }
//     }
//   }
//   /* eslint-disable */

//   getHtmlForWebview(webview) {
//     const scriptUri = webview.asWebviewUri(
//       vscode.Uri.joinPath(this._context.extensionUri, "app", "index.jsx")
//     );
//     const nonce = getNonce();

//     return /* html */ `
//     <!DOCTYPE html>
//     <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>ERD Editor-Schema Helper</title>
//       </head>
//       <body>
//         <div id="root"></div>
//         <script>
//           const vscode = acquireVsCodeApi();
//         </script>
//         <script nonce="${nonce}" src="${scriptUri}"></script>
//       </body>
//     </html>
//     `;
//   }
// }

// DiagramEditorProvider.viewType = "erd-editor-schema-helper.editor";
// class WebviewCollection {
//   constructor() {
//     this._webview = new Set();
//   }

//   *get(uri) {
//     const key = uri.toString();
//     for (const entry of this._webview) {
//       if (entry.resource === key) {
//         yield entry.webviewPanel;
//       }
//     }
//   }

//   add(uri, webviewPanel) {
//     const entry = { resource: uri.toString(), webviewPanel };
//     this._webview.add(entry);
//     webviewPanel.onDidDispose(() => {
//       this._webview.delete(entry);
//     });
//   }
// }

// module.exports = DiagramEditorProvider;

/**
 * Define the doc (the data model)
 */
class DiagramEditorDocument extends Disposable {
  constructor(uri, initialContent, delegate) {
    super();
    this._uri = uri;
    this._documentData = initialContent;
    this._delegate = delegate;
    // this._uri;
    // this._documentData;
    // this._edits = [];
    // this._saveEdits = [];
    // this._delegate;
  }
  _uri;
  _documentData;
  _edits = [];
  _saveEdits = [];
  _delegate;
  _onDidDispose = this._register(new vscode.EventEmitter());
  onDidDispose = this._onDidDispose.event;
  _onDidChangeDocument = this._register(new vscode.EventEmitter());
  onDidChangeContent = this._onDidChangeDocument.event;
  _onDidChange = this._register(new vscode.EventEmitter());
  onDidChange = this._onDidChange.event;

  get uri() {
    return this._uri;
  }

  get documentData() {
    return this._documentData;
  }

  // onDidDispose

  dispose() {
    this._onDidDispose.fire();
    super.dispose();
  }

  makeEdit(edit) {
    this._onDidChange.fire(edit);

    this._onDidChange.fire({
      label: "Stroke",
      undo: async () => {
        this._edits.pop();
        this._onDidChangeDocument.fire({
          edits: this._edits,
        });
      },

      redo: async () => {
        this._edits.push(edit);
        this._onDidChangeDocument.fire({
          edits: this._edits,
        });
      },
    });
  }

  static async create(uri, backupId, delegate) {
    const dataFile =
      typeof backupId === "string" ? vscode.Uri.parse(backupId) : uri;
    const fileData = await DiagramEditorDocument.readFile(dataFile);
    // const buffer = await vscode.workspace.fs.readFile(dataFile);
    // const value = Buffer.from(buffer).toString("utf8");

    return new DiagramEditorDocument(uri, fileData, delegate);
  }

  static async readFile(uri) {
    if (uri.scheme === "untitled") {
      return new Uint8Array();
    }

    return vscode.workspace.fs.readFile(uri);
  }

  async save(cancellation) {
    await this.saveAs(this.uri, cancellation);
    this._savedEdits = Array.from(this._edits);
  }

  async saveAs(targetResource, cancellation) {
    const fileData = await this._delegate.getFileData();

    if (cancellation.isCancellationRequested) {
      return;
    }

    await vscode.workspace.fs.writeFile(targetResource, fileData);
  }

  async revert() {
    const diskContent = await DiagramEditorDocument.readFile(this.uri);
    this._documentData = diskContent;
    this._edits = this._savedEdits;
    this._onDidChangeDocument.fire({
      content: diskContent,
      edits: this._edits,
    });
  }

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

/**
 * Provider
 */
class DiagramEditorProvider {
  constructor(_context) {
    this._context = _context;
  }

  static newERDiagramFileId = 1;

  static register(context) {
    vscode.commands.registerCommand("erd-editor-schema-helper.editor", () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (!workspaceFolders) {
        vscode.window.showErrorMessage(
          "Creating new Diagram files currently requires opening a workspace"
        );
        return;
      }

      const uri = vscode.Uri.joinPath(
        workspaceFolders[0].uri,
        `new-${DiagramEditorProvider.newERDiagramFileId++}.erdsh`
      ).with({ scheme: "untitled" });

      vscode.commands.executeCommand(
        "vscode.openWith",
        uri,
        DiagramEditorProvider.viewType
      );
    });

    return vscode.window.registerCustomEditorProvider(
      DiagramEditorProvider.viewType,
      new DiagramEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },

        supportsMultipleEditorsPerDocument: false,
      }
    );
  }

  // static register(context) {
  //   return vscode.window.registerCustomEditorProvider(
  //     DiagramEditorProvider.viewType,
  //     new DiagramEditorProvider(context),
  //     {
  //       webviewOptions: {
  //         retainContextWhenHidden: true,
  //       },
  //       supportsMultipleEditorsPerDocument: false,
  //     }
  //   );
  // }

  static viewType = "erd-editor-schema-helper.editor";
  webview = new WebviewCollection();

  async openCustomDocument(uri, openContext) {
    const document = await DiagramEditorDocument.create(
      uri,
      openContext.backupId,
      {
        getFileData: async () => {
          const webviewForDocument = Array.from(this.webview.get(document.uri));
          if (!webviewForDocument.length) {
            throw new Error("Could not find webview to save for");
          }
          const panel = webviewForDocument[0];
          const response = await this.postMessageWithResponse(
            panel,
            "getFileData",
            {}
          );
          return new Uint8Array(response);
        },
      }
    );

    const listeners = [];

    listeners.push(
      document.onDidChange((e) => {
        this._onDidChangeCustomDocument.fire({
          document,
          ...e,
        });
      })
    );

    listeners.push(
      document.onDidChangeContent((e) => {
        for (const webviewPanel of this.webview.get(document.uri)) {
          this.postMessage(webviewPanel, "update", {
            edits: e.edits,
            content: e.content,
          });
        }
      })
    );

    document.onDidDispose(() => disposeAll(listeners));

    return document;
  }

  async resolveCustomEditor(document, webviewPanel) {
    this.webview.add(document.uri, webviewPanel);

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

    // webviewPanel.webview.onDidReceiveMessage((e) => {
    //   if (e.command === "getValue") {
    //     this.postMessage(webviewPanel, "theme", {
    //       value: getTheme(),
    //     });
    //     this.postMessage(webviewPanel, "keymap", {
    //       value: getKeymap(),
    //     });
    //     this.postMessage(webviewPanel, "init", {
    //       value: document.documentData,
    //     });
    //   } else if (e.command === "exportFile") {
    //     let defaultPath = os.homedir();

    //     if (
    //       Array.isArray(vscode.workspace.workspaceFolders) &&
    //       vscode.workspace.workspaceFolders.length
    //     ) {
    //       defaultPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    //     }

    //     vscode.window
    //       .showSaveDialog({
    //         defaultUri: vscode.Uri.file(
    //           path.join(defaultPath, e.options.fileName)
    //         ),
    //       })
    //       .then((uri) => {
    //         if (uri) {
    //           vscode.workspace.fs.writeFile(
    //             uri,
    //             Buffer.from(e.value.split(",")[1], "base64")
    //           );
    //         }
    //       });
    //   } else if (e.command === "importFile") {
    //     vscode.window.showOpenDialog().then(async (uris) => {
    //       if (!uris || !uris.length) {
    //         return;
    //       }
    //       const uri = uris[0];

    //       const regexp = new RegExp(`\\.(${e.options.type})$`, "i");
    //       if (!regexp.test(uri.path)) {
    //         vscode.window.showInformationMessage(
    //           `Just import the ${e.options.type} file`
    //         );
    //         return;
    //       }

    //       const buffer = await vscode.workspace.fs.readFile(uris[0]);
    //       const value = Buffer.from(buffer).toString("utf8");
    //       this.postMessage(webviewPanel, "importFile", {
    //         value,
    //         type: e.options.type,
    //       });
    //     });
    //   }
    // });
  }

  _onDidChangeCustomDocument = new vscode.EventEmitter();
  onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

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

  getHtmlForWebview(webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "app", "index.jsx")
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

  _requestId = 1;
  _callbacks = new Map();

  postMessageWithResponse(panel, type, body) {
    const requestId = this._requestId++;
    const p = new Promise((resolve) => this._callbacks.set(requestId, resolve));
    panel.webview.postMessage({ type, requestId, body });

    return p;
  }

  postMessage(panel, type, body) {
    panel.webview.postMessage({ type, body });
  }

  /* eslint-disable */
  onMessage(document, message) {
    switch (message.type) {
      case "value":
        document.makeEdit(message);
        return;

      case "response": {
        const callback = this._callbacks.get(message.requestId);
        callback?.(message.body);
        return;
      }
    }
  }
  /* eslint-disable */
}
class WebviewCollection {
  _webview = new Set();

  *get(uri) {
    const key = uri.toString();
    for (const entry of this._webview) {
      if (entry.resource === key) {
        yield entry.webviewPanel;
      }
    }
  }

  add(uri, webviewPanel) {
    const entry = { resource: uri.toString(), webviewPanel };
    this._webview.add(entry);
    webviewPanel.onDidDispose(() => {
      this._webview.delete(entry);
    });
  }
}

module.exports = DiagramEditorProvider;
