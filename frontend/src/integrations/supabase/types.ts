export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      abastecimentos: {
        Row: {
          created_at: string
          data_abastecimento: string
          id: string
          litros: number
          observacoes: string | null
          posto: string | null
          quilometragem: number
          valor_litro: number
          valor_total: number
          veiculo_id: string
        }
        Insert: {
          created_at?: string
          data_abastecimento?: string
          id?: string
          litros: number
          observacoes?: string | null
          posto?: string | null
          quilometragem: number
          valor_litro: number
          valor_total: number
          veiculo_id: string
        }
        Update: {
          created_at?: string
          data_abastecimento?: string
          id?: string
          litros?: number
          observacoes?: string | null
          posto?: string | null
          quilometragem?: number
          valor_litro?: number
          valor_total?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abastecimentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos: {
        Row: {
          cargo: string | null
          created_at: string
          email: string | null
          empresa: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          cliente: string
          created_at: string | null
          id: string
          notificar_dp: boolean | null
          notificar_operacional: boolean | null
          notificar_rh: boolean | null
          observacoes: string | null
          status: string
          tipo: string
          valor: number
          vigencia: string
        }
        Insert: {
          cliente: string
          created_at?: string | null
          id?: string
          notificar_dp?: boolean | null
          notificar_operacional?: boolean | null
          notificar_rh?: boolean | null
          observacoes?: string | null
          status: string
          tipo: string
          valor: number
          vigencia: string
        }
        Update: {
          cliente?: string
          created_at?: string | null
          id?: string
          notificar_dp?: boolean | null
          notificar_operacional?: boolean | null
          notificar_rh?: boolean | null
          observacoes?: string | null
          status?: string
          tipo?: string
          valor?: number
          vigencia?: string
        }
        Relationships: []
      }
      "Escala de Trabalho": {
        Row: {
          clienteid: string | null
          end: string | null
          funcionarioid: string | null
          id: string
          observacoes: string | null
          start: string | null
          title: string | null
          turno: string | null
        }
        Insert: {
          clienteid?: string | null
          end?: string | null
          funcionarioid?: string | null
          id?: string
          observacoes?: string | null
          start?: string | null
          title?: string | null
          turno?: string | null
        }
        Update: {
          clienteid?: string | null
          end?: string | null
          funcionarioid?: string | null
          id?: string
          observacoes?: string | null
          start?: string | null
          title?: string | null
          turno?: string | null
        }
        Relationships: []
      }
      filiais: {
        Row: {
          cidade: string
          created_at: string
          email: string | null
          endereco: string
          funcionarios: number | null
          id: string
          nome: string
          responsavel: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cidade: string
          created_at?: string
          email?: string | null
          endereco: string
          funcionarios?: number | null
          id?: string
          nome: string
          responsavel: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string
          created_at?: string
          email?: string | null
          endereco?: string
          funcionarios?: number | null
          id?: string
          nome?: string
          responsavel?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          data: string
          descricao: string
          id: string
          status: string
          tipo: string
          valor: number
        }
        Insert: {
          data: string
          descricao: string
          id?: string
          status: string
          tipo: string
          valor: number
        }
        Update: {
          data?: string
          descricao?: string
          id?: string
          status?: string
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo: string
          contato: string
          data_nascimento: string | null
          documento: string
          email: string | null
          id: string
          nome: string
          status: string
        }
        Insert: {
          cargo: string
          contato: string
          data_nascimento?: string | null
          documento: string
          email?: string | null
          id?: string
          nome: string
          status: string
        }
        Update: {
          cargo?: string
          contato?: string
          data_nascimento?: string | null
          documento?: string
          email?: string | null
          id?: string
          nome?: string
          status?: string
        }
        Relationships: []
      }
      holerites_processados: {
        Row: {
          ano_referencia: number
          arquivo_individual_url: string | null
          arquivo_original_url: string | null
          created_at: string
          funcionario_codigo: string | null
          funcionario_id: string | null
          funcionario_nome: string
          id: string
          mes_referencia: string
          pagina_numero: number | null
          updated_at: string
        }
        Insert: {
          ano_referencia: number
          arquivo_individual_url?: string | null
          arquivo_original_url?: string | null
          created_at?: string
          funcionario_codigo?: string | null
          funcionario_id?: string | null
          funcionario_nome: string
          id?: string
          mes_referencia: string
          pagina_numero?: number | null
          updated_at?: string
        }
        Update: {
          ano_referencia?: number
          arquivo_individual_url?: string | null
          arquivo_original_url?: string | null
          created_at?: string
          funcionario_codigo?: string | null
          funcionario_id?: string | null
          funcionario_nome?: string
          id?: string
          mes_referencia?: string
          pagina_numero?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holerites_processados_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          contrato_id: string | null
          created_at: string
          departamento: string
          id: string
          mensagem: string
          sent_at: string | null
          status: string
          titulo: string
        }
        Insert: {
          contrato_id?: string | null
          created_at?: string
          departamento: string
          id?: string
          mensagem: string
          sent_at?: string | null
          status?: string
          titulo: string
        }
        Update: {
          contrato_id?: string | null
          created_at?: string
          departamento?: string
          id?: string
          mensagem?: string
          sent_at?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      servicos: {
        Row: {
          descricao: string
          id: string
          nome: string
          status: string
          valor: number
          valor_hora: number
          valor_mensal: number
        }
        Insert: {
          descricao: string
          id?: string
          nome: string
          status: string
          valor: number
          valor_hora?: number
          valor_mensal?: number
        }
        Update: {
          descricao?: string
          id?: string
          nome?: string
          status?: string
          valor?: number
          valor_hora?: number
          valor_mensal?: number
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: number
          combustivel: string
          cor: string | null
          created_at: string
          data_aquisicao: string | null
          id: string
          marca: string
          modelo: string
          observacoes: string | null
          placa: string
          quilometragem: number | null
          status: string
          updated_at: string
          valor_aquisicao: number | null
        }
        Insert: {
          ano: number
          combustivel?: string
          cor?: string | null
          created_at?: string
          data_aquisicao?: string | null
          id?: string
          marca: string
          modelo: string
          observacoes?: string | null
          placa: string
          quilometragem?: number | null
          status?: string
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Update: {
          ano?: number
          combustivel?: string
          cor?: string | null
          created_at?: string
          data_aquisicao?: string | null
          id?: string
          marca?: string
          modelo?: string
          observacoes?: string | null
          placa?: string
          quilometragem?: number | null
          status?: string
          updated_at?: string
          valor_aquisicao?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
