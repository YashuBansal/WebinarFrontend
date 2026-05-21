import React, { useState, useEffect } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Globe, Phone, ExternalLink, MessageSquare } from "lucide-react";
import { countryCodes } from "../../../utils/countryCodes";

const cleanPhoneNumber = (phone) => {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
};

const formatPhoneNumberForDisplay = (phone) => {
  let cleaned = cleanPhoneNumber(phone);
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned.substring(2);
  if (cleaned.length === 11 && cleaned.startsWith("0")) return cleaned.substring(1);
  return cleaned;
};

const WhatsappModal = ({ phones, onClose }) => {
  const [selectedPhone, setSelectedPhone] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("91");
  const [formattedPhones, setFormattedPhones] = useState([]);

  useEffect(() => {
    if (phones && phones.length > 0) {
      const newFormattedPhones = phones.map(formatPhoneNumberForDisplay);
      setFormattedPhones(newFormattedPhones);
      setSelectedPhone(newFormattedPhones[0]);

      const rawFirstPhone = cleanPhoneNumber(phones[0]);
      if (rawFirstPhone.startsWith("91")) setSelectedCountryCode("91");
    }
  }, [phones]);

  const cleanedDigits = cleanPhoneNumber(selectedPhone);
  const whatsappUrl = cleanedDigits ? `https://wa.me/${selectedCountryCode}${cleanedDigits}` : "";

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '10px',
      minHeight: '38px',
      fontSize: '13px',
      fontWeight: '700',
      border: state.isFocused ? '2px solid #22C55E' : '1px solid #E2E8F0',
      backgroundColor: 'white',
      boxShadow: 'none',
      '&:hover': { border: '1px solid #BBF7D0' }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#22C55E' : state.isFocused ? '#F0FDF4' : 'white',
      color: state.isSelected ? 'white' : '#1E293B',
      fontWeight: '600',
      fontSize: '12px',
    }),
    menu: (provided) => ({ ...provided, borderRadius: '10px', overflow: 'hidden', zIndex: 9999 }),
    menuPortal: (provided) => ({ ...provided, zIndex: 999999 })
  };

  if (!phones || phones.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-green-500" />

        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight leading-none">WhatsApp</h2>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1">Select target number</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Country Code</label>
            </div>
            <Select
              options={countryCodes}
              getOptionLabel={(e) => e.name}
              getOptionValue={(e) => e.code}
              value={countryCodes.find((c) => c.code === selectedCountryCode)}
              onChange={(o) => setSelectedCountryCode(o.code)}
              styles={customSelectStyles}
              isSearchable
              menuPortalTarget={document.body}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Phone</label>
            </div>
            <select
              value={selectedPhone}
              onChange={(e) => setSelectedPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
            >
              {formattedPhones.map((phone, idx) => (
                <option key={idx} value={phone}>{phone}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 space-y-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest"
            >
              <MessageSquare className="w-4 h-4" />
              Start Chat
              <ExternalLink className="w-3.5 h-3.5 opacity-50" />
            </a>
            <button
              onClick={onClose}
              className="w-full h-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[9px] font-black uppercase tracking-[0.2em] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WhatsappModal;
