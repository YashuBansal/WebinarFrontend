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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "lucide-react";
import type {
  CampaignContact,
  WlhAttendeeFilterState,
} from "@/schemas/campaignSchema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WLHContacts from "./WLHContacts";

const NO_TAGS_FILTER_VALUE = "__no_tags__";

/** Same as ContactsTable row virtualizer estimate */
const CONTACT_ROW_ESTIMATE_PX = 48;

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
    () => (contact.tags || []).slice(0, 3),
    [contact.tags]
  );
  const extraTagCount = (contact.tags?.length || 0) - displayTags.length;

  return (
    <TableRow data-state={isSelected ? "selected" : undefined}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onToggle(contact, checked === true)
          }
        />
      </TableCell>
      <TableCell>
        <span className="font-semibold">{contact.firstName || "-"}</span>
      </TableCell>
      <TableCell>
        <span className="text-muted-foreground">
          {contact.lastName || "-"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 min-w-0">
          <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate">{contact.email || "-"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 min-w-0">
          <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="truncate">{contact.phone || "-"}</span>
        </div>
      </TableCell>
      <TableCell>
        {contact.tags && contact.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {displayTags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {extraTagCount > 0 && (
              <Badge variant="outline" className="text-xs">
                +{extraTagCount}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No tags</span>
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

  const canProceed = selectedContacts.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="">
      <Tabs
        value={contactType}
        onValueChange={setContactType}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="whatsapp">Contacts</TabsTrigger>
          <TabsTrigger value="wlh">WLH Contacts</TabsTrigger>
        </TabsList>
        <TabsContent value="whatsapp">
          <div className="space-y-6 ">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Contacts</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="w-48">
                  <Label htmlFor="tag-filter">Filter by Tag</Label>
                  <select
                    id="tag-filter"
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Tags</option>
                    <option value={NO_TAGS_FILTER_VALUE}>No Tags</option>
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selectedContacts.length} of {filteredContacts.length}{" "}
                    contacts selected
                  </span>
                </div>

                {selectedContacts.length > 0 && (
                  <Badge variant="secondary">
                    {selectedContacts.length} selected
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {filteredContacts.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {searchTerm || selectedTag
                      ? "No contacts match your search criteria."
                      : "No contacts available. Please add contacts first."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div
                  ref={scrollRef}
                  className="h-96 overflow-y-auto rounded-md border"
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={(c) =>
                              handleSelectAll(c === true)
                            }
                          />
                        </TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Tags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paddingTop > 0 && (
                        <TableRow>
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
                        <TableRow>
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

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={onPrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <Button
                onClick={onNext}
                disabled={!canProceed}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="wlh">
          <WLHContacts
            onNext={onNext}
            onPrevious={onPrevious}
            wlhAttendeeFilters={wlhAttendeeFilters}
            setWlhAttendeeFilters={setWlhAttendeeFilters}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactSelection;
