-- =====================================================================
-- NFS-e Nacional: IBS/CBS e registro de eventos (cancelamento)
-- =====================================================================

-- Dados declarados do IBS/CBS na DPS e totais devolvidos pela SEFIN
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_fin_nfse VARCHAR(2);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_ind_final VARCHAR(1);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_c_ind_op VARCHAR(6);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_tp_oper VARCHAR(1);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_tp_ente_gov VARCHAR(1);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_ind_dest VARCHAR(2);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_cst VARCHAR(3);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_c_class_trib VARCHAR(6);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_c_cred_pres VARCHAR(2);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_v_bc NUMERIC(15, 2);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_p_ibs_uf NUMERIC(7, 4);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_p_ibs_mun NUMERIC(7, 4);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_p_cbs NUMERIC(7, 4);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_v_ibs NUMERIC(15, 2);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_v_cbs NUMERIC(15, 2);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS ibscbs_v_tot_nf NUMERIC(15, 2);

-- Eventos vinculados à NFS-e
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS event_xml TEXT;
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS event_response_xml TEXT;
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS event_id VARCHAR(60);
ALTER TABLE service_invoices ADD COLUMN IF NOT EXISTS event_protocol VARCHAR(60);
