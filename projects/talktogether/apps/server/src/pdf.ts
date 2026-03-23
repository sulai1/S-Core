import path from "path";
import PdfDoc from "pdfkit";
import { DataSource, SelectFunctionDefinitions } from "@s-core/core";
import { Identification, Salesman, tables } from "@s-core/talktogether";
import { imgPath } from "../app";

export async function getNewID(salesmanId: number, db: DataSource<typeof tables, SelectFunctionDefinitions>): Promise<Identification> {
    const validTo = new Date(new Date().setMonth(new Date().getMonth() + 9))
    // get current id
    const res = await db.find("Identification", {
        where: [
            { function: "=", params: ["id", { value: salesmanId }] },
            { function: ">", params: ["validTo", { value: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString() }] },
            { function: "<", params: ["id_nr", { value: 1000 }] }
        ],
        orderBy: [["validTo", "desc"]],
        limit: 1
    })
    if (res?.[0]?.id) {
        await db.update("Identification", {
            validTo: validTo.toISOString(),
            updatedAt: new Date().toISOString(),
        }, [{ function: "=", params: ["id", { value: res[0].id }] }])
        return {
            salesman: res[0].salesman,
            id: res[0].id,
            id_nr: res[0].id_nr,
            validTo: validTo.toISOString(),
            updatedAt: new Date().toISOString(),
            createdAt: res[0].createdAt,
        }
    }

    // get new Id
    const newId = await db.find("Identification", {
        attributes: { newId: "id_nr" },
        where: [
            { function: ">", params: ["validTo", { value: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString() }] }
        ],
        orderBy: [["id_nr", "asc"]],
    })
    let freeId = 1;
    const set = new Set(newId.map((row) => row.newId));
    for (const id of set) {
        if (id !== freeId)
            break;
        else {
            freeId += 1;
        }
    }
    const id = {
        validTo: validTo.toISOString(),
        salesman: salesmanId,
        id_nr: freeId,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    }
    const generatedId = await db.insert("Identification", [id])
    return {
        salesman: salesmanId,
        id: generatedId[0].id ?? 0,
        id_nr: freeId,
        validTo: validTo.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

export async function createIdentification(
    salesmen: Salesman[],
    stream: NodeJS.WritableStream,
    db: DataSource<typeof tables, SelectFunctionDefinitions>
): Promise<void> {
    const doc = new PdfDoc({
        layout: "landscape",
        margins: {
            left: 25,
            right: 25,
            top: 25,
            bottom: 25
        }
    });

    doc.pipe(stream); // write to PDF

    const width = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 3;
    const height = (doc.page.height - doc.page.margins.top - doc.page.margins.bottom) / 2;
    const xOffset1 = 105 + doc.page.margins.left;
    const yOffset1 = 82 + doc.page.margins.top;
    const yOffset2 = 110 + doc.page.margins.top;
    const xOffsetNr = 130 + doc.page.margins.left;
    const yOffsetNr = 165 + doc.page.margins.top;

    const xOffsetImg = 10 + doc.page.margins.left;
    const yOffsetImg = 65 + doc.page.margins.top;

    const xOffsetValid = 25 + doc.page.margins.left;
    const yOffsetValid = 172 + doc.page.margins.top;

    let index = 0;
    for (const salesman of salesmen) {
        if (!salesman.image || !salesman.id)
            continue

        const newId = await getNewID(salesman.id, db)

        let x = ((index % 6) % 3) * width;
        let y = (Math.floor((index % 6) / 3)) * height;
        doc.image("vorlage.png", doc.page.margins.left + x, doc.page.margins.top + y, {
            width,
            height,
        })
        index += 1;

        doc.fontSize(15)
        doc.text(salesman.last, x + xOffset1, y + yOffset1, { width: 150 })
        doc.fontSize(12)
        doc.text(salesman.first, x + xOffset1, y + yOffset2, { width: 150 })

        doc.fontSize(64)
        doc.text(String(newId.id_nr), x + xOffsetNr, y + yOffsetNr)

        doc.fontSize(10)
        if (newId.validTo)
            doc.text(new Date(newId.validTo).toLocaleDateString(), x + xOffsetValid, y + yOffsetValid)

        try {
            doc.image(path.join(imgPath, salesman.image), x + xOffsetImg, y + yOffsetImg, {
                width: 75,
                height: 90
            })
        } catch (e) {
            console.error(e)
        }

        if (index % 6 === 0) {
            doc.addPage();
        }
    }

    return new Promise<void>((resolve, reject) => {
        doc.on("end", () => {
            console.log("finished")
            resolve()
        })
        doc.on("error", (e: any) => {
            console.error("PDF generation error:", e)
            reject(e)
        })
        stream.on("error", (e: any) => {
            console.error("Stream error:", e)
            reject(e)
        })
        doc.end();
    })
}