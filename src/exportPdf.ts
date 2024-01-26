import { DataItemGenerator, GenaratorExport } from "./interface";
import { convertDateTime } from "./helpers";
import jsPDF from "jspdf";
import "jspdf-autotable";
const ExportPDF = <T>({
  columns,
  data,
  grouping,
  pdfSetting,
  date
}: GenaratorExport<T>): void => {
  const doc: any = new jsPDF(pdfSetting?.orientation, pdfSetting?.unit, [
    pdfSetting?.width || 297,
    pdfSetting?.height || 210
  ]);
  const tableRows: any[] = [];
  let finalY = date ? 30 : 20;
  columns = columns.filter((item) => !item.options?.disabledColumn);

  doc.setFontSize(15);
  doc.text(pdfSetting?.titlePdf, 15, 18);
  doc.setFontSize(10);
  if (date) {
    doc.text(
      `Tanggal : ${date?.start_date} ${
        date?.end_date ? `s/d ${date?.end_date}` : ""
      }`,
      15,
      25
    );
  }
  doc.setProperties({
    title: pdfSetting?.titlePdf
  });

  // Header Tabel
  const tableHeader = columns.map((column) => ({
    content: column.label,
    styles: {
      textColor: `#${pdfSetting?.txtColor || "000"}`,
      fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
      fontStyle: "bold",
      halign: column?.options?.halign
        ? column?.options?.halign
        : column?.options?.format === "RP" || column?.options?.format === "GR"
        ? "right"
        : "left"
    }
  }));

  tableRows.push(tableHeader);

  // Body Tabel
  const totals: { [key: string]: number } = {};

  data.forEach((item) => {
    if (grouping.length > 0) {
      const group = grouping.map((column) => ({
        content:
          item[column] !== undefined
            ? `${formatingTitle(column)} : ` + item[column]
            : ""
      }));
      tableRows.push(group);
      const subtotal: { [key: string]: number } = {};

      item.detail.forEach((list2: any) => {
        const rowData = columns.map((column) => {
          const value = list2[column.key as keyof DataItemGenerator];
          const columnKey = column.key as keyof DataItemGenerator;
          totals[columnKey] = (totals[columnKey] || 0) + Number(value);
          subtotal[columnKey] = (subtotal[columnKey] || 0) + Number(value);
          return {
            content: (() => {
              switch (column?.options?.format) {
                case "RP":
                  return list2[column.key] !== undefined
                    ? Number(list2[column.key] || 0).toLocaleString("kr-ko")
                    : "";
                case "GR":
                  return list2[column.key] !== undefined
                    ? Number(list2[column.key] || 0).toFixed(3)
                    : "";
                case "DATETIME":
                  return list2[column.key] !== undefined
                    ? convertDateTime(list2[column.key] || new Date())
                    : "";
                default:
                  return list2[column.key] !== undefined
                    ? list2[column.key].toString()
                    : "";
              }
            })(),
            styles: {
              halign: column?.options?.halign
                ? column?.options?.halign
                : column?.options?.format === "RP" ||
                  column?.options?.format === "GR"
                ? "right"
                : typeof list2[column.key] === "number"
                ? "right"
                : "left"
            }
          };
        });

        tableRows.push(rowData);
      });

      const footersubtotal: any = [];
      columns.forEach((column) => {
        const total = subtotal[column.key as keyof DataItemGenerator];
        if (
          column?.options?.format === "RP" ||
          column?.options?.format === "GR"
        ) {
          const row = {
            content: column?.options?.disabledFooter
              ? ""
              : (() => {
                  switch (column?.options?.format) {
                    case "RP":
                      return total.toLocaleString("kr-ko");
                    case "GR":
                      return total.toFixed(3);
                    default:
                      return total.toString();
                  }
                })(),
            styles: {
              halign: column?.options?.halign
                ? column?.options?.halign
                : column?.options?.format === "RP" ||
                  column?.options?.format === "GR"
                ? "right"
                : "left",
              textColor: `#${pdfSetting?.txtColor || "000"}`,
              fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
              fontStyle: "bold"
            }
          };

          footersubtotal.push(row);
        } else {
          footersubtotal.push({
            content: "",
            styles: {
              textColor: `#${pdfSetting?.txtColor || "000"}`,
              fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
              fontStyle: "bold"
            }
          });
        }
      });
      const colSpan = pdfSetting?.grandTotalSetting?.colSpan
        ? Number(pdfSetting?.grandTotalSetting?.colSpan || 0) + 1
        : 0;
      footersubtotal[0] = {
        content: "SUB TOTAL",
        colSpan: colSpan,
        styles: {
          textColor: `#${pdfSetting?.txtColor || "000"}`,
          fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
          fontStyle: "bold",
          halign: "center"
        }
      };
      if (pdfSetting?.grandTotalSetting?.colSpan) {
        footersubtotal.splice(1, pdfSetting?.grandTotalSetting?.colSpan);
      }
      tableRows.push(footersubtotal);
    } else {
      const rowData = columns.map((column) => {
        const value = item[column.key as keyof DataItemGenerator];
        const columnKey = column.key as keyof DataItemGenerator;
        totals[columnKey] = (totals[columnKey] || 0) + Number(value);
        return {
          content: (() => {
            switch (column?.options?.format) {
              case "RP":
                return item[column.key as keyof DataItemGenerator] !== undefined
                  ? Number(
                      item[column.key as keyof DataItemGenerator] || 0
                    ).toLocaleString("kr-ko")
                  : "";
              case "GR":
                return item[column.key as keyof DataItemGenerator] !== undefined
                  ? Number(
                      item[column.key as keyof DataItemGenerator] || 0
                    ).toFixed(3)
                  : "";
              case "DATETIME":
                return item[column.key as keyof DataItemGenerator] !== undefined
                  ? convertDateTime(
                      item[column.key as keyof DataItemGenerator] || new Date()
                    )
                  : "";
              default:
                return item[column.key as keyof DataItemGenerator] !== undefined
                  ? item[column.key as keyof DataItemGenerator].toString()
                  : "";
            }
          })(),
          styles: {
            halign: column?.options?.halign
              ? column?.options?.halign
              : column?.options?.format === "RP" ||
                column?.options?.format === "GR"
              ? "right"
              : typeof item[column.key as keyof DataItemGenerator] === "number"
              ? "right"
              : "left"
          }
        };
      });
      tableRows.push(rowData);
    }
  });

  const grandTotal: any = [];
  columns.forEach((column) => {
    const total = totals[column.key as keyof DataItemGenerator];
    if (column?.options?.format === "RP" || column?.options?.format === "GR") {
      const row = {
        content: column?.options?.disabledFooter
          ? ""
          : (() => {
              switch (column?.options?.format) {
                case "RP":
                  return total.toLocaleString("kr-ko");
                case "GR":
                  return total.toFixed(3);
                default:
                  return total.toString();
              }
            })(),
        styles: {
          halign: column?.options?.halign
            ? column?.options?.halign
            : column?.options?.format === "RP" ||
              column?.options?.format === "GR"
            ? "right"
            : "left",
          textColor: `#${pdfSetting?.txtColor || "000"}`,
          fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
          fontStyle: "bold"
        }
      };

      grandTotal.push(row);
    } else {
      grandTotal.push({
        content: "",
        styles: {
          textColor: `#${pdfSetting?.txtColor || "000"}`,
          fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
          fontStyle: "bold"
        }
      });
    }
  });

  const colSpan = pdfSetting?.grandTotalSetting?.colSpan
    ? Number(pdfSetting?.grandTotalSetting?.colSpan || 0) + 1
    : 0;

  if (!pdfSetting?.grandTotalSetting?.disableGrandTotal) {
    grandTotal[0] = {
      content: "GRAND TOTAL",
      colSpan: colSpan,
      styles: {
        textColor: `#${pdfSetting?.txtColor || "000"}`,
        fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
        fontStyle: "bold",
        halign: "center"
      }
    };
    if (pdfSetting?.grandTotalSetting?.colSpan) {
      grandTotal.splice(1, pdfSetting?.grandTotalSetting?.colSpan);
    }

    tableRows.push(grandTotal);
  }

  tableRows.push([
    {
      content: `Print Date : ${convertDateTime(`${new Date()}`)}`,
      colSpan: columns.length,
      styles: {
        textColor: `#${pdfSetting?.txtColor || "000"}`,
        fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
        fontStyle: "italic"
      }
    }
  ]);

  doc.autoTable({
    head: [],
    body: tableRows,
    startY: finalY,
    theme: pdfSetting?.theme || "plain",
    rowPageBreak: "avoid",
    margin: { top: 10 },
    bodyStyles: { fontSize: pdfSetting?.fontSIze || 8 },
    headStyles: {
      fontSize: pdfSetting?.fontSIze || 8,
      textColor: `#${pdfSetting?.txtColor || "000"}`,
      fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`
    }
  });

  finalY = doc.autoTableEndPosY() + 3;

  const pages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.setFontSize(10);

  for (let j = 1; j < pages + 1; j++) {
    const horizontalPos = pageWidth / 2;
    const verticalPos = pageHeight - 10;
    doc.setPage(j);
    doc.text(`${j} of ${pages}`, horizontalPos, verticalPos, {
      align: "center"
    });
  }

  if (pdfSetting?.openNewTab) {
    const blob = doc.output("bloburl");
    window.open(blob);
  } else {
    doc.save(`${pdfSetting?.titlePdf}.pdf`);
  }
};

const formatingTitle = (title: string): string => {
  // Pisahkan kata-kata menggunakan underscore sebagai pemisah
  const words = title.split("_");

  // Ubah setiap kata menjadi huruf kapital dan gabungkan kembali dengan spasi di antara mereka
  const formattedtitle = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return formattedtitle;
};
export default ExportPDF;
