package com.z7design.fleet_manager.fiscal;

import java.math.BigDecimal;

/**
 * Dados declarados pelo emitente referentes ao IBS e à CBS.
 *
 * <p>Os campos {@code finNFSe}, {@code indFinal}, {@code cIndOp}, {@code indDest},
 * {@code cst} e {@code cClassTrib} alimentam o grupo {@code infDPS/IBSCBS}
 * (tipo XSD {@code TCRTCInfoIBSCBS}). Os demais campos representam os valores,
 * alíquotas e totalizadores publicados na NFS-e autorizada (tipo XSD
 * {@code TCRTCIBSCBS} / {@code TCRTCTotalCIBS}) e são preenchidos pelo
 * {@link NfseResponseParser#parseIbscbs(String)}.</p>
 *
 * <p><strong>Importante:</strong> o leiaute oficial da DPS v1.01 NÃO admite
 * {@code vBC}, alíquotas ou totalizadores dentro de {@code infDPS/IBSCBS};
 * esse grupo contém apenas a classificação tributária. Por isso o
 * {@link NfseXmlBuilder#build(com.z7design.fleet_manager.model.ServiceInvoice,
 * com.z7design.fleet_manager.model.Company, NfseIbscbsData)} emite somente os
 * campos aceitos pelo XSD da DPS.</p>
 *
 * @param finNFSe       finalidade da emissão ("0" = NFS-e regular)
 * @param indFinal      uso/consumo pessoal: "0" não, "1" sim (opcional)
 * @param cIndOp        código indicador da operação (6 dígitos)
 * @param tpOper        tipo de operação com entes governamentais/bens imóveis "1".."5" (opcional)
 * @param tpEnteGov     tipo de ente governamental "1".."4" (opcional)
 * @param indDest       destinatário: "0" = é o próprio tomador, "1" = outro
 * @param cst           código de situação tributária IBS/CBS (3 dígitos)
 * @param cClassTrib    código de classificação tributária IBS/CBS (6 dígitos)
 * @param cCredPres     código do crédito presumido (2 dígitos, opcional)
 * @param vBC           base de cálculo do IBS/CBS
 * @param vCalcReeRepRes valor de reembolso/repassa/ressarcimento (opcional)
 * @param pRedutor      percentual de redução de alíquota em compra governamental (opcional)
 * @param pIBSUF        alíquota do IBS estadual
 * @param pRedAliqUF    redução de alíquota estadual (opcional)
 * @param pAliqEfetUF   alíquota efetiva do IBS estadual
 * @param pIBSMun       alíquota do IBS municipal
 * @param pRedAliqMun   redução de alíquota municipal (opcional)
 * @param pAliqEfetMun  alíquota efetiva do IBS municipal
 * @param pCBS          alíquota da CBS
 * @param pRedAliqCBS   redução de alíquota da CBS (opcional)
 * @param pAliqEfetCBS  alíquota efetiva da CBS
 * @param vTotNF        valor total da NF com IBS/CBS por fora
 * @param vIBSTot       total do IBS (gIBS/vIBSTot)
 * @param vIBSUF        total do IBS estadual (gIBS/gIBSUFTot/vIBSUF)
 * @param vIBSMun       total do IBS municipal (gIBS/gIBSMunTot/vIBSMun)
 * @param vCBS          total da CBS (gCBS/vCBS)
 */
public record NfseIbscbsData(
        String finNFSe,
        String indFinal,
        String cIndOp,
        String tpOper,
        String tpEnteGov,
        String indDest,
        String cst,
        String cClassTrib,
        String cCredPres,
        BigDecimal vBC,
        BigDecimal vCalcReeRepRes,
        BigDecimal pRedutor,
        BigDecimal pIBSUF,
        BigDecimal pRedAliqUF,
        BigDecimal pAliqEfetUF,
        BigDecimal pIBSMun,
        BigDecimal pRedAliqMun,
        BigDecimal pAliqEfetMun,
        BigDecimal pCBS,
        BigDecimal pRedAliqCBS,
        BigDecimal pAliqEfetCBS,
        BigDecimal vTotNF,
        BigDecimal vIBSTot,
        BigDecimal vIBSUF,
        BigDecimal vIBSMun,
        BigDecimal vCBS
) {

    /** Fábrica enxuta com os campos obrigatórios do grupo infDPS/IBSCBS. */
    public static NfseIbscbsData of(String finNFSe, String indFinal, String cIndOp,
                                    String indDest, String cst, String cClassTrib) {
        return new NfseIbscbsData(
                finNFSe, indFinal, cIndOp, null, null, indDest, cst, cClassTrib, null,
                null, null, null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null);
    }
}
