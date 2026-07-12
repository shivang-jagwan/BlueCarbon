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
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
