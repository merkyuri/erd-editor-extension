// // const path = require("path");

// const vscode = require("vscode");

// const { Disposable, disposeAll } = require("./dispose");
// const { getNonce } = require("./util");

// /**
//  * Define the doc (the data model)
//  */
// class DiagramEditorDocument extends Disposable {
//   _uri;
//   _documentData;
//   _edits = [];
//   _saveEdits = [];
//   _delegate;
//   _onDidDispose = this._register(new vscode.EventEmitter());
//   onDidDispose = this._onDidDispose.event;
//   _onDidChangeDocument = this._register(new vscode.EventEmitter());
//   onDidChangeContent = this._onDidChangeDocument.event;
//   _onDidChange = this._register(new vscode.EventEmitter());
//   onDidChange = this._onDidChange.event;

//   constructor(uri, initialContent, delegate) {
//     super();
//     this._uri = uri;
//     this._documentData = initialContent;
//     this._delegate = delegate;
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

//   makeEdit(edit) {
//     this._onDidChange.fire(edit);

//     this._onDidChange.fire({
//       label: "Stroke",
//       undo: async () => {
//         this._edits.pop();
//         this._onDidChangeDocument.fire({
//           edits: this._edits,
//         });
//       },

//       redo: async () => {
//         this._edits.push(edit);
//         this._onDidChangeDocument.fire({
//           edits: this._edits,
//         });
//       },
//     });
//   }

//   static async create(uri, backupId, delegate) {
//     const dataFile =
//       typeof backupId === "string" ? vscode.Uri.parse(backupId) : uri;
//     const fileData = await DiagramEditorDocument.readFile(dataFile);
//     // const buffer = await vscode.workspace.fs.readFile(dataFile);
//     // const value = Buffer.from(buffer).toString("utf8");

//     return new DiagramEditorDocument(uri, fileData, delegate);
//   }

//   static async readFile(uri) {
//     if (uri.scheme === "untitled") {
//       return new Uint8Array();
//     }

//     return vscode.workspace.fs.readFile(uri);
//   }

//   async save(cancellation) {
//     await this.saveAs(this.uri, cancellation);
//     this._savedEdits = Array.from(this._edits);
//   }

//   async saveAs(targetResource, cancellation) {
//     const fileData = await this._delegate.getFileData();

//     if (cancellation.isCancellationRequested) {
//       return;
//     }

//     await vscode.workspace.fs.writeFile(targetResource, fileData);
//   }

//   async revert() {
//     const diskContent = await DiagramEditorDocument.readFile(this.uri);
//     this._documentData = diskContent;
//     this._edits = this._savedEdits;
//     this._onDidChangeDocument.fire({
//       content: diskContent,
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

// /**
//  * Provider
//  */
// class DiagramEditorProvider {
//   constructor(_context) {
//     this._context = _context;
//   }

//   static newERDiagramFileId = 1;

//   static register(context) {
//     vscode.commands.registerCommand("erdEditor.webview", () => {
//       const workspaceFolders = vscode.workspace.workspaceFolders;

//       if (!workspaceFolders) {
//         vscode.window.showErrorMessage(
//           "Creating new Diagram files currently requires opening a workspace."
//         );
//         return;
//       }

//       const uri = vscode.Uri.joinPath(
//         workspaceFolders[0].uri,
//         `new-${DiagramEditorProvider.newERDiagramFileId++}.erdsh`
//       ).with({ scheme: "untitled" });

//       vscode.commands.executeCommand(
//         "vscode.openWith",
//         uri,
//         DiagramEditorProvider.viewType
//       );
//     });

//     return vscode.window.registerCustomEditorProvider(
//       DiagramEditorProvider.viewType,
//       new DiagramEditorProvider(context),
//       {
//         webviewOptions: {
//           retainContextWhenHidden: true,
//         },

//         supportsMultipleEditorsPerDocument: false,
//       }
//     );
//   }

//   static viewType = "erdEditor.webview";
//   webview = new WebviewCollection();

//   async openCustomDocument(uri, openContext) {
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
//           return new Uint8Array(response);
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
//             edits: e.edits,
//             content: e.content,
//           });
//         }
//       })
//     );

//     document.onDidDispose(() => disposeAll(listeners));

//     return document;
//   }

//   async resolveCustomEditor(document, webviewPanel) {
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

//   _onDidChangeCustomDocument = new vscode.EventEmitter();
//   onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

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

//   getHtmlForWebview(webview) {
//     const nonce = getNonce();
//     const scriptUri = webview.asWebviewUri(
//       vscode.Uri.joinPath(
//         this._context.extensionUri,
//         "dist",
//         "app",
//         "index.bundle.js"
//       )
//     );

//     // const scriptPath = vscode.Uri.file(
//     //   path.join(this._context.extensionUri, "dist", "app", "index.bundle.js")
//     // );
//     // const scriptUri = webview.asWebviewUri(scriptPath);

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
//           (function () {
//             const vscode = acquireVsCodeApi();

//             console.log("hello from javascript");
//           })();
//         </script>
//         <script nonce="${nonce}" src="${scriptUri}"></script>
//       </body>
//     </html>
//     `;
//   }

//   _requestId = 1;
//   _callbacks = new Map();

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
//         document.makeEdit(message);
//         return;

//       case "response": {
//         const callback = this._callbacks.get(message.requestId);
//         callback?.(message.body);
//         return;
//       }
//     }
//   }
//   /* eslint-disable */
// }
// class WebviewCollection {
//   _webview = new Set();

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
