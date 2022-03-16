/* eslint-disable react/prop-types */
import React, { Component } from "react";

import PreviewPage from "./PreviewPage.jsx";
// import Toolbar from "./components/Toolbar.jsx";

class App extends Component {
  render() {
    return (
      <>
        <div>App</div>
        <div>{this.props.source.data && <PreviewPage />}</div>
      </>
    );
  }
}

export default App;
