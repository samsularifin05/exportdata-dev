import ExcelJS from 'exceljs';
import { ColumnGenarator, FileType, validFileTypes } from "./interface";

export function convertDateTime(tgl: string) {
  const now = new Date(tgl);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const currentDateTime = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  return currentDateTime;
}

export function validateFileTypes(fileTypes: FileType[]): boolean {
  return fileTypes.every((fileType) => validFileTypes.includes(fileType));
}

export function countColumns(columns: ColumnGenarator<any>[]): number {
  let count = 0;
  columns.forEach((col) => {
    if (col.child && col.child.length > 0) {
      count += countColumns(col.child);
    } else {
      count += 1;
    }
  });
  return count;
}

export const getFlattenColumns = (
  columns: ColumnGenarator<any>[]
): ColumnGenarator<any>[] => {
  const flat: ColumnGenarator<any>[] = [];

  columns.forEach((col) => {
    if (col.child && col.child.length > 0) {
      flat.push(...getFlattenColumns(col.child)); // panggil rekursif
    } else {
      flat.push(col);
    }
  });

  return flat;
};

export const formatingTitle = (title: string): string => {
  // Pisahkan kata-kata menggunakan underscore sebagai pemisah
  const words = title.split("_");

  // Ubah setiap kata menjadi huruf kapital dan gabungkan kembali dengan spasi di antara mereka
  const formattedtitle = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return formattedtitle;
};


/**
 * Menambahkan gambar ke baris Excel menggunakan ExcelJS di browser, dari base64 string
 */
export async function addImagesToRow(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  row: ExcelJS.Row,
  rowData: any[]
) {
  for (let index = 0; index < rowData.length; index++) {
    const cellData = rowData[index];

    // Proses jika imageSrc adalah base64 string
    if (
      cellData?.isImage &&
      cellData?.imageSrc &&
      typeof cellData.imageSrc === "string" &&
      cellData.imageSrc.startsWith("data:image")
    ) {
      try {
        const { buffer, extension } = base64ToBufferAndExtension(cellData.imageSrc);

        const imageId = workbook.addImage({
          buffer: buffer as any,
          extension,
        });

        worksheet.addImage(imageId, {
          tl: { col: index, row: row.number - 1 },
          ext: { width: 70, height: 60 },
          editAs: "oneCell",
        });

        if (!row.height || row.height < 60) {
          row.height = 35;
        }
      } catch (error) {
        console.error("❌ Error adding image to row:", error);
        row.getCell(index + 1).value = "[Image]";
      }
    }
  }
}

/**
 * Mengubah base64 image string ke buffer dan extension
 */
function base64ToBufferAndExtension(base64: string): { buffer: Uint8Array; extension: any } {
  const match = base64.match(/^data:image\/(\w+);base64,(.*)$/);
  if (!match) throw new Error("Invalid base64 image format");
  const extension = match[1] === "jpg" ? "jpeg" : (match[1] as any);
  const base64Data = match[2];
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { buffer: bytes, extension };
}