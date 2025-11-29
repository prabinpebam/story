# OAuth Setup Guide

This guide walks you through setting up OAuth authentication for Story, enabling users to sign in with their Microsoft or Google accounts.

## Overview

Story uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) for secure authentication. This approach:

- **No backend required**: Authentication happens entirely in the browser
- **Cloud storage integration**: Users can save/load files from OneDrive or Google Drive
- **Privacy-focused**: Story never stores user credentials

## Prerequisites

- A Microsoft Azure account (for Microsoft OAuth)
- A Google Cloud account (for Google OAuth)
- Access to Story's source code

## Quick Start

1. Copy `.env.example` to `.env`
2. Follow the provider-specific setup below
3. Add your Client IDs to `.env`
4. Run the app - OAuth should now work!

---

## Microsoft OAuth Setup

### Step 1: Create Azure AD App Registration

1. Go to [Azure Portal - App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Click **"New registration"**

### Step 2: Configure the App

| Field | Value |
|-------|-------|
| Name | `Story Presentation App` |
| Supported account types | `Accounts in any organizational directory and personal Microsoft accounts` |
| Redirect URI - Platform | `Single-page application (SPA)` |
| Redirect URI - URL | `http://localhost:5173/auth/callback` |

Click **"Register"**

### Step 3: Copy the Client ID

After registration, you'll see the **Overview** page:
- Copy the **"Application (client) ID"**
- This is your `VITE_MICROSOFT_CLIENT_ID`

### Step 4: Add API Permissions

1. Go to **"API permissions"** in the left sidebar
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Choose **"Delegated permissions"**
5. Add these permissions:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
   - `Files.ReadWrite` (for OneDrive access)

### Step 5: Add Production Redirect URI (Optional)

If deploying to production:
1. Go to **"Authentication"**
2. Under **"Single-page application"**, add your production URL:
   - `https://your-domain.com/auth/callback`

---

## Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### Step 2: Enable Required APIs

1. Go to **"APIs & Services"** > **"Enable APIs and Services"**
2. Enable:
   - **Google Drive API** (for file storage)
   - **Google People API** (optional, for profile info)

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **"External"** (for public use) or **"Internal"** (for org-only)
3. Fill in the required fields:
   - App name: `Story Presentation App`
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/drive.file`
5. Add test users if using External with unverified status

### Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. Configure:

| Field | Value |
|-------|-------|
| Application type | `Web application` |
| Name | `Story Web Client` |
| Authorized JavaScript origins | `http://localhost:5173` |
| Authorized redirect URIs | `http://localhost:5173/auth/callback` |

4. Click **"Create"**

### Step 5: Copy the Client ID

- Copy the **"Client ID"** shown in the popup
- This is your `VITE_GOOGLE_CLIENT_ID`

### Step 6: Add Production URLs (Optional)

For production:
1. Edit your OAuth client
2. Add production URLs:
   - Authorized JavaScript origins: `https://your-domain.com`
   - Authorized redirect URIs: `https://your-domain.com/auth/callback`

---

## Environment Configuration

Create a `.env` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` with your Client IDs:

```env
VITE_MICROSOFT_CLIENT_ID=your-azure-app-client-id
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## Testing OAuth

### Local Development

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:5173`

3. Click the **Profile button** (top-right) or open the **Sign In modal**

4. Choose a provider and sign in

### Verifying It Works

After successful sign-in:
- The Profile button shows your avatar/initials
- Clicking the Profile button shows a dropdown with your name/email
- You can sign out from the dropdown

### Troubleshooting

#### "Sign-in providers not configured"
- Check that `.env` file exists and has the Client IDs
- Restart the dev server after changing `.env`

#### "Invalid redirect URI"
- Ensure the redirect URI in your OAuth app exactly matches:
  - Dev: `http://localhost:5173/auth/callback`
  - Prod: `https://your-domain.com/auth/callback`
- Check for trailing slashes (shouldn't have one)

#### "CORS Error"
- Ensure your OAuth app's JavaScript origins include your domain
- For Google: Add `http://localhost:5173` to Authorized JavaScript origins

#### "Access Denied" or "Consent Required"
- Microsoft: Ensure you added the required API permissions
- Google: Ensure test users are added if app is unverified

#### "Invalid Client"
- Double-check the Client ID is correct (no typos, spaces)
- Ensure the Client ID is from a SPA/Web application type

---

## Security Notes

### PKCE Protection
Story uses PKCE (Proof Key for Code Exchange) which:
- Prevents authorization code interception attacks
- Doesn't require a client secret
- Is the recommended flow for SPAs

### Token Storage
- Access tokens: Stored in `sessionStorage` (cleared on tab close)
- Refresh tokens: Stored in `localStorage` (for session persistence)
- ID tokens: Parsed for user info, not stored

### Best Practices Implemented
- State parameter for CSRF protection
- Automatic token refresh before expiration
- Secure redirect URI validation

---

## Production Deployment

For production deployment, ensure:

1. **HTTPS is required** - OAuth providers require HTTPS in production
2. **Update redirect URIs** - Add your production domain to both OAuth apps
3. **Google: Verify your app** - For public use, submit for verification
4. **Environment variables** - Use your hosting platform's secrets management

---

## Related Documentation

- [OAuth Identity Flow Spec](./specs/identity/oauth-identity-flow.md)
- [Identity Architecture](./specs/identity/identity-architecture.md)
- [Session Lifecycle](./specs/identity/session-lifecycle.md)
