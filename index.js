import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mysql from "mysql2";
import multer from "multer";
import path from "path";

const app = express();
const port = 3030;

app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// koneksi ke MySQL
const db = mysql.createConnection({
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

// ENDPOINT

// Get semua lagu
app.get("/lagu", (req, res) => {
    db.query("SELECT * FROM lagu", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Tambah lagu
app.post("/lagu", upload.single("gambar"), (req, res) => {
    const { kode_lagu, judul_lagu, pencipta, penyanyi, jenis } = req.body;
    const gambar = req.file ? req.file.filename : null;

    db.query(
        "INSERT INTO lagu VALUES (?, ?, ?, ?, ?, ?)",
        [kode_lagu, judul_lagu, pencipta, penyanyi, jenis, gambar],
        (err) => {
            if (err) return res.status(500).send(err);
            res.send("Lagu ditambahkan");
        }
    );
});

// Update lagu
app.put("/lagu/:kode", upload.single("gambar"), (req, res) => {
    const { judul_lagu, pencipta, penyanyi, jenis } = req.body;
    const gambar = req.file ? req.file.filename : null;
    const kode = req.params.kode;

    const query = gambar
        ? "UPDATE lagu SET judul_lagu=?, pencipta=?, penyanyi=?, jenis=?, gambar=? WHERE kode_lagu=?"
        : "UPDATE lagu SET judul_lagu=?, pencipta=?, penyanyi=?, jenis=? WHERE kode_lagu=?";

    const values = gambar
        ? [judul_lagu, pencipta, penyanyi, jenis, gambar, kode]
        : [judul_lagu, pencipta, penyanyi, jenis, kode];

    db.query(query, values, (err) => {
        if (err) return res.status(500).send(err);
        res.send("Lagu diperbarui");
    });
});

// Hapus lagu
app.delete("/lagu/:kode", (req, res) => {
    db.query("DELETE FROM lagu WHERE kode_lagu=?", [req.params.kode], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Lagu dihapus");
    });
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
