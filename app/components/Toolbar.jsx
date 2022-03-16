import React from "react";
import styled from "styled-components";

function Toolbar() {
  return (
    <>
      <BarWrapper>
        <input placeholder="table name" />
        <button onClick={() => setShowDiagram(false)}>Code generator</button>
        <button onClick={() => setShowDiagram(true)}>Diagram</button>
      </BarWrapper>
    </>
  );
}

const BarWrapper = styled.div`
  width: 700px;
  height: 30px;
  border: 2px solid black;

  input {
    border: none;
    height: 25px;
  }

  button {
    float: right;
    margin-right: 10px;
    background-color: white;
    cursor: pointer;
  }
`;

export default Toolbar;
