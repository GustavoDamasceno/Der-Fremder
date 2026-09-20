import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      // Chrome: garante Gamepad + WebHID liberados nesta origem
      'Permissions-Policy': 'gamepad=(self), hid=(self)',
    },
  },
  preview: {
    headers: {
      'Permissions-Policy': 'gamepad=(self), hid=(self)',
    },
  },
});
