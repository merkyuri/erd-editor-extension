import React /* useState */ from "react";
import styled from "styled-components";

function EntityDiagram() {
  // const [value, setValue] = useState([]);

  return (
    <div>
      <EntityWrapper>
        <input placeholder="title" />
        <input placeholder="input" />
        <input placeholder="another" />
      </EntityWrapper>
    </div>
  );
}

const EntityWrapper = styled.div`
  input {
    border: 3px solid black;
    display: flex;
  }

  .title {
    flex: 1;
  }

  .input .another {
    flex: none;
  }
`;

export default EntityDiagram;
