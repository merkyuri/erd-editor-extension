/* eslint-disable react/prop-types */
import React, { Component } from "react";

import PreviewPage from "./PreviewPage.jsx";
import ToolbarContainer from "./ToolbarContainer.jsx";
import messageBroker from "./messaging/index.js";

class App extends Component {
  componentDidMount() {
    messageBroker.addListener("source:update", this.props.updateSource);
  }

  componentWillUnmount() {
    messageBroker.removeListener("source:update", this.props.updateSource);
  }

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
