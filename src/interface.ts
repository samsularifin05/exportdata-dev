import jsPDF from "jspdf";
import ExcelJS from "exceljs";

type FormatType = "RP" | "GR" | "DATETIME" | "NUMBER" | "IMAGE" | "";
type HalignType = "center" | "right" | "left" | "";
type ValignType = "top" | "middle" | "bottom" | undefined;

export interface ColumnGenarator<T> {
  key: keyof T;
  label?: string;
  options?: {
    format?: FormatType;
    halign?: HalignType;
    valign?: ValignType;
    disabledColumn?: boolean;
    disabledFooter?: boolean;
  };
  child?: ColumnGenarator<T>[];
}

export interface DataItemGenerator {
  [key: string]: any;
}

export type FileType = "EXCEL" | "PDF" | "TXT" | "ALL";

export const validFileTypes: FileType[] = ["EXCEL", "PDF", "TXT", "ALL"];
type CustomizePdfFunction = (
  doc: jsPDF,
  finalY: number,
  autoTable?: any
) => void;
type addRowPdfPdfFunction = (tableRows?: any) => void;
type CustomizeFunctionExcel = (worksheet: ExcelJS.Worksheet) => void;

export interface GenaratorExport<T> {
  columns: ColumnGenarator<T>[];
  data: DataItemGenerator[];
  type: ("EXCEL" | "PDF" | "TXT" | "ALL")[];
  title?: string;

  pdfSetting?: {
    orientation?: "p" | "portrait" | "l" | "landscape";
    unit?: "pt" | "px" | "in" | "mm" | "cm" | "ex" | "em" | "pc";
    width?: number;
    height?: number;
    fontSIze?: number;
    bgColor?: string;
    titlePdf?: string;
    txtColor?: string;
    finalY?: number;
    textHeaderRight?: string;
    textHeaderLeft?: string;
    theme?: "grid" | "striped" | "plain";
    grandTotalSetting?: {
      disableGrandTotal?: boolean;
      colSpan?: number;
    };
    openNewTab?: boolean;
    addRow?: addRowPdfPdfFunction;
    customize?: CustomizePdfFunction;
    disablePrintDate?: boolean;
  };
  date?: {
    start_date?: string;
    end_date?: string;
    caption?: string;
  };
  txtSetting?: {
    dataTxt?: DataItemGenerator[] | DataItemGenerator;
    titleTxt: string;
    templateTxt?: string;
    copy?: boolean;
  };
  excelSetting?: {
    titleExcel?: string;
    bgColor?: string;
    txtColor?: string;
    additionalTextHeader?: string;
    grandTotalSetting?: {
      disableGrandTotal?: boolean;
      colSpan?: number;
    };
    customize?: CustomizeFunctionExcel;
  };
  grouping: string[];
  footerSetting?: {
    subTotal?: {
      caption?: string;
      enableCount?: boolean;
      captionItem?: string;
    };
    grandTotal?: {
      caption?: string;
      captionItem?: string;
      enableCount?: boolean;
    };
  };
}
