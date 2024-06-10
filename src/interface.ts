type FormatType = "RP" | "GR" | "DATETIME" | "";
type HalignType = "center" | "right" | "left" | "";
export interface ColumnGenarator<T> {
  key: keyof T;
  label?: string;
  options?: {
    format?: FormatType;
    barcodeOption?: {
      showText: boolean;
      format: "qrcode" | "code128";
      widthBarcode?: number;
      heightBarcode?: number;
      widthColumn?: number;
      heightColumn?: number;
    };
    halign?: HalignType;
    disabledColumn?: boolean;
    disabledFooter?: boolean;
  };
}
export interface DataItemGenerator {
  [key: string]: any;
}

export interface GenaratorExport<T> {
  grouping: string[];
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
    textHeaderRight?: string;
    textHeaderLeft?: string;
    theme?: "grid" | "striped" | "plain";
    grandTotalSetting?: {
      disableGrandTotal?: boolean;
      colSpan?: number;
    };
    openNewTab?: boolean;
  };
  date?: {
    start_date?: string;
    end_date?: string;
  };
  txtSetting?: {
    dataTxt?: DataItemGenerator[] | DataItemGenerator;
    titleTxt: string;
    templateTxt?: string;
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
  };
}
