import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import mysql from "mysql2/promise";
import fs from "fs";

const app = express();
const port = 3030;

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// koneksi ke MySQL
const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "musik"
});

// konfigurasi upload gambar
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// endpoint GET semua lagu
app.get("/lagu", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM lagu");
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// endpoint POST tambah lagu dengan generate kode otomatis
app.post("/lagu", upload.single("gambar"), async (req, res) => {
    try {
        const { judul_lagu, pencipta, penyanyi, jenis } = req.body;
        const gambar = req.file ? req.file.filename : "default-image.jpg";

        const [rows] = await db.query("SELECT MAX(kode_lagu) AS lastCode FROM lagu");
        const lastCode = rows[0].lastCode;
        let newCode;

        if (!lastCode) {
            newCode = "LG00001";
        } else {
            const number = parseInt(lastCode.slice(2)) + 1;
            newCode = "LG" + String(number).padStart(5, "0");
        }

        await db.query(
            "INSERT INTO lagu (kode_lagu, judul_lagu, pencipta, penyanyi, jenis, gambar) VALUES (?, ?, ?, ?, ?, ?)",
            [newCode, judul_lagu, pencipta, penyanyi, jenis, gambar]
        );

        res.json({ success: true, message: "Lagu ditambahkan", kode_lagu: newCode });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// endpoint PUT update lagu
app.put("/lagu/:kode", upload.single("gambar"), async (req, res) => {
    try {
        const { judul_lagu, pencipta, penyanyi, jenis } = req.body;
        const gambar = req.file ? req.file.filename : "default-image.jpg";
        const kode = req.params.kode;

        let query, values;

        if (gambar) {
            const [oldData] = await db.query("SELECT gambar FROM lagu WHERE kode_lagu = ?", [kode]);
            // if (oldData.length && oldData[0].gambar) {
            //     fs.unlinkSync(`uploads/${oldData[0].gambar}`);
            // }

            query = "UPDATE lagu SET judul_lagu=?, pencipta=?, penyanyi=?, jenis=?, gambar=? WHERE kode_lagu=?";
            values = [judul_lagu, pencipta, penyanyi, jenis, gambar, kode];
        } else {
            query = "UPDATE lagu SET judul_lagu=?, pencipta=?, penyanyi=?, jenis=? WHERE kode_lagu=?";
            values = [judul_lagu, pencipta, penyanyi, jenis, kode];
        }

        await db.query(query, values);
        res.json({ success: true, message: "Lagu diperbarui" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// endpoint DELETE lagu
app.delete("/lagu/:kode", async (req, res) => {
    try {
        const kode = req.params.kode;

        const [oldData] = await db.query("SELECT gambar FROM lagu WHERE kode_lagu = ?", [kode]);
        // if (oldData.length && oldData[0].gambar) {
        //     fs.unlinkSync(`uploads/${oldData[0].gambar}`);
        // }

        await db.query("DELETE FROM lagu WHERE kode_lagu = ?", [kode]);
        res.json({ success: true, message: "Lagu dihapus" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
