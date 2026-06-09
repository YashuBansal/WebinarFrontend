import { createSlice } from '@reduxjs/toolkit';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';

const initialState = {
  nodes: [],
  edges: [],
  flowId: null,
  name: '',
  flowCategory: 'general',
  activeDrawerNodeId: null,
};


const flowSlice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    setNodes: (state, action) => {
      state.nodes = action.payload;
    },
    setEdges: (state, action) => {
      state.edges = action.payload;
    },
    setFlowInfo: (state, action) => {
      if (action.payload.flowId !== undefined) {
        state.flowId = action.payload.flowId;
      }
      if (action.payload.name !== undefined) {
        state.name = action.payload.name;
      }
      if (action.payload.flowCategory !== undefined) {
        state.flowCategory = action.payload.flowCategory;
      }
    },
    clearFlowInfo: (state) => {
      state.flowId = null;
      state.name = '';
      state.flowCategory = 'general';
    },
    addNode: (state, action) => {
      state.nodes.push(action.payload);
    },
    updateNodeData: (state, action) => {
      const { id, data } = action.payload;
      const node = state.nodes.find((n) => n.id === id);
      if (node) {
        node.data = { ...node.data, ...data };
      }
    },
    addConnection: (state, action) => {
      state.edges = addEdge(action.payload, state.edges);
    },
    onNodesChange: (state, action) => {
      state.nodes = applyNodeChanges(action.payload, state.nodes);
    },
    onEdgesChange: (state, action) => {
      state.edges = applyEdgeChanges(action.payload, state.edges);
    },
    setActiveDrawerNodeId: (state, action) => {
      state.activeDrawerNodeId = action.payload;
    },
  },
});

export const {
  setNodes,
  setEdges,
  setFlowInfo,
  clearFlowInfo,
  addNode,
  updateNodeData,
  addConnection,
  onNodesChange,
  onEdgesChange,
  setActiveDrawerNodeId,
} = flowSlice.actions;

export default flowSlice.reducer;
