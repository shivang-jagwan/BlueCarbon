const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vwpktddlwnspwqntxxxp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createOwner() {
  const email = 'shivang.jagwan@gmail.com';
  const password = 'Shivang@PROJECT07';
  
  console.log('Creating Project Owner:', email);
  
  // 1. Create User in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'shivang.jagwan',
      role: 'project_owner'
    }
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('User already exists in Auth. Updating profile instead...');
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const user = existingUser.users.find(u => u.email === email);
      if (user) {
        await upsertProfile(user.id, email);
      }
      return;
    }
    console.error('❌ Auth Error:', authError.message);
    return;
  }
  
  console.log('✅ Auth user created. ID:', authData.user.id);
  await upsertProfile(authData.user.id, email);
}

async function upsertProfile(userId, email) {
  // 2. Insert into Profiles
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email: email,
    full_name: 'shivang.jagwan',
    role: 'project_owner',
    approval_status: 'approved',
    mobile_number: '8191013531',
    aadhaar_number: '2321321312323',
    pan_number: 'ABCD211E',
    country: 'India',
    state: 'Uttarakhand',
    district: 'dehradun',
    village: 'dehradun',
    pin_code: '248002',
    bank_name: 'sbi',
    account_number: '23123213213',
    ifsc_code: 'SBIN0007878',
    occupation: 'scientist',
    experience: '3-5 years',
    primary_activity: 'Seagrass Restoration',
    kyc_status: 'verified',
    profile_completed: true,
  });

  if (profileError) {
    console.error('❌ Profile Error:', profileError.message, profileError);
    return;
  }

  console.log('✅ Project Owner profile created successfully!');
  console.log('Email:', email);
  console.log('Password: Shivang@PROJECT07');
}

createOwner();
