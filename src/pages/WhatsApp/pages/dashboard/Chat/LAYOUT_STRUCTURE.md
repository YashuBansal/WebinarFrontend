# Chat Layout Structure

## Fixed Layout Implementation

The chat window now has a proper sticky layout where:

### Layout Structure:
```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard Navbar                     │ ← FIXED TOP
├─────────────────────────────────────────────────────────┤
│                    Chat Header                          │ ← STICKY TOP
│                 (Contact Info + Actions)                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    Messages Area                        │ ← SCROLLABLE
│                   (Only this scrolls)                   │
│                                                         │
│  • Message 1                                            │
│  • Message 2                                            │
│  • Message 3                                            │
│  • ...                                                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                 Template Form (if open)                 │ ← STICKY ABOVE INPUT
├─────────────────────────────────────────────────────────┤
│                    Chat Input                           │ ← STICKY BOTTOM
│              (Text input + Send button)                  │
└─────────────────────────────────────────────────────────┘
```

## Key Changes Made:

### 1. **DashboardLayout Component**
- **Chat Page Detection**: Automatically detects when on `/chat` route
- **Special Styling**: Removes padding and background for chat page
- **Height Management**: Ensures proper height inheritance for chat components

### 2. **ChatWindow Component**
- **Header**: `sticky top-0 z-10` - Always stays at the top
- **Messages**: `flex-1 min-h-0 overflow-hidden` - Takes remaining space and scrolls
- **Template Form**: `sticky bottom-0 z-10` - Sticks above input when open
- **Input**: `sticky bottom-0 z-10` - Always stays at the bottom

### 3. **MessagesList Component**
- Changed from `flex-1` to `h-full` to properly fill the scrollable container
- Maintains `overflow-y-auto` for scrolling

### 4. **ChatPage Component**
- Updated to use `h-full` for available height
- Works within DashboardLayout constraints

## CSS Classes Used:

```css
/* DashboardLayout - Chat Page Detection */
.isChatPage ? 'p-0' : ''
.isChatPage ? 'shadow-none bg-transparent' : ''

/* Main container */
.flex-1.flex.flex-col.h-full

/* Sticky header */
.flex-shrink-0.sticky.top-0.z-10.bg-white

/* Scrollable messages */
.flex-1.min-h-0.overflow-hidden

/* Sticky input */
.flex-shrink-0.sticky.bottom-0.z-10.bg-white.border-t
```

## Benefits:

1. **Header Always Visible**: Contact info and actions always accessible
2. **Input Always Accessible**: Users can always type messages
3. **Smooth Scrolling**: Only messages scroll, creating natural chat experience
4. **Template Form**: When open, appears above input without covering messages
5. **Responsive**: Works on all screen sizes
6. **Z-index Management**: Proper layering with z-10 for sticky elements
7. **Dashboard Integration**: Seamlessly works within existing dashboard layout

## Behavior:

- **Scroll**: Only the messages area scrolls
- **Header**: Stays fixed at top, never scrolls away
- **Input**: Stays fixed at bottom, always accessible
- **Template Form**: Slides up from bottom when opened, pushes input down
- **Mobile**: Same behavior maintained on mobile devices
- **Dashboard**: Integrates properly with dashboard navbar and sidebar
