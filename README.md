 # Gmail Vault - Progressive Web App

A secure Gmail account manager with biometric recovery capabilities, built as a Progressive Web App using React and Vite.

> Secure app for managing Gmail accounts with biometric recovery.

## Features

- 📱 **Progressive Web App**: Installable on mobile and desktop devices
- 🔒 **Secure Storage**: Store Gmail accounts with passwords and recovery information
- 👆 **Biometric Recovery**: Simulated fingerprint authentication for account recovery
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Mobile-first design that works on all screen sizes
- ⚡ **Offline Support**: View stored accounts even without internet connection
- 🎨 **Modern UI**: Clean, professional interface with Roboto font and blue/gray color scheme

## Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Build for production:
\`\`\`bash
npm run build
\`\`\`

4. Preview production build:
\`\`\`bash
npm run preview
\`\`\`

## Usage

### Adding Accounts
1. Navigate to "Add Account" from the sidebar or bottom navigation
2. Fill in the email, password, and optional recovery information
3. Use the "Generate Password" button to create a secure password
4. Click "Save Account" to store the account

### Managing Accounts
- View all accounts on the Dashboard
- Search accounts by email or notes
- Toggle password visibility on account cards
- Copy passwords to clipboard
- Delete accounts when no longer needed

### Biometric Recovery
1. Enable biometric authentication in Settings
2. Navigate to the Recovery page
3. Click "Start Scan" to simulate fingerprint authentication
4. View and copy recovered account credentials

### Settings
- Toggle dark mode
- Enable/disable biometric authentication
- Clear all stored data
- View app information

## Technology Stack

- **React 18**: UI library
- **Vite**: Build tool and development server
- **React Router**: Client-side routing
- **Tailwind CSS v4**: Utility-first CSS framework
- **vite-plugin-pwa**: PWA support with service workers
- **LocalStorage**: Client-side data persistence

## Security Notes

⚠️ **Important**: This is a demonstration app. For production use:
- Implement proper encryption for stored passwords
- Use secure backend storage instead of localStorage
- Integrate real biometric authentication APIs
- Add proper authentication and authorization
- Follow security best practices for password management

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with PWA support

## License

MIT
