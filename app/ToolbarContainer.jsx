/* eslint-disable react/prop-types */
import React, { Component } from "react";

import Toolbar from "./components/Toolbar.jsx";

const SCALE_STEP = 0.5;

class ToolbarContainer extends Component {
  componentDidMount() {
    window.document.addEventListener("mouseup", this.onButtonMouseUp);
  }

  componentWillUnmount() {
    window.document.removeEventListener("mouseup", this.onButtonMouseUp);
  }

  onChangeBackgroundButtonClick = (e) => {
    this.props.changeBackground(e.srcElement.getAttribute("name"));
  };

  onButtonMouseDown = (e) => {
    this.setState({ activeButton: e.currentTarget.name });
  };

  onBtnMouseUp = () => {
    this.setState({ activeButton: "" });
  };

  zoomIn = () => {
    this.props.zoomIn(SCALE_STEP);
  };

  zoomOut = () => {
    this.props.zoomOut(SCALE_STEP);
  };

  render() {
    return (
      <Toolbar
        onChangeBackgroundButtonClick={this.onChangeBackgroundButtonClick}
        zoomIn={this.zoomIn}
        zoomOut={this.zoomOut}
        zoomReset={this.props.zoomReset}
        fileSize={this.getFileSize()}
        onButtonMouseDown={this.onButtonMouseDown}
        activeButton={this.state.activeButton}
      />
    );
  }
}

export default ToolbarContainer;
