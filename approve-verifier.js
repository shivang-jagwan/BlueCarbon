const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vwpktddlwnspwqntxxxp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function approveVerifier() {
  console.log('Approving verifier...');
  const { error } = await supabase
    .from('profiles')
    .update({ approval_status: 'approved' })
    .eq('email', 'org@gmail.com');

  if (error) {
    console.error('Error approving:', error);
  } else {
    console.log('Successfully approved org@gmail.com!');
  }
}

approveVerifier();
