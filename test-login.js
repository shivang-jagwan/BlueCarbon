const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with anonymous key for client-side login testing
const supabaseUrl = 'https://vwpktddlwnspwqntxxxp.supabase.co';
const supabaseAnonKey = 'sb_publishable_W5s-LJLAebqxPx5XFIcgzg_JqJBQ_DH';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testLogin(email, password, label) {
  console.log(`\n--- Testing ${label} Login ---`);
  console.log(`Email: ${email}`);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Login Failed:', error.message);
  } else {
    console.log('✅ Login Successful!');
    console.log('User ID:', data.user.id);
    
    // Fetch profile to verify role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, approval_status')
      .eq('id', data.user.id)
      .single();
      
    if (profileError) {
      console.log('Error fetching profile:', profileError.message);
    } else {
      console.log('Profile Info:');
      console.log('  - Role:', profile.role);
      console.log('  - Name:', profile.full_name);
      console.log('  - Status:', profile.approval_status);
    }
  }
}

async function runTests() {
  // 1. Test Admin Login
  await testLogin('admin@carbonrush.ai', 'AdminPassword123!', 'Admin');
  
  // 2. Test Org Login
  await testLogin('org@gmail.com', 'Shivang@ORG07', 'Organization');
}

runTests();
