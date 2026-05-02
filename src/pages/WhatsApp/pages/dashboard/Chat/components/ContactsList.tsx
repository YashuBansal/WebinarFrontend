import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Clock, Users } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useUniquePhoneNumbers, useEligibleSessionContacts } from '@/hooks/useWabaMessage';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Contact } from '@/schemas/contactSchema';

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
  const getInitials = (phoneNumber: string): string => {
    const contact = phoneToContactMap.get(phoneNumber);
    if (!contact) {
      // Extract last 2 digits of phone as fallback
      return phoneNumber.slice(-2);
    }
    
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
    
    return phoneNumber.slice(-2);
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

  const getOutboundStatusLabel = (contact: ContactWithName): string => {
    const status = contact.lastMessageStatus;
    switch (status) {
      case 'failed':
        return 'Failed';
      case 'read':
        return 'Read';
      case 'delivered':
        return 'Delivered';
      case 'sent':
        return 'Sent';
      case 'pending':
        return 'Pending/Sending';
      case 'clicked':
        return 'Clicked';
      default:
        break;
    }

    // Fallback to timestamps (backend/older payloads)
    if (contact.lastMessageReadAt) return 'Read';
    if (contact.lastMessageDeliveredAt) return 'Delivered';
    if (contact.lastMessageSentAt) return 'Sent';
    return 'Pending/Sending';
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

  return (
    <aside className="w-80 border-r flex flex-col h-full bg-gray-50">
      <div className="p-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
            <p className="text-xs text-gray-500">Manage your conversations</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden bg-white">
        <TabsList className="mx-4 mt-3 mb-2 flex-shrink-0 grid grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All
            {allPhoneNumbers && allPhoneNumbers.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 rounded-full">
                {allPhoneNumbers.count}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Session
            {eligibleContacts && eligibleContacts.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                {eligibleContacts.count}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 overflow-y-auto m-0 mt-3">
          {isLoadingAll ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading contacts...</div>
          ) : processedAllContacts.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchQuery ? 'No matching contacts' : 'No contacts found'}
            </div>
          ) : (
            <div className="px-2">
              {processedAllContacts.map((contact, index) => (
                <>
                  <button
                    key={contact.phoneNumber}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all group relative ${
                      activePhone === contact.phoneNumber 
                        ? 'bg-blue-50 shadow-sm border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    onClick={() => onContactSelect(contact.phoneNumber)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 border-2 border-gray-200">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium text-sm">
                          {getInitials(contact.phoneNumber)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {contact.name ? (
                              <>
                                <div className="font-medium text-sm text-gray-900 truncate">{contact.name}</div>
                                <div className="text-xs text-gray-500 truncate">{contact.phoneNumber}</div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-700 truncate font-medium">{contact.phoneNumber}</div>
                            )}
                          </div>
                          {contact.unreadCount && contact.unreadCount > 0 ? (
                            <div className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                              {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                            </div>
                          ) : null}
                        </div>
                        {contact.lastMessagePreview && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {contact.lastMessageDirection === 'outbound' && (
                              <span className="text-gray-400 mr-1">You: </span>
                            )}
                            {contact.lastMessagePreview}
                          </div>
                        )}
                        {contact.lastMessageDirection === 'outbound' &&
                          (contact.lastMessageStatus ||
                            contact.lastMessageSentAt ||
                            contact.lastMessageDeliveredAt ||
                            contact.lastMessageReadAt) && (
                            <div className="text-[11px] text-blue-600 truncate mt-0.5">
                              {getOutboundStatusLabel(contact)}
                            </div>
                          )}
                      </div>
                    </div>
                  </button>
                  {index < processedAllContacts.length - 1 && (
                    <div className="mx-3 h-px bg-gray-100"></div>
                  )}
                </>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="flex-1 overflow-y-auto m-0 mt-3">
          {isLoadingEligible ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading active contacts...</div>
          ) : processedEligibleContacts.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {searchQuery 
                ? 'No matching active contacts' 
                : 'No contacts replied in the last 24 hours'}
            </div>
          ) : (
            <div className="px-2">
              {processedEligibleContacts.map((contact, index) => (
                <>
                  <button
                    key={contact.phoneNumber}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all group relative ${
                      activePhone === contact.phoneNumber 
                        ? 'bg-blue-50 shadow-sm border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    onClick={() => onContactSelect(contact.phoneNumber)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 border-2 border-green-200">
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-medium text-sm">
                          {getInitials(contact.phoneNumber)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {contact.name ? (
                              <>
                                <div className="font-medium text-sm text-gray-900 truncate">{contact.name}</div>
                                <div className="text-xs text-gray-500 truncate">{contact.phoneNumber}</div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-700 truncate font-medium">{contact.phoneNumber}</div>
                            )}
                          </div>
                          {contact.unreadCount && contact.unreadCount > 0 ? (
                            <div className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                              {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                            </div>
                          ) : null}
                        </div>
                        {contact.lastMessagePreview && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {contact.lastMessageDirection === 'outbound' && (
                              <span className="text-gray-400 mr-1">You: </span>
                            )}
                            {contact.lastMessagePreview}
                          </div>
                        )}
                        {contact.lastMessageDirection === 'outbound' &&
                          (contact.lastMessageStatus ||
                            contact.lastMessageSentAt ||
                            contact.lastMessageDeliveredAt ||
                            contact.lastMessageReadAt) && (
                            <div className="text-[11px] text-blue-600 truncate mt-0.5">
                              {getOutboundStatusLabel(contact)}
                            </div>
                          )}
                        {contact.timeRemaining !== undefined && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">
                              {formatTimeRemaining(contact.timeRemaining)} remaining
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  {index < processedEligibleContacts.length - 1 && (
                    <div className="mx-3 h-px bg-gray-100"></div>
                  )}
                </>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  );
}
