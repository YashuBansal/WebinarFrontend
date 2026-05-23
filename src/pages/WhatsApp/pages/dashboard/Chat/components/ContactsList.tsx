import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Clock, Users, MessageSquare, Contact as ContactIcon, User, Check, CheckCheck } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useUniquePhoneNumbers, useEligibleSessionContacts } from '@/hooks/useWabaMessage';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Contact } from '@/schemas/contactSchema';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { socketManager } from '@/lib/socket';

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
  const queryClient = useQueryClient();

  const activeTab = searchParams.get('tab') || 'all';

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    setSearchParams(newParams);
  };

  const { data: allPhoneNumbers, isLoading: isLoadingAll } = useUniquePhoneNumbers(projectId);
  const { data: eligibleContacts, isLoading: isLoadingEligible } = useEligibleSessionContacts(projectId);

  const { data: contactsData } = useContacts({ page: 1, limit: 5000 });
  const contacts = useMemo(() => contactsData?.contacts || [], [contactsData]);

  const phoneToContactMap = useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach(contact => {
      map.set(contact.phone, contact);
    });
    return map;
  }, [contacts]);

  const getContactName = (phoneNumber: string): string | undefined => {
    const contact = phoneToContactMap.get(phoneNumber);
    if (!contact) return undefined;
    const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    return fullName || undefined;
  };

  const getInitials = (name?: string, phoneNumber?: string): string | null => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (phoneNumber) {
      const contact = phoneToContactMap.get(phoneNumber);
      if (contact) {
        if (contact.firstName && contact.lastName) return `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();
        if (contact.firstName) return contact.firstName[0].toUpperCase();
        if (contact.lastName) return contact.lastName[0].toUpperCase();
      }
    }
    return null;
  };

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Window closed';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return '< 1m';
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'read':
      case 'clicked': return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
      case 'delivered': return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'sent': return <Check className="h-3 w-3 text-gray-400" />;
      default: return null;
    }
  };

  // Socket Listener for instant sidebar updates
  useEffect(() => {
    const socket = socketManager.getSocket();
    if (!socket || !projectId) return;

    const handleSidebarUpdate = (evt: any) => {
      if (!evt?.phoneNumber) return;

      const updateCache = (queryKey: any[], listKey: string) => {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !oldData[listKey]) return oldData;

          const newList = [...oldData[listKey]];
          const idx = newList.findIndex((c: any) =>
            (typeof c === 'string' ? c : c.phoneNumber) === evt.phoneNumber
          );

          if (idx !== -1) {
            const item = typeof newList[idx] === 'string' ? { phoneNumber: newList[idx] } : { ...newList[idx] };

            newList[idx] = {
              ...item,
              ...(evt.status && { lastMessageStatus: evt.status }),
              ...(evt.textBody && { lastMessagePreview: evt.textBody }),
              ...(evt.createdAt && { lastMessageAt: evt.createdAt }),
              ...(evt.direction && { lastMessageDirection: evt.direction }),
            };

            if (evt.createdAt && evt.status === 'pending') {
              const [updated] = newList.splice(idx, 1);
              newList.unshift(updated);
            }
          }
          return { ...oldData, [listKey]: newList };
        });
      };

      updateCache(['wabaMessage', 'unique-phone-numbers', projectId], 'phoneNumbers');
      updateCache(['wabaMessage', 'eligible-session-contacts', projectId], 'eligibleContacts');
    };

    socket.on('chat-message', handleSidebarUpdate);
    socket.on('message-status', handleSidebarUpdate);

    return () => {
      socket.off('chat-message', handleSidebarUpdate);
      socket.off('message-status', handleSidebarUpdate);
    };
  }, [projectId, queryClient]);

  // Handle contact click to instantly clear unread state
  const handleContactClick = (phone: string) => {
    const clearUnread = (queryKey: any[], listKey: string) => {
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData || !oldData[listKey]) return oldData;
        const newList = [...oldData[listKey]];
        const idx = newList.findIndex((c: any) => (typeof c === 'string' ? c : c.phoneNumber) === phone);
        if (idx !== -1) {
          const item = typeof newList[idx] === 'string' ? { phoneNumber: newList[idx] } : { ...newList[idx] };
          newList[idx] = { ...item, unreadCount: 0, lastMessageStatus: 'read' };
        }
        return { ...oldData, [listKey]: newList };
      });
    };

    clearUnread(['wabaMessage', 'unique-phone-numbers', projectId], 'phoneNumbers');
    clearUnread(['wabaMessage', 'eligible-session-contacts', projectId], 'eligibleContacts');

    onContactSelect(phone);
  };

  const processContacts = (dataList: any[], isEligible: boolean) => {
    if (!dataList) return [];

    let processed: ContactWithName[] = dataList.map(contact => ({
      phoneNumber: typeof contact === 'string' ? contact : contact.phoneNumber,
      name: getContactName(typeof contact === 'string' ? contact : contact.phoneNumber),
      timeRemaining: contact.timeRemaining,
      lastMessagePreview: typeof contact === 'string' ? undefined : contact.lastMessagePreview,
      lastMessageAt: typeof contact === 'string' ? undefined : contact.lastMessageAt,
      lastMessageStatus: typeof contact === 'string' ? undefined : contact.lastMessageStatus,
      lastMessageDirection: typeof contact === 'string' ? undefined : contact.lastMessageDirection,
      unreadCount: typeof contact === 'string' ? 0 : (contact.unreadCount || 0),
    }));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      processed = processed.filter(c =>
        c.phoneNumber.toLowerCase().includes(query) || c.name?.toLowerCase().includes(query)
      );
    }

    processed.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    return processed;
  };

  const processedAllContacts = useMemo(() => processContacts(allPhoneNumbers?.phoneNumbers || [], false), [allPhoneNumbers, phoneToContactMap, searchQuery]);
  const processedEligibleContacts = useMemo(() => processContacts(eligibleContacts?.eligibleContacts || [], true), [eligibleContacts, phoneToContactMap, searchQuery]);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const isToday = date.toDateString() === new Date().toDateString();
    return isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="w-full flex-shrink-0 md:w-[380px] lg:w-[450px] flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-100/80 dark:border-slate-800 overflow-hidden shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
      {/* Header & Search Area */}
      <div className="p-4 md:p-5 flex flex-col gap-3 md:gap-4 border-b border-gray-100/50 dark:border-slate-800/50 flex-shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 dark:bg-teal-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 md:gap-3.5">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 rounded-xl blur-md"></div>
              <div className="relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/20 border border-white/20">
                <MessageSquare className="h-4.5 w-4.5 md:h-5.5 md:w-5.5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-[15px] md:text-[16px] font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">Messages</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Active Conversations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group z-10">
          <div className="absolute inset-y-0 left-0 pl-3 md:pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 transition-colors group-focus-within:text-teal-500" />
          </div>
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 md:pl-10 h-10 md:h-11 bg-gray-50/80 dark:bg-slate-800/50 border-none dark:border dark:border-slate-700/30 rounded-xl text-[12px] md:text-[13px] font-medium focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all shadow-inner placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-white/30 dark:bg-slate-900/30">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 md:px-5 md:py-3 flex-shrink-0">
            <TabsList className="bg-gray-100/50 dark:bg-slate-800/50 p-1 h-9 md:h-10 w-full grid grid-cols-2 rounded-xl border border-gray-100/50 dark:border-slate-700/30">
              <TabsTrigger value="all" className="rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 data-[state=active]:shadow-md transition-all duration-300">
                All Chats
                {allPhoneNumbers && allPhoneNumbers.count > 0 && (
                  <Badge variant="secondary" className="ml-1.5 md:ml-2 h-4 md:h-4.5 min-w-[16px] md:min-w-[18px] px-1 bg-gray-200/50 dark:bg-slate-600/50 text-gray-600 dark:text-slate-300 border-none text-[8px] md:text-[9px]">
                    {allPhoneNumbers.count}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400 data-[state=active]:shadow-md transition-all duration-300">
                Active
                {eligibleContacts && eligibleContacts.count > 0 && (
                  <Badge variant="secondary" className="ml-1.5 md:ml-2 h-4 md:h-4.5 min-w-[16px] md:min-w-[18px] px-1 bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-none text-[8px] md:text-[9px]">
                    {eligibleContacts.count}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ALL CHATS TAB */}
          <TabsContent value="all" className="flex-1 overflow-y-auto m-0 custom-scrollbar px-2 md:px-3">
            {isLoadingAll ? (
              <div className="p-8 md:p-12 text-center">
                <div className="inline-block w-5 h-5 md:w-6 md:h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2 md:mb-3"></div>
                <p className="text-[11px] md:text-xs text-gray-400 dark:text-slate-500 font-medium tracking-wide">Syncing conversations...</p>
              </div>
            ) : processedAllContacts.length === 0 ? (
              <div className="p-8 md:p-12 text-center flex flex-col items-center gap-2 md:gap-3">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center border border-dashed border-gray-200 dark:border-slate-700">
                  <Search className="h-6 w-6 text-gray-300 dark:text-slate-600" />
                </div>
                <p className="text-[11px] md:text-xs text-gray-400 dark:text-slate-500 font-medium">
                  {searchQuery ? 'No matching contacts found' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 pb-6 pt-1">
                {processedAllContacts.map((contact, idx) => {
                  const isSelected = activePhone === contact.phoneNumber;
                  return (
                    <button
                      key={contact.phoneNumber}
                      onClick={() => handleContactClick(contact.phoneNumber)}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      className={`w-full text-left p-3 md:p-3.5 transition-all duration-300 rounded-2xl flex items-center gap-3 md:gap-4 group relative border-l-0 animate-in fade-in slide-in-from-left-2 duration-500 ${isSelected ? 'bg-teal-50/70 dark:bg-teal-500/10 shadow-[0_4px_20px_rgba(20,184,166,0.08)] scale-[1.01] z-10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'}`}
                    >
                      {isSelected && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-teal-500 rounded-r-full"></div>}
                      <div className="relative flex-shrink-0">
                        <Avatar className={`h-12 w-12 md:h-13 md:w-13 border-2 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 ${isSelected ? 'border-teal-500/50 shadow-lg shadow-teal-500/20' : 'border-white dark:border-slate-700 shadow-sm'}`}>
                          <AvatarFallback className={`${isSelected ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'} text-[12px] md:text-[13px] font-bold`}>
                            {getInitials(contact.name, contact.phoneNumber) || <User className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />}
                          </AvatarFallback>
                        </Avatar>
                        {contact.unreadCount && contact.unreadCount > 0 ? (
                          <div className="absolute -top-1 -right-1 ring-4 ring-white dark:ring-slate-900 bg-teal-500 text-white text-[9px] md:text-[10px] font-bold rounded-full min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] flex items-center justify-center shadow-lg">
                            {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className={`font-bold text-[13px] md:text-[14px] truncate transition-colors duration-300 ${isSelected ? 'text-teal-900 dark:text-teal-400' : 'text-gray-900 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`}>
                            {contact.name || contact.phoneNumber}
                          </h3>
                          <span className={`text-[9px] md:text-[10px] font-bold tracking-tight whitespace-nowrap ml-2 ${contact.unreadCount && contact.unreadCount > 0 ? 'text-teal-500' : 'text-gray-400 dark:text-slate-500'}`}>
                            {formatTime(contact.lastMessageAt) || 'Just now'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {contact.lastMessageDirection === 'outbound' && getStatusIcon(contact.lastMessageStatus)}
                          <p className={`text-[11.5px] md:text-[12.5px] truncate font-medium transition-colors duration-300 ${isSelected ? 'text-teal-700/80 dark:text-teal-500/60' : 'text-gray-500 dark:text-slate-500'}`}>
                            {contact.lastMessagePreview || 'Start a conversation'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ACTIVE TAB */}
          <TabsContent value="active" className="flex-1 overflow-y-auto m-0 custom-scrollbar px-2 md:px-3">
            {isLoadingEligible ? (
              <div className="p-8 md:p-12 text-center">
                <div className="inline-block w-5 h-5 md:w-6 md:h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2 md:mb-3"></div>
                <p className="text-[11px] md:text-xs text-gray-400 dark:text-slate-500 font-medium tracking-wide">Syncing sessions...</p>
              </div>
            ) : processedEligibleContacts.length === 0 ? (
              <div className="p-8 md:p-12 text-center flex flex-col items-center gap-2 md:gap-3">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center border border-dashed border-gray-200 dark:border-slate-700">
                  <Clock className="h-6 w-6 text-gray-300 dark:text-slate-600" />
                </div>
                <p className="text-[11px] md:text-xs text-gray-400 dark:text-slate-500 font-medium">No active 24h sessions</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 pb-6 pt-1">
                {processedEligibleContacts.map((contact, idx) => {
                  const isSelected = activePhone === contact.phoneNumber;
                  return (
                    <button
                      key={contact.phoneNumber}
                      onClick={() => handleContactClick(contact.phoneNumber)}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      className={`w-full text-left p-3 md:p-3.5 transition-all duration-300 rounded-2xl flex items-center gap-3 md:gap-4 group relative border-l-0 animate-in fade-in slide-in-from-left-2 duration-500 ${isSelected ? 'bg-teal-50/70 dark:bg-teal-500/10 shadow-[0_4px_20px_rgba(20,184,166,0.08)] scale-[1.01] z-10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'}`}
                    >
                      {isSelected && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-teal-500 rounded-r-full"></div>}
                      <div className="relative flex-shrink-0">
                        <Avatar className={`h-12 w-12 md:h-13 md:w-13 border-2 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 ${isSelected ? 'border-teal-500/50 shadow-lg shadow-teal-500/20' : 'border-white dark:border-slate-700 shadow-sm'}`}>
                          <AvatarFallback className={`${isSelected ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'} text-[12px] md:text-[13px] font-bold`}>
                            {getInitials(contact.name, contact.phoneNumber) || <User className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className={`font-bold text-[13px] md:text-[14px] truncate transition-colors duration-300 ${isSelected ? 'text-teal-900 dark:text-teal-400' : 'text-gray-900 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`}>
                            {contact.name || contact.phoneNumber}
                          </h3>
                          <span className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-tight whitespace-nowrap ml-2">
                            {formatTime(contact.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {contact.lastMessageDirection === 'outbound' && getStatusIcon(contact.lastMessageStatus)}
                            <p className={`text-[11.5px] md:text-[12.5px] truncate font-medium transition-colors duration-300 ${isSelected ? 'text-teal-700/80 dark:text-teal-500/60' : 'text-gray-500 dark:text-slate-500'}`}>
                              {contact.lastMessagePreview || 'Active session'}
                            </p>
                          </div>
                          {contact.timeRemaining !== undefined && (
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${contact.timeRemaining < 1000 * 60 * 60 * 2 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-teal-100/50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400'}`}>
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
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </aside>
  );
}