// ==========================================
// 1. CONFIGURAÇÃO
// ==========================================
var SUPABASE_URL = 'https://dzedlukbhypaammdgavg.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6ZWRsdWtiaHlwYWFtbWRnYXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDI1MDQsImV4cCI6MjA4NTIxODUwNH0.q0e7dt4r_eDOEDgQgovS6mWo1I62H8w-Bq43wmXZnPU';

var _supabase;
try {
    if (window.supabase) {
        _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase conectado.");
    }
} catch (error) { console.error(error); }

var loginModal = document.getElementById('login-modal');
var adminPanel = document.getElementById('admin-panel');
var btnLoginArea = document.getElementById('btn-login-area');
window.postsData = {};

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('post-image-file');
    if(fileInput) {
        fileInput.addEventListener('change', function(e) {
            var fileName = e.target.files[0] ? e.target.files[0].name : '';
            document.getElementById('file-name').innerText = fileName ? "Arquivo: " + fileName : "";
            window.atualizarPrevia();
        });
    }
});

// ==========================================
// 2. FUNÇÕES DE MODAL
// ==========================================
window.showAlert = function(title, msg, type) {
    var modal = document.getElementById('custom-alert');
    var box = document.getElementById('alert-box');
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-msg').innerText = msg;
    box.classList.remove('success-modal', 'error-modal');
    if (type === 'success') box.classList.add('success-modal');
    if (type === 'error') box.classList.add('error-modal');
    modal.classList.remove('hidden');
}
window.fecharAlert = function() { document.getElementById('custom-alert').classList.add('hidden'); }

window.showConfirm = function(title, msg, callback) {
    var modal = document.getElementById('custom-confirm');
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-msg').innerText = msg;
    var btnYes = document.getElementById('btn-confirm-yes');
    var newBtn = btnYes.cloneNode(true);
    btnYes.parentNode.replaceChild(newBtn, btnYes);
    newBtn.addEventListener('click', function() { callback(); window.fecharConfirm(); });
    modal.classList.remove('hidden');
}
window.fecharConfirm = function() { document.getElementById('custom-confirm').classList.add('hidden'); }

// --- MODAL DE CONTEÚDO ---
window.abrirModalContent = function(titulo, texto, imgUrl) {
    document.getElementById('modal-img-content').src = imgUrl || 'https://via.placeholder.com/800x400';
    document.getElementById('modal-title-content').innerText = titulo;
    document.getElementById('modal-body-content').innerHTML = texto; 
    document.getElementById('content-modal').classList.remove('hidden');
}

window.abrirModalSobre = function() {
    var containerTexto = document.getElementById('about-text-container');
    var htmlTexto = containerTexto.innerHTML; 
    var imgUrl = document.getElementById('foto-dra').src;
    window.abrirModalContent("Drª Ariana Mendonça", htmlTexto, imgUrl);
}

window.abrirModalPost = function(id) {
    var post = window.postsData[id];
    if (post) {
        var textoFormatado = post.content.replace(/\n/g, '<br>');
        window.abrirModalContent(post.title, textoFormatado, post.image_url);
    }
}

window.fecharModalContent = function() { document.getElementById('content-modal').classList.add('hidden'); }

// ==========================================
// 3. ENVIAR LEAD
// ==========================================
window.enviarFormulario = function() {
    var nome = document.getElementById('lead-name').value;
    var whatsappCliente = document.getElementById('lead-whatsapp').value;
    var resumo = document.getElementById('lead-summary').value;

    if (!nome || !whatsappCliente || !resumo) {
        return window.showAlert("Atenção", "Por favor, preencha todos os campos.", "error");
    }

    var numeroAdvogada = "5588996074394"; 
    var textoMensagem = `Olá, vim pelo site da AM Advocacia.%0A%0A*Nome:* ${nome}%0A*WhatsApp:* ${whatsappCliente}%0A*Caso:* ${resumo}`;
    var linkWhatsApp = `https://wa.me/${numeroAdvogada}?text=${textoMensagem}`;

    window.open(linkWhatsApp, '_blank');

    document.getElementById('lead-name').value = '';
    document.getElementById('lead-whatsapp').value = '';
    document.getElementById('lead-summary').value = '';
}

// ==========================================
// 4. ADMIN & LOGIN & CADASTRO
// ==========================================
window.cliqueBotaoAdmin = async function(e) {
    e.preventDefault();
    var menuToggle = document.getElementById('menu-toggle');
    if(menuToggle) menuToggle.checked = false;

    if (!_supabase) return;
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        window.showConfirm("Logout", "Deseja sair do sistema?", window.fazerLogout);
    } else {
        loginModal.classList.remove('hidden');
    }
}
window.fecharModal = function() { loginModal.classList.add('hidden'); }

window.fazerLogin = async function() {
    var email = document.getElementById('email-login').value;
    var pass = document.getElementById('pass-login').value;
    if(!email || !pass) return window.showAlert("Erro", "Preencha tudo!", "error");
    const { error } = await _supabase.auth.signInWithPassword({ email: email, password: pass });
    if (error) window.showAlert("Erro", error.message, "error");
    else { window.fecharModal(); window.checarSessao(); window.showAlert("Sucesso", "Bem-vinda!", "success"); }
}

// NOVA FUNÇÃO: CRIAR CONTA
window.criarConta = async function() {
    var email = document.getElementById('email-login').value;
    var pass = document.getElementById('pass-login').value;
    
    if(!email || !pass) return window.showAlert("Erro", "Preencha e-mail e senha para cadastrar.", "error");
    
    const { data, error } = await _supabase.auth.signUp({
        email: email,
        password: pass,
    });

    if (error) {
        window.showAlert("Erro no Cadastro", error.message, "error");
    } else {
        window.showAlert("Sucesso", "Cadastro realizado! Verifique seu e-mail para confirmar antes de entrar.", "success");
        window.fecharModal();
    }
}

window.fazerLogout = async function() { await _supabase.auth.signOut(); window.checarSessao(); window.showAlert("Logout", "Saiu.", "success"); }

// ==========================================
// 5. PUBLICAR POST
// ==========================================
window.publicarPost = async function() {
    var title = document.getElementById('post-title').value;
    var content = document.getElementById('post-content').value;
    var fileInput = document.getElementById('post-image-file');
    var file = fileInput.files[0];
    if(!title || !content) return window.showAlert("Atenção", "Preencha tudo.", "error");

    var btnPub = document.querySelector('#admin-panel .btn-blue');
    btnPub.innerText = "Enviando...";
    btnPub.disabled = true;

    let publicImageUrl = "";
    if (file) {
        try {
            const fileName = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const { error } = await _supabase.storage.from('blog-images').upload(fileName, file);
            if (error) throw error;
            const { data: { publicUrl } } = _supabase.storage.from('blog-images').getPublicUrl(fileName);
            publicImageUrl = publicUrl;
        } catch (uploadError) {
            window.showAlert("Erro Upload", uploadError.message, "error");
            btnPub.innerText = "Publicar Artigo";
            btnPub.disabled = false;
            return;
        }
    }
    const { error } = await _supabase.from('posts').insert([{ title: title, content: content, image_url: publicImageUrl }]);
    btnPub.innerText = "Publicar Artigo";
    btnPub.disabled = false;
    
    if(error) { window.showAlert("Erro Banco", error.message, "error"); } 
    else { 
        window.showAlert("Sucesso", "Artigo publicado!", "success");
        document.getElementById('post-title').value = ''; 
        document.getElementById('post-content').value = ''; 
        fileInput.value = ''; 
        document.getElementById('file-name').innerText = ''; 
        window.atualizarPrevia(); 
        window.carregarPosts(); 
    }
}

// ==========================================
// 6. CARREGAMENTO E VISUALIZAÇÃO
// ==========================================
window.atualizarPrevia = function() {
    var title = document.getElementById('post-title').value || "Título do Artigo";
    var content = document.getElementById('post-content').value || "Conteúdo...";
    var fileInput = document.getElementById('post-image-file');
    var previewContainer = document.getElementById('live-preview-container');
    var imgUrl = 'https://via.placeholder.com/400x300?text=Sua+Foto+Aqui';

    if (fileInput.files && fileInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) { 
            previewContainer.style.border = "none";
            previewContainer.style.background = "transparent";
            previewContainer.innerHTML = window.gerarHTMLCard(title, content, e.target.result, null, true); 
        }
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        previewContainer.innerHTML = window.gerarHTMLCard(title, content, imgUrl, null, true);
    }
}

window.gerarHTMLCard = function(title, content, imgUrl, id, isPreview) {
    var buttonsHtml = '';
    if (isPreview) {
        buttonsHtml = `<span style="font-size:0.8rem; color:#888;">(Botões após publicar)</span>`;
    } else {
        buttonsHtml = `
            <button onclick="window.abrirModalPost(${id})" class="btn-read-more">Ler Artigo Completo</button>
            <button onclick="window.copiarLink(${id})" class="btn-share"><i class="fas fa-link"></i></button>
            <button onclick="window.deletarPost(${id})" class="btn-delete" style="display:none; color:red; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
        `;
    }
    return `
        <article class="blog-card" id="${id ? 'post-'+id : ''}">
            <div class="blog-img-wrapper"><img src="${imgUrl}" class="blog-img"></div>
            <div class="blog-content">
                <h3>${title}</h3><p>${content}</p>
                <div class="blog-actions">${buttonsHtml}</div>
            </div>
        </article>
    `;
}

if (!window.scriptIniciado) {
    document.addEventListener('DOMContentLoaded', () => { window.carregarPosts(); window.checarSessao(); window.atualizarPrevia(); });
    window.scriptIniciado = true;
}

window.checarSessao = async function() {
    if (!_supabase) return;
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        if(adminPanel) adminPanel.classList.remove('hidden');
        if(btnLoginArea) { btnLoginArea.innerText = "Sair"; btnLoginArea.style.color = "red"; }
        window.mostrarBotoesAdmin(true);
    } else {
        if(adminPanel) adminPanel.classList.add('hidden');
        if(btnLoginArea) { btnLoginArea.innerText = "Admin"; btnLoginArea.style.color = "#888"; }
        window.mostrarBotoesAdmin(false);
    }
}

window.carregarPosts = async function() {
    if (!_supabase) return;
    var feed = document.getElementById('blog-feed');
    feed.innerHTML = 'Carregando...';
    const { data: posts, error } = await _supabase.from('posts').select('*').order('created_at', { ascending: false });
    feed.innerHTML = ''; 
    if (posts && posts.length > 0) {
        document.getElementById('no-posts-msg').style.display = 'none';
        posts.forEach(post => {
            window.postsData[post.id] = post; 
            var img = post.image_url || 'https://via.placeholder.com/400x300?text=AM+Advocacia';
            feed.innerHTML += window.gerarHTMLCard(post.title, post.content, img, post.id, false);
        });
        window.checarSessao();
        window.verificarLinkCompartilhado();
    } else {
        document.getElementById('no-posts-msg').style.display = 'block';
    }
}

window.copiarLink = function(id) {
    const url = window.location.origin + window.location.pathname + '?id=' + id;
    navigator.clipboard.writeText(url).then(() => { window.showAlert("Sucesso", "Link copiado!", "success"); }).catch(err => { prompt("Copie:", url); });
}

window.verificarLinkCompartilhado = function() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    if (postId && window.postsData[postId]) {
        window.abrirModalPost(postId);
    }
}

window.deletarPost = function(id) {
    window.showConfirm("Excluir", "Apagar post?", async function() {
        const { error } = await _supabase.from('posts').delete().eq('id', id);
        if(error) window.showAlert("Erro", error.message, "error");
        else { window.carregarPosts(); window.showAlert("Sucesso", "Apagado.", "success"); }
    });
}

window.mostrarBotoesAdmin = function(visivel) {
    var btns = document.querySelectorAll('.btn-delete');
    btns.forEach(btn => btn.style.display = visivel ? 'block' : 'none');
}