/* eslint-disable react/prop-types */
import React from "react";

function Preview({
  data,
  attachRef,
  dimension: { width, height, units },
  onWheel,
  background,
}) {
  const styles = {
    width: `${width}${units}`,
    minWidth: `${width}${units}`,
    height: `${height}${units}`,
    minHeight: `${height}${units}`,
  };

  return (
    <div className={`preview ${background}`} onWheel={onWheel}>
      <img
        src={`data:image/svg+xml,${encodeURIComponent(data)}`}
        ref={attachRef}
        style={styles}
        alt="preview"
      />
    </div>
  );
}

export default Preview;
