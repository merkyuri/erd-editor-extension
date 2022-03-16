/* eslint-disable react/prop-types */
import React from "react";

function Toolbar({
  onChangeBackgroundButtonClick,
  zoomIn,
  zoomOut,
  zoomReset,
  fileSize,
  onButtonMouseDown,
  activeButton,
}) {
  return (
    <div className="toolbar">
      <div className="btn-group">
        <button
          name="zoom-in"
          className={`reset-button btn btn-plus ${
            activeButton === "zoom-in" ? "active" : ""
          }`}
          onClick={zoomIn}
          onMouseDown={onButtonMouseDown}
        />
        <button
          name="zoom-out"
          className={`reset-button btn btn-minus ${
            activeButton === "zoom-out" ? "active" : ""
          }`}
          onClick={zoomOut}
          onMouseDown={onButtonMouseDown}
        />
        <button
          name="reset"
          className={`reset-button btn btn-one-to-one ${
            activeButton === "reset" ? "active" : ""
          }`}
          onClick={zoomReset}
          onMouseDown={onButtonMouseDown}
        />
      </div>
      <div className="separator" />
      <div className="bg-group">
        <div
          className={`bg-container ${
            activeButton === "dark" ? "selected" : ""
          }`}
        >
          <button
            className="reset-button bg dark"
            name="dark"
            onClick={onChangeBackgroundButtonClick}
            onMouseDown={onButtonMouseDown}
          />
        </div>
        <div
          className={`bg-container ${
            activeButton === "light" ? "selected" : ""
          }`}
        >
          <button
            className="reset-button bg light"
            name="light"
            onClick={onChangeBackgroundButtonClick}
            onMouseDown={onButtonMouseDown}
          />
        </div>
        <div
          className={`bg-container ${
            activeButton === "transparent" ? "selected" : ""
          }`}
        >
          <button
            className="reset-button bg transparent"
            name="transparent"
            onClick={onChangeBackgroundButtonClick}
            onMouseDown={onButtonMouseDown}
          />
        </div>
      </div>
      <div className="size">{fileSize}</div>
    </div>
  );
}

export default Toolbar;
