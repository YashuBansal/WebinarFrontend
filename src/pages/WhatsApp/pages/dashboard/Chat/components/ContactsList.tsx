import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Clock, Users, MessageSquare, Contact as ContactIcon, User, Check, CheckCheck } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useUniquePhoneNumbers, useEligibleSessionContacts } from '@/hooks/useWabaMessage';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Contact } from '@/schemas/contactSchema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ContactsListProps {
  projectId: string;
  activePhone?: string;
  onContactSelect: (phone: string) => void;
}

interface ContactWithName {
  phoneNumber: string;
  name?: string;
  timeRemaining?: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastMessageStatus?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'clicked' | string;
  lastMessageSentAt?: string;
  lastMessageDeliveredAt?: string;
  lastMessageReadAt?: string;
  lastMessageFailureReason?: string;
  unreadCount?: number;
  lastMessageDirection?: 'inbound' | 'outbound';
}

export function ContactsList({ projectId, activePhone, onContactSelect }: ContactsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab from URL, default to "all"
  const activeTab = searchParams.get('tab') || 'all';

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    setSearchParams(newParams);
  };

  const { data: allPhoneNumbers, isLoading: isLoadingAll } = useUniquePhoneNumbers(projectId);
  const { data: eligibleContacts, isLoading: isLoadingEligible } = useEligibleSessionContacts(projectId);

  // Fetch contacts
  const { data: contactsData } = useContacts({ page: 1, limit: 5000 });
  const contacts = useMemo(() => contactsData?.contacts || [], [contactsData]);

  // Create a phone number to contact mapping
  const phoneToContactMap = useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach(contact => {
      map.set(contact.phone, contact);
    });
    return map;
  }, [contacts]);

  // Helper function to get contact name from phone number
  const getContactName = (phoneNumber: string): string | undefined => {
    const contact = phoneToContactMap.get(phoneNumber);
    if (!contact) return undefined;

    const firstName = contact.firstName || '';
    const lastName = contact.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || undefined;
  };

  // Helper function to get initials for avatar
  const getInitials = (name?: string, phoneNumber?: string): string | null => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    if (phoneNumber) {
      const contact = phoneToContactMap.get(phoneNumber);
      if (contact) {
        const firstName = contact.firstName || '';
        const lastName = contact.lastName || '';

        if (firstName && lastName) {
          return `${firstName[0]}${lastName[0]}`.toUpperCase();
        }
        if (firstName) {
          return firstName[0].toUpperCase();
        }
        if (lastName) {
          return lastName[0].toUpperCase();
        }
      }
    }

    return null;
  };

  // Format time remaining for eligible contacts
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) {
      return 'Window closed';
    }

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return '< 1m';
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'read':
      case 'clicked':
        return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      default:
        return null;
    }
  };

  // Process and filter all contacts
  const processedAllContacts = useMemo(() => {
    if (!allPhoneNumbers?.phoneNumbers) return [];

    const contacts: ContactWithName[] = allPhoneNumbers.phoneNumbers.map(contact => ({
      phoneNumber: typeof contact === 'string' ? contact : contact.phoneNumber,
      name: getContactName(typeof contact === 'string' ? contact : contact.phoneNumber),
      lastMessagePreview: typeof contact === 'string' ? undefined : contact.lastMessagePreview,
      lastMessageAt: typeof contact === 'string' ? undefined : contact.lastMessageAt,
      lastMessageStatus: typeof contact === 'string' ? undefined : contact.lastMessageStatus,
      lastMessageSentAt: typeof contact === 'string' ? undefined : contact.lastMessageSentAt,
      lastMessageDeliveredAt: typeof contact === 'string' ? undefined : contact.lastMessageDeliveredAt,
      lastMessageReadAt: typeof contact === 'string' ? undefined : contact.lastMessageReadAt,
      lastMessageFailureReason: typeof contact === 'string' ? undefined : contact.lastMessageFailureReason,
      unreadCount: typeof contact === 'string' ? 0 : (contact.unreadCount || 0),
      lastMessageDirection: typeof contact === 'string' ? undefined : contact.lastMessageDirection,
    }));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return contacts.filter(contact =>
        contact.phoneNumber.toLowerCase().includes(query) ||
        contact.name?.toLowerCase().includes(query)
      );
    }

    // Sort by lastMessageAt (already sorted by backend, but ensure consistency)
    contacts.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    return contacts;
  }, [allPhoneNumbers, phoneToContactMap, searchQuery]);

  // Process and filter eligible contacts
  const processedEligibleContacts = useMemo(() => {
    if (!eligibleContacts?.eligibleContacts) return [];

    const contacts: ContactWithName[] = eligibleContacts.eligibleContacts.map(contact => ({
      phoneNumber: contact.phoneNumber,
      name: getContactName(contact.phoneNumber),
      timeRemaining: contact.timeRemaining,
      lastMessagePreview: contact.lastMessagePreview,
      lastMessageAt: contact.lastMessageAt,
      lastMessageStatus: contact.lastMessageStatus,
      lastMessageSentAt: contact.lastMessageSentAt,
      lastMessageDeliveredAt: contact.lastMessageDeliveredAt,
      lastMessageReadAt: contact.lastMessageReadAt,
      lastMessageFailureReason: contact.lastMessageFailureReason,
      unreadCount: contact.unreadCount || 0,
      lastMessageDirection: contact.lastMessageDirection,
    }));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return contacts.filter(contact =>
        contact.phoneNumber.toLowerCase().includes(query) ||
        contact.name?.toLowerCase().includes(query)
      );
    }

    // Sort by lastMessageAt (already sorted by backend, but ensure consistency)
    contacts.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    return contacts;
  }, [eligibleContacts, phoneToContactMap, searchQuery]);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderContactItem = (contact: ContactWithName, type: 'all' | 'active', index: number) => {
    const isSelected = activePhone === contact.phoneNumber;

    return (
      <button
        key={contact.phoneNumber}
        onClick={() => onContactSelect(contact.phoneNumber)}
        style={{ 
          animationDelay: `${index * 40}ms`,
          animationFillMode: 'both'
        }}
        className={`w-full text-left px-3 py-3 md:px-4 md:py-3.5 transition-all duration-300 rounded-xl flex items-center gap-3 md:gap-3.5 group relative border-l-4 animate-in fade-in slide-in-from-left-4 duration-500 ${isSelected
          ? 'bg-teal-50/60 border-teal-500 shadow-sm'
          : 'hover:bg-gray-50/80 border-transparent'
          }`}
      >

        <div className="relative flex-shrink-0">
          <Avatar className={`h-11 w-11 md:h-13 md:w-13 border-2 transition-transform duration-300 group-hover:scale-105 ${isSelected ? 'border-teal-200' : 'border-white shadow-sm'}`}>
            <AvatarFallback className={`${isSelected ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'} text-[12px] md:text-[13px] font-bold`}>
              {(() => {
                const initials = getInitials(contact.name, contact.phoneNumber);
                return initials ? initials : <User className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />;
              })()}
            </AvatarFallback>
          </Avatar>

          {type === 'all' && contact.unreadCount && contact.unreadCount > 0 ? (
            <div className="absolute -top-1 -right-1 ring-4 ring-white bg-teal-500 text-white text-[9px] md:text-[10px] font-bold rounded-full min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-300">
              {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
            </div>
          ) : type === 'active' ? (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm ring-1 ring-emerald-500/20 animate-pulse"></div>
          ) : null}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5 md:mb-1">
            <h3 className={`font-bold text-[13px] md:text-[14px] truncate transition-colors ${isSelected ? 'text-teal-900' : 'text-gray-900 group-hover:text-teal-600'}`}>
              {contact.name || contact.phoneNumber}
            </h3>
            <span className={`text-[9px] md:text-[10px] font-bold tracking-tight whitespace-nowrap ml-2 ${type === 'all' && contact.unreadCount && contact.unreadCount > 0 ? 'text-teal-600' : 'text-gray-400'}`}>
              {formatTime(contact.lastMessageAt) || 'Just now'}
            </span>
          </div>
          <div className="flex flex-col gap-1 md:gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {contact.lastMessageDirection === 'outbound' && getStatusIcon(contact.lastMessageStatus)}
              <p className="text-[11.5px] md:text-[12.5px] text-gray-500 truncate font-medium">
                {contact.lastMessagePreview || (type === 'all' ? 'New conversation' : 'Active session')}
              </p>
            </div>
            {type === 'active' && contact.timeRemaining !== undefined && (
              <div className={`inline-flex items-center gap-1 md:gap-1.5 px-2 py-0.5 rounded-full w-fit ${contact.timeRemaining < 1000 * 60 * 60 * 2 ? 'bg-amber-100 text-amber-700' : 'bg-teal-100/50 text-teal-700'}`}>
                <Clock className="h-2.5 w-2.5" />
                <span className="text-[8px] md:text-[9px] font-extrabold uppercase tracking-widest">
                  {formatTimeRemaining(contact.timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <aside className="w-full flex-shrink-0 md:w-[380px] lg:w-[450px] flex flex-col h-full bg-white border-r border-gray-100/80 overflow-hidden shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
      {/* Sidebar Header */}
      <div className="p-4 md:p-5 flex flex-col gap-3 md:gap-4 border-b border-gray-100/50 flex-shrink-0 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-3.5">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 rounded-xl blur-md"></div>
              <div className="relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-200/40 border border-white/20">
                <MessageSquare className="h-4.5 w-4.5 md:h-5.5 md:w-5.5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-[15px] md:text-[16px] font-extrabold text-gray-900 leading-tight tracking-tight">Messages</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] md:text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Manage your conversation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar - Modern Redesign */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 md:pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 transition-colors group-focus-within:text-teal-500" />
          </div>
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 md:pl-10 h-10 md:h-11 bg-gray-50/80 border-none rounded-xl text-[12px] md:text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-teal-500/10 focus-visible:bg-white transition-all shadow-inner placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Tabs / Chat List Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 md:px-5 md:py-3 flex-shrink-0">
            <TabsList className="bg-gray-100/50 p-1 h-9 md:h-10 w-full grid grid-cols-2 rounded-xl">
              <TabsTrigger
                value="all"
                className="rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-md transition-all duration-300"
              >
                All Chats
                {allPhoneNumbers && allPhoneNumbers.count > 0 && (
                  <Badge variant="secondary" className="ml-1.5 md:ml-2 h-4 md:h-4.5 min-w-[16px] md:min-w-[18px] px-1 bg-gray-200/50 text-gray-600 border-none text-[8px] md:text-[9px]">
                    {allPhoneNumbers.count}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-md transition-all duration-300"
              >
                Active
                {eligibleContacts && eligibleContacts.count > 0 && (
                  <Badge variant="secondary" className="ml-1.5 md:ml-2 h-4 md:h-4.5 min-w-[16px] md:min-w-[18px] px-1 bg-emerald-100 text-emerald-600 border-none text-[8px] md:text-[9px]">
                    {eligibleContacts.count}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="flex-1 overflow-y-auto m-0 custom-scrollbar px-1.5 md:px-2">
            {isLoadingAll ? (
              <div className="p-8 md:p-12 text-center">
                <div className="inline-block w-5 h-5 md:w-6 md:h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2 md:mb-3"></div>
                <p className="text-[11px] md:text-xs text-gray-400 font-medium">Syncing conversations...</p>
              </div>
            ) : processedAllContacts.length === 0 ? (
              <div className="p-8 md:p-12 text-center flex flex-col items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-50 flex items-center justify-center">
                  <Search className="h-5 w-5 md:h-6 md:w-6 text-gray-300" />
                </div>
                <p className="text-[11px] md:text-xs text-gray-400 font-medium">
                  {searchQuery ? 'No matching contacts' : 'Start a new conversation'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 pb-4">
                {processedAllContacts.map((contact, idx) => renderContactItem(contact, 'all', idx))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="flex-1 overflow-y-auto m-0 custom-scrollbar px-1.5 md:px-2">
            {isLoadingEligible ? (
              <div className="p-8 md:p-12 text-center">
                <div className="inline-block w-5 h-5 md:w-6 md:h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2 md:mb-3"></div>
                <p className="text-[11px] md:text-xs text-gray-400 font-medium">Loading active sessions...</p>
              </div>
            ) : processedEligibleContacts.length === 0 ? (
              <div className="p-8 md:p-12 text-center flex flex-col items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-50 flex items-center justify-center">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-gray-300" />
                </div>
                <p className="text-[11px] md:text-xs text-gray-400 font-medium">
                  {searchQuery ? 'No matching active contacts' : 'No active sessions in last 24h'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 pb-4">
                {processedEligibleContacts.map((contact, idx) => renderContactItem(contact, 'active', idx))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}