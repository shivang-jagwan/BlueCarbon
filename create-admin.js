const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vwpktddlwnspwqntxxxp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = 'admin@carbonrush.ai';
  const password = 'AdminPassword123!';

  console.log('Creating admin user via admin API...');

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
  });

  if (authError) {
    console.error('Error creating auth user:', authError.message);
    if (authError.message.includes('already exists') || authError.message.includes('has already been registered')) {
      console.log('User already exists, updating profile role instead.');
      const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();
      if (existingUser) {
        await supabase.from('profiles').update({ role: 'admin', kyc_status: 'verified' }).eq('id', existingUser.id);
        console.log('Updated existing profile to admin.');
      }
      return;
    }
    return;
  }

  const userId = authData.user.id;
  console.log('Auth user created with ID:', userId);

  console.log('Waiting 2 seconds for trigger to execute...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({
      role: 'admin',
      full_name: 'Platform Administrator',
      kyc_status: 'verified'
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating profile:', updateError.message);
  } else {
    console.log('Admin account fully configured!');
    console.log('Email:', email);
    console.log('Password:', password);
  }
}

createAdmin();
