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
