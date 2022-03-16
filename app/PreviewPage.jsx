/* eslint-disable react/prop-types */
import React, { Component } from "react";

import Preview from "./components/Preview.jsx";
import PreviewError from "./components/PreviewError.jsx";

const NEW_LINE_REGEXP = /[\r\n]+/g;
const SVG_TAG_REGEXP = /<svg.+?>/;
const WIDTH_REGEXP = /width=("|')([0-9.,]+)\w*("|')/;
const HEIGHT_REGEXP = /height=("|')([0-9.,]+)\w*("|')/;

class PreviewPage extends Component {
  imageEl;

  constructor(props) {
    super(props);

    this.state = { showPreviewError: false };
  }

  componentDidMount() {
    this.imageEl.addEventListener("error", this.onError);
    this.imageEl.addEventListener("load", this.onLoad);
  }

  // componentWillReceiveProps(nextProps) {
  //   if (nextProps.source.data !== this.props.source.data) {
  //     this.setState({ showPreviewError: false });
  //   }
  // }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.source.data !== prevState.source.data) {
      return { showPreviewError: false };
    }

    return null;
  }

  attachRef = (el) => {
    if (el) {
      this.imageEl = el;
    }
  };

  onWheel = (event) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }

    event.preventDefault();
    let delta = Math.sign(event.wheelDelta);

    if (delta === 1) {
      this.props.zoomIn();
    }
    if (delta === -1) {
      this.props.zoomOut();
    }
  };

  onError = () => {
    this.setState({ showPreviewError: true });
    this.props.toggleSourceImageValidity(false);
  };

  onLoad = () => {
    this.setState({ showPreviewError: false });
    this.props.toggleSourceImageValidity(true);
  };

  getOriginalDimension(data) {
    const formatted = data.replace(NEW_LINE_REGEXP, " ");
    const svg = formatted.match(SVG_TAG_REGEXP);
    let width = null;
    let height = null;

    if (svg && svg.length) {
      width = svg[0].match(WIDTH_REGEXP) ? svg[0].match(WIDTH_REGEXP)[2] : null;
      height = svg[0].match(HEIGHT_REGEXP)
        ? svg[0].match(HEIGHT_REGEXP)[2]
        : null;
    }
    return width && height
      ? { width: parseFloat(width), height: parseFloat(width) }
      : null;
  }

  getScaledDimension() {
    const originalDimension = this.getOriginalDimension(this.props.source.data);
    const originalWidth = originalDimension ? originalDimension.width : 100;
    const originalHeight = originalDimension ? originalDimension.height : 100;
    const units = originalDimension ? "px" : "%";

    return {
      width: parseInt((originalWidth * this.props.scale).toString()),
      height: parseInt((originalHeight * this.props.scale).toString()),
      units,
    };
  }

  render() {
    return this.state.showPreviewError ? (
      <PreviewError />
    ) : (
      <Preview
        data={this.props.source.data}
        attachRef={this.attachRef}
        dimension={this.getScaledDimension()}
        onWheel={this.onWheel}
        background={this.props.background}
      />
    );
  }
}

export default PreviewPage;
