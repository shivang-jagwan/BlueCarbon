export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          project_type: string;
          status: string;
          country: string | null;
          location_name: string | null;
          boundary_geojson: Json | null;
          area_hectares: number | null;
          perimeter_km: number | null;
          target_carbon_tonnes: number | null;
          verified_carbon_tonnes: number | null;
          start_date: string | null;
          end_date: string | null;
          verification_status: string;
          passport_issued_at: string | null;
          objectives: string | null;
          expected_duration_months: number | null;
          ownership_type: string | null;
          survey_number: string | null;
          land_registry_url: string | null;
          cover_image_url: string | null;
          land_verification_status: string;
          health_score: number | null;
          center_lat: number | null;
          center_lng: number | null;
          bounding_box: number[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          approval_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      project_activity: {
        Row: {
          id: string;
          project_id: string;
          actor_id: string | null;
          event_type: string;
          title: string;
          description: string | null;
          metadata: Json | null;
          created_at: string;
          organization_id: string | null;
          company_id: string | null;
          related_document_id: string | null;
          related_report_id: string | null;
          related_verification_id: string | null;
          related_partnership_id: string | null;
          activity_status: string | null;
          actor_name: string | null;
          actor_role: string | null;
          organization_name: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      project_support: {
        Row: {
          id: string;
          project_id: string;
          partner_id: string;
          amount_usd: number;
          carbon_credits_tonnes: number | null;
          status: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      verification_service_requests: {
        Row: {
          id: string;
          project_id: string;
          verifier_id: string;
          request_type: string;
          priority: string;
          status: string;
          due_date: string | null;
          corporate_partner_id: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      verification_service_decisions: {
        Row: {
          id: string;
          request_id: string;
          verifier_id: string;
          decision: string;
          remarks: string | null;
          justification: string | null;
          file_path: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      carbon_passports: {
        Row: {
          id: string;
          project_id: string;
          issued_by: string;
          status: string;
          certificate_url: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      project_partnerships: {
        Row: {
          id: string;
          project_id: string;
          company_id: string;
          verifier_id: string;
          status: 'pending_owner' | 'pending_verifier' | 'active' | 'rejected' | 'terminated';
          service_type: string;
          start_date: string | null;
          budget_usd: number | null;
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      project_monitoring_assignments: {
        Row: {
          id: string;
          partnership_id: string;
          project_id: string;
          company_id: string;
          verifier_id: string;
          status: 'pending' | 'accepted' | 'declined';
          next_monitoring_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      project_monitoring_reports: {
        Row: {
          id: string;
          assignment_id: string;
          project_id: string;
          verifier_id: string;
          status: 'draft' | 'submitted';
          report_date: string;
          general_inspection: string | null;
          tree_growth: string | null;
          tree_survival_rate: number | null;
          new_plantation_count: number | null;
          carbon_estimate_tons: number | null;
          biomass_notes: string | null;
          biodiversity_notes: string | null;
          soil_condition: string | null;
          water_condition: string | null;
          threats: string | null;
          restoration_progress: string | null;
          recommendations: string | null;
          overall_health_score: number | null;
          visit_date: string | null;
          visit_time: string | null;
          lead_inspector: string | null;
          inspection_team: string | null;
          weather: string | null;
          temperature: string | null;
          gps_lat: number | null;
          gps_lng: number | null;
          gps_accuracy: number | null;
          gps_timestamp: string | null;
          current_tree_count: number | null;
          dead_trees: number | null;
          missing_trees: number | null;
          dominant_species: string | null;
          species_count: number | null;
          average_height: number | null;
          average_dbh: number | null;
          canopy_coverage: number | null;
          tree_health: string | null;
          growth_stage: string | null;
          soil_carbon: number | null;
          carbon_gain: number | null;
          carbon_loss: number | null;
          methodology: string | null;
          sampling_notes: string | null;
          species_observed: string | null;
          bird_count: number | null;
          wildlife: string | null;
          pollinators: string | null;
          insects: string | null;
          invasive_species: string | null;
          habitat_quality: string | null;
          biodiversity_index: number | null;
          ecosystem_health: string | null;
          illegal_activities: string | null;
          fire_damage: string | null;
          flood_damage: string | null;
          soil_erosion: string | null;
          water_availability: string | null;
          waste: string | null;
          encroachment: string | null;
          site_condition: string | null;
          risk_level: string | null;
          monitoring_score: number | null;
          risk_score: number | null;
          recommendation: string | null;
          auditor_notes: string | null;
          partner_notes: string | null;
          delta_tree_count: number | null;
          delta_carbon_estimate: number | null;
          delta_biomass: number | null;
          delta_canopy_coverage: number | null;
          delta_health_score: number | null;
          auto_growth_rate: number | null;
          auto_area_change: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
