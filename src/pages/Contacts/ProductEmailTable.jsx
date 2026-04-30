import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getEnrollmentsByEmail } from "../../features/actions/product";
import {
  formatDateAsNumber,
  formatDateAsNumberWithTime,
  capitalizeWords,
} from "../../utils/extra";
import useMediaQuery from "../../hooks/useMediaQuery";
import { ShoppingBag, Calendar, Tag, User, ShieldCheck, DollarSign, Layers, Layout } from "lucide-react";
import { motion } from "framer-motion";

const StatRow = ({ icon: Icon, label, value, color }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
    <div className="flex items-center gap-2">
      {Icon && <Icon className={`w-3.5 h-3.5 ${color || 'text-slate-300'}`} />}
      <dt className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</dt>
    </div>
    <dd className="text-xs font-bold text-slate-700 dark:text-slate-200 text-right capitalize">{value}</dd>
  </div>
);

const formatAssignedBy = (item) => {
  if (!item.assignedBy) return "N/A";
  const role = item.userRole ? capitalizeWords(item.userRole.split("_").join(" ")) : "N/A";
  return `${capitalizeWords(item.assignedBy)} (${role})`;
};

const ProductEmailTable = ({ email }) => {
  const dispatch = useDispatch();
  const isSmallScreen = useMediaQuery("(max-width: 1024px)");

  const { enrollmentsByEmail = [], isLoading } = useSelector(
    (state) => state.product
  );

  useEffect(() => {
    if (email) {
      dispatch(getEnrollmentsByEmail({ email }));
    }
  }, [dispatch, email]);

  const hasNoData = !isLoading && enrollmentsByEmail.length === 0;

  return (
    <div className="mt-4">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-400">Loading purchase history...</p>
        </div>
      ) : hasNoData ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
          <ShoppingBag className="w-12 h-12 opacity-10" />
          <p className="text-lg font-bold italic">No enrollments recorded</p>
        </div>
      ) : isSmallScreen ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollmentsByEmail.map((item, idx) => (
            <EnrollmentCard key={item._id} item={item} index={idx} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-4 px-6">S.No</th>
                <th className="py-4 px-2">Webinar & Date</th>
                <th className="py-4 px-2">Product Details</th>
                <th className="py-4 px-2">Pricing</th>
                <th className="py-4 px-2">Enrollment Info</th>
                <th className="py-4 px-6 text-right">Assigned By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {enrollmentsByEmail.map((item, idx) => (
                <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group">
                  <td className="py-4 px-6 text-sm font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-4 px-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{capitalizeWords(item.webinarName) || "N/A"}</span>
                      <span className="text-[11px] text-indigo-500 font-bold">{item.webinarDate ? formatDateAsNumber(item.webinarDate) : "N/A"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-emerald-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{capitalizeWords(item.productName) || "N/A"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold ml-4.5">{capitalizeWords(item.productLevel) || "N/A"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="inline-flex items-center px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-black">
                      ₹{item.productPrice || 0}
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{item.enrollmentDate ? formatDateAsNumberWithTime(item.enrollmentDate) : "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.assignType || "N/A"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{capitalizeWords(item.assignedBy) || "N/A"}</span>
                      <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                        {item.userRole ? item.userRole.split("_").join(" ") : "N/A"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const EnrollmentCard = ({ item, index }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400">
            {index + 1}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-tight line-clamp-1">{capitalizeWords(item.productName)}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{capitalizeWords(item.productLevel)}</span>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-indigo-500">{item.enrollmentDate ? formatDateAsNumber(item.enrollmentDate) : "N/A"}</span>
            </div>
          </div>
        </div>
        <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-black">
          ₹{item.productPrice || 0}
        </div>
      </div>

      <dl className="space-y-1">
        <StatRow icon={Layout} label="Webinar" value={item.webinarName} />
        <StatRow icon={Calendar} label="Event Date" value={item.webinarDate ? formatDateAsNumber(item.webinarDate) : "N/A"} />
        <StatRow icon={ShieldCheck} label="Type" value={item.assignType} color="text-blue-400" />
        <StatRow icon={User} label="Assigned By" value={formatAssignedBy(item)} color="text-amber-400" />
      </dl>
    </motion.div>
  );
};

export default ProductEmailTable;