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

// Exibe nome do arquivo
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
// 2. FUNÇÕES DE MODAL PERSONALIZADO
// ==========================================
window.showAlert = function(title, msg, type) {
    var modal = document.getElementById('custom-alert');
    var box = document.getElementById('alert-box');
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-msg').innerText = msg;
    
    // Cores
    box.classList.remove('success-modal', 'error-modal');
    if (type === 'success') box.classList.add('success-modal');
    if (type === 'error') box.classList.add('error-modal');

    modal.classList.remove('hidden');
}

window.fecharAlert = function() {
    document.getElementById('custom-alert').classList.add('hidden');
}

window.showConfirm = function(title, msg, callback) {
    var modal = document.getElementById('custom-confirm');
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-msg').innerText = msg;
    
    var btnYes = document.getElementById('btn-confirm-yes');
    
    // Remove eventos anteriores para não acumular
    var newBtn = btnYes.cloneNode(true);
    btnYes.parentNode.replaceChild(newBtn, btnYes);
    
    newBtn.addEventListener('click', function() {
        callback();
        window.fecharConfirm();
    });
    
    modal.classList.remove('hidden');
}

window.fecharConfirm = function() {
    document.getElementById('custom-confirm').classList.add('hidden');
}

// ==========================================
// 3. ADMIN & LOGIN
// ==========================================
window.cliqueBotaoAdmin = async function(e) {
    e.preventDefault();
    // Fecha menu mobile
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
    if(!email || !pass) return window.showAlert("Erro", "Preencha e-mail e senha!", "error");

    const { error } = await _supabase.auth.signInWithPassword({ email: email, password: pass });
    if (error) window.showAlert("Erro", error.message, "error");
    else { 
        window.fecharModal(); 
        window.checarSessao(); 
        window.showAlert("Sucesso", "Bem-vinda, Dra. Ariana!", "success");
    }
}

window.fazerLogout = async function() {
    await _supabase.auth.signOut();
    window.checarSessao();
    window.showAlert("Logout", "Você saiu do sistema.", "success");
}

// ==========================================
// 4. POSTAGEM (SUBSTITUINDO ALERTS)
// ==========================================
window.publicarPost = async function() {
    var title = document.getElementById('post-title').value;
    var content = document.getElementById('post-content').value;
    var fileInput = document.getElementById('post-image-file');
    var file = fileInput.files[0];
    if(!title || !content) return window.showAlert("Atenção", "Título e conteúdo são obrigatórios.", "error");

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
    
    if(error) { 
        window.showAlert("Erro Banco", error.message, "error");
    } else { 
        window.showAlert("Sucesso", "Artigo publicado!", "success");
        document.getElementById('post-title').value = ''; 
        document.getElementById('post-content').value = ''; 
        fileInput.value = ''; 
        document.getElementById('file-name').innerText = ''; 
        window.atualizarPrevia(); 
        window.carregarPosts(); 
    }
}

window.deletarPost = function(id) {
    window.showConfirm("Excluir Artigo", "Tem certeza que deseja apagar este post permanentemente?", async function() {
        const { error } = await _supabase.from('posts').delete().eq('id', id);
        if(error) window.showAlert("Erro", error.message, "error");
        else {
            window.showAlert("Sucesso", "Artigo excluído.", "success");
            window.carregarPosts();
        }
    });
}

// ... Resto das funções auxiliares (atualizarPrevia, carregarPosts, etc) iguais ao anterior ...
// Apenas garanta que o código abaixo esteja lá:

window.atualizarPrevia = function() {
    var title = document.getElementById('post-title').value || "Título do Artigo";
    var content = document.getElementById('post-content').value || "Conteúdo...";
    var fileInput = document.getElementById('post-image-file');
    var previewContainer = document.getElementById('live-preview-container');
    var imgUrl = 'https://via.placeholder.com/400x300?text=Sua+Foto+Aqui';

    if (fileInput.files && fileInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) { previewContainer.innerHTML = window.gerarHTMLCard(title, content, e.target.result, null, true); }
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
            <button onclick="window.copiarLink(${id})" class="btn-share"><i class="fas fa-link"></i> Link</button>
            <button onclick="window.deletarPost(${id})" class="btn-delete" style="display:none; color:red; border:none; background:none; cursor:pointer; margin-top:5px;"><i class="fas fa-trash"></i></button>
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
    if (postId) {
        setTimeout(() => {
            const element = document.getElementById('post-' + postId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.style.border = "2px solid #D4AF37";
            }
        }, 1000);
    }
}

window.mostrarBotoesAdmin = function(visivel) {
    var btns = document.querySelectorAll('.btn-delete');
    btns.forEach(btn => btn.style.display = visivel ? 'block' : 'none');
}