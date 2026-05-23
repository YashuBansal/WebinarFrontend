/** User-facing copy for projects still on the old Zoom server-app credential flow. */
export const LEGACY_ZOOM_SETUP = {
  title: 'Please reconfigure your Zoom connection',
  body:
    'This project (or your account) still uses the older Zoom setup with your own server app credentials. Some features may not work reliably until you connect again using our general Zoom app (OAuth). We recommend completing setup under Configuration for each affected project.',
  badge: 'Legacy Zoom setup',
} as const
