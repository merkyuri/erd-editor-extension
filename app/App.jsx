/* eslint-disable react/prop-types */
import React, { Component } from "react";

import PreviewPage from "./PreviewPage.jsx";
import ToolbarContainer from "./ToolbarContainer.jsx";

class App extends Component {
  render() {
    return (
      <>
        <div className="layout">
          <ToolbarContainer />
          {this.props.source.data && <PreviewPage />}
        </div>
      </>
    );
  }
}

export default App;
