import { useStore } from '../store';
import { calculateDemand, calculateAcometida, calculateRegulation } from '../lib/calculations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export function ReportePDF() {
  const state = useStore();
  const resDemand = calculateDemand(state);
  const resAcometida = calculateAcometida(state, resDemand);
  const resReg = calculateRegulation(state, resAcometida.iPhase, state.selectedAWG);

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Portada
    doc.setFontSize(22);
    doc.setTextColor(33, 53, 71);
    doc.text("Memoria de Cálculo Eléctrico", 14, 30);
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text("Norma NTC 2050 y RETIE", 14, 40);
    
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 55);
    doc.text(`Voltaje del Sistema: ${state.voltage}V`, 14, 62);
    doc.text(`Área de la vivienda: ${state.area} m²`, 14, 69);
    
    // 1. Cargas
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("1. Cálculo de Cargas", 14, 90);
    
    autoTable(doc, {
      startY: 95,
      head: [['Descripción', 'Carga (VA)']],
      body: [
        ['Alumbrado General (ATUG)', resDemand.atug],
        ['Pequeños Artefactos', resDemand.pa],
        ['Lavado y Planchado', resDemand.lp],
        ['Aires Acondicionados', resDemand.acLoad],
        ['Cargas Especiales', `${resDemand.specialLoad} VA`],
        ['Carga Demandada Total', `${resDemand.demandTotal.toFixed(2)} VA`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // 2. Demanda
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(16);
    doc.text("2. Aplicación Factor de Demanda", 14, finalY1);
    
    autoTable(doc, {
      startY: finalY1 + 5,
      head: [['Subtotal 1 (Con FD)', 'Subtotal 2 (AA y CE)', 'Carga Demandada Total']],
      body: [
        [`${resDemand.demandSubtotal1.toFixed(1)} VA`, `${resDemand.subtotal2.toFixed(1)} VA`, `${resDemand.demandTotal.toFixed(1)} VA`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // 3. Acometida
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(16);
    doc.text("3. Alimentador Principal y Neutro", 14, finalY2);
    
    autoTable(doc, {
      startY: finalY2 + 5,
      head: [['Parámetro', 'Valor', 'Validación']],
      body: [
        ['Corriente de Fase (IF)', `${resAcometida.iPhase.toFixed(2)} A`, '-'],
        ['Conductor de Fase', `${resAcometida.selectedAwg.awg} AWG`, resAcometida.status],
        ['Ampacidad Corregida', `${resAcometida.correctedAmpacity.toFixed(2)} A`, `(Temp: ${state.temperature}°C)`],
        ['Corriente Neutro (IN)', `${resAcometida.iNeutro.toFixed(2)} A`, '-'],
        ['Conductor Neutro', `${resAcometida.selectedNeutroAwg.awg} AWG`, 'OK'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // 4. Regulación
    doc.addPage();
    doc.setFontSize(16);
    doc.text("4. Regulación de Voltaje", 14, 20);
    
    autoTable(doc, {
      startY: 25,
      head: [['Parámetro', 'Valor']],
      body: [
        ['Longitud', `${state.feederLength} m`],
        ['Material / Tubería', `${state.feederMaterial.toUpperCase()} / ${state.feederConduit.toUpperCase()}`],
        ['Impedancia Eficaz (Zef)', `${resReg.zef.toFixed(4)} ohm/km`],
        ['Caída de Tensión (dV)', `${resReg.deltaV.toFixed(2)} V`],
        ['Porcentaje de Regulación', `${resReg.regulationPercent.toFixed(2)} %`],
        ['Cumplimiento Ramal (<3%)', resReg.statusRamal],
        ['Cumplimiento Total (<5%)', resReg.statusTotal],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Save or Share
    if (Capacitor.isNativePlatform()) {
      try {
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        const fileName = `Memoria_Calculo_${new Date().getTime()}.pdf`;
        
        const result = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache
        });
        
        await Share.share({
          title: 'Memoria de Cálculo Eléctrico',
          text: 'Aquí está el reporte técnico del cálculo eléctrico.',
          url: result.uri,
          dialogTitle: 'Compartir o Guardar Reporte PDF'
        });
      } catch (e) {
        console.error("Error guardando el PDF nativo:", e);
        alert("Ocurrió un error al intentar compartir el documento.");
      }
    } else {
      doc.save("Memoria_Calculo_NTC2050.pdf");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Generación de Reportes</h2>
        <p className="text-muted-foreground mt-2">
          Exporte toda la memoria de cálculo en un documento PDF estructurado.
        </p>
      </div>

      <div className="bg-card border rounded-lg p-10 flex flex-col items-center justify-center text-center shadow-sm max-w-2xl mx-auto mt-10">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <Download className="w-16 h-16 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Memoria Lista</h3>
        <p className="text-muted-foreground mb-8">
          El reporte incluirá todos los cálculos normativos, tablas de cargas, selección de conductores, 
          correcciones por temperatura y caída de tensión.
        </p>
        
        <button 
          onClick={generatePDF}
          className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <Download className="w-5 h-5" />
          Descargar Memoria PDF
        </button>
      </div>
    </div>
  );
}
