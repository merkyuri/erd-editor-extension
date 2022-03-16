import createStore from "redux-zero";

import vscode from "../vscode-api/vscode-api.js";

const initialState = {
  source: {
    uri: vscode.getState() ? vscode.getState().uri : null,
    data: vscode.getState() ? vscode.getState().data : null,
  },

  scale: 1,
  background: document.querySelector("body").classList.contains("vscode-dark")
    ? "dark"
    : "light",
  sourceImageValidity: false,
};

export default createStore(initialState);
