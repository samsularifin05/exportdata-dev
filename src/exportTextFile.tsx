interface Load {
  [key: string]: string | string[] | undefined;
}

interface Res {
  data: Load[];
  template: string;
  copy?: boolean;
}

const generateNotaSlip = (res: Res): string[] => {
  const notaGenerated: string[] = [];
  const jml = res.copy ? 2 : 1;
  for (let index = 0; index < jml; index++) {
    const nota: string[] = res.data.map((load: Load) => {
      let replaceLoop = res.template;

      while (/\n!!LOOP\((.+)\)(\{\n(.*\n)+\})\n/gm.exec(replaceLoop)) {
        replaceLoop = replaceLoop.replace(
          /\n!!LOOP\((.+)\)(\{\n(.*\n)+\})\n/,
          (_match, p1, p2) => {
            const loopContent = p2.replace(/^\{/, "").replace(/\}$/, "");
            const loopArray: string[] | undefined = !Array.isArray(load[p1])
              ? [load[p1] as string]
              : (load[p1] as string[]);
            const detail: string = loopArray.reduce((acc, val) => {
              return (
                acc +
                loopContent.replace(/\{([a-z0-9_]+)\}/gm, (c: any) => {
                  const key = c.replace(/(\{|\})/g, "");
                  if (key.match(/nama_barang/)) {
                    const keyCustomer = key.match(/nama_barang/);
                    const sliceNamaBarang =
                      key === "nama_barang2"
                        ? [20, 40]
                        : key === "nama_barang3"
                        ? [40, 60]
                        : [0, 20];
                    return (
                      (val[keyCustomer] as string)
                        ?.slice(...sliceNamaBarang)
                        .trim() || ""
                    );
                  }
                  if (key.match(/deskripsi_jual/)) {
                    const keyDeskripsi = key.match(/deskripsi_jual/);
                    const sliceDeskripsi =
                      key === "deskripsi_jual2"
                        ? [20, 40]
                        : key === "deskripsi_jual3"
                        ? [40, 60]
                        : [0, 20];
                    return (
                      (val[keyDeskripsi] as string)
                        ?.slice(...sliceDeskripsi)
                        .trim() || ""
                    );
                  }
                  if (key.match(/deskripsi/)) {
                    const keyCustomer = key.match(/deskripsi/);
                    const sliceNama =
                      key === "deskripsi2"
                        ? [20, 40]
                        : key === "deskripsi3"
                        ? [40, 60]
                        : [0, 20];
                    return (
                      (val[keyCustomer] as string)
                        ?.slice(...sliceNama)
                        .trim() || ""
                    );
                  }
                  return (val[key] as string) || "";
                })
              );
            }, "");
            return detail.replace(/\n(\s)+\n/gm, "\n");
          }
        );
      }

      return replaceLoop
        .replace(/\{([a-z0-9_]+)\}/gm, (c) => {
          const key = c.replace(/(\{|\})/g, "");

          if (key.match(/auto_cut/)) {
            return "\nVA";
          }
          return (load[key] as string) || "";
        })
        .replace(/\n(\s)+\n/gm, "\n")
        .replace(/~new_line~/gm, "\n")
        .replace(/!!LOOP\(detail\)/g, "")
        .replace(/[}{]/g, "");
    });

    for (const key in nota) {
      nota[key] += "\n\n";
    }

    notaGenerated.push(...nota);
  }

  return notaGenerated;
};

const ExportToTxt = async (res: any, nama_file: string): Promise<void> => {
  const notaGenerated = generateNotaSlip(res);
  const blob = new Blob([notaGenerated?.join("\n") || ""], {
    type: "text/plain"
  });
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = nama_file;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

export default ExportToTxt;
