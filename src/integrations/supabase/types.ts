export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      historico_observacoes: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          id: string
          observacao: string
          origem: string | null
          plano_adquirido_id: string
          solicitacao_id: string | null
          status_evento: string | null
          tipo_evento: string | null
          valor_final: number | null
          valor_solicitado: number | null
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          id?: string
          observacao: string
          origem?: string | null
          plano_adquirido_id: string
          solicitacao_id?: string | null
          status_evento?: string | null
          tipo_evento?: string | null
          valor_final?: number | null
          valor_solicitado?: number | null
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          id?: string
          observacao?: string
          origem?: string | null
          plano_adquirido_id?: string
          solicitacao_id?: string | null
          status_evento?: string | null
          tipo_evento?: string | null
          valor_final?: number | null
          valor_solicitado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_observacoes_plano_adquirido_id_fkey"
            columns: ["plano_adquirido_id"]
            isOneToOne: false
            referencedRelation: "planos_adquiridos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_observacoes_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome_plano: string
          preco: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome_plano: string
          preco: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome_plano?: string
          preco?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      planos_adquiridos: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_aquisicao: string | null
          id: string
          id_carteira: string
          plano_id: string
          status_plano: Database["public"]["Enums"]["plan_status"] | null
          tipo_saque: Database["public"]["Enums"]["withdrawal_type"]
          updated_at: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_aquisicao?: string | null
          id?: string
          id_carteira: string
          plano_id: string
          status_plano?: Database["public"]["Enums"]["plan_status"] | null
          tipo_saque: Database["public"]["Enums"]["withdrawal_type"]
          updated_at?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_aquisicao?: string | null
          id?: string
          id_carteira?: string
          plano_id?: string
          status_plano?: Database["public"]["Enums"]["plan_status"] | null
          tipo_saque?: Database["public"]["Enums"]["withdrawal_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planos_adquiridos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_adquiridos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_config: {
        Row: {
          config_key: string
          config_value: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          documentos_completos: boolean | null
          email: string
          estado: string | null
          foto_perfil: string | null
          id: string
          informacoes_personalizadas: string | null
          nome: string
          numero_residencial: string | null
          pagamento_ativo: boolean | null
          rua_bairro: string | null
          status_plataforma: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          documentos_completos?: boolean | null
          email: string
          estado?: string | null
          foto_perfil?: string | null
          id: string
          informacoes_personalizadas?: string | null
          nome: string
          numero_residencial?: string | null
          pagamento_ativo?: boolean | null
          rua_bairro?: string | null
          status_plataforma?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          documentos_completos?: boolean | null
          email?: string
          estado?: string | null
          foto_perfil?: string | null
          id?: string
          informacoes_personalizadas?: string | null
          nome?: string
          numero_residencial?: string | null
          pagamento_ativo?: boolean | null
          rua_bairro?: string | null
          status_plataforma?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      solicitacoes: {
        Row: {
          atendida_em: string | null
          atendida_por: string | null
          created_at: string | null
          descricao: string | null
          id: string
          plano_adquirido_id: string | null
          resposta_admin: string | null
          status: string
          tipo_solicitacao: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          atendida_em?: string | null
          atendida_por?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          plano_adquirido_id?: string | null
          resposta_admin?: string | null
          status?: string
          tipo_solicitacao: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          atendida_em?: string | null
          atendida_por?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          plano_adquirido_id?: string | null
          resposta_admin?: string | null
          status?: string
          tipo_solicitacao?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_atendida_por_fkey"
            columns: ["atendida_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_plano_adquirido_id_fkey"
            columns: ["plano_adquirido_id"]
            isOneToOne: false
            referencedRelation: "planos_adquiridos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          log_data: Json
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          log_data: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          log_data?: Json
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          arquivo_url: string
          created_at: string | null
          id: string
          status: string
          tipo_documento: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string | null
          id?: string
          status?: string
          tipo_documento: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string | null
          id?: string
          status?: string
          tipo_documento?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_expired_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "cliente" | "super_admin"
      plan_status:
        | "eliminado"
        | "teste_1"
        | "teste_2"
        | "sim_rem"
        | "ativo"
        | "pausado"
        | "teste_1_sc"
        | "teste_2_sc"
      withdrawal_type: "mensal" | "quinzenal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "cliente", "super_admin"],
      plan_status: [
        "eliminado",
        "teste_1",
        "teste_2",
        "sim_rem",
        "ativo",
        "pausado",
        "teste_1_sc",
        "teste_2_sc",
      ],
      withdrawal_type: ["mensal", "quinzenal"],
    },
  },
} as const
