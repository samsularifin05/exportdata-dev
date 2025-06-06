// import BwipJs from "bwip-js/browser";
import {
  convertDateTime,
  countColumns,
  formatingTitle,
  getFlattenColumns
} from "./helpers";
import { DataItemGenerator, GenaratorExport } from "./interface";
import ExcelJS from "exceljs";

const ExportExcel = async <T>({
  columns,
  data,
  grouping,
  date,
  excelSetting,
  title,
  footerSetting
}: GenaratorExport<T>): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  columns = columns.filter((item) => !item.options?.disabledColumn);
  const worksheet = workbook.addWorksheet(title || excelSetting?.titleExcel);

  const lastUsedColumnIndex = countColumns(columns);

  // Judul
  // console.log(lastUsedColumnIndex);
  const judul = worksheet.addRow([]);
  judul.getCell(1).value = title || excelSetting?.titleExcel;
  judul.getCell(1).alignment = { horizontal: "center" };

  const lastColumnLetter = worksheet.getColumn(lastUsedColumnIndex).letter;

  worksheet.mergeCells(`A${judul.number}:${lastColumnLetter}${judul.number}`);

  judul.eachCell((cell) => {
    cell.font = {
      color: { argb: "000000" },
      bold: true,
      size: 12
    };
  });

  // Tanggal
  if (date) {
    const tanggalRow = worksheet.addRow([]);
    tanggalRow.getCell(1).value = `${
      date.caption ? date.caption : "Tanggal "
    } : ${date?.start_date} ${date?.end_date ? `s/d ${date?.end_date}` : ""}`;
    tanggalRow.getCell(1).alignment = { horizontal: "center" };
    worksheet.mergeCells(
      `A${tanggalRow.number}:${lastColumnLetter}${tanggalRow.number}`
    );

    tanggalRow.eachCell((cell) => {
      cell.font = {
        color: { argb: "00000" },
        bold: true,
        size: 12
      };
    });
  }

  // additional
  const additionalText = worksheet.addRow([]);
  additionalText.getCell(1).value = excelSetting?.additionalTextHeader || "";
  additionalText.getCell(1).alignment = { horizontal: "center" };
  worksheet.mergeCells(
    `A${additionalText.number}:${lastColumnLetter}${additionalText.number}`
  );

  additionalText.eachCell((cell) => {
    cell.font = { color: { argb: "000000" }, bold: true, size: 12 };
  });

  const hasChild = columns.some((col) => col.child && col.child.length > 0);
  const headerColumn1 = worksheet.addRow([]);
  const headerColumn2 = hasChild ? worksheet.addRow([]) : null;

  columns.forEach((col) => {
    if (col.child && col.child.length > 0) {
      // Parent dengan child: di headerColumn1 ditulis parent-nya dan di headerColumn2 tulis child-nya
      // Merge parent cell di headerColumn1 sesuai jumlah child
      const startCol = headerColumn1.actualCellCount + 1;
      const childCount = col.child.length;

      // Isi parent di headerColumn1, merge sesuai childCount
      headerColumn1.getCell(startCol).value = col.label;
      if (childCount > 1) {
        worksheet.mergeCells(
          headerColumn1.number,
          startCol,
          headerColumn1.number,
          startCol + childCount - 1
        );
      }

      // Styling dan alignment parent headerColumn1
      for (let i = startCol; i < startCol + childCount; i++) {
        const cell = headerColumn1.getCell(i);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: excelSetting?.bgColor || "E8E5E5" }
        };
        cell.font = {
          color: { argb: excelSetting?.txtColor || "000000" },
          bold: true
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      // Isi child di headerColumn2
      col.child.forEach((childCol, index) => {
        if (headerColumn2) {
          const cell = headerColumn2.getCell(startCol + index);
          cell.value = childCol.label;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: excelSetting?.bgColor || "E8E5E5" }
          };
          cell.font = {
            color: { argb: excelSetting?.txtColor || "000000" },
            bold: true
          };

          const halign =
            childCol.options?.halign ||
            (["RP", "GR", "NUMBER"].includes(childCol?.options?.format || "")
              ? "right"
              : "left");
          const valign = childCol.options?.valign || "middle";
          cell.alignment = { horizontal: halign, vertical: valign };
        }
      });
    } else {
      // Parent tanpa child: tulis di headerColumn1 dan merge di headerColumn2 agar melebar ke bawah
      const colIndex = headerColumn1.actualCellCount + 1;

      // Isi headerColumn1
      headerColumn1.getCell(colIndex).value = col.label;
      headerColumn1.getCell(colIndex).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: excelSetting?.bgColor || "E8E5E5" }
      };
      headerColumn1.getCell(colIndex).font = {
        color: { argb: excelSetting?.txtColor || "000000" },
        bold: true
      };
      headerColumn1.getCell(colIndex).alignment = {
        horizontal: col.options?.halign || "center",
        vertical: col.options?.valign || "middle"
      };
      if (hasChild && headerColumn2) {
        worksheet.mergeCells(
          headerColumn1.number,
          colIndex,
          headerColumn2.number,
          colIndex
        );
      }
    }
  });

  const totals: { [key: string]: number } = {};

  data.forEach((item) => {
    if (grouping.length > 0) {
      const totalColumns = countColumns(columns); // sudah kamu punya
      const groupContent = grouping
        .map((column) =>
          item[column] !== undefined
            ? `${formatingTitle(column)} : ${item[column]}`
            : ""
        )
        .filter(Boolean)
        .join("  |  ");

      const groupRow = worksheet.addRow([groupContent]); // hanya isi satu sel (di kolom A)
      worksheet.mergeCells(
        `A${groupRow.number}:${String.fromCharCode(64 + totalColumns)}${
          groupRow.number
        }`
      );

      // Styling opsional:
      groupRow.getCell(1).alignment = { horizontal: "left" };
      groupRow.getCell(1).font = { bold: true };

      const subtotal: { [key: string]: number } = {};

      item.detail.forEach((itemDetail: any) => {
        const flatColumns = getFlattenColumns(columns);

        const rowData = flatColumns.map((column) => {
          const value =
            column?.options?.format === "DATETIME"
              ? convertDateTime(
                  itemDetail[column.key as keyof DataItemGenerator]
                )
              : itemDetail[column.key as keyof DataItemGenerator];
          const alignment = {
            horizontal: column?.options?.halign
              ? column?.options?.halign
              : column?.options?.format === "RP" ||
                column?.options?.format === "GR" ||
                column?.options?.format === "NUMBER"
              ? "right"
              : "left"
          };
          const columnKey = column.key as keyof DataItemGenerator;
          totals[columnKey] = (totals[columnKey] || 0) + Number(value);
          subtotal[columnKey] = (subtotal[columnKey] || 0) + Number(value);

          return {
            value,
            alignment,
            numFmt:
              column?.options?.format === "RP"
                ? "#,##0"
                : column?.options?.format === "GR"
                ? "#,##0.000"
                : undefined
          };
        });

        const row = worksheet.addRow(rowData.map((cellData) => cellData.value));

        rowData.forEach((cellData, index) => {
          const cell = row.getCell(index + 1);
          cell.alignment = cellData.alignment;

          if (cellData.numFmt) {
            cell.numFmt = cellData.numFmt;
          }
        });
      });
      const flatColumnsSubTott = getFlattenColumns(columns);

      const subtotalRow = worksheet.addRow(columns.map(() => null)); // Create a row with null values

      flatColumnsSubTott.forEach((column, columnIndex) => {
        if (
          column?.options?.format === "RP" ||
          column?.options?.format === "GR" ||
          column?.options?.format === "NUMBER"
        ) {
          const startRow = 4; // Adjust this based on the starting row for your data
          const endRow = data.length + startRow - 1;
          const totalFormula = `SUM(${String.fromCharCode(
            65 + columnIndex
          )}${startRow}:${String.fromCharCode(65 + columnIndex)}${endRow})`;
          const grandTotalCell = subtotalRow.getCell(columnIndex + 1);
          const subtotalCount = footerSetting?.subTotal?.enableCount
            ? grouping.length > 0
              ? " : " + item.detail.length
              : ""
            : "";

          const captionSub = footerSetting?.subTotal?.captionItem
            ? footerSetting?.subTotal?.captionItem
            : "";
          (subtotalRow.getCell(1).value = `${
            footerSetting?.subTotal?.caption || "SUB TOTAL"
          } ${subtotalCount} ${captionSub}`),
            (subtotalRow.getCell(1).alignment = { horizontal: "center" });

          // Explicitly cast the cell to CellValue to set numFmt
          (grandTotalCell as any).numFmt =
            column?.options?.format === "GR" ? "#,##0.000" : "#,##0";
          grandTotalCell.value = { formula: totalFormula };
          subtotalRow.getCell(columnIndex + 1).value = column?.options
            .disabledFooter
            ? ""
            : subtotal[column.key as keyof DataItemGenerator];
        } else {
          subtotalRow.getCell(columnIndex + 1).value = "";
        }
      });
      if (excelSetting?.grandTotalSetting?.colSpan) {
        worksheet.mergeCells(
          `A${subtotalRow.number}:${String.fromCharCode(
            64 + Number(excelSetting?.grandTotalSetting?.colSpan)
          )}${subtotalRow.number}`
        );
      }
      subtotalRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: excelSetting?.bgColor || "#E8E5E5" }, // Warna hijau yang diinginkan
          bgColor: { argb: excelSetting?.bgColor || "#E8E5E5" }
        };
        cell.font = {
          color: { argb: excelSetting?.txtColor },
          bold: true
        };
      });
    } else {
      const flatColumns = getFlattenColumns(columns);
      const rowData = flatColumns.map((column) => {
        const value =
          column?.options?.format === "DATETIME"
            ? convertDateTime(item[column.key as keyof DataItemGenerator])
            : item[column.key as keyof DataItemGenerator];
        const alignment = {
          vertical: "middle",
          horizontal: column?.options?.halign
            ? column?.options?.halign
            : column?.options?.format === "RP" ||
              column?.options?.format === "GR" ||
              column?.options?.format === "NUMBER"
            ? "right"
            : "left"
        };

        const columnKey = column.key as keyof DataItemGenerator;
        totals[columnKey] = (totals[columnKey] || 0) + Number(value);

        return {
          value,
          options: column?.options,
          alignment,
          numFmt:
            column?.options?.format === "RP"
              ? "#,##0"
              : column?.options?.format === "GR"
              ? "#,##0.000"
              : // : column?.options?.barcodeOption !== undefined
                //   ? "BARCODE"
                undefined
        };
      });

      const row = worksheet.addRow(rowData.map((cellData) => cellData.value));

      rowData.forEach((cellData, index) => {
        const cell = row.getCell(index + 1);

        const vertical = cellData.alignment.vertical
          ? String(cellData.alignment.vertical || "bottom")
          : "bottom";

        let verticalAlignment: any = ""; // Default value

        // Check if the value is valid and assign it
        if (
          vertical === "middle" ||
          vertical === "bottom" ||
          vertical === "justify" ||
          vertical === "distributed" ||
          vertical === "top"
        ) {
          verticalAlignment = vertical as any;
        }

        cell.alignment = {
          horizontal: cellData.alignment.horizontal,
          vertical: verticalAlignment
        };

        if (cellData.numFmt) {
          cell.numFmt = cellData.numFmt;
        }
      });
    }
  });

  const grandTotalRow = worksheet.addRow(columns.map(() => null)); // Create a row with null values

  const flatColumnsTott = getFlattenColumns(columns);

  flatColumnsTott.forEach((column, columnIndex) => {
    if (
      column?.options?.format === "RP" ||
      column?.options?.format === "GR" ||
      column?.options?.format === "NUMBER"
    ) {
      const startRow = 4; // Adjust this based on the starting row for your data
      const endRow = data.length + startRow - 1;
      const totalFormula = `SUM(${String.fromCharCode(
        65 + columnIndex
      )}${startRow}:${String.fromCharCode(65 + columnIndex)}${endRow})`;
      const grandTotalCell = grandTotalRow.getCell(columnIndex + 1);
      // content: ,
      const GrandTotal = footerSetting?.grandTotal?.enableCount
        ? grouping.length > 0
          ? " : " +
            data.map((list) => list.detail.length).reduce((a, b) => a + b, 0)
          : " : " + data.length
        : "";

      const caption = footerSetting?.grandTotal?.captionItem
        ? footerSetting?.grandTotal?.captionItem
        : "";

      const footerGrandtotal = `${
        footerSetting?.grandTotal?.caption || "GRAND TOTAL"
      } ${GrandTotal} ${caption}`;
      grandTotalRow.getCell(1).value = footerGrandtotal;
      grandTotalRow.getCell(1).alignment = { horizontal: "center" };

      (grandTotalCell as any).numFmt =
        column?.options?.format === "GR" ? "#,##0.000" : "#,##0";
      grandTotalCell.value = { formula: totalFormula };
      grandTotalRow.getCell(columnIndex + 1).value = column?.options
        .disabledFooter
        ? ""
        : totals[column.key as keyof DataItemGenerator];
    } else {
      grandTotalRow.getCell(columnIndex + 1).value = "";
    }
  });
  if (excelSetting?.grandTotalSetting?.colSpan) {
    worksheet.mergeCells(
      `A${grandTotalRow.number}:${String.fromCharCode(
        64 + Number(excelSetting?.grandTotalSetting?.colSpan)
      )}${grandTotalRow.number}`
    );
  }
  grandTotalRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: excelSetting?.bgColor || "#E8E5E5" }, // Warna hijau yang diinginkan
      bgColor: { argb: excelSetting?.bgColor || "#E8E5E5" }
    };
    cell.font = {
      color: { argb: excelSetting?.txtColor },
      bold: true
    };
  });

  if (excelSetting?.customize) {
    excelSetting.customize(worksheet);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${excelSetting?.titleExcel || title}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default ExportExcel;
