import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Schedule } from './scheduleService';

interface ExportEscalasOptions {
  escalas: Schedule[];
  driverFilter?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
  companyName?: string;
}

export class EscalaPdfGeneratorService {
  /**
   * Formata data no formato DD/MM/AAAA
   */
  private static formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const clean = dateStr.substring(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  /**
   * Retorna texto amigável do turno
   */
  private static getShiftLabel(shift?: string): string {
    switch (shift) {
      case 'DAY':
        return 'Diurno';
      case 'NIGHT':
        return 'Noturno';
      case 'MIXED':
        return 'Misto';
      default:
        return shift || '-';
    }
  }

  /**
   * Retorna texto amigável do status
   */
  private static getStatusLabel(status?: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'CONFIRMED':
        return 'Confirmada';
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'COMPLETED':
        return 'Concluída';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status || '-';
    }
  }

  /**
   * Gera o PDF completo das escalas agrupadas por motorista
   */
  public static async exportEscalasToPDF(options: ExportEscalasOptions): Promise<void> {
    const {
      escalas,
      driverFilter,
      driverId,
      startDate,
      endDate,
      companyName = 'Viação São Silvestre LTDA / FluxBus'
    } = options;

    if (!escalas || escalas.length === 0) {
      throw new Error('Nenhuma escala disponível para gerar o relatório PDF.');
    }

    // Filtrar se um motorista específico foi solicitado
    let targetEscalas = escalas;
    if (driverId) {
      targetEscalas = escalas.filter(
        (e) => (e.employeeId && e.employeeId === driverId) || (e.employee?.id && e.employee.id === driverId)
      );
    } else if (driverFilter && driverFilter.trim()) {
      const q = driverFilter.toLowerCase().trim();
      targetEscalas = escalas.filter((e) =>
        (e.employee?.name || '').toLowerCase().includes(q)
      );
    }

    if (targetEscalas.length === 0) {
      throw new Error('Nenhuma escala encontrada para os critérios selecionados.');
    }

    // Agrupar escalas por motorista
    const groupedByDriver = new Map<string, { driverName: string; position: string; items: Schedule[] }>();

    for (const escala of targetEscalas) {
      const driverName = (escala.employee?.name || 'Motorista Não Identificado').trim();
      const driverKey = escala.employeeId || escala.employee?.id || driverName;
      const position = escala.employee?.position || 'Motorista / Operador';

      if (!groupedByDriver.has(driverKey)) {
        groupedByDriver.set(driverKey, {
          driverName,
          position,
          items: []
        });
      }

      groupedByDriver.get(driverKey)!.items.push(escala);
    }

    // Ordenar escalas de cada motorista cronologicamente
    groupedByDriver.forEach((group) => {
      group.items.sort((a, b) => {
        const dateA = a.scheduleDate || '';
        const dateB = b.scheduleDate || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
    });

    // Ordenar lista de motoristas por nome
    const sortedGroups = Array.from(groupedByDriver.values()).sort((a, b) =>
      a.driverName.localeCompare(b.driverName)
    );

    // Inicializar documento jsPDF em orientação paisagem (A4)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const isSingleDriver = sortedGroups.length === 1;
    const nowStr = new Date().toLocaleString('pt-BR');

    // Cabeçalho da Empresa
    const renderHeader = () => {
      // Barra superior estilizada
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 24, 'F');

      // Linha de detalhe amarela
      doc.setFillColor(234, 179, 8); // yellow-500
      doc.rect(0, 24, pageWidth, 1.5, 'F');

      // Título e identificação
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(companyName.toUpperCase(), margin, 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225); // slate-300
      const subTitle = isSingleDriver
        ? `FICHA INDIVIDUAL DE ESCALAS • ${sortedGroups[0].driverName.toUpperCase()}`
        : 'CONTROLE E PLANEJAMENTO OPERACIONAL DE ESCALAS DE MOTORISTAS';
      doc.text(subTitle, margin, 17);

      // Metadados à direita
      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text(`Emissão: ${nowStr}`, pageWidth - margin, 10, { align: 'right' });

      let periodText = 'Período: Todas as escalas cadastradas';
      if (startDate && endDate) {
        periodText = `Período: ${EscalaPdfGeneratorService.formatDate(startDate)} até ${EscalaPdfGeneratorService.formatDate(endDate)}`;
      } else if (startDate) {
        periodText = `A partir de: ${EscalaPdfGeneratorService.formatDate(startDate)}`;
      } else if (endDate) {
        periodText = `Até: ${EscalaPdfGeneratorService.formatDate(endDate)}`;
      }
      doc.text(periodText, pageWidth - margin, 16, { align: 'right' });
    };

    renderHeader();

    let currentY = 32;

    // Resumo de Métricas no topo
    const totalEscalasCount = targetEscalas.length;
    const totalDriversCount = sortedGroups.length;
    const concluidasCount = targetEscalas.filter((e) => e.status === 'COMPLETED').length;
    const emAndamentoCount = targetEscalas.filter((e) => e.status === 'IN_PROGRESS').length;
    const pendentesCount = targetEscalas.filter((e) => e.status === 'PENDING' || e.status === 'CONFIRMED').length;

    // Card de métricas rápidas
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const colW = (pageWidth - margin * 2) / 5;
    doc.text(`Motoristas: ${totalDriversCount}`, margin + 5, currentY + 9);
    doc.text(`Total de Escalas: ${totalEscalasCount}`, margin + colW + 5, currentY + 9);
    doc.text(`Concluídas: ${concluidasCount}`, margin + colW * 2 + 5, currentY + 9);
    doc.text(`Em Andamento: ${emAndamentoCount}`, margin + colW * 3 + 5, currentY + 9);
    doc.text(`Pendentes/Confirmadas: ${pendentesCount}`, margin + colW * 4 + 5, currentY + 9);

    currentY += 19;

    // Iterar por cada grupo de motorista
    for (let i = 0; i < sortedGroups.length; i++) {
      const group = sortedGroups[i];

      // Verificar espaço antes do bloco do motorista (se precisar de nova página)
      if (currentY > pageHeight - 40) {
        doc.addPage();
        renderHeader();
        currentY = 32;
      }

      // Faixa destacada com o nome do motorista e contagem de escalas
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 9, 1.5, 1.5, 'FD');

      doc.setFillColor(220, 38, 38); // red-600 indicator
      doc.circle(margin + 4, currentY + 4.5, 1.8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Motorista: ${group.driverName}`, margin + 8, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Cargo: ${group.position}  |  ${group.items.length} escala(s) atribuída(s)`,
        margin + 90,
        currentY + 6
      );

      currentY += 11;

      // Montar linhas da tabela para esse motorista
      const tableRows = group.items.map((escala) => {
        const dataStr = EscalaPdfGeneratorService.formatDate(escala.scheduleDate);
        const horarioStr = `${escala.startTime || '--:--'} às ${escala.endTime || '--:--'}\n(${EscalaPdfGeneratorService.getShiftLabel(escala.shift)})`;

        // Veículo
        const placa = escala.vehicle?.plate || escala.vehiclePlate || 'Sem Placa';
        const modelo = escala.vehicle?.model || escala.vehicleModel || '';
        const veiculoStr = modelo ? `${placa}\n${modelo}` : placa;

        // Rota / Linha
        const rotaStr =
          escala.routeCode ||
          escala.route?.name ||
          escala.travelTrip?.name ||
          'Rota não vinculada';

        // Cliente / Posto
        const cliente =
          escala.clientName ||
          escala.workPost?.client?.name ||
          escala.location?.name ||
          '-';
        const posto = escala.workPost?.name ? `\nPosto: ${escala.workPost.name}` : '';
        const clientePostoStr = `${cliente}${posto}`;

        // Ponto Eletrônico
        let pontoStr = 'Não registrado';
        if (escala.pointRegisteredAt) {
          try {
            const d = new Date(escala.pointRegisteredAt);
            pontoStr = `Reg: ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
          } catch {
            pontoStr = 'Registrado';
          }
        }
        if (escala.pointStatus === 'PENDING_TRAFFIC_APPROVAL') {
          pontoStr += '\n(Aguard. Tráfego)';
        }

        // KM
        let kmStr = '-';
        if (escala.initialKm != null && escala.finalKm != null) {
          const diff = escala.finalKm - escala.initialKm;
          kmStr = `Ini: ${escala.initialKm}\nFim: ${escala.finalKm}\n(Tot: ${diff} km)`;
        } else if (escala.initialKm != null) {
          kmStr = `Ini: ${escala.initialKm}\nFim: em curso`;
        }

        // Status
        const statusStr = EscalaPdfGeneratorService.getStatusLabel(escala.status);

        return [
          dataStr,
          horarioStr,
          veiculoStr,
          rotaStr,
          clientePostoStr,
          pontoStr,
          kmStr,
          statusStr
        ];
      });

      // Renderizar tabela do motorista com autotable
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [
          [
            'Data',
            'Horário / Turno',
            'Veículo',
            'Rota / Trajeto',
            'Cliente / Posto',
            'Ponto Eletrônico',
            'KM (Ini / Fim)',
            'Status'
          ]
        ],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59], // slate-800
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
          valign: 'middle'
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85],
          valign: 'top',
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Data
          1: { cellWidth: 28 }, // Horário
          2: { cellWidth: 35 }, // Veículo
          3: { cellWidth: 50 }, // Rota
          4: { cellWidth: 54 }, // Cliente / Posto
          5: { cellWidth: 30 }, // Ponto
          6: { cellWidth: 28 }, // KM
          7: { cellWidth: 24, halign: 'center' } // Status
        },
        didDrawPage: () => {
          // Mantém cabeçalho consistente se a tabela quebrar página
        }
      });

      // Atualizar currentY para o próximo motorista
      // @ts-ignore
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY + 30;
      currentY = finalY + 8;
    }

    // Rodapé de todas as páginas (numeração e assinatura)
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400

      // Linha delimitadora de rodapé
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.text(
        'FluxBus • Sistema Integrado de Gestão de Frotas & Tráfego Operacional',
        margin,
        pageHeight - 6
      );
      doc.text(
        `Página ${p} de ${totalPages}`,
        pageWidth - margin,
        pageHeight - 6,
        { align: 'right' }
      );
    }

    // Nome do arquivo de download
    const cleanDateStr = new Date().toISOString().split('T')[0];
    let filename = `relatorio-escalas-${cleanDateStr}.pdf`;
    if (isSingleDriver) {
      const driverSlug = sortedGroups[0].driverName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      filename = `escala-${driverSlug}-${cleanDateStr}.pdf`;
    }

    doc.save(filename);
  }
}

