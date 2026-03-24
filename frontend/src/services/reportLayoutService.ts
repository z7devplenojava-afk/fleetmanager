import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportOptions {
    title: string;
    filename: string;
    company?: any; // Define proper type if available, using any for flexibility as per usage
}

class ReportLayoutService {

    /**
     * Generates a "Premium" PDF by capturing the HTML element.
     * It handles layout, potentially custom headers if not already in the element, and downloading.
     */
    async generatePremiumPDF(element: HTMLElement, options: ReportOptions): Promise<void> {
        try {
            // Apply some print styles to the element before capturing if needed
            // For now, we assume the element is already styled for print/capture

            const canvas = await html2canvas(element, {
                scale: 2, // Improve quality
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // First page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            // Subsequent pages
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            // Maybe add footer or header here if not in the HTML?
            // The usage suggests options.company might be used for header, 
            // but if the element already contains the full report view (which usually includes header in the modal),
            // matching standard behavior might just be capturing the view.
            // If the user asked for "Dynamic PDF Report Headers" in the past, maybe the element logic handles it, 
            // OR this service should prepend a header.
            // Given I see "printElement" being fetched from ID 'frota-multa-printable', 
            // it likely contains the rendered modal content.
            // I'll stick to faithful capture for now to resolve the build error.

            pdf.save(options.filename);

        } catch (error) {
            console.error('Error generating Premium PDF:', error);
            throw new Error('Failed to generate PDF');
        }
    }
}

export const reportLayoutService = new ReportLayoutService();
