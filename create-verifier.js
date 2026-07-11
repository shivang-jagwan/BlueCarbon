const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vwpktddlwnspwqntxxxp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createVerifier() {
  const email = 'org@gmail.com';
  const password = 'Shivang@ORG07';
  
  console.log('Creating auth user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'angad singh',
      role: 'verifier'
    }
  });

  let userId;
  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('User already exists, fetching existing user...');
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users.users.find(u => u.email === email);
        if (user) {
            userId = user.id;
            // update password to ensure it matches
            await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
        } else {
            console.error('Could not find existing user');
            return;
        }
    } else {
        console.error('Auth Error:', authError);
        return;
    }
  } else {
    userId = authData.user.id;
  }
  
  console.log('User ID:', userId);
  
  const profileData = {
    id: userId,
    email: 'org@gmail.com',
    full_name: 'angad singh',
    role: 'verifier',
    approval_status: 'pending',
    organization: 'angad org',
    organization_type: 'Government Forest Department',
    registration_number: '1223231',
    website: null,
    designation: 'lead',
    mobile_number: '8191013531',
    phone: '8191013531', 
    country: 'India',
    state: 'Uttarakhand',
    district: 'dehraudn',
    office_address: 'Dehradun Forest Office',
    pin_code: '248002',
    services_offered: [
      'Land Verification',
      'Monthly Monitoring',
      'Satellite Analysis',
      'Drone Survey',
      'GIS Mapping',
      'Carbon Assessment',
      'Project Verification'
    ],
    kyc_status: 'submitted',
    profile_completed: true,
  };

  console.log('Upserting profile...');
  const { error: profileError } = await supabase.from('profiles').upsert(profileData);
  
  if (profileError) {
    console.error('Profile Error:', profileError);
  } else {
    console.log('Success! Verifier account created and profile populated.');
  }
}

createVerifier();
