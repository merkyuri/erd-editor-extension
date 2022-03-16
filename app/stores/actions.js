import vscode from "../vscode-api/vscode-api.js";

const DEFAULT_SCALE_STEP = 0.1;
const MIN_SCALE = 0.1;
const MAX_SCALE = 20;

const actions = () => ({
  updateSource: (state, source) => {
    vscode.setState(source);

    return { ...state, source, scale: 1 };
  },

  zoomIn: (state, step = DEFAULT_SCALE_STEP) => {
    const nextScale = state.scale + state.scale * step;
    return { ...state, scale: nextScale <= MAX_SCALE ? nextScale : MAX_SCALE };
  },

  zoomOut: (state, step = DEFAULT_SCALE_STEP) => {
    const nextScale = state.scale - state.scale * step;
    return { ...state, scale: nextScale >= MIN_SCALE ? nextScale : MIN_SCALE };
  },

  zoomReset: (state) => {
    return { ...state, scale: 1 };
  },

  changeBackground: (state, background) => {
    return { ...state, background };
  },

  toggleSourceImageValidity: (state, validity) => ({
    ...state,
    sourceImageValidity: validity,
  }),
});

export default actions;
