# ChatWindow Component Usage

The `ChatWindow` component is a reusable chat interface that can be used throughout the application. It provides a complete chat experience with message history, template support, and real-time messaging.

## Basic Usage

```tsx
import { ChatWindow, type Contact } from '@/pages/dashboard/Chat/components';

function MyChatComponent() {
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const projectId = "your-project-id";

  return (
    <ChatWindow
      projectId={projectId}
      activeContact={activeContact}
      onMessageSent={(message) => {
        console.log('Message sent:', message);
        // Handle message sent event
      }}
      onTemplateSent={(payload) => {
        console.log('Template sent:', payload);
        // Handle template sent event
      }}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `projectId` | `string` | ✅ | The selected project ID |
| `activeContact` | `Contact \| null` | ✅ | The active contact/phone number |
| `disabled` | `boolean` | ❌ | Whether the chat window is disabled |
| `emptyState` | `object` | ❌ | Custom empty state configuration |
| `className` | `string` | ❌ | Custom class names for styling |
| `onMessageSent` | `function` | ❌ | Callback when a message is sent |
| `onTemplateSent` | `function` | ❌ | Callback when template is sent |
| `headerActions` | `React.ReactNode` | ❌ | Custom header actions |

## Contact Interface

```tsx
interface Contact {
  _id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}
```

## Features

- **Real-time messaging**: Automatic message updates via WebSocket
- **Template support**: Send WhatsApp template messages
- **Message history**: Load older messages with pagination
- **24-hour window detection**: Automatic detection of messaging window status
- **Accessibility**: Full keyboard navigation and screen reader support
- **Error handling**: Comprehensive error states and user feedback
- **Responsive design**: Works on all screen sizes

## Customization

### Custom Empty State

```tsx
<ChatWindow
  projectId={projectId}
  activeContact={activeContact}
  emptyState={{
    title: "No conversation selected",
    description: "Please select a contact to start messaging"
  }}
/>
```

### Custom Header Actions

```tsx
import { Button } from '@/components/ui/button';
import { Phone, Video } from 'lucide-react';

<ChatWindow
  projectId={projectId}
  activeContact={activeContact}
  headerActions={
    <div className="flex gap-2">
      <Button size="sm" variant="outline">
        <Phone className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="outline">
        <Video className="h-4 w-4" />
      </Button>
    </div>
  }
/>
```

### Custom Styling

```tsx
<ChatWindow
  projectId={projectId}
  activeContact={activeContact}
  className="border-2 border-blue-200 rounded-lg"
/>
```

## Integration Examples

### With Contact List

```tsx
function ChatWithContacts() {
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const { data: contacts } = useContacts({ page: 1, limit: 50 });

  return (
    <div className="flex h-full">
      <div className="w-80 border-r">
        {/* Your contact list component */}
        {contacts?.map(contact => (
          <button
            key={contact._id}
            onClick={() => setActiveContact(contact)}
            className="w-full text-left p-3 hover:bg-gray-100"
          >
            {contact.firstName} {contact.lastName}
          </button>
        ))}
      </div>
      
      <ChatWindow
        projectId={projectId}
        activeContact={activeContact}
      />
    </div>
  );
}
```

### With Project Context

```tsx
function ProjectChat() {
  const { selectedProject } = useProjectContext();
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  if (!selectedProject) {
    return <div>Please select a project</div>;
  }

  return (
    <ChatWindow
      projectId={selectedProject._id}
      activeContact={activeContact}
      onMessageSent={(message) => {
        // Track analytics
        analytics.track('message_sent', {
          projectId: selectedProject._id,
          contactId: activeContact?._id
        });
      }}
    />
  );
}
```

## Error Handling

The component includes built-in error handling for:
- Network failures
- Invalid message formats
- Template sending errors
- WebSocket connection issues

All errors are displayed to the user with appropriate messaging and recovery options.

## Accessibility

The component is fully accessible with:
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- High contrast support
