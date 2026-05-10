import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProjectContext } from '@/context/ProjectContext';
import type { ChatMessageDTO } from '@/api/modules/chatAPI';
import type { SendTemplateMessagePayload } from '@/schemas/templateSchema';
import { wabaMessageApi } from '@/api/modules/wabaMessageAPI';

import {
  ContactsList,
  ChatWindow,
  type Contact
} from './components';
import { useContacts } from '@/hooks/useContacts';
import { DUMMY_CONTACTS } from './dummyData';
import { useMemo } from 'react';

export default function ChatPage() {
  const { selectedProject } = useProjectContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Query key constant for waba message-related queries
  const WABA_MESSAGE_QUERY_KEY = 'wabaMessage';

  const initialPhone = searchParams.get('phone') || undefined;
  const [activePhone, setActivePhone] = useState<string | undefined>(initialPhone);

  // Fetch contacts to find the active one
  const { data: contactsData } = useContacts({ page: 1, limit: 5000 });

  const activeContactObject = useMemo<Contact | undefined>(() => {
    if (!activePhone) return undefined;

    // Check dummy contacts first
    const dummy = DUMMY_CONTACTS.find(c => c.phoneNumber === activePhone);
    if (dummy) {
      return { 
        ...dummy, 
        _id: `dummy-${dummy.phoneNumber}`,
        phone: dummy.phoneNumber, 
        firstName: dummy.name, 
        lastName: '' 
      };
    }

    // Check real contacts
    const contact = contactsData?.contacts?.find(c => c.phone === activePhone);
    return contact as Contact | undefined;
  }, [activePhone, contactsData]);

  // Handle contact selection
  const handleContactSelect = useCallback(
    async (phone: string) => {
      console.log('Contact selected:', phone);
      setActivePhone(phone);

      const newParams = new URLSearchParams(searchParams);
      newParams.set('phone', phone);
      setSearchParams(newParams);

      // Optimistically mark messages as read for this contact
      if (selectedProject?._id) {
        try {
          await wabaMessageApi.markAsRead(selectedProject._id, phone);
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        } finally {
          // Refresh contact lists so unread counts update immediately
          queryClient.invalidateQueries({
            queryKey: [WABA_MESSAGE_QUERY_KEY, 'unique-phone-numbers', selectedProject._id],
          });
          queryClient.invalidateQueries({
            queryKey: [WABA_MESSAGE_QUERY_KEY, 'eligible-session-contacts', selectedProject._id],
          });
        }
      }
    },
    [searchParams, setSearchParams, selectedProject?._id, queryClient],
  );

  // Handle message sent callback
  const handleMessageSent = (message: ChatMessageDTO) => {
    console.log('Message sent:', message);
    // You can add additional logic here like analytics, notifications, etc.
  };

  // Handle template sent callback
  const handleTemplateSent = (payload: SendTemplateMessagePayload) => {
    console.log('Template sent:', payload);
    // You can add additional logic here like analytics, notifications, etc.
  };

  if (!selectedProject) {
    return (
      <div className="flex h-full overflow-hidden w-full">
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-800/50">
          <div className="text-center text-gray-500 dark:text-slate-400">
            <div className="text-lg font-medium mb-2">No project selected</div>
            <div className="text-sm">Please select a project to start chatting</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden min-h-0 relative">
      <div className={`flex-shrink-0 ${activePhone ? 'hidden md:block' : 'block w-full md:w-auto'}`}>
        <ContactsList
          projectId={selectedProject._id}
          activePhone={activePhone}
          onContactSelect={handleContactSelect}
        />
      </div>

      <div className={`flex-1 min-w-0 ${activePhone ? 'block' : 'hidden md:block'}`}>
        <ChatWindow
          projectId={selectedProject._id}
          activeContact={activePhone}
          contact={activeContactObject}
          onMessageSent={handleMessageSent}
          onTemplateSent={handleTemplateSent}
          onBack={() => setActivePhone(undefined)}
          emptyState={{
            title: "Select a contact to start chatting",
            description: "Choose a contact from the sidebar to view your conversation"
          }}
        />
      </div>
    </div>
  );
}


