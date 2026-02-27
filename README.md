# MIMAROPA Organic Profile

Organic Agriculture Profile Management System for MIMAROPA (Oriental Mindoro, Occidental Mindoro, Marinduque, Palawan, Romblon).

## Tech Stack

- **Front-end**: React.js, Tailwind CSS, CSS
- **Back-end**: Firebase (Auth, Firestore)
- **Font**: Poppins
- **Icons**: Iconify
- **Charts**: Recharts

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Ensure `public/LOGO_OA.PNG` and `public/COLOR_PALLETE.JPG` exist in the public folder.

3. Deploy Firestore rules:
   - Copy `firestore.rules` to your Firebase project
   - Run `firebase deploy --only firestore:rules` (requires Firebase CLI)

4. Enable Authentication (Email/Password) in Firebase Console.

5. Run development server:
   ```
   npm run dev
   ```

## User Roles

- **Admin**: Full dashboard across all 5 provinces. Login at `/admin/login`.
- **Provincial Encoder**: Dashboard and data entry for their assigned province. 2 encoders per province. Login at `/encoder/select-province` → choose province → login.

## Features

- Remember Me & Forgot Password on both Admin and Encoder auth
- Dashboard with OA Area, Practitioners, FCAs, Commodities, PGS metrics
- Form A: Individual OA Profile
- Form B: FCA Form
- Color palette from `COLOR_PALLETE.JPG` / logo
- Logo: `LOGO_OA.PNG` in public folder
