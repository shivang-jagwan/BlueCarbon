const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function getStats() {
  const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
  
  const { data: projects } = await supabase.from('projects').select('area_hectares');
  const totalHectares = projects.reduce((acc, p) => acc + (p.area_hectares || 0), 0);
  
  const { data: passports } = await supabase.from('carbon_passports').select('amount_issued');
  const totalCarbon = passports.reduce((acc, p) => acc + (p.amount_issued || 0), 0);
  
  const { count: verifierCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'verifier');
  
  console.log({
    activeProjects: projectCount || 0,
    totalHectares: Math.round(totalHectares) || 0,
    totalCarbon: Math.round(totalCarbon) || 0,
    verifiers: verifierCount || 0
  });
}
getStats();
