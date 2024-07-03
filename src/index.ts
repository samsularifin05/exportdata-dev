import ExportExcel from "./exportExcel";
import ExportPDF from "./exportPdf";
import ExportToTxt from "./exportTextFile";
import { validateFileTypes } from "./helpers";
import { GenaratorExport, ColumnGenarator } from "./interface";

/**
 * Ekspor ke PDF atau Excel berdasarkan konfigurasi yang diberikan.
 *
 * @param title - Judul laporan.
 * @param columns - Konfigurasi kolom untuk laporan.
 * @param data - Data yang akan disertakan dalam laporan.
 * @param grouping - Gruping yang akan diterapkan dalam laporan ada head dan detail Example: ["no_faktur_hutang"].
 * @param pdfSetting - Opsi untuk config PDF.
 * @param excelSetting - Opsi untuk config Excel.
 * @param txtSetting - Opsi untuk config Txt file.
 * @param date - Rentang tanggal untuk laporan.
 * @param type - Jenis laporan yang akan diekspor ("PDF" "TXT" atau "EXCEL").
 * @param footerSetting - Setting Footer Subtotal atau GranTotal
 */
export const ExportData = <T>({
  columns,
  data,
  grouping,
  date,
  type,
  txtSetting,
  pdfSetting,
  excelSetting,
  title,
  footerSetting
}: GenaratorExport<T>): void => {
  const databaru = {
    data: [txtSetting?.dataTxt],
    template: txtSetting?.templateTxt,
    copy: txtSetting?.copy
  };

  if (data.length === 0) {
    throw new Error("Data is required");
  }
  if (type.length === 0) {
    throw new Error("Type is required");
  }

  if (!validateFileTypes(type)) {
    throw new Error(`Type Export must use ["EXCEL", "PDF", "TXT", "ALL"]`);
  }

  type.forEach((list) => {
    if (list === "PDF") {
      ExportPDF({
        pdfSetting,
        date,
        data,
        type,
        columns,
        grouping,
        title,
        footerSetting
      });
    } else if (list === "TXT") {
      ExportToTxt(databaru, txtSetting?.titleTxt || "");
    } else if (list === "EXCEL") {
      ExportExcel({
        date,
        data,
        type,
        columns,
        grouping,
        excelSetting,
        title,
        footerSetting
      });
    } else {
      ExportExcel({
        date,
        data,
        type,
        columns,
        grouping,
        excelSetting,
        title
      });

      ExportPDF({
        pdfSetting,
        date,
        data,
        type,
        columns,
        grouping,
        title
      });

      ExportToTxt(databaru, txtSetting?.titleTxt || "");
    }
  });
};

export type { ColumnGenarator };
