import ExportExcel from "./exportExcel";
import ExportPDF from "./exportPdf";
import ExportToTxt from "./exportTextFile";
import { GenaratorExport, ColumnGenarator } from "./interface";
/**
 * Ekspor ke PDF atau Excel berdasarkan konfigurasi yang diberikan.
 * @param title - Judul export data.
 * @param columns - Konfigurasi kolom untuk export data.
 * @param data - Data yang akan disertakan dalam export data.
 * @param grouping - Gruping yang akan diterapkan dalam export data ada head dan detail Example: ["no_faktur_hutang"].
 * @param pdfSetting - Opsi untuk config PDF.
 * @param excelSetting - Opsi untuk config Excel.
 * @param txtSetting - Opsi untuk config Txt file.
 * @param date - Rentang tanggal untuk export data.
 * @param type - Jenis export data yang akan diekspor ("PDF" "TXT" atau "EXCEL").
 */
export const ExportDataFile = <T>({
  columns,
  data,
  grouping,
  date,
  type,
  txtSetting,
  pdfSetting,
  excelSetting
}: GenaratorExport<T>): void => {
  const dataTxt = {
    data: txtSetting?.dataTxt?.length
      ? txtSetting?.dataTxt
      : [txtSetting?.dataTxt],
    template: txtSetting?.templateTxt
  };
  if (type === "PDF") {
    ExportPDF({
      pdfSetting,
      date,
      data,
      type,
      columns,
      grouping
    });
  } else if (type === "TXT") {
    ExportToTxt(dataTxt, txtSetting?.titleTxt || "");
  } else if (type === "EXCEL") {
    ExportExcel({
      date,
      data,
      type,
      columns,
      grouping,
      excelSetting
    });
  } else {
    ExportExcel({
      date,
      data,
      type,
      columns,
      grouping,
      excelSetting
    });

    ExportPDF({
      pdfSetting,
      date,
      data,
      type,
      columns,
      grouping
    });

    ExportToTxt(dataTxt, txtSetting?.titleTxt || "");
  }
};

export { type ColumnGenarator };
