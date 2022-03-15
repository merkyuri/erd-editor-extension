const vscode = require("vscode");

const DiagramPreviewPanel = require("./DiagramPreviewPanel.js");
const { isOutputPanel } = require("./util.js");

class DiagramPreviewManager {
  static erdPreviewFocusContextKey = "erd-preview-focus";
  _disposables = [];
  _previews = [];
  _activePreview;

  constructor(_extensionPath) {
    this._extensionPath = _extensionPath;

    vscode.workspace.onDidChangeTextDocument(
      this.onDidChangeTextDocument.bind(this),
      null,
      this._disposables
    );
    vscode.window.onDidChangeActiveTextEditor(
      this.onDidChangeActiveTextEditor.bind(this),
      null,
      this._disposables
    );

    if (
      vscode.window.activeTextEditor &&
      this.shouldAutoOpenPreviewForEditor(vscode.window.activeTextEditor)
    ) {
      this.showPreview(
        vscode.window.activeTextEditor.document.uri,
        vscode.ViewColumn.Beside
      );
    }
  }

  async showPreview(uri, viewColumn) {
    const preview =
      this.getPreviewOnTargetColumn(viewColumn) ||
      (await this.createPreview(uri, viewColumn));

    preview.update(uri);
    preview.panel.reveal(preview.panel.viewColumn);
  }

  showSource() {
    vscode.workspace
      .openTextDocument(this._activePreview.source)
      .then((document) => vscode.window.showTextDocument(document));
  }

  async deserializeWebviewPanel(webview, state) {
    const source = vscode.Uri.parse(state.uri);
    const preview = await DiagramPreviewPanel.revive(
      source,
      webview,
      this._extensionPath
    );

    this.registerPreview(preview);
    preview.update();
  }

  dispose() {
    this._disposables.forEach((ds) => ds.dispose());
    this._previews.forEach((ds) => ds.dispose());
  }

  isActivePreviewUri(uri) {
    return (
      this._activePreview &&
      this._activePreview.source.toString() === uri.toString()
    );
  }

  onDidChangeActiveTextEditor(editor) {
    if (!editor) {
      return;
    }

    if (
      !isOutputPanel(editor.document.uri) &&
      !this.isActivePreviewUri(editor.document.uri)
    ) {
      this._previews.forEach((preview) => {
        preview.update(editor.document.uri);
      });
    }

    if (this.shouldAutoOpenPreviewForEditor(editor)) {
      this.showPreview(editor.document.uri, vscode.ViewColumn.Beside);
    }
  }

  onDidChangeTextDocument(event) {
    const preview = this.getPreviewOf(event.document.uri);

    if (preview) {
      preview.update();
    }
  }

  async createPreview(uri, viewColumn) {
    const preview = await DiagramPreviewPanel.create(
      uri,
      viewColumn,
      this._extensionPath
    );

    this.registerPreview(preview);

    return preview;
  }

  registerPreview(preview) {
    this._previews.push(preview);
    this.onPreviewFocus(preview);
    preview.onDispose(() => {
      this.onPreviewBlur();
      this._previews.splice(this._previews.indexOf(preview), 1);
    });

    preview.onDidChangeViewState(({ webviewPanel }) => {
      webviewPanel.active ? this.onPreviewFocus(preview) : this.onPreviewBlur();
    });
  }

  onPreviewFocus(preview) {
    this._activePreview = preview;
    this.setErdPreviewFocusContext(true);
  }

  onPreviewBlur() {
    this._activePreview = undefined;
    this.setErdPreviewFocusContext(false);
  }

  setErdPreviewFocusContext(value) {
    vscode.commands.executeCommand(
      "setContext",
      DiagramPreviewManager.erdPreviewFocusContextKey,
      value
    );
  }

  getPreviewOnTargetColumn(viewColumn) {
    const activeViewColumn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : vscode.ViewColumn.Active;

    /* eslint-disable */
    return viewColumn === vscode.ViewColumn.Active
      ? this._previews.find(
          (preview) => preview.panel.viewColumn === activeViewColumn
        )
      : this._previews.find(
          (preview) => preview.panel.viewColumn === Number(activeViewColumn) + 1
        );
    /* eslint-disable */
  }

  getPreviewOf(resource) {
    return this._previews.find((p) => p.source.fsPath === resource.fsPath);
  }

  shouldAutoOpenPreviewForEditor(editor) {
    const isAutoOpen = vscode.workspace
      .getConfiguration("erd")
      .get("preview.autoOpen");

    return isAutoOpen && !this.getPreviewOf(editor.document.uri);
  }
}

module.exports = DiagramPreviewManager;
