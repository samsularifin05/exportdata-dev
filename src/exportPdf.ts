import {
  ColumnGenarator,
  DataItemGenerator,
  GenaratorExport
} from "./interface";
import {
  convertDateTime,
  countColumns,
  formatingTitle,
  getFlattenColumns
} from "./helpers";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ExportPDF = <T>({
  columns,
  data,
  grouping,
  pdfSetting,
  date,
  title,
  footerSetting,
}: GenaratorExport<T>): void => {
  const doc: jsPDF = new jsPDF(pdfSetting?.orientation, pdfSetting?.unit, [
    pdfSetting?.width || 297,
    pdfSetting?.height || 210,
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
    align: "right",
  });

  if (date) {
    doc.text(
      `${date.caption ? date.caption : "TANGGAL "} : ${date?.start_date} ${date?.end_date ? `s/d ${date?.end_date}` : ""
      }`,
      widthPortrait - 15,
      22,
      { align: "right" }
    );
  }
  doc.setProperties({
    title: title || pdfSetting?.titlePdf,
  });

  if (pdfSetting?.finalY) {
    console.log(pdfSetting.finalY);
    finalY = pdfSetting.finalY;
  }

  // Header Tabel
  const headerRow1: any[] = [];
  const headerRow2: any[] = [];
  const hasChild = columns.some((col) => col.child && col.child.length > 0);
  columns.forEach((column) => {
    const baseStyle = {
      textColor: `#${pdfSetting?.txtColor || "000"}`,
      fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
      fontStyle: "bold",
      ...(column?.options?.valign ? { valign: column.options.valign } : {}),
      halign:
        column?.options?.halign ??
        (["RP", "GR", "NUMBER"].includes(column?.options?.format || "")
          ? "right"
          : "left"),
    };

    if (hasChild) {
      if (column.child && column.child.length > 0) {
        // Parent di headerRow1
        headerRow1.push({
          content: column.label,
          colSpan: column.child.length,
          styles: baseStyle,
        });

        // Children di headerRow2
        column.child.forEach((childCol) => {
          headerRow2.push({
            content: childCol.label,
            key: childCol.key,
            options: childCol.options,
            styles: {
              ...baseStyle,
              halign:
                childCol?.options?.halign ??
                (["RP", "GR", "NUMBER"].includes(
                  childCol?.options?.format || ""
                )
                  ? "right"
                  : "left"),
            },
          });
        });
      } else {
        // Tidak ada child, tapi harus isi 2 baris header (rowSpan 2)
        headerRow1.push({
          content: column.label,
          rowSpan: 2,
          key: column.key,
          options: column.options,
          styles: baseStyle,
        });
      }
    } else {
      // Semua column tidak punya child, cukup 1 headerRow
      headerRow1.push({
        content: column.label,
        key: column.key,
        options: column.options,
        styles: baseStyle,
      });
    }
  });

  // Push header ke tabel
  tableRows.push(headerRow1);
  if (hasChild && headerRow2.length > 0) {
    tableRows.push(headerRow2);
  }

  // Body Tabel
  const totals: { [key: string]: number } = {};

  data.forEach((item) => {
    if (grouping.length > 0) {
      // Tambah row grup (header kelompok)
      const totalColumns = countColumns(columns);

      const groupContent = grouping
        .map((column) =>
          item[column] !== undefined
            ? `${formatingTitle(column)} : ${item[column]}`
            : ""
        )
        .filter(Boolean) // hilangkan string kosong
        .join("  |  "); // separator antar grup (bisa diganti sesuai preferensi)

      // console.log(groupContent)
      const groupRow = [
        {
          content: groupContent,
          colSpan: totalColumns, // colSpan sesuai jumlah kolom tabel
          styles: {
            fontStyle: "bold",
            halign: "left", // bisa disesuaikan
          },
        },
      ];

      tableRows.push(groupRow);

      const subtotal: { [key: string]: number } = {};

      // FLATTEN COLUMNS untuk looping
      const flatColumns = getFlattenColumns(columns);

      item.detail.forEach((list2: any) => {
        const rowData = flatColumns.map((column) => {
          const value = list2[column.key as keyof DataItemGenerator];
          const columnKey = column.key as keyof DataItemGenerator;

          // Hitung subtotal & total
          totals[columnKey] = (totals[columnKey] || 0) + Number(value || 0);
          subtotal[columnKey] = (subtotal[columnKey] || 0) + Number(value || 0);
          const isImage = column.options?.format === "IMAGE";

          return {
            content: (() => {
              switch (column?.options?.format) {
                case "RP":
                  return value !== undefined
                    ? Number(value || 0).toLocaleString("kr-ko")
                    : "";
                case "GR":
                  return value !== undefined
                    ? Number(value || 0).toFixed(3)
                    : "";
                case "NUMBER":
                  return value !== undefined ? Number(value || 0) : "";
                case "IMAGE":
                  return ""
                case "DATETIME":
                  return value !== undefined
                    ? convertDateTime(value || new Date())
                    : "";
                default:
                  return value !== undefined ? value.toString() : "";
              }
            })(),
            foto: isImage ? value : null,
            styles: {
              halign: column?.options?.halign
                ? column?.options?.halign
                : column?.options?.format === "RP" ||
                  column?.options?.format === "GR" ||
                  column?.options?.format === "NUMBER"
                  ? "right"
                  : typeof value === "number"
                    ? "right"
                    : "left",
            },
          };
        });


        tableRows.push(rowData);
      });


      if (!footerSetting?.subTotal?.disableSubtotal) {

        // Footer Subtotal
        const footersubtotal: any = [];
        flatColumns.forEach((column) => {
          const total = subtotal[column.key as keyof DataItemGenerator];
          if (
            column?.options?.format === "RP" ||
            column?.options?.format === "GR" ||
            column?.options?.format === "NUMBER"
          ) {
            footersubtotal.push({
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
                halign: column?.options?.halign || "right",
                textColor: `#${pdfSetting?.txtColor || "000"}`,
                fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
                fontStyle: "bold",
              },
            });
          } else {
            footersubtotal.push({
              content: "",
              styles: {
                textColor: `#${pdfSetting?.txtColor || "000"}`,
                fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
                fontStyle: "bold",
              },
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
          content: `${footerSetting?.subTotal?.caption || "SUB TOTAL"}${subtotalCount} ${captionSub}`,
          colSpan,
          styles: {
            textColor: `#${pdfSetting?.txtColor || "000"}`,
            fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
            fontStyle: "bold",
            halign: "center",
          },
        };

        if (pdfSetting?.grandTotalSetting?.colSpan) {
          footersubtotal.splice(1, pdfSetting?.grandTotalSetting?.colSpan);
        }

        tableRows.push(footersubtotal);
      }
    } else {
      // Helper untuk mengambil data cell dari item dan column
      const getCellData = (column: ColumnGenarator<any>, item: any) => {
        const value = item[column.key as keyof DataItemGenerator];
        const columnKey = column.key as keyof DataItemGenerator;

        // Hitung total jika tidak disabled
        if (!column.options?.disabledFooter) {
          totals[columnKey] = (totals[columnKey] || 0) + Number(value || 0);
        }

        // Tentukan isi cell
        const content = (() => {
          switch (column?.options?.format) {
            case "RP":
              return value !== undefined
                ? Number(value || 0).toLocaleString("kr-ko")
                : "";
            case "GR":
              return value !== undefined ? Number(value || 0).toFixed(3) : "";
            case "NUMBER":
              return value !== undefined ? Number(value || 0) : "";
            case "IMAGE":
              return '';
            case "DATETIME":
              return value !== undefined
                ? convertDateTime(value || new Date())
                : "";
            default:
              return value !== undefined ? value?.toString() : "";
          }
        })();

        // Style cell
        const halign = column?.options?.halign
          ? column?.options?.halign
          : column?.options?.format === "RP" ||
            column?.options?.format === "GR" ||
            column?.options?.format === "NUMBER"
            ? "right"
            : typeof value === "number"
              ? "right"
              : "left";

        const isImage = column.options?.format === "IMAGE";


        return {
          options: column?.options,
          content,
          foto: isImage ? value : null,
          styles: { halign },
        };
      };

      // Helper rekursif untuk flatten column dengan child

      // Dapatkan semua kolom flatten dari struktur kolom dengan child
      const flatColumns = getFlattenColumns(columns);

      // Lalu generate rowData
      const rowData = flatColumns.map((column) => getCellData(column, item));

      // Tambahkan ke baris tabel
      tableRows.push(rowData);
    }
  });

  const flatColumns = getFlattenColumns(columns);
  if (!footerSetting?.grandTotal?.disableGrandTotal) {
    const grandTotal: any[] = [];

    flatColumns.forEach((column) => {
      const total = totals[column.key as keyof DataItemGenerator];

      const isNumericFormat = ["RP", "GR", "NUMBER"].includes(
        column?.options?.format || ""
      );

      const content = column?.options?.disabledFooter
        ? ""
        : (() => {
          if (!isNumericFormat) return "";
          switch (column.options?.format) {
            case "RP":
              return Number(total || 0).toLocaleString("kr-KO");
            case "GR":
              return Number(total || 0).toFixed(3);
            case "NUMBER":
              return Number(total || 0);
            default:
              return (total || 0).toString();
          }
        })();

      grandTotal.push({
        options: column?.options,
        content,
        styles: {
          halign: column?.options?.halign
            ? column.options.halign
            : isNumericFormat
              ? "right"
              : "left",
          textColor: `#${pdfSetting?.txtColor || "000"}`,
          fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
          fontStyle: "bold",
        },
      });
    });
    // Tangani caption dan colSpan untuk GRAND TOTAL
    const rawColSpan = Number(pdfSetting?.grandTotalSetting?.colSpan || 0);
    const colSpan = Math.min(rawColSpan + 1, flatColumns.length); // batasi agar tidak lebih dari kolom yang tersedia

    const totalItemCount = footerSetting?.grandTotal?.enableCount
      ? grouping.length > 0
        ? data.reduce((sum, group) => sum + group.detail.length, 0)
        : data.length
      : 0;

    const caption = footerSetting?.grandTotal?.captionItem || "";
    const grandTotalLabel =
      `${footerSetting?.grandTotal?.caption || "GRAND TOTAL"}` +
      (totalItemCount ? ` : ${totalItemCount}` : "") +
      (caption ? ` ${caption}` : "");

    // Ubah cell pertama dengan content Grand Total + colSpan
    grandTotal[0] = {
      content: grandTotalLabel,
      colSpan,
      styles: {
        textColor: `#${pdfSetting?.txtColor || "000"}`,
        fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
        fontStyle: "bold",
        halign: "center",
      },
    };

    // Hapus kolom setelah grandTotal[0] sebanyak colSpan - 1 agar panjang array tetap flatColumns.length
    grandTotal.splice(1, colSpan - 1);

    // Pastikan panjang array tetap sama dengan flatColumns.length
    while (grandTotal.length < flatColumns.length) {
      grandTotal.push({
        content: "",
        styles: {
          textColor: `#${pdfSetting?.txtColor || "000"}`,
          fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
          fontStyle: "bold",
        },
      });
    }

    // Push baris GRAND TOTAL ke table
    tableRows.push(grandTotal);
  }

  if (typeof pdfSetting?.addRow === "function") {
    pdfSetting?.addRow(tableRows);
  }

  if (!pdfSetting?.disablePrintDate) {
    const totalColumns = countColumns(columns);

    tableRows.push([
      {
        content: `Print Date : ${convertDateTime(`${new Date()}`)}`,
        colSpan: totalColumns,
        styles: {
          textColor: `#${pdfSetting?.txtColor || "000"}`,
          fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
          fontStyle: "italic",
        },
      },
    ]);
  }

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
      fillColor: `#${pdfSetting?.bgColor || "E8E5E5"}`,
    },
    tableLineColor: [255, 255, 255],
    didParseCell: function (data) {
      const colIndex = data.column.index;
      const col = flatColumns[colIndex];
      const isImage = col?.options?.format === "IMAGE";

      if (isImage && data.cell.raw && (data.cell.raw as any).foto) {
        data.row.height = 20; // Ganti sesuai ukuran gambar
        data.cell.styles.valign = "middle"; // Ubah ke "middle" agar foto di tengah
        data.cell.styles.halign = "center"; // Tambahkan agar foto di tengah secara horizontal
      }
    },

    // ✅ Render gambar sesuai posisi dan ukuran
    didDrawCell: function (data) {
      const { cell } = data;
      const raw = cell.raw || {};
      const value = (raw as any).foto;
      const colIndex = data.column.index;
      const col = flatColumns[colIndex];

      if (col?.options?.format === "IMAGE" && value) {
        const imageSize = 15;
        const x = cell.x + (cell.width - imageSize) / 2;
        const y = cell.y + (cell.height - imageSize) / 2;

        try {
          doc.addImage(value, "JPG", x, y, imageSize, imageSize);
        } catch (err) {
          console.warn("❌ Gagal render gambar:", err);
        }
      }
    }

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
      align: "center",
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

export default ExportPDF;
