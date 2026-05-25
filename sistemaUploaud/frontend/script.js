const menuItems = document.querySelectorAll(".menu-item");
const pages = document.querySelectorAll(".page");

const formulario = document.getElementById("formulario");
const mensagem = document.getElementById("mensagem");
const listaArquivos = document.getElementById("listaArquivos");

const totalArquivos = document.getElementById("totalArquivos");
const totalPdf = document.getElementById("totalPdf");
const totalImagens = document.getElementById("totalImagens");

menuItems.forEach((button) => {
    button.addEventListener("click", () => {
        menuItems.forEach((btn) => btn.classList.remove("active"));
        pages.forEach((page) => page.classList.remove("active-page"));

        button.classList.add("active");

        const pageId = button.dataset.page;
        document.getElementById(pageId).classList.add("active-page");
    });
});

formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nomeAluno = formulario.nomeAluno.value.trim();
    const arquivo = formulario.arquivo.files[0];

    if (!nomeAluno) {
        mostrarMensagem("Digite o nome do aluno.", "red");
        return;
    }

    if (!arquivo) {
        mostrarMensagem("Selecione um arquivo.", "red");
        return;
    }

    const tiposPermitidos = [
        "image/png",
        "image/jpeg",
        "application/pdf"
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
        mostrarMensagem("Tipo inválido. Envie apenas PNG, JPG ou PDF.", "red");
        return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
        mostrarMensagem("Arquivo muito grande. O limite é 5 MB.", "red");
        return;
    }

    const dadosFormulario = new FormData(formulario);

    try {
        const resposta = await fetch("/upload", {
            method: "POST",
            body: dadosFormulario
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            mostrarMensagem(dados.erro, "red");
            return;
        }

        mostrarMensagem(dados.mensagem, "green");

        formulario.reset();
        carregarArquivos();

    } catch (erro) {
        mostrarMensagem("Erro ao enviar o arquivo.", "red");
    }
});

function mostrarMensagem(texto, cor) {
    mensagem.textContent = texto;
    mensagem.style.color = cor;
}

async function carregarArquivos() {
    listaArquivos.innerHTML = "";

    try {
        const resposta = await fetch("/arquivos");
        const arquivos = await resposta.json();

        let pdfs = 0;
        let imagens = 0;

        arquivos.forEach((arquivo) => {
            if (arquivo.mimeType === "application/pdf") {
                pdfs++;
            }

            if (
                arquivo.mimeType === "image/png" ||
                arquivo.mimeType === "image/jpeg"
            ) {
                imagens++;
            }

            listaArquivos.innerHTML += `
                <tr>
                    <td>${arquivo.aluno}</td>
                    <td>${arquivo.nomeArquivo}</td>
                    <td>${(arquivo.tamanho / 1024).toFixed(2)} KB</td>
                    <td>${arquivo.mimeType}</td>
                    <td>${arquivo.dataUpload}</td>
                    <td class="acoes">

    <a 
        class="download-btn"
        href="/download/${arquivo.arquivoSalvo}"
    >
        Baixar
    </a>

    <button 
        class="delete-btn"
        onclick="excluirArquivo('${arquivo.arquivoSalvo}')"
    >
        X
    </button>

</td>
                </tr>
            `;
        });

        totalArquivos.textContent = arquivos.length;
        totalPdf.textContent = pdfs;
        totalImagens.textContent = imagens;

    } catch (erro) {
        listaArquivos.innerHTML = `
            <tr>
                <td colspan="6">Erro ao carregar arquivos.</td>
            </tr>
        `;
    }
}

carregarArquivos();

async function excluirArquivo(nomeArquivo) {

    const confirmar = confirm(
        "Deseja realmente excluir este arquivo?"
    );

    if (!confirmar) {
        return;
    }

    try {

        const resposta = await fetch(
            `/excluir/${nomeArquivo}`,
            {
                method: "DELETE"
            }
        );

        const dados = await resposta.json();

        mostrarMensagem(dados.mensagem, "red");

        carregarArquivos();

    } catch (erro) {

        mostrarMensagem(
            "Erro ao excluir arquivo.",
            "red"
        );
    }
}

