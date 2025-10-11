# Shared Development Database Setup

## 🔧 For Team Lead (You)

### Create Shared Development User
1. **MongoDB Atlas Dashboard** → **Database Access**
2. **Add New Database User:**
   - Username: `studymaster-dev-team`
   - Password: `DevTeam2024!StudyMaster`
   - Privileges: `Read and write to any database`

3. **Network Access:**
   - Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
   - Comment: "Development team access"

### Share with Developers
**Send this connection string to all developers:**
```
MONGODB_URI=mongodb+srv://studymaster-dev-team:DevTeam2024!StudyMaster@studymaster.wzaaliv.mongodb.net/studymaster?retryWrites=true&w=majority&appName=Studymaster
```

## 🚀 For Developers

### Quick Setup
1. **Clone repository**
2. **Copy `.env.example` to `.env.local`**
3. **Replace MONGODB_URI** with the shared connection string above
4. **Add your own Gemini API key**
5. **Run `npm install && npm run dev`**

### Environment File (.env.local)
```env
GEMINI_API_KEY=your_personal_gemini_key
MONGODB_URI=mongodb+srv://studymaster-dev-team:DevTeam2024!StudyMaster@studymaster.wzaaliv.mongodb.net/studymaster?retryWrites=true&w=majority&appName=Studymaster
NEXTAUTH_SECRET=dev-secret-key-2024
NEXTAUTH_URL=http://localhost:3000
```

## ⚠️ Important Notes

### Security
- This is for **development only**
- Never use shared credentials in production
- Each developer should get their own Gemini API key

### Database Sharing
- All developers share the same database
- Be careful with test data
- Coordinate schema changes
- Use unique usernames when testing

### Best Practices
- Test your changes before pushing
- Don't delete other developers' test data
- Use descriptive session names
- Communicate database changes to team