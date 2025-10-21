# Admin Account Creation Guide

## How to Create Parent-Student Accounts

When admin creates a student account, the system now automatically handles parent account creation:

### Step 1: Navigate to Admin Panel
- Go to Admin → Students tab
- Click "Create New" button

### Step 2: Fill Student Information
- Enter student's first name, last name
- Enter date of birth and enrollment date
- Fill in parent information:
  - Parent's first name
  - Parent's last name  
  - **Parent's email address** (NEW REQUIRED FIELD)

### Step 3: Account Creation Process
The system will:
1. **Check if parent exists** - If a parent with that email already exists, link the student to existing parent
2. **Create new parent account** - If parent doesn't exist:
   - Create Supabase Auth account for parent
   - Generate temporary password
   - Create parent profile
   - Show login credentials to admin
3. **Create student record** - Link student to parent account

### Step 4: Share Parent Login Details
When creating a new parent account, the system will display:
```
PARENT LOGIN DETAILS:
Email: parent@example.com
Password: Parent@abc123

Please share these credentials with the parent securely.
```

### Important Notes:
- **No more duplicate accounts** - Parents can only login with properly created accounts
- **Proper parent-child linking** - Students are properly linked to parent accounts
- **Secure password generation** - System generates secure temporary passwords
- **Email-based identification** - Parents are identified by email address

### Testing the System:
1. Create a student account with parent email
2. Note the generated parent login credentials
3. Try logging in as parent using those credentials
4. Verify that children show up in parent dashboard

### Troubleshooting:
- If parent login fails: Check that account was created properly in admin panel
- If no children show: Verify parent_id field in students table matches parent's user ID
- If duplicate parent error: Use existing parent's email or create with different email