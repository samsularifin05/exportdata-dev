import { DataItemGenerator, GenaratorExport } from "./interface";
import { convertDateTime } from "./helpers";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ExportPDF = <T>({
  columns,
  data,
  grouping,
  pdfSetting,
  date,
  title,
  footerSetting
}: GenaratorExport<T>): void => {
  const doc: jsPDF = new jsPDF(pdfSetting?.orientation, pdfSetting?.unit, [
    pdfSetting?.width || 297,
    pdfSetting?.height || 210
  ]);
  let tableRows: any[] = [];
  let finalY = date ? 30 : 20;
  columns = columns.filter((item) => !item.options?.disabledColumn);

  doc.setFontSize(10);
  const widthPortrait = doc.internal.pageSize.getWidth();

  const headerLeft = doc.splitTextToSize(pdfSetting?.textHeaderLeft || "", 110);
  doc.text(headerLeft, 15, 18);

  //Text Kanan
  doc.text(`${title || pdfSetting?.titlePdf}`, widthPortrait - 15, 18, {
    align: "right"
  });

  if (date) {
    doc.text(
      `${date.caption ? date.caption : "TANGGAL "} : ${date?.start_date} ${
        date?.end_date ? `s/d ${date?.end_date}` : ""
      }`,
      widthPortrait - 15,
      22,
      { align: "right" }
    );
  }
  doc.setProperties({
    title: title || pdfSetting?.titlePdf
  });

  if (pdfSetting?.finalY) {
    console.log(pdfSetting.finalY);
    finalY = pdfSetting.finalY;
  }

  // Header Tabel
  const tableHeader = columns.map((column) => {
    return {
      content: column.label,
      key: column.key,
      options: column?.options,
      styles: {
        textColor: `#${pdfSetting?.txtColor || "000"}`,
        fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
        fontStyle: "bold",
        halign: column?.options?.halign
          ? column?.options?.halign
          : column?.options?.format === "RP" ||
            column?.options?.format === "GR" ||
            column?.options?.format === "NUMBER"
          ? "right"
          : "left"
      }
    };
  });

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
                case "NUMBER":
                  return list2[column.key] !== undefined
                    ? Number(list2[column.key] || 0)
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
                  column?.options?.format === "GR" ||
                  column?.options?.format === "NUMBER"
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
          column?.options?.format === "GR" ||
          column?.options?.format === "NUMBER"
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
                    case "NUMBER":
                      return total;
                    default:
                      return total.toString();
                  }
                })(),
            styles: {
              halign: column?.options?.halign
                ? column?.options?.halign
                : column?.options?.format === "RP" ||
                  column?.options?.format === "GR" ||
                  column?.options?.format === "NUMBER"
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

      const subtotalCount = footerSetting?.subTotal?.enableCount
        ? grouping.length > 0
          ? " : " + item.detail.length
          : ""
        : "";

      const captionSub = footerSetting?.subTotal?.captionItem
        ? footerSetting?.subTotal?.captionItem
        : "";
      footersubtotal[0] = {
        content: `${
          footerSetting?.subTotal?.caption || "SUB TOTAL"
        } ${subtotalCount} ${captionSub}`,
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
          options: column?.options,
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
              case "NUMBER":
                return item[column.key as keyof DataItemGenerator] !== undefined
                  ? Number(item[column.key as keyof DataItemGenerator] || 0)
                  : "";
              case "DATETIME":
                return item[column.key as keyof DataItemGenerator] !== undefined
                  ? convertDateTime(
                      item[column.key as keyof DataItemGenerator] || new Date()
                    )
                  : "";
              default:
                return item[column.key as keyof DataItemGenerator] !== undefined
                  ? item[column.key as keyof DataItemGenerator]?.toString()
                  : "";
            }
          })(),
          styles: {
            halign: column?.options?.halign
              ? column?.options?.halign
              : column?.options?.format === "RP" ||
                column?.options?.format === "GR" ||
                column?.options?.format === "NUMBER"
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
    if (
      column?.options?.format === "RP" ||
      column?.options?.format === "GR" ||
      column?.options?.format === "NUMBER"
    ) {
      const row = {
        options: column?.options,
        content: column?.options?.disabledFooter
          ? ""
          : (() => {
              switch (column?.options?.format) {
                case "RP":
                  return total.toLocaleString("kr-ko");
                case "GR":
                  return total.toFixed(3);
                case "NUMBER":
                  return total;
                default:
                  return total.toString();
              }
            })(),
        styles: {
          halign: column?.options?.halign
            ? column?.options?.halign
            : column?.options?.format === "RP" ||
              column?.options?.format === "GR" ||
              column?.options?.format === "NUMBER"
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
        options: column?.options,
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
    const GrandTotal = footerSetting?.grandTotal?.enableCount
      ? grouping.length > 0
        ? " : " +
          data.map((list) => list.detail.length).reduce((a, b) => a + b, 0)
        : " : " + data.length
      : "";

    const caption = footerSetting?.grandTotal?.captionItem
      ? footerSetting?.grandTotal?.captionItem
      : "";
    grandTotal[0] = {
      content: `${
        footerSetting?.grandTotal?.caption || "GRAND TOTAL"
      } ${GrandTotal} ${caption}`,
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

  autoTable(doc, {
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
    },
    tableLineColor: [255, 255, 255]
  });
  tableRows = [];
  finalY = (doc as any).lastAutoTable.finalY;
  +3;

  const pages = (doc as any).internal.getNumberOfPages();
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
  if (typeof pdfSetting?.customize === "function") {
    pdfSetting.customize(doc, finalY, autoTable);
  }

  if (pdfSetting?.openNewTab) {
    const blob = doc.output("bloburl");
    window.open(blob);
  } else {
    doc.save(`${pdfSetting?.titlePdf || title}.pdf`);
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
