const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

const pastaUploads = path.join(__dirname, "uploads");
const caminhoMetadados = path.join(__dirname, "metadados.json");

if (!fs.existsSync(pastaUploads)) {
    fs.mkdirSync(pastaUploads);
}

if (!fs.existsSync(caminhoMetadados)) {
    fs.writeFileSync(caminhoMetadados, "[]");
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pastaUploads);
    },
    filename: (req, file, cb) => {
        const nomeSeguro = Date.now() + "-" + file.originalname;
        cb(null, nomeSeguro);
    }
});

const tiposPermitidos = ["image/png", "image/jpeg", "application/pdf"];

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Tipo inválido. Envie apenas PNG, JPG ou PDF."));
        }
    }
});

app.post("/upload", upload.single("arquivo"), (req, res) => {
    const nomeAluno = req.body.nomeAluno;

    if (!nomeAluno) {
        return res.status(400).json({
            erro: "O nome do aluno é obrigatório."
        });
    }

    if (!req.file) {
        return res.status(400).json({
            erro: "Nenhum arquivo foi enviado."
        });
    }

    const metadado = {
        aluno: nomeAluno,
        nomeArquivo: req.file.originalname,
        tamanho: req.file.size,
        mimeType: req.file.mimetype,
        dataUpload: new Date().toLocaleString("pt-BR"),
        arquivoSalvo: req.file.filename
    };

    const dados = fs.readFileSync(caminhoMetadados, "utf8");
    const lista = dados ? JSON.parse(dados) : [];

    lista.push(metadado);

    fs.writeFileSync(caminhoMetadados, JSON.stringify(lista, null, 2));

    return res.status(200).json({
        mensagem: "Upload realizado com sucesso!"
    });
});

app.get("/arquivos", (req, res) => {
    const dados = fs.readFileSync(caminhoMetadados, "utf8");
    const lista = dados ? JSON.parse(dados) : [];

    return res.json(lista);
});

app.get("/download/:arquivo", (req, res) => {
    const arquivo = req.params.arquivo;
    const caminhoArquivo = path.join(pastaUploads, arquivo);

    if (!fs.existsSync(caminhoArquivo)) {
        return res.status(404).json({
            erro: "Arquivo não encontrado."
        });
    }

    return res.download(caminhoArquivo);
});

app.delete("/excluir/:arquivo", (req, res) => {
    const arquivo = req.params.arquivo;
    const caminhoArquivo = path.join(pastaUploads, arquivo);

    if (!fs.existsSync(caminhoArquivo)) {
        return res.status(404).json({
            erro: "Arquivo não encontrado."
        });
    }

    fs.unlinkSync(caminhoArquivo);

    const dados = fs.readFileSync(caminhoMetadados, "utf8");
    let lista = dados ? JSON.parse(dados) : [];

    lista = lista.filter((item) => {
        return item.arquivoSalvo !== arquivo;
    });

    fs.writeFileSync(caminhoMetadados, JSON.stringify(lista, null, 2));

    return res.json({
        mensagem: "Arquivo excluído com sucesso."
    });
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                erro: "Arquivo maior que 5 MB."
            });
        }
    }

    return res.status(400).json({
        erro: err.message || "Erro no servidor."
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});