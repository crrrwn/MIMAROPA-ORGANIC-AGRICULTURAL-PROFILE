# Firestore Setup — Fix "Missing or insufficient permissions"

Ang error na **"Missing or insufficient permissions"** ay kadalasan dahil walang **user document** sa Firestore para sa naka-log-in na user, o hindi pa na-deploy ang Firestore rules.

## 1. I-deploy ang Firestore rules

Sa project root (kung saan naka-save ang `firestore.rules`), run:

```bash
firebase deploy --only firestore:rules
```

Kung wala pa naka-link na Firebase project:

```bash
firebase login
firebase use --add
```

## 2. Siguraduhing may user document bawat naka-log-in na user

Ang app ay naka-set up na **bawat user na naka-log in (Firebase Auth)** ay dapat may katumbas na document sa collection na **`users`**:

- **Path:** `users/{userId}` (ang `userId` ay ang Firebase Auth UID)
- **Fields na kailangan:**
  - **Encoder:** `email` (string), `role` (string, dapat `"encoder"`), `province` (string, hal. `"Oriental Mindoro"`)
  - **Admin:** `email` (string), `role` (string, dapat `"admin"`)

### Paano malalaman ang UID?

- Sa **Firebase Console** → Authentication → Users → makikita ang UID sa listahan.
- O sa app: pag naka-log in, maaaring i-log sa console ang `auth.currentUser.uid` (kung may dev check ka).

### Paano mag-add ng user document?

**Option A — Gamit ang app (recommended)**  
- Gumawa ng bagong user sa **Register** flow ng app (Encoder o Admin), kung available. Doon automatic na na-create ang document sa `users`.

**Option B — Manually sa Firebase Console**  
1. Buksan [Firebase Console](https://console.firebase.google.com) → piliin ang project.  
2. Firestore Database → Start collection o piliin ang collection **`users`**.  
3. Add document na ang **Document ID** ay ang **UID** ng user mula sa Authentication.  
4. Add fields halimbawa:
   - `email` (string): `encoder@example.com`
   - `role` (string): `encoder`
   - `province` (string): `Oriental Mindoro`
   - Para sa admin: `role`: `admin` (province optional).

Pagkatapos nito, i-refresh ang app at subukan ulit; dapat mawala na ang "Missing or insufficient permissions" kung tama ang role at province.
