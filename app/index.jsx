import React from "react";
// import ReactDOM from "react-dom";
import { Provider } from "redux-zero/react";

import App from "./App.jsx";
import store from "./stores";
import "./messaging/index.js";

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.body
);
