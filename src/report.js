/**
 * PDF-rapport generering
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Genererer og laster ned PDF-rapport
 */
export async function generatePDFReport(reportData, renderer, stats) {
  try {
    console.log('Starter PDF-generering...');
    
    // Opprett PDF (A4 format)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;
    
    // === HEADER ===
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text(reportData.projectName || 'Punktsky Rapport', margin, 20);
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    const date = new Date().toLocaleDateString('no-NO', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    pdf.text(`Generert: ${date}`, margin, 32);
    
    yPos = 50;
    pdf.setTextColor(0, 0, 0);
    
    // === METADATA SEKSJON ===
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Metadata og Georeferering', margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    
    // Tabell for metadata
    const metadataData = [
      ['Koordinatsystem (Datum):', reportData.datum || 'WGS84'],
      ['Projeksjon:', reportData.projection || 'UTM 32N'],
      ['Beskrivelse:', reportData.description || 'Ingen beskrivelse']
    ];
    
    drawTable(pdf, metadataData, margin, yPos, pageWidth - 2 * margin);
    yPos += metadataData.length * 10 + 15;
    
    // === STATISTIKK SEKSJON ===
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Statistikk', margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    
    const statsData = [
      ['Totalt antall punkter:', reportData.pointCount.toLocaleString('nb-NO')],
      ['Høydeområde (Z):', `${reportData.minZ.toFixed(2)} til ${reportData.maxZ.toFixed(2)} m`],
      ['Høydespenn:', `${(reportData.maxZ - reportData.minZ).toFixed(2)} m`],
      ['Areal (XY):', `${reportData.areaX.toFixed(2)} x ${reportData.areaY.toFixed(2)} m`]
    ];
    
    drawTable(pdf, statsData, margin, yPos, pageWidth - 2 * margin);
    yPos += statsData.length * 10 + 15;
    
    // === 3D VISUALISERING ===
    if (yPos > pageHeight - 100) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('3D Visualisering', margin, yPos);
    yPos += 10;
    
    // Ta screenshot av 3D-view
    console.log('Tar screenshot av 3D-view...');
    const canvas = renderer.domElement;
    const imgData = canvas.toDataURL('image/png');
    
    // Legg til bilde (skalert til å passe siden)
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;
    
    if (yPos + imgHeight > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 15;
    
    // === HISTOGRAM ===
    if (yPos > pageHeight - 80) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text('Z-Høyde Histogram', margin, yPos);
    yPos += 10;
    
    // Ta screenshot av dashboard (inkluderer histogram)
    console.log('Tar screenshot av histogram...');
    const dashboardElement = document.getElementById('dashboard');
    if (dashboardElement) {
      const dashCanvas = await html2canvas(dashboardElement, {
        backgroundColor: '#14141e',
        scale: 2
      });
      const dashImgData = dashCanvas.toDataURL('image/png');
      
      const dashWidth = pageWidth - 2 * margin;
      const dashHeight = (dashCanvas.height / dashCanvas.width) * dashWidth;
      
      if (yPos + dashHeight > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }
      
      pdf.addImage(dashImgData, 'PNG', margin, yPos, dashWidth, dashHeight);
    }
    
    // === FOOTER ===
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Generert med 3D Punktsky Visualisering', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Lagre PDF
    const filename = `Rapport_${reportData.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    console.log('PDF generert og lastet ned:', filename);
    return true;
    
  } catch (error) {
    console.error('Feil ved PDF-generering:', error);
    throw error;
  }
}

/**
 * Hjelpefunksjon for å tegne en enkel tabell
 */
function drawTable(pdf, data, x, y, width) {
  const rowHeight = 10;
  const col1Width = width * 0.5;
  const col2Width = width * 0.5;
  
  data.forEach((row, index) => {
    const currentY = y + index * rowHeight;
    
    // Alternerende rad-farger (lys grå)
    if (index % 2 === 0) {
      pdf.setFillColor(248, 248, 248);
      pdf.rect(x, currentY - 7, width, rowHeight, 'F');
    }
    
    // Tekst (svart)
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text(row[0], x + 2, currentY);
    
    pdf.setFont(undefined, 'normal');
    pdf.text(row[1], x + col1Width + 2, currentY);
    
    // Tynn linje under rad (lys grå)
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.1);
    pdf.line(x, currentY + 2, x + width, currentY + 2);
  });
}
