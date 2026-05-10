import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  memo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Users,
  Loader2,
  Mail,
  Phone,
  Filter,
  CheckCircle2,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CampaignContact,
  WlhAttendeeFilterState,
} from "@/schemas/campaignSchema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Tags } from "lucide-react";
import WLHContacts from "./WLHContacts";

const NO_TAGS_FILTER_VALUE = "__no_tags__";

/** Same as ContactsTable row virtualizer estimate */
const CONTACT_ROW_ESTIMATE_PX = 64;

const TABLE_COL_SPAN = 6;

type CampaignContactTableRowProps = {
  contact: CampaignContact;
  isSelected: boolean;
  onToggle: (contact: CampaignContact, checked: boolean) => void;
};

const CampaignContactTableRow = memo(function CampaignContactTableRow({
  contact,
  isSelected,
  onToggle,
}: CampaignContactTableRowProps) {
  const displayTags = useMemo(
    () => (contact.tags || []).slice(0, 2),
    [contact.tags]
  );
  const extraTagCount = (contact.tags?.length || 0) - displayTags.length;

  return (
    <TableRow 
      data-state={isSelected ? "selected" : undefined}
      className={`group transition-colors ${isSelected ? 'bg-[#22B573]/5 hover:bg-[#22B573]/10' : 'hover:bg-slate-50/80'}`}
    >
      <TableCell className="pl-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onToggle(contact, checked === true)
          }
          className={`transition-colors ${isSelected ? 'border-[#22B573] data-[state=checked]:bg-[#22B573]' : ''}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 dark:text-slate-300">{contact.firstName || "-"}</span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">First Name</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 dark:text-slate-300">{contact.lastName || "-"}</span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Last Name</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 group/info">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 group-hover/info:bg-blue-100 transition-colors">
            <Mail className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{contact.email || "-"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 group/info">
          <div className="h-8 w-8 rounded-lg bg-[#22B573]/5 flex items-center justify-center shrink-0 group-hover/info:bg-[#22B573]/10 transition-colors">
            <Phone className="h-4 w-4 text-[#22B573]" />
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{contact.phone || "-"}</span>
        </div>
      </TableCell>
      <TableCell className="pr-4">
        {contact.tags && contact.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {displayTags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-none hover:bg-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                {tag}
              </Badge>
            ))}
            {extraTagCount > 0 && (
              <Badge variant="secondary" className="bg-[#22B573]/10 text-[#22B573] border-none text-[10px] font-bold px-2 py-0.5 rounded-md">
                +{extraTagCount}
              </Badge>
            )}
          </div>
        ) : (
          <div className="text-right">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Untagged</span>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
});

interface ContactSelectionProps {
  contacts: CampaignContact[];
  createdTags: string[];
  isLoading: boolean;
  selectedContacts: CampaignContact[];
  onSelectionChange: (contacts: CampaignContact[]) => void;
  onNext: () => void;
  onPrevious: () => void;
  wlhAttendeeFilters: WlhAttendeeFilterState;
  setWlhAttendeeFilters: Dispatch<SetStateAction<WlhAttendeeFilterState>>;
  contactType: string;
  setContactType: (type: string) => void;
}

const ContactSelection = ({
  contacts,
  createdTags,
  isLoading,
  selectedContacts,
  onSelectionChange,
  onNext,
  onPrevious,
  wlhAttendeeFilters,
  setWlhAttendeeFilters,
  contactType,
  setContactType,
}: ContactSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectAll, setSelectAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const selectedContactsRef = useRef(selectedContacts);
  selectedContactsRef.current = selectedContacts;

  const availableTags = useMemo(
    () => Array.from(new Set(createdTags)).filter(Boolean),
    [createdTags]
  );

  const filteredContacts = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return contacts.filter((contact) => {
      const matchesSearch =
        contact.firstName?.toLowerCase().includes(q) ||
        contact.lastName?.toLowerCase().includes(q) ||
        contact.email?.toLowerCase().includes(q) ||
        contact.phone.includes(searchTerm);

      const matchesTag =
        selectedTag === "all" ||
        !selectedTag ||
        (selectedTag === NO_TAGS_FILTER_VALUE
          ? !contact.tags || contact.tags.length === 0
          : contact.tags?.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [contacts, searchTerm, selectedTag]);

  const selectedIdSet = useMemo(
    () => new Set(selectedContacts.map((c) => c._id)),
    [selectedContacts]
  );

  const handleContactSelect = useCallback(
    (contact: CampaignContact, checked: boolean) => {
      const current = selectedContactsRef.current;
      if (checked) {
        onSelectionChange([...current, contact]);
      } else {
        onSelectionChange(current.filter((c) => c._id !== contact._id));
      }
    },
    [onSelectionChange]
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        onSelectionChange(filteredContacts);
      } else {
        onSelectionChange([]);
      }
      setSelectAll(checked);
    },
    [filteredContacts, onSelectionChange]
  );

  useEffect(() => {
    setSelectAll(
      filteredContacts.length > 0 &&
      filteredContacts.every((contact) =>
        selectedIdSet.has(contact._id)
      )
    );
  }, [selectedContacts, filteredContacts, selectedIdSet]);

  const rowVirtualizer = useVirtualizer({
    count: filteredContacts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CONTACT_ROW_ESTIMATE_PX,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop =
    virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() -
      virtualItems[virtualItems.length - 1].end
      : 0;

  const canProceed = contactType === 'whatsapp' ? selectedContacts.length > 0 : wlhAttendeeFilters.contactCount > 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-100 dark:border-slate-700/50 border-t-[#22B573] animate-spin" />
          <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#22B573]" />
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Syncing Audience Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={contactType}
        onValueChange={setContactType}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <TabsList className="h-12 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <TabsTrigger 
              value="whatsapp" 
              className="px-6 rounded-lg font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
            >
              Contact Directory
            </TabsTrigger>
            <TabsTrigger 
              value="wlh"
              className="px-6 rounded-lg font-bold text-sm data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
            >
              WLH Analytics
            </TabsTrigger>
          </TabsList>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Audience</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {contactType === 'whatsapp' 
                  ? `${selectedContacts.length} / ${filteredContacts.length} Selected` 
                  : `${wlhAttendeeFilters.contactCount} Recipients`}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#22B573]/10 flex items-center justify-center">
               <UserCheck className="h-5 w-5 text-[#22B573]" />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <TabsContent value="whatsapp" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 space-y-2">
                  <Label htmlFor="search" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Search Database</Label>
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#22B573] transition-colors" />
                    <Input
                      id="search"
                      placeholder="Search by name, email, or phone number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-12 pl-12 rounded-2xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-[#22B573]/10 focus:border-[#22B573] transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-4 space-y-2">
                  <Label htmlFor="tag-filter" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Segment Filter</Label>
                  <Select
                    value={selectedTag || "all"}
                    onValueChange={(value) => setSelectedTag(value === "all" ? "" : value)}
                  >
                    <SelectTrigger 
                      id="tag-filter"
                      className="h-12 pl-12 rounded-2xl border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 text-sm font-medium focus:ring-4 focus:ring-[#22B573]/10 focus:border-[#22B573] transition-all relative group"
                    >
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus:text-[#22B573] transition-colors" />
                      <SelectValue placeholder="All Segments" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-700/50 shadow-xl p-1">
                      <SelectItem value="all" className="rounded-xl py-3 focus:bg-[#22B573]/5 focus:text-[#22B573] transition-colors">
                        <div className="flex items-center gap-2">
                          <Filter className="h-3.5 w-3.5" />
                          <span className="font-bold">All Segments</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={NO_TAGS_FILTER_VALUE} className="rounded-xl py-3 focus:bg-[#22B573]/5 focus:text-[#22B573] transition-colors">
                        <div className="flex items-center gap-2">
                          <Tags className="h-3.5 w-3.5" />
                          <span className="font-bold">Unsegmented</span>
                        </div>
                      </SelectItem>
                      {availableTags.map((tag) => (
                        <SelectItem key={tag} value={tag} className="rounded-xl py-3 focus:bg-[#22B573]/5 focus:text-[#22B573] transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#22B573]" />
                            <span className="font-bold">{tag}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center">
                    <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Database View</span>
                    <span className="text-[10px] font-medium text-slate-400">
                      Showing {filteredContacts.length} matching contacts in your directory
                    </span>
                  </div>
                </div>

                {selectedContacts.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#22B573]/10 rounded-lg"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#22B573]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#22B573]">
                      {selectedContacts.length} Contacts Selected
                    </span>
                  </motion.div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 overflow-hidden shadow-sm">
                {filteredContacts.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center">
                      <Search className="h-8 w-8 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-bold text-slate-900 dark:text-white">No contacts found</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[280px]">Adjust your search or filters to find the right audience for this campaign.</p>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={scrollRef}
                    className="h-[450px] overflow-y-auto custom-scrollbar"
                  >
                    <Table>
                      <TableHeader className="bg-slate-50/80 dark:bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
                        <TableRow className="hover:bg-transparent border-b-slate-200">
                          <TableHead className="w-12 pl-4">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={(c) =>
                                handleSelectAll(c === true)
                              }
                              className={`transition-colors ${selectAll ? 'border-[#22B573] data-[state=checked]:bg-[#22B573]' : ''}`}
                            />
                          </TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">First Name</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Last Name</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Email Address</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4">Phone</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-4 text-right pr-4">Tags</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paddingTop > 0 && (
                          <TableRow className="hover:bg-transparent border-none">
                            <TableCell
                              colSpan={TABLE_COL_SPAN}
                              style={{ height: `${paddingTop}px` }}
                              className="p-0"
                            />
                          </TableRow>
                        )}

                        {virtualItems.map((virtualRow) => {
                          const contact = filteredContacts[virtualRow.index];
                          if (!contact) return null;
                          return (
                            <CampaignContactTableRow
                              key={contact._id}
                              contact={contact}
                              isSelected={selectedIdSet.has(contact._id)}
                              onToggle={handleContactSelect}
                            />
                          );
                        })}

                        {paddingBottom > 0 && (
                          <TableRow className="hover:bg-transparent border-none">
                            <TableCell
                              colSpan={TABLE_COL_SPAN}
                              style={{ height: `${paddingBottom}px` }}
                              className="p-0"
                            />
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="wlh" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <WLHContacts
                onNext={onNext}
                onPrevious={onPrevious}
                wlhAttendeeFilters={wlhAttendeeFilters}
                setWlhAttendeeFilters={setWlhAttendeeFilters}
              />
            </motion.div>
          </TabsContent>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-700/50 mt-4">
          <Button
            variant="ghost"
            onClick={onPrevious}
            className="h-12 px-6 rounded-xl text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous Step
          </Button>

          <div className="flex items-center gap-4">
            {canProceed ? (
              <div className="hidden sm:flex items-center gap-1.5 text-[#22B573]">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Audience Selected</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Selection Required</span>
              </div>
            )}
            
            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 group"
            >
              Proceed to Content
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default ContactSelection;
