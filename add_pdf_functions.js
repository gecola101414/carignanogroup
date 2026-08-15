import fs from 'fs';
let content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

const newFunctions = `
  const handleExportWeeklyPDF = async () => {
    const element = document.getElementById("weekly-schedule-table");
    if (!element) return;
    showToast("Generazione PDF in corso...");
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(\`Turni_Settimanali_\${todayStr}.pdf\`);
      showToast("PDF esportato con successo!");
    } catch (err) {
      console.error(err);
      showToast("Errore durante l'esportazione del PDF.");
    }
  };

  const handleExportMonthlyPDF = async () => {
    const element = document.getElementById("monthly-schedule-table");
    if (!element) return;
    showToast("Generazione PDF in corso...");
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(\`Riepilogo_Mensile_\${currentMonth}_\${currentYear}.pdf\`);
      showToast("PDF esportato con successo!");
    } catch (err) {
      console.error(err);
      showToast("Errore durante l'esportazione del PDF.");
    }
  };

  const handlePrintPDF = () => {`;

content = content.replace('  const handlePrintPDF = () => {', newFunctions);
fs.writeFileSync('src/components/StaffShiftsView.tsx', content);
console.log("Added PDF functions");
