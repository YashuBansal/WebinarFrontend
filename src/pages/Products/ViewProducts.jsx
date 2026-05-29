import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Filter,
  Bookmark,
  Maximize,
  Minimize,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Eye,
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  Tag,
  IndianRupee,
  ChevronDown,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";


import AppLoader from "../../components/AppLoader";
import ComponentGuard from "../../components/AccessControl/ComponentGuard";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { DeleteConfirmationModal } from "../../components/ui/DeleteConfirmationModal";
import { useTheme } from "../../contexts/ThemeContext";
import useRoles from "../../hooks/useRoles";
import useUserSubscription from "../../hooks/useUserSubscription";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
} from "../../features/actions/product";
import {
  clearProductData,
  resetProductState,
} from "../../features/slices/product";
import { filterTruthyValues, errorToast } from "../../utils/extra";
import productLevelService from "../../services/productLevelService";
import tagsService from "../../services/tagsService";
import ProductsRevenueView from "./ProductsRevenueView";

const tableHeader = "Product Table";

const defaultFilters = {
  name: "",
  description: "",
  minPrice: "",
  maxPrice: "",
  level: "All Levels",
  tag: "Select Tags...",
  sortBy: "Name",
  order: "A - Z",
};

function getLevelColor(level) {
  const l = String(level || "").toLowerCase();
  if (l.includes("advanced") || l.includes("expert")) {
    return {
      bg: "rgba(239, 68, 68, 0.15)",
      text: "#ef4444",
      border: "rgba(239, 68, 68, 0.3)",
    };
  }
  if (l.includes("intermediate")) {
    return {
      bg: "rgba(59, 130, 246, 0.15)",
      text: "#3b82f6",
      border: "rgba(59, 130, 246, 0.3)",
    };
  }
  return {
    bg: "rgba(34, 181, 115, 0.15)",
    text: "#22B573",
    border: "rgba(34, 181, 115, 0.3)",
  };
}

function getOperatorsForField(field) {
  const textFields = ["name", "description", "tag"];
  const selectFields = ["level"];
  const numberFields = ["price"];
  if (!field) {
    return [
      { value: "contains", label: "Contains" },
      { value: "equals", label: "Equals" },
      { value: "startsWith", label: "Starts with" },
      { value: "endsWith", label: "Ends with" },
    ];
  }
  if (textFields.includes(field)) {
    return [
      { value: "contains", label: "Contains" },
      { value: "equals", label: "Equals" },
      { value: "startsWith", label: "Starts with" },
      { value: "endsWith", label: "Ends with" },
    ];
  }
  if (selectFields.includes(field)) {
    return [
      { value: "equals", label: "Is exactly" },
      { value: "notEquals", label: "Is not exactly" },
    ];
  }
  if (numberFields.includes(field)) {
    return [
      { value: "equals", label: "Equals" },
      { value: "greaterThan", label: "Greater than" },
      { value: "lessThan", label: "Less than" },
      { value: "between", label: "Between" },
    ];
  }
  return [{ value: "equals", label: "Equals" }];
}

const PRODUCT_ADVANCED_FIELD_KEYS = [
  "name",
  "price",
  "level",
  "tag",
  "description",
];

const PRODUCT_FIELD_LABELS = {
  name: "Name",
  price: "Price",
  level: "Level",
  tag: "Tag",
  description: "Description",
};

function normalizeProductFilterConditions(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return [
      {
        id: 1,
        field: "",
        operator: "contains",
        value: "",
        value2: "",
        include: true,
        chain: "and",
      },
    ];
  }
  return list.map((c, idx) => ({
    ...c,
    id: c.id ?? idx + 1,
    value2: c.value2 ?? "",
    chain: idx > 0 ? c.chain || "and" : "and",
    include: c.include !== false,
  }));
}

function buildApiFiltersFromSimple(f, productLevelData) {
  const o = {};
  if (f.name?.trim()) o.name = f.name.trim();
  if (f.level && f.level !== "All Levels") {
    const found = productLevelData.find((x) => x.label === f.level);
    if (found != null) o.level = found.level;
  }
  if (f.tag && f.tag !== "Select Tags...") o.tag = f.tag;
  if (f.minPrice !== "" && f.minPrice != null) o["price.$gte"] = Number(f.minPrice);
  if (f.maxPrice !== "" && f.maxPrice != null) o["price.$lte"] = Number(f.maxPrice);
  return filterTruthyValues(o);
}

function mapProductRow(raw, productLevelObj) {
  const levelNum = raw.level;
  const levelLabel = productLevelObj[levelNum] ?? `L${levelNum}`;
  return {
    id: raw._id,
    raw,
    name: raw.name || "",
    price: Number(raw.price) || 0,
    description: raw.description || "",
    tag: raw.tag || "",
    level: levelLabel,
    levelNum,
  };
}

function conditionHasActiveValue(cond) {
  if (!cond.field) return false;
  if (cond.field === "price" && cond.operator === "between") {
    return (
      String(cond.value ?? "").trim() !== "" && String(cond.value2 ?? "").trim() !== ""
    );
  }
  return String(cond.value ?? "").trim() !== "";
}

function advancedMatchRow(row, filterConditions) {
  if (!filterConditions.length) return true;
  if (!filterConditions.some((c) => conditionHasActiveValue(c))) return true;

  const evalOne = (cond) => {
    let val = "";
    if (cond.field === "name") val = row.name;
    else if (cond.field === "price") val = row.price;
    else if (cond.field === "level") val = row.level;
    else if (cond.field === "tag") val = row.tag;
    else if (cond.field === "description") val = row.description;

    let isMatch = false;
    const vStr = String(val).toLowerCase();
    const targetStr = String(cond.value).toLowerCase();

    if (cond.field === "price") {
      const n = Number(val);
      if (cond.operator === "between") {
        const lo = Number(cond.value);
        const hi = Number(cond.value2);
        isMatch = n >= lo && n <= hi;
      } else if (cond.operator === "equals") isMatch = n === Number(cond.value);
      else if (cond.operator === "greaterThan") isMatch = n > Number(cond.value);
      else if (cond.operator === "lessThan") isMatch = n < Number(cond.value);
    } else if (cond.operator === "contains") isMatch = vStr.includes(targetStr);
    else if (cond.operator === "equals") isMatch = vStr === targetStr;
    else if (cond.operator === "startsWith") isMatch = vStr.startsWith(targetStr);
    else if (cond.operator === "endsWith") isMatch = vStr.endsWith(targetStr);
    else if (cond.operator === "notEquals") isMatch = vStr !== targetStr;

    return cond.include ? isMatch : !isMatch;
  };

  let acc = null;
  for (let i = 0; i < filterConditions.length; i++) {
    const cond = filterConditions[i];
    if (!conditionHasActiveValue(cond)) continue;
    const r = evalOne(cond);
    if (acc === null) acc = r;
    else {
      const chain = i > 0 ? cond.chain || "and" : "and";
      acc = chain === "or" ? acc || r : acc && r;
    }
  }
  return acc ?? true;
}

const ViewProducts = () => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const roles = useRoles();
  const { userData } = useSelector((state) => state.auth);
  const { data: subscription } = useUserSubscription();
  const productRevenueMetrics = subscription?.plan?.productRevenueMetrics;
  const role = userData?.role;

  const { isLoading, isSuccess, productData, totalPages } = useSelector((s) => s.product);
  const { employeeModeData } = useSelector((s) => s.employee);
  const LIMIT = useSelector((s) => s.pageLimits[tableHeader] || 10);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") || 1) || 1;
  const setPage = useCallback(
    (p) => {
      const next = typeof p === "function" ? p(page) : p;
      setSearchParams({ page: String(next) }, { replace: true });
    },
    [page, setSearchParams]
  );

  const [apiFilters, setApiFilters] = useState({});
  const [productLevelData, setProductLevelData] = useState([]);
  const [productLevelObj, setProductLevelObj] = useState({});
  const [tagData, setTagData] = useState([]);

  const [portalTarget, setPortalTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isLoadPresetModalOpen, setIsLoadPresetModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);

  const [editProductForm, setEditProductForm] = useState({
    name: "",
    price: "",
    level: "",
    tag: "",
    description: "",
  });

  const [filterTab, setFilterTab] = useState("simple");
  const [filters, setFilters] = useState(() => ({ ...defaultFilters }));
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);

  const [filterConditions, setFilterConditions] = useState([
    {
      id: 1,
      field: "",
      operator: "contains",
      value: "",
      value2: "",
      include: true,
      chain: "and",
    },
  ]);

  const [savedPresets, setSavedPresets] = useState([
    {
      id: "1",
      name: "High Ticket Products",
      filters: { ...defaultFilters, minPrice: "5000" },
      filterTab: "simple",
      filterConditions: [],
    },
  ]);
  const [selectedPresetId, setSelectedPresetId] = useState("");

  const [activeView, setActiveView] = useState("table");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    setPortalTarget(typeof document !== "undefined" ? document.body : null);
  }, []);

  useEffect(() => {
    const open =
      showFilters ||
      isLoadPresetModalOpen ||
      isViewDetailsOpen ||
      isEditProductOpen ||
      isAddProductOpen ||
      isFullscreen ||
      isDeleteModalOpen;
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    showFilters,
    isLoadPresetModalOpen,
    isViewDetailsOpen,
    isEditProductOpen,
    isAddProductOpen,
    isFullscreen,
    isDeleteModalOpen,
  ]);

  useEffect(() => {
    productLevelService.getProductLevels().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setProductLevelData(res.data);
        const obj = {};
        res.data.forEach((item) => {
          obj[item.level] = item.label;
        });
        setProductLevelObj(obj);
      }
    });
    tagsService.getTags().then((res) => {
      if (res.success && Array.isArray(res.data)) setTagData(res.data);
    });
    return () => {
      dispatch(clearProductData());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllProducts({ page, limit: LIMIT, filters: apiFilters }));
  }, [dispatch, page, LIMIT, apiFilters]);

  useEffect(() => {
    if (!isSuccess) return;
    dispatch(getAllProducts({ page: 1, limit: LIMIT, filters: apiFilters }));
    dispatch(resetProductState());
    setPage(1);
  }, [isSuccess, dispatch, LIMIT, apiFilters, setPage]);

  const productRows = useMemo(() => {
    if (!Array.isArray(productData)) return [];
    return productData.map((raw) => mapProductRow(raw, productLevelObj));
  }, [productData, productLevelObj]);

  const isFilterApplied = useMemo(() => {
    const simpleChanged = Object.keys(defaultFilters).some(
      (key) => filters[key] !== defaultFilters[key]
    );
    const adv =
      filterConditions.length > 1 ||
      filterConditions.some((c) => conditionHasActiveValue(c));
    return simpleChanged || adv;
  }, [filters, filterConditions]);

  const usedAdvancedFieldKeys = useMemo(
    () => new Set(filterConditions.map((c) => c.field).filter(Boolean)),
    [filterConditions]
  );
  const canAddProductCondition =
    usedAdvancedFieldKeys.size < PRODUCT_ADVANCED_FIELD_KEYS.length;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const terms = q.split(/\s+/).filter(Boolean);
    return productRows.filter((p) => {
      const matchesSearch =
        !terms.length ||
        terms.every(
          (term) =>
            p.name.toLowerCase().includes(term) ||
            (p.tag || "").toLowerCase().includes(term) ||
            (p.description || "").toLowerCase().includes(term)
        );
      if (!matchesSearch) return false;
      if (filterTab === "simple") {
        if (filters.name && !p.name.toLowerCase().includes(filters.name.toLowerCase()))
          return false;
        if (filters.level !== "All Levels" && p.level !== filters.level) return false;
        if (filters.tag !== "Select Tags..." && p.tag !== filters.tag) return false;
        if (filters.minPrice && p.price < Number(filters.minPrice)) return false;
        if (filters.maxPrice && p.price > Number(filters.maxPrice)) return false;
      } else if (!advancedMatchRow(p, filterConditions)) return false;
      return true;
    });
  }, [productRows, searchQuery, filterTab, filters, filterConditions]);

  const sortedProducts = useMemo(() => {
    if (!sortField || !sortDirection) return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      let valA;
      let valB;
      switch (sortField) {
        case "serial":
          return 0;
        case "name":
          valA = a.name;
          valB = b.name;
          break;
        case "price":
          valA = a.price;
          valB = b.price;
          break;
        case "level":
          valA = a.level;
          valB = b.level;
          break;
        case "tag":
          valA = a.tag;
          valB = b.tag;
          break;
        default:
          valA = a.name;
          valB = b.name;
      }
      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortField, sortDirection]);

  const finalProducts = useMemo(() => {
    if (sortField === "serial" && sortDirection === "desc") return [...sortedProducts].reverse();
    return sortedProducts;
  }, [sortedProducts, sortField, sortDirection]);

  const startIndex = (page - 1) * LIMIT;
  const paginatedProducts = finalProducts;

  const toggleSelectAll = () => {
    if (
      selectedIds.size === paginatedProducts.length &&
      paginatedProducts.length > 0
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") setSortDirection(null);
      else setSortDirection("asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    if (sortDirection === "asc") return <ArrowUp className="w-3 h-3 text-blue-500" />;
    if (sortDirection === "desc") return <ArrowDown className="w-3 h-3 text-blue-500" />;
    return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
  };

  const handleResetFilters = () => {
    setFilters({ ...defaultFilters });
    setSearchQuery("");
    setPage(1);
    setFilterConditions(normalizeProductFilterConditions([]));
    setSelectedPresetId("");
    setApiFilters({});
  };

  const handleFilterApply = () => {
    if (filterTab === "simple") {
      setApiFilters(buildApiFiltersFromSimple(filters, productLevelData));
      setPage(1);
    }
    setShowFilters(false);
  };

  const handleAddCondition = () => {
    if (!canAddProductCondition) return;
    const newId =
      filterConditions.length > 0
        ? Math.max(...filterConditions.map((c) => c.id)) + 1
        : 1;
    setFilterConditions([
      ...filterConditions,
      {
        id: newId,
        field: "",
        operator: "contains",
        value: "",
        value2: "",
        include: true,
        chain: "and",
      },
    ]);
  };

  const handleRemoveCondition = (id) => {
    const next = filterConditions.filter((c) => c.id !== id);
    setFilterConditions(
      next.length ? next : normalizeProductFilterConditions([])
    );
  };

  const handleUpdateCondition = (id, key, value) => {
    setFilterConditions(
      filterConditions.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c, [key]: value };
        if (key === "operator" && value !== "between") next.value2 = "";
        return next;
      })
    );
  };

  const handleConditionFieldChange = (id, newField) => {
    const ops = getOperatorsForField(newField || "");
    setFilterConditions(
      filterConditions.map((c) =>
        c.id === id
          ? {
              ...c,
              field: newField,
              operator: ops[0]?.value || "contains",
              value: "",
              value2: "",
            }
          : c
      )
    );
  };

  const handleLoadPreset = () => {
    const preset = savedPresets.find((p) => p.id === selectedPresetId);
    if (preset) {
      setFilters(preset.filters);
      setFilterTab(preset.filterTab);
      setFilterConditions(normalizeProductFilterConditions(preset.filterConditions));
      if (preset.filterTab === "simple") {
        setApiFilters(buildApiFiltersFromSimple(preset.filters, productLevelData));
        setPage(1);
      }
    }
    setIsLoadPresetModalOpen(false);
  };

  const handleDeletePreset = () => {
    if (!selectedPresetId) return;
    setSavedPresets(savedPresets.filter((p) => p.id !== selectedPresetId));
    setSelectedPresetId("");
  };

  const openViewDetails = (product) => {
    setSelectedProduct(product);
    setIsViewDetailsOpen(true);
  };

  const openEditProductModal = (product) => {
    setSelectedProduct(product);
    setEditProductForm({
      name: product.name,
      price: String(product.price),
      level: String(product.levelNum ?? ""),
      tag: product.tag || "",
      description: product.description || "",
    });
    setIsEditProductOpen(true);
  };

  const openAddProductModal = () => {
    const first = productLevelData[0];
    setEditProductForm({
      name: "",
      price: "",
      level: first != null ? String(first.level) : "",
      tag: "",
      description: "",
    });
    setSelectedProduct(null);
    setIsAddProductOpen(true);
  };

  const handleAddProduct = () => {
    if (!editProductForm.name || !editProductForm.price || !editProductForm.level) {
      errorToast("Please fill product name, price, and level.");
      return;
    }
    dispatch(
      addProduct({
        name: editProductForm.name.trim(),
        price: Number(editProductForm.price),
        level: Number(editProductForm.level),
        tag: editProductForm.tag?.trim() || undefined,
        description: editProductForm.description?.trim() || "",
      })
    ).then((res) => {
      if (res.meta?.requestStatus === "fulfilled") {
        setIsAddProductOpen(false);
      }
    });
  };

  const handleUpdateProduct = () => {
    if (!selectedProduct) return;
    if (!editProductForm.name || !editProductForm.price || !editProductForm.level) {
      errorToast("Please fill product name, price, and level.");
      return;
    }
    dispatch(
      updateProduct({
        id: selectedProduct.raw._id,
        name: editProductForm.name.trim(),
        price: Number(editProductForm.price),
        level: Number(editProductForm.level),
        tag: editProductForm.tag?.trim() || "",
        description: editProductForm.description?.trim() || "",
      })
    ).then((res) => {
      if (res.meta?.requestStatus === "fulfilled") {
        setIsEditProductOpen(false);
        setSelectedProduct(null);
      }
    });
  };

  const handleDeleteProduct = (id) => {
    const row = productRows.find((p) => p.id === id);
    if (!row) return;
    setItemToDelete({ id, name: row.name });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (!itemToDelete) return;
    dispatch(deleteProduct(itemToDelete.id)).then((res) => {
      if (res.meta?.requestStatus === "fulfilled") {
        const next = new Set(selectedIds);
        next.delete(itemToDelete.id);
        setSelectedIds(next);
        dispatch(getAllProducts({ page, limit: LIMIT, filters: apiFilters }));
      }
    });
    setItemToDelete(null);
  };

  const inputStyle = useMemo(
    () => ({
      backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
      border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
      color: theme === "dark" ? "#f8fafc" : "#0f172a",
      fontFamily: "Inter, sans-serif",
    }),
    [theme]
  );

  const labelStyle = useMemo(
    () => ({
      color: theme === "dark" ? "#cbd5e1" : "#475569",
      fontSize: "11px",
      fontWeight: 600,
      marginBottom: "2px",
      display: "block",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }),
    [theme]
  );

  const levelOptions = useMemo(
    () => ["All Levels", ...productLevelData.map((d) => d.label)],
    [productLevelData]
  );
  const tagOptions = useMemo(
    () => ["Select Tags...", ...tagData.map((t) => t.name)],
    [tagData]
  );
  const levelFilterLabels = useMemo(
    () => productLevelData.map((d) => d.label),
    [productLevelData]
  );
  const tagFilterLabels = useMemo(() => tagData.map((t) => t.name), [tagData]);

  const pillBase =
    "px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors shrink-0";
  const inactivePillText = theme === "dark" ? "#94a3b8" : "#64748b";

  const TableUI = (
    <motion.div
      className={`rounded-2xl overflow-hidden border flex flex-col transition-all duration-300 ${
        isFullscreen ? "flex-1 h-full shadow-2xl" : ""
      }`}
      style={{
        background:
          theme === "dark"
            ? isFullscreen
              ? "#1e293b"
              : "rgba(30, 41, 59, 0.7)"
            : isFullscreen
              ? "#ffffff"
              : "rgba(255, 255, 255, 0.7)",
        backdropFilter: isFullscreen ? "none" : "blur(16px)",
        borderColor:
          theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)",
        boxShadow:
          theme === "light" && !isFullscreen ? "0 10px 40px rgba(7, 16, 40, 0.04)" : "none",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.08,
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div
        className="p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{
          borderColor: theme === "dark" ? "#334155" : "rgba(0,0,0,0.05)",
        }}
      >
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search product name, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
              border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
              color: theme === "dark" ? "#f8fafc" : "#0f172a",
            }}
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
          {isFilterApplied && (
            <Button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl flex items-center gap-2 px-4 flex-1 sm:flex-none hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              style={{
                backgroundColor: "transparent",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <RotateCcw className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
          <Button
            type="button"
            onClick={() => setIsLoadPresetModalOpen(true)}
            className="rounded-xl flex items-center gap-2 px-4 flex-1 sm:flex-none hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              backgroundColor: theme === "dark" ? "#1e293b" : "white",
              color: theme === "dark" ? "#f8fafc" : "#071028",
              border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
            }}
          >
            <Bookmark className="w-4 h-4 text-gray-500" />{" "}
            <span className="hidden sm:inline">Presets</span>
          </Button>
          <Button
            type="button"
            onClick={() => setShowFilters(true)}
            className="rounded-xl flex items-center gap-2 px-4 flex-1 sm:flex-none hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              backgroundColor: theme === "dark" ? "#1e293b" : "white",
              color: theme === "dark" ? "#f8fafc" : "#071028",
              border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
            }}
          >
            <Filter className="w-4 h-4 text-gray-500" />{" "}
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-xl flex items-center justify-center p-2.5 flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              backgroundColor: theme === "dark" ? "#1e293b" : "white",
              color: theme === "dark" ? "#94a3b8" : "#64748b",
              border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div
        className={`overflow-x-auto custom-scrollbar ${isFullscreen ? "flex-1 overflow-y-auto" : ""}`}
      >
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className={isFullscreen ? "sticky top-0 z-20" : ""}>
            <tr
              style={{
                backgroundColor: theme === "dark" ? "rgba(15,23,42,0.95)" : "#F9FAFB",
                backdropFilter: isFullscreen ? "blur(8px)" : "none",
              }}
            >
              <th
                className="p-4 font-semibold text-xs uppercase tracking-wider sticky left-0 z-30"
                style={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#F9FAFB",
                  color: theme === "dark" ? "#94a3b8" : "#64748b",
                }}
              >
                <Checkbox
                  checked={
                    selectedIds.size === paginatedProducts.length &&
                    paginatedProducts.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                  className={theme === "dark" ? "border-slate-500" : ""}
                />
              </th>
              <th
                className="p-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-black/5"
                style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
                onClick={() => handleSort("serial")}
              >
                <div className="flex items-center gap-2">
                  S.No <SortIcon field="serial" />
                </div>
              </th>
              <th
                className="p-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-black/5"
                style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  Name <SortIcon field="name" />
                </div>
              </th>
              <th
                className="p-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-black/5"
                style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
                onClick={() => handleSort("price")}
              >
                <div className="flex items-center gap-2">
                  Price (INR) <SortIcon field="price" />
                </div>
              </th>
              <th
                className="p-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-black/5"
                style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
                onClick={() => handleSort("level")}
              >
                <div className="flex items-center gap-2">
                  Level <SortIcon field="level" />
                </div>
              </th>
              <th
                className="p-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-black/5"
                style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
                onClick={() => handleSort("tag")}
              >
                <div className="flex items-center gap-2">
                  Tag <SortIcon field="tag" />
                </div>
              </th>
              <th
                className="p-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap"
                style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
              >
                Description
              </th>
              {!employeeModeData && role === roles.ADMIN && (
                <th
                  className="p-4 font-semibold text-xs uppercase tracking-wider whitespace-nowrap text-right sticky right-0 z-30"
                  style={{
                    backgroundColor: theme === "dark" ? "#1e293b" : "#F9FAFB",
                    color: theme === "dark" ? "#94a3b8" : "#64748b",
                    boxShadow: "-4px 0 10px rgba(0,0,0,0.05)",
                  }}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={employeeModeData || role !== roles.ADMIN ? 7 : 8}
                  className="p-8 text-center"
                  style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <AppLoader size="lg" />
                    <p>Loading products...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={employeeModeData || role !== roles.ADMIN ? 7 : 8}
                  className="p-8 text-center"
                  style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 mb-2 opacity-20" />
                    <p>No products found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product, index) => {
                const isSelected = selectedIds.has(product.id);
                const levelStyles = getLevelColor(product.level);
                const showActions = !employeeModeData && role === roles.ADMIN;
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.03,
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={() => openViewDetails(product)}
                    className="border-b transition-colors group cursor-pointer"
                    style={{
                      borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                      backgroundColor: isSelected
                        ? theme === "dark"
                          ? "rgba(34, 181, 115, 0.1)"
                          : "rgba(34, 181, 115, 0.05)"
                        : "transparent",
                    }}
                  >
                    <td
                      className="p-4 sticky left-0 z-10 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor:
                          theme === "dark"
                            ? isSelected
                              ? "#1e293b"
                              : "#0f172a"
                            : isSelected
                              ? "#f0fdf4"
                              : "#ffffff",
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(product.id)}
                        className={theme === "dark" ? "border-slate-500" : ""}
                      />
                    </td>
                    <td
                      className="p-4 text-sm font-medium group-hover:bg-black/5 dark:group-hover:bg-white/5"
                      style={{ color: theme === "dark" ? "#cbd5e1" : "#64748b" }}
                    >
                      {sortField === "serial" && sortDirection === "desc"
                        ? Math.max(0, finalProducts.length - (startIndex + index))
                        : startIndex + index + 1}
                    </td>
                    <td className="p-4 whitespace-nowrap group-hover:bg-black/5 dark:group-hover:bg-white/5">
                      <div
                        className="flex items-center gap-2 text-sm font-bold"
                        style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
                      >
                        <Package className="w-4 h-4 text-blue-500 shrink-0" />
                        {product.name}
                      </div>
                    </td>
                    <td
                      className="p-4 whitespace-nowrap text-sm font-bold group-hover:bg-black/5 dark:group-hover:bg-white/5"
                      style={{ color: "#22B573" }}
                    >
                      ₹{product.price.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 whitespace-nowrap group-hover:bg-black/5 dark:group-hover:bg-white/5">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: levelStyles.bg,
                          color: levelStyles.text,
                          borderColor: levelStyles.border,
                        }}
                      >
                        {product.level}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap group-hover:bg-black/5 dark:group-hover:bg-white/5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 flex items-center gap-1 w-max">
                        <Tag className="w-2.5 h-2.5 shrink-0" /> {product.tag || "—"}
                      </span>
                    </td>
                    <td
                      className="p-4 text-sm group-hover:bg-black/5 dark:group-hover:bg-white/5"
                      style={{ color: theme === "dark" ? "#cbd5e1" : "#475569" }}
                    >
                      <p className="line-clamp-1 max-w-[300px]" title={product.description}>
                        {product.description}
                      </p>
                    </td>
                    {showActions && (
                      <td
                        className="p-4 text-right sticky right-0 z-10 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          backgroundColor:
                            theme === "dark"
                              ? isSelected
                                ? "#1e293b"
                                : "#0f172a"
                              : isSelected
                                ? "#f0fdf4"
                                : "#ffffff",
                          boxShadow: "-4px 0 10px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            onClick={() => openViewDetails(product)}
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            type="button"
                            onClick={() => openEditProductModal(product)}
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10"
                          >
                            <Edit className="w-4 h-4 text-orange-500" />
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div
        className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0"
        style={{
          borderColor: theme === "dark" ? "#334155" : "rgba(0,0,0,0.05)",
          backgroundColor: theme === "dark" ? "rgba(15,23,42,0.4)" : "#F9FAFB",
        }}
      >
        <div className="text-sm" style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
          Showing {finalProducts.length > 0 ? startIndex + 1 : 0} to{" "}
          {startIndex + finalProducts.length} on this page · Page {page} of {totalPages || 1}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            style={{
              backgroundColor: theme === "dark" ? "#1e293b" : "white",
              color: theme === "dark" ? "#f8fafc" : "#071028",
              border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
            }}
          >
            Previous
          </Button>
          <Button
            type="button"
            disabled={page >= (totalPages || 1)}
            onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            style={{
              backgroundColor: theme === "dark" ? "#1e293b" : "white",
              color: theme === "dark" ? "#f8fafc" : "#071028",
              border: `1px solid ${theme === "dark" ? "#334155" : "#e2e8f0"}`,
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const shellBorder = theme === "dark" ? "#334155" : "#e5e7eb";

  if (activeView === "revenue") {
    return <ProductsRevenueView onBack={() => setActiveView("table")} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 transition-all duration-300">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h2
            className="text-2xl font-bold tracking-tight flex items-center gap-3 flex-wrap"
            style={{ color: theme === "dark" ? "#f8fafc" : "#071028" }}
          >
            Products Table
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor:
                  theme === "dark" ? "rgba(59, 130, 246, 0.2)" : "#eff6ff",
                color: theme === "dark" ? "#60a5fa" : "#2563eb",
                border: `1px solid ${
                  theme === "dark" ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe"
                }`,
              }}
            >
              Total: {Array.isArray(productData) ? productData.length : 0}
            </span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track your available products and pricing.
          </p>
        </div>
        <ComponentGuard
          allowedRoles={[roles.ADMIN]}
          conditions={[userData?.isActive, employeeModeData ? false : true]}
        >
          <div className="flex flex-wrap items-center gap-3">
            {productRevenueMetrics && (
              <Button
                type="button"
                onClick={() => setActiveView("revenue")}
                className="rounded-xl flex items-center gap-2 px-4 transition-transform hover:scale-105 shadow-sm"
                style={{ backgroundColor: "#22B573", color: "white", border: "none" }}
              >
                <IndianRupee className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">Revenue</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={openAddProductModal}
              className="rounded-xl flex items-center gap-2 px-4 shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: "#1877F2", color: "white", border: "none" }}
            >
              <Plus className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">Add Product</span>
            </Button>
          </div>
        </ComponentGuard>
      </motion.div>

      {isFullscreen && portalTarget
        ? createPortal(
            <div
              className={`fixed inset-0 z-[100] p-4 sm:p-6 flex flex-col ${
                theme === "dark" ? "bg-[#0f172a]" : "bg-[#F2F4F6]"
              }`}
            >
              {TableUI}
            </div>,
            portalTarget
          )
        : TableUI}

      {portalTarget &&
        createPortal(
          <AnimatePresence>
            {(isAddProductOpen || isEditProductOpen) && (
              <motion.div
                key="add-edit-product"
                className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setIsAddProductOpen(false);
                    setIsEditProductOpen(false);
                  }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden max-h-[90vh]"
                  style={{
                    backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                    border: `1px solid ${shellBorder}`,
                  }}
                  onMouseDown={(ev) => ev.stopPropagation()}
                >
                  <div
                    className="flex items-center justify-between p-5 border-b bg-gray-50 dark:bg-slate-800/50 flex-shrink-0"
                    style={{ borderColor: shellBorder }}
                  >
                    <h3
                      className="text-lg font-bold flex items-center gap-2"
                      style={{ color: theme === "dark" ? "#f8fafc" : "#1e293b" }}
                    >
                      <Package className="w-5 h-5 text-blue-500" />{" "}
                      {isEditProductOpen ? "Edit Product" : "Add New Product"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddProductOpen(false);
                        setIsEditProductOpen(false);
                      }}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label
                          className="block text-sm font-medium mb-1.5"
                          style={{ color: theme === "dark" ? "#cbd5e1" : "#334155" }}
                        >
                          Product Name
                        </label>
                        <Input
                          value={editProductForm.name}
                          onChange={(e) =>
                            setEditProductForm({ ...editProductForm, name: e.target.value })
                          }
                          placeholder="e.g., Lead Generation Masterclass"
                          className="rounded-lg"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-1.5"
                          style={{ color: theme === "dark" ? "#cbd5e1" : "#334155" }}
                        >
                          Price (INR)
                        </label>
                        <Input
                          type="number"
                          value={editProductForm.price}
                          onChange={(e) =>
                            setEditProductForm({ ...editProductForm, price: e.target.value })
                          }
                          placeholder="4999"
                          className="rounded-lg"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-1.5"
                          style={{ color: theme === "dark" ? "#cbd5e1" : "#334155" }}
                        >
                          Level
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex h-11 w-full items-center justify-between rounded-xl px-4 py-2 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                              style={inputStyle}
                            >
                              <span className="truncate">
                                {editProductForm.level
                                  ? productLevelData.find((item) => String(item.level) === String(editProductForm.level))?.label || editProductForm.level
                                  : "Select level"}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                          >
                            {productLevelData.map((item) => (
                              <DropdownMenuItem
                                key={item._id || item.level}
                                onClick={() =>
                                  setEditProductForm({ ...editProductForm, level: String(item.level) })
                                }
                                className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                              >
                                {item.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          className="block text-sm font-medium mb-1.5"
                          style={{ color: theme === "dark" ? "#cbd5e1" : "#334155" }}
                        >
                          Tag (Optional)
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex h-11 w-full items-center justify-between rounded-xl px-4 py-2 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                              style={inputStyle}
                            >
                              <span className="truncate">
                                {editProductForm.tag || "No tag"}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                setEditProductForm({ ...editProductForm, tag: "" })
                              }
                              className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                            >
                              No tag
                            </DropdownMenuItem>
                            {editProductForm.tag &&
                              !tagData.some((t) => t.name === editProductForm.tag) && (
                                <DropdownMenuItem
                                  key={editProductForm.tag}
                                  onClick={() =>
                                    setEditProductForm({ ...editProductForm, tag: editProductForm.tag })
                                  }
                                  className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  {editProductForm.tag}
                                </DropdownMenuItem>
                              )}
                            {tagData.map((item) => (
                              <DropdownMenuItem
                                key={item._id || item.name}
                                onClick={() =>
                                  setEditProductForm({ ...editProductForm, tag: item.name })
                                }
                                className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                              >
                                {item.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          className="block text-sm font-medium mb-1.5"
                          style={{ color: theme === "dark" ? "#cbd5e1" : "#334155" }}
                        >
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={editProductForm.description}
                          onChange={(e) =>
                            setEditProductForm({
                              ...editProductForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Product features and details..."
                          className="w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 resize-none custom-scrollbar"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex justify-end gap-3 p-5 border-t bg-gray-50 dark:bg-slate-800/50 flex-shrink-0"
                    style={{ borderColor: shellBorder }}
                  >
                    <Button
                      type="button"
                      onClick={() => {
                        setIsAddProductOpen(false);
                        setIsEditProductOpen(false);
                        setSelectedProduct(null);
                      }}
                      className="px-5 py-2 rounded-xl font-medium"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={isEditProductOpen ? handleUpdateProduct : handleAddProduct}
                      className="px-6 py-2 rounded-xl font-semibold hover:scale-105"
                      style={{ backgroundColor: "#1877F2", color: "#ffffff" }}
                    >
                      {isEditProductOpen ? "Save Changes" : "Create Product"}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {isViewDetailsOpen && selectedProduct && (
              <motion.div
                key="view-product-details"
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsViewDetailsOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden max-h-[90vh]"
                  style={{
                    backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
                    border: `1px solid ${shellBorder}`,
                  }}
                  onMouseDown={(ev) => ev.stopPropagation()}
                >
                  <div
                    className="flex items-center justify-between p-5 border-b bg-white dark:bg-slate-800 flex-shrink-0"
                    style={{ borderColor: shellBorder }}
                  >
                    <h3
                      className="text-xl font-bold flex items-center gap-2"
                      style={{ color: theme === "dark" ? "#f8fafc" : "#1e293b" }}
                    >
                      <Package className="w-5 h-5 text-blue-500" /> Product Details
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsViewDetailsOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4 overflow-y-auto">
                    <div
                      className="flex items-center justify-between border rounded-lg p-3 bg-white dark:bg-slate-800"
                      style={{ borderColor: shellBorder }}
                    >
                      <span className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        Name
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: theme === "dark" ? "#f8fafc" : "#1e293b" }}
                      >
                        {selectedProduct.name}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between border rounded-lg p-3 bg-white dark:bg-slate-800"
                      style={{ borderColor: shellBorder }}
                    >
                      <span className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        Price
                      </span>
                      <span className="text-sm font-black text-green-500">
                        ₹{selectedProduct.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between border rounded-lg p-3 bg-white dark:bg-slate-800"
                      style={{ borderColor: shellBorder }}
                    >
                      <span className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        Level
                      </span>
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: getLevelColor(selectedProduct.level).bg,
                          color: getLevelColor(selectedProduct.level).text,
                          borderColor: getLevelColor(selectedProduct.level).border,
                        }}
                      >
                        {selectedProduct.level}
                      </span>
                    </div>
                    <div
                      className="flex flex-col border rounded-lg p-3 bg-white dark:bg-slate-800 gap-2"
                      style={{ borderColor: shellBorder }}
                    >
                      <span className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        Tag
                      </span>
                      <span
                        className="text-sm font-medium"
                        style={{ color: theme === "dark" ? "#cbd5e1" : "#475569" }}
                      >
                        {selectedProduct.tag || "—"}
                      </span>
                    </div>
                    <div
                      className="flex flex-col border rounded-lg p-3 bg-white dark:bg-slate-800 gap-2"
                      style={{ borderColor: shellBorder }}
                    >
                      <span className="text-sm font-bold uppercase tracking-wider text-gray-500">
                        Description
                      </span>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: theme === "dark" ? "#cbd5e1" : "#475569" }}
                      >
                        {selectedProduct.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {showFilters && (
              <motion.div
                key="filter-modal"
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFilters(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-[1200px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10"
                  style={{
                    backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                    border: `1px solid ${shellBorder}`,
                  }}
                  onMouseDown={(ev) => ev.stopPropagation()}
                >
                  <div
                    className="flex items-center justify-between p-4 border-b flex-shrink-0"
                    style={{ borderColor: shellBorder }}
                  >
                    <h3
                      className="text-lg font-bold flex items-center gap-2"
                      style={{ color: theme === "dark" ? "#f8fafc" : "#0f172a" }}
                    >
                      <Filter className="w-5 h-5 text-gray-500" /> Product Filters
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="p-1.5 rounded-lg hover:bg-black/5"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <div
                    className="flex gap-2 px-4 pt-2 border-b flex-shrink-0"
                    style={{ borderColor: theme === "dark" ? "#374151" : "#e5e7eb" }}
                  >
                    <button
                      type="button"
                      onClick={() => setFilterTab("simple")}
                      className="px-4 py-2 transition-all duration-300 relative"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        fontWeight: 600,
                        color:
                          filterTab === "simple"
                            ? "#22B573"
                            : theme === "dark"
                              ? "#94a3b8"
                              : "#64748b",
                        backgroundColor: "transparent",
                      }}
                    >
                      Simple Filters
                      {filterTab === "simple" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22B573] rounded-t-full" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab("advanced")}
                      className="px-4 py-2 transition-all duration-300 relative"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        fontWeight: 600,
                        color:
                          filterTab === "advanced"
                            ? "#22B573"
                            : theme === "dark"
                              ? "#94a3b8"
                              : "#64748b",
                        backgroundColor: "transparent",
                      }}
                    >
                      Conditional Logic
                      {filterTab === "advanced" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22B573] rounded-t-full" />
                      )}
                    </button>
                  </div>
                  <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar flex-1">
                    {filterTab === "simple" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <span style={labelStyle}>Product Name</span>
                          <input
                            type="text"
                            value={filters.name}
                            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            placeholder="Masterclass..."
                            className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <span style={labelStyle}>Level</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex h-10 w-full items-center justify-between rounded-xl px-3 py-2 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                                style={inputStyle}
                              >
                                <span className="truncate">
                                  {filters.level || "Select level"}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                            >
                              {levelOptions.map((o) => (
                                <DropdownMenuItem
                                  key={o}
                                  onClick={() => setFilters({ ...filters, level: o })}
                                  className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  {o}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div>
                          <span style={labelStyle}>Tags</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                className="flex h-10 w-full items-center justify-between rounded-xl px-3 py-2 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                                style={inputStyle}
                              >
                                <span className="truncate">
                                  {filters.tag || "Select Tags..."}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                            >
                              {tagOptions.map((t) => (
                                <DropdownMenuItem
                                  key={t}
                                  onClick={() => setFilters({ ...filters, tag: t })}
                                  className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                >
                                  {t}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div>
                          <span style={labelStyle}>Price Range (INR)</span>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Min"
                              value={filters.minPrice}
                              onChange={(e) =>
                                setFilters({ ...filters, minPrice: e.target.value })
                              }
                              className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                              style={inputStyle}
                            />
                            <input
                              type="number"
                              placeholder="Max"
                              value={filters.maxPrice}
                              onChange={(e) =>
                                setFilters({ ...filters, maxPrice: e.target.value })
                              }
                              className="w-full p-2 rounded-xl text-sm focus:outline-none focus:ring-2"
                              style={inputStyle}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {filterTab === "advanced" && (
                      <div className="space-y-4 max-w-5xl mx-auto">
                        <div
                          className="p-3 rounded-xl border"
                          style={{
                            backgroundColor:
                              theme === "dark" ? "rgba(30,58,138,0.25)" : "#eff6ff",
                            borderColor: theme === "dark" ? "#1e3a8a" : "#bfdbfe",
                          }}
                        >
                          <span
                            className="text-[12px] font-medium flex items-start gap-2 leading-relaxed"
                            style={{ color: theme === "dark" ? "#93c5fd" : "#1e40af" }}
                          >
                            <span className="p-1 rounded bg-blue-500/20 shrink-0 mt-0.5">
                              <Filter className="w-3.5 h-3.5" />
                            </span>
                            <span>
                              Use AND/OR on each row to combine with the previous condition. Each
                              field can appear once — pick level or tag from the list like webinar
                              attendee filters.
                            </span>
                          </span>
                        </div>
                        <div className="space-y-3">
                          {filterConditions.map((condition, index) => {
                            const chain = condition.chain || "and";
                            const ops = getOperatorsForField(condition.field);
                            const isBetweenPrice =
                              condition.field === "price" && condition.operator === "between";
                            return (
                              <div
                                key={condition.id}
                                className="rounded-xl border p-3 sm:p-4"
                                style={{
                                  backgroundColor:
                                    theme === "dark" ? "rgba(15,23,42,0.35)" : "#ffffff",
                                  borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                                }}
                              >
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                  <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                                    style={{ backgroundColor: "#22B573" }}
                                  >
                                    {index + 1}
                                  </div>
                                  <div
                                    className="inline-flex rounded-full border p-0.5 shrink-0"
                                    style={{
                                      borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                                      backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateCondition(condition.id, "include", true)
                                      }
                                      className={pillBase}
                                      style={{
                                        backgroundColor:
                                          condition.include ? "#22B573" : "transparent",
                                        color: condition.include ? "#ffffff" : inactivePillText,
                                        borderColor: "transparent",
                                      }}
                                    >
                                      Include
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateCondition(condition.id, "include", false)
                                      }
                                      className={pillBase}
                                      style={{
                                        backgroundColor:
                                          !condition.include ? "#dc2626" : "transparent",
                                        color: !condition.include ? "#ffffff" : inactivePillText,
                                        borderColor: "transparent",
                                      }}
                                    >
                                      Exclude
                                    </button>
                                  </div>
                                  {index > 0 && (
                                    <div
                                      className="inline-flex rounded-full border p-0.5 shrink-0"
                                      style={{
                                        borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
                                        backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
                                      }}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateCondition(condition.id, "chain", "and")
                                        }
                                        className={`${pillBase} px-2.5`}
                                        style={{
                                          backgroundColor:
                                            chain === "and" ? "#2563eb" : "transparent",
                                          color: chain === "and" ? "#ffffff" : inactivePillText,
                                          borderColor: "transparent",
                                        }}
                                      >
                                        AND
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateCondition(condition.id, "chain", "or")
                                        }
                                        className={`${pillBase} px-2.5`}
                                        style={{
                                          backgroundColor:
                                            chain === "or" ? "#2563eb" : "transparent",
                                          color: chain === "or" ? "#ffffff" : inactivePillText,
                                          borderColor: "transparent",
                                        }}
                                      >
                                        OR
                                      </button>
                                    </div>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="flex h-10 min-w-[140px] flex-1 max-w-[220px] items-center justify-between rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                                        style={inputStyle}
                                      >
                                        <span className="truncate">
                                          {condition.field ? PRODUCT_FIELD_LABELS[condition.field] : "Choose field…"}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="start"
                                      className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                                    >
                                      <DropdownMenuItem
                                        onClick={() => handleConditionFieldChange(condition.id, "")}
                                        className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                      >
                                        Choose field…
                                      </DropdownMenuItem>
                                      {PRODUCT_ADVANCED_FIELD_KEYS.map((key) => {
                                        const takenElsewhere = filterConditions.some(
                                          (c) => c.id !== condition.id && c.field === key
                                        );
                                        const disabled = takenElsewhere && condition.field !== key;
                                        if (disabled) return null;
                                        return (
                                          <DropdownMenuItem
                                            key={key}
                                            onClick={() => handleConditionFieldChange(condition.id, key)}
                                            className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                          >
                                            {PRODUCT_FIELD_LABELS[key]}
                                          </DropdownMenuItem>
                                        );
                                      })}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild disabled={!condition.field}>
                                      <Button
                                        variant="outline"
                                        disabled={!condition.field}
                                        className="flex h-10 min-w-[120px] max-w-[160px] items-center justify-between rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
                                        style={inputStyle}
                                      >
                                        <span className="truncate">
                                          {ops.find((o) => o.value === condition.operator)?.label || condition.operator || "Select Operator"}
                                        </span>
                                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="start"
                                      className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                                    >
                                      {ops.map((op) => (
                                        <DropdownMenuItem
                                          key={op.value}
                                          onClick={() => handleUpdateCondition(condition.id, "operator", op.value)}
                                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                        >
                                          {op.label}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  {!condition.field ? (
                                    <div
                                      className="w-full min-w-[160px] flex-1 max-w-md"
                                      style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
                                    >
                                      <input
                                        readOnly
                                        placeholder="Enter value…"
                                        className="w-full p-2 rounded-lg text-sm opacity-60 cursor-not-allowed"
                                        style={inputStyle}
                                      />
                                    </div>
                                  ) : condition.field === "level" ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="flex h-10 flex-1 min-w-[160px] items-center justify-between rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                                          style={inputStyle}
                                        >
                                          <span className="truncate">
                                            {condition.value || "Enter value…"}
                                          </span>
                                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="start"
                                        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                                      >
                                        <DropdownMenuItem
                                          onClick={() => handleUpdateCondition(condition.id, "value", "")}
                                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                        >
                                          Enter value…
                                        </DropdownMenuItem>
                                        {levelFilterLabels.map((lbl) => (
                                          <DropdownMenuItem
                                            key={lbl}
                                            onClick={() => handleUpdateCondition(condition.id, "value", lbl)}
                                            className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                          >
                                            {lbl}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : condition.field === "tag" ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className="flex h-10 flex-1 min-w-[160px] items-center justify-between rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                                          style={inputStyle}
                                        >
                                          <span className="truncate">
                                            {condition.value || "Enter value…"}
                                          </span>
                                          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="start"
                                        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                                      >
                                        <DropdownMenuItem
                                          onClick={() => handleUpdateCondition(condition.id, "value", "")}
                                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                        >
                                          Enter value…
                                        </DropdownMenuItem>
                                        {tagFilterLabels.map((name) => (
                                          <DropdownMenuItem
                                            key={name}
                                            onClick={() => handleUpdateCondition(condition.id, "value", name)}
                                            className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                          >
                                            {name}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : isBetweenPrice ? (
                                    <div className="flex gap-2 flex-1 min-w-[180px]">
                                      <input
                                        type="number"
                                        value={condition.value}
                                        onChange={(e) =>
                                          handleUpdateCondition(
                                            condition.id,
                                            "value",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Min"
                                        className="w-full p-2 rounded-lg border text-sm outline-none min-w-0"
                                        style={inputStyle}
                                      />
                                      <input
                                        type="number"
                                        value={condition.value2 ?? ""}
                                        onChange={(e) =>
                                          handleUpdateCondition(
                                            condition.id,
                                            "value2",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Max"
                                        className="w-full p-2 rounded-lg border text-sm outline-none min-w-0"
                                        style={inputStyle}
                                      />
                                    </div>
                                  ) : (
                                    <input
                                      type={condition.field === "price" ? "number" : "text"}
                                      value={condition.value}
                                      onChange={(e) =>
                                        handleUpdateCondition(
                                          condition.id,
                                          "value",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Enter value…"
                                      className="flex-1 min-w-[100px] p-2 rounded-lg border text-sm outline-none focus:ring-2"
                                      style={inputStyle}
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCondition(condition.id)}
                                    className="p-2 rounded-xl shrink-0 hover:opacity-90"
                                    style={{
                                      borderWidth: 1,
                                      borderStyle: "solid",
                                      borderColor: theme === "dark" ? "#991b1b" : "#fca5a5",
                                      color: "#dc2626",
                                      backgroundColor: theme === "dark"
                                        ? "rgba(127, 29, 29, 0.2)"
                                        : "rgba(254, 242, 242, 0.95)",
                                    }}
                                    aria-label="Remove condition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={handleAddCondition}
                            disabled={!canAddProductCondition}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              backgroundColor: "#2563eb",
                              color: "#ffffff",
                              border: "none",
                              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.35)",
                            }}
                          >
                            <Plus className="w-4 h-4" /> Add Condition
                          </button>
                          {!canAddProductCondition && (
                            <p
                              className="text-xs mt-2"
                              style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
                            >
                              All fields are in use. Remove a row to add another.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className="p-4 border-t flex justify-between items-center flex-shrink-0"
                    style={{
                      borderColor: shellBorder,
                      backgroundColor:
                        theme === "dark" ? "rgba(15,23,42,0.5)" : "#F9FAFB",
                    }}
                  >
                    <Button type="button" onClick={handleResetFilters} variant="outline">
                      Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={handleFilterApply}
                      className="bg-[#22B573] text-white hover:bg-[#1da366]"
                    >
                      Apply
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {isLoadPresetModalOpen && (
              <motion.div
                key="load-preset-modal"
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsLoadPresetModalOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col z-10"
                  style={{
                    backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                    border: `1px solid ${shellBorder}`,
                  }}
                  onMouseDown={(ev) => ev.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-5">
                    <h3
                      className="text-lg font-bold"
                      style={{ color: theme === "dark" ? "#f8fafc" : "#0f172a" }}
                    >
                      Load Preset
                    </h3>
                    <button type="button" onClick={() => setIsLoadPresetModalOpen(false)}>
                      <X className="w-5 h-5 cursor-pointer text-gray-500" />
                    </button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex h-11 w-full items-center justify-between rounded-xl px-4 py-2 text-sm outline-none mb-6 transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10"
                        style={inputStyle}
                      >
                        <span className="truncate">
                          {selectedPresetId
                            ? savedPresets.find((p) => p.id === selectedPresetId)?.name || "Select a preset..."
                            : "Select a preset..."}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] z-[10000] overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl p-1"
                    >
                      {savedPresets.map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          onClick={() => setSelectedPresetId(p.id)}
                          className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        >
                          {p.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="flex justify-between w-full gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDeletePreset}
                      disabled={!selectedPresetId}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsLoadPresetModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleLoadPreset}
                        disabled={!selectedPresetId}
                        className="bg-[#22B573] text-white"
                      >
                        Load
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          portalTarget
        )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteProduct}
        itemName={itemToDelete?.name || ""}
      />
    </div>
  );
};

export default ViewProducts;
