import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isImporting: false,
  percentage: 0,
  processedCount: 0,
  totalCount: 0,
  logs: [],
  status: 'PROCESSING', // PROCESSING, COMPLETED, FAILED
  errorSummary: '',
};

export const importProgressSlice = createSlice({
  name: 'importProgress',
  initialState,
  reducers: {
    startImport: (state, action) => {
      state.isImporting = true;
      state.percentage = 0;
      state.processedCount = 0;
      state.totalCount = action.payload?.totalCount || 0;
      state.logs = [{
        id: 'start',
        timestamp: new Date().toLocaleTimeString(),
        message: 'Import pipeline started.',
        type: 'info'
      }];
      state.status = 'PROCESSING';
      state.errorSummary = '';
    },
    updateImportProgress: (state, action) => {
      const { processedCount, totalCount, percentage, status } = action.payload;
      if (processedCount !== undefined) state.processedCount = processedCount;
      if (totalCount !== undefined) state.totalCount = totalCount;
      if (percentage !== undefined) state.percentage = percentage;
      if (status !== undefined) state.status = status;
      
      if (status === 'COMPLETED' || percentage >= 100) {
        state.isImporting = false;
        state.percentage = 100;
        state.status = 'COMPLETED';
      }
    },
    addBulkLogs: (state, action) => {
      const incomingLogs = action.payload;
      // Memory safety optimization: Cap logs terminal array to the last 150 lines to prevent DOM swelling
      state.logs = [...state.logs, ...incomingLogs].slice(-150);
    },
    failImport: (state, action) => {
      state.isImporting = false;
      state.status = 'FAILED';
      state.errorSummary = action.payload || 'Validation failed.';
      state.logs.push({
        id: `fail-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        message: `Pipeline halted: ${action.payload || 'Validation failed.'}`,
        type: 'error'
      });
    },
    resetImportState: (state) => {
      return initialState;
    },
  },
});

export const {
  startImport,
  updateImportProgress,
  addBulkLogs,
  failImport,
  resetImportState,
} = importProgressSlice.actions;

export default importProgressSlice.reducer;
