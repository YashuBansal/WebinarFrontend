import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "wlh_maskedTables_prefs";
const LEGACY_UI_KEY = "wlh_maskedTables_ui_draft";

function saveMaskedPrefs(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isTablesMasked: state.isTablesMasked,
        maskBillingHistory: state.maskBillingHistory,
        maskProductSalesDetail: state.maskProductSalesDetail,
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

function loadMaskedPrefs() {
  const defaults = {
    isTablesMasked: false,
    maskBillingHistory: false,
    maskProductSalesDetail: false,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      delete p.maskEmployeeSalaries;
      return { ...defaults, ...p };
    }
    const legacy = localStorage.getItem(LEGACY_UI_KEY);
    if (legacy) {
      const p = JSON.parse(legacy);
      const merged = {
        ...defaults,
        maskBillingHistory: Boolean(p.billingHistory),
        maskProductSalesDetail: Boolean(p.productSalesDetail),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch {
    /* ignore */
  }
  return defaults;
}

const persisted = loadMaskedPrefs();

const initialState = {
  selectedRows: [],
  filters: {},
  page: 1,
  isTablesMasked: persisted.isTablesMasked,
  /** When true, billing history masks invoice / transaction-style identifiers in the UI. */
  maskBillingHistory: persisted.maskBillingHistory,
  /** When true, product revenue "Top customers" masks customer email / id in the UI. */
  maskProductSalesDetail: persisted.maskProductSalesDetail,
};

const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    setSelectedRows: (state, action) => {
      const prev = state.selectedRows;
      const id = action.payload;
      state.selectedRows = prev.includes(id)
        ? prev.filter((rowId) => rowId !== id)
        : [...prev, id];
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setTableMasked: (state, action) => {
      state.isTablesMasked = Boolean(action.payload);
      saveMaskedPrefs(state);
    },
    setMaskBillingHistory: (state, action) => {
      state.maskBillingHistory = Boolean(action.payload);
      saveMaskedPrefs(state);
    },
    setMaskProductSalesDetail: (state, action) => {
      state.maskProductSalesDetail = Boolean(action.payload);
      saveMaskedPrefs(state);
    },
  },
});

export const {
  setSelectedRows,
  setFilters,
  setPage,
  setTableMasked,
  setMaskBillingHistory,
  setMaskProductSalesDetail,
} = tableSlice.actions;
export default tableSlice.reducer;
