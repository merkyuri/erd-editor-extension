import React, { useState } from "react";
import styled from "styled-components";

import CodeGenerator from "../CodeGenerator.jsx";
import ERDEditor from "../ERDEditor.jsx";

function Toolbar() {
  const [showDiagram, setShowDiagram] = useState(true);

  return (
    <>
      <BarWrapper>
        <input placeholder="table name" />
        <button onClick={() => setShowDiagram(false)}>Code generator</button>
        <button onClick={() => setShowDiagram(true)}>Diagram</button>
      </BarWrapper>
      <div>{showDiagram ? <ERDEditor /> : <CodeGenerator />}</div>
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
