
// --- Variáveis globais ---
let farmer; // Representa o trator do jogador
let corns = []; // Array de milhos na lavoura
let totalCorn = 15; // Quantidade de milhos para coletar
let collected = 0; // Milhos coletados
let gameState = 'menu'; // Estados do jogo: 'menu', 'tractorSelection', 'howToPlay', 'credits', 'playing', 'win', 'gameOver'

let sunX = 100; // Posição X do sol/lua
let clouds = []; // Array de nuvens

let cornOscillation = 0; // Para animação de balanço do milho

let tractors = [
    { color: [180, 0, 0], speed: 4, size: 1, name: "Trator Vermelho" },     // Vermelho
    { color: [0, 120, 180], speed: 6, size: 0.9, name: "Trator Azul" }, // Azul (mais rápido, menor)
    { color: [50, 180, 50], speed: 3, size: 1.2, name: "Trator Verde" }  // Verde (mais lento, maior)
];
let selectedTractor = null; // Índice do trator selecionado

let timeLimit = 60000; // 60 segundos de jogo
let startTime = 0; // Tempo de início da partida

let enemies = []; // Array de gafanhotos
let crows = []; // Array de corvos

let cutsceneState = null; // 'deliver', 'fair'
let cutsceneTimer = 0; // Contador para cutscenes
let tractorCityX, tractorCityY; // Posição do trator na cutscene da cidade

// --- Pré-carregamento (opcional, caso adicione imagens/sons) ---
function preload() {
    // Ex: font = loadFont('assets/suaFonte.otf');
    // Ex: imgTrator = loadImage('assets/trator.png');
}

// --- Configuração inicial do P5.js ---
function setup() {
    createCanvas(800, 400); // Define o tamanho da tela
    textAlign(CENTER, CENTER); // Alinhamento padrão para textos
    textFont('Georgia'); // Define a fonte para "Georgia"

    // Inicializa nuvens
    for (let i = 0; i < 4; i++) {
        clouds.push({ x: random(width), y: random(50, 150), speed: random(0.3, 0.8) });
    }
    resetGame(); // Chama a função para configurar o estado inicial do jogo
}

// --- Função para resetar o jogo para um novo início ---
function resetGame() {
    // Vida inicial do fazendeiro (trator) é 30
    farmer = { x: 150, y: 150, health: 30 };
    corns = [];
    // Adiciona os milhos com 100% de saúde inicial
    for (let i = 0; i < totalCorn; i++) {
        corns.push({ x: random(40, 440), y: random(100, 300), collected: false, health: 100 });
    }
    collected = 0;

    enemies = [];
    // Gafanhotos iniciais (4)
    for (let i = 0; i < 4; i++) {
        enemies.push({
            x: random(500, width - 50),
            y: random(100, height - 100),
            speed: random(0.4, 0.7),
            targetCorn: null,
            type: 'grasshopper'
        });
    }
    crows = [];
    // Corvos iniciais (2)
    for (let i = 0; i < 2; i++) {
        crows.push({
            x: random(width),
            y: random(0, 50),
            speed: random(1, 2),
            targetFarmer: true,
            wingOscillation: random(TWO_PI) // Para animação das asas
        });
    }

    startTime = 0; // Zera o tempo de início
    gameState = 'menu'; // Volta para o menu principal
    cutsceneState = null; // Reseta estado da cutscene
    tractorCityX = farmer.x; // Posição inicial do trator na cutscene
    tractorCityY = farmer.y;
}

// --- Loop principal do jogo ---
function draw() {
    drawBackground(); // Desenha o cenário (céu, sol, nuvens, chão)

    // Gerencia os diferentes estados do jogo
    switch (gameState) {
        case 'menu':
            drawMainMenu();
            break;
        case 'tractorSelection':
            drawTractorSelectionMenu();
            break;
        case 'howToPlay':
            drawHowToPlay();
            break;
        case 'credits':
            drawCredits();
            break;
        case 'playing':
            drawHarvestScene(); // Desenha a fazenda, milhos, trator e inimigos
            updateGame(); // Atualiza a lógica do jogo
            drawTimer(); // Desenha o tempo e contadores
            break;
        case 'win':
            // Inicia a cutscene de vitória se não estiver iniciada
            if (!cutsceneState) {
                cutsceneState = 'deliver';
                cutsceneTimer = 0;
                tractorCityX = farmer.x;
                tractorCityY = farmer.y;
            }
            drawCutscene(); // Desenha as cutscenes de vitória
            break;
        case 'gameOver':
            drawGameOver();
            break;
    }
}

// --- Desenha o cenário de fundo (céu, sol, nuvens, chão) ---
function drawBackground() {
    // Gradiente do céu (do azul claro ao azul escuro)
    for (let i = 0; i <= height - 100; i++) {
        let inter = map(i, 0, height - 100, 0, 1);
        let c = lerpColor(color(135, 206, 250), color(0, 100, 200), inter);
        stroke(c);
        line(0, i, width, i);
    }
    noStroke(); // Remove o contorno após desenhar o céu

    // Sol com brilho suave
    fill(255, 220, 0, 200); // Amarelo mais claro e semi-transparente para o brilho
    ellipse(sunX, 80, 100, 100);
    fill(255, 204, 0); // Amarelo sólido para o sol
    ellipse(sunX, 80, 80, 80);
    sunX += 0.3; // Move o sol
    if (sunX > width + 40) sunX = -40; // Reinicia o sol ao sair da tela

    // Nuvens com efeito de profundidade
    fill(255, 255, 255, 220); // Nuvens semi-transparentes
    noStroke();
    for (let c of clouds) {
        ellipse(c.x, c.y, 80, 40);
        ellipse(c.x + 30, c.y + 10, 50, 30);
        ellipse(c.x - 30, c.y + 10, 50, 30);
        c.x += c.speed; // Move a nuvem
        if (c.x > width + 80) c.x = -80; // Reinicia a nuvem ao sair da tela
    }

    // Chão da fazenda com variação de cor
    fill(80, 180, 50); // Verde base
    rect(0, height - 100, width, 100);
    fill(70, 170, 40, 150); // Sombreamento para dar profundidade
    rect(0, height - 90, width, 90);
    fill(90, 190, 60, 100); // Pontos de luz
    for (let i = 0; i < width; i += 50) {
        ellipse(i + random(-10, 10), height - random(10, 80), 5, 3);
    }
}

// --- MENU PRINCIPAL ---
function drawMainMenu() {
    fill(0);
    textSize(48);
    text("Colheita de Milho", width / 2, height / 4 - 30); // Título do jogo

    // Botões no menu principal
    drawButton(width / 2 - 110, height / 2 - 20, 220, 50, "Selecionar Trator");
    drawButton(width / 2 - 110, height / 2 + 40, 220, 50, "Começar Colheita");
    drawButton(width / 2 - 110, height / 2 + 100, 220, 50, "Como Jogar");
    drawButton(width / 2 - 110, height / 2 + 160, 220, 50, "Créditos");
}

// --- Função auxiliar para desenhar botões ---
function drawButton(x, y, w, h, label) {
    fill(255); // Cor de fundo do botão (branco)
    stroke(0); // Contorno preto
    strokeWeight(2);
    rect(x, y, w, h, 10); // Retângulo arredondado
    fill(0); // Cor do texto (preto)
    noStroke();
    textSize(20);
    text(label, x + w / 2, y + h / 2); // Texto centralizado no botão
}

// --- MENU DE SELEÇÃO DE TRATOR ---
function drawTractorSelectionMenu() {
    fill(0);
    textSize(36);
    text("Selecione seu trator", width / 2, 80);

    let startX = 130;
    let y = height / 2;
    for (let i = 0; i < tractors.length; i++) {
        let x = startX + i * 200;
        // Desenha o trator e o nome
        drawTractor(x, y, tractors[i], i === selectedTractor);
        fill(0);
        textSize(16);
        text(tractors[i].name, x, y + 80); // Nome do trator abaixo
    }

    drawButton(width / 2 - 110, height - 80, 220, 50, "Voltar");
}

// --- Tela "Como Jogar" ---
function drawHowToPlay() {
    fill(0);
    textSize(36);
    text("Como Jogar", width / 2, 80);

    textSize(20);
    text("Mova o trator com o mouse para coletar os milhos.", width / 2, height / 2 - 60);
    text("Cuidado com os gafanhotos e corvos! Eles danificam seu trator e os milhos.", width / 2, height / 2);
    text("Colete todos os milhos antes que o tempo acabe ou seu trator seja destruído.", width / 2, height / 2 + 60);
    text("Sua vida é indicada pela barra verde sobre o trator.", width / 2, height / 2 + 90);

    drawButton(width / 2 - 110, height - 80, 220, 50, "Voltar");
}

// --- Tela "Créditos" ---
function drawCredits() {
    fill(0);
    textSize(36);
    text("Créditos", width / 2, 80);

    textSize(20);
    text("Design e Programação: Angelo Rafael De Souza Bráz", width / 2, height / 2 - 30);
    text("Baseado em tutoriais de p5.js", width / 2, height / 2 + 10);

    drawButton(width / 2 - 110, height - 80, 220, 50, "Voltar");
}

// --- Função para desenhar o trator ---
function drawTractor(x, y, tractor, highlight = false) {
    push();
    translate(x, y);
    scale(tractor.size); // Aplica a escala do trator

    if (highlight) {
        stroke(255, 215, 0); // Ouro para destacar o trator selecionado
        strokeWeight(4);
    } else {
        noStroke();
    }

    // Corpo principal do trator
    fill(...tractor.color); // Usa a cor do trator
    rect(-50, 10, 100, 40, 10); // Base
    rect(-30, -30, 60, 50, 10); // Cabine

    // Detalhes da cabine
    fill(100); // Vidro escuro
    rect(-20, -20, 40, 20, 5);

    // Rodas
    fill(40); // Pneu
    ellipse(-30, 50, 40, 40); // Roda traseira
    ellipse(30, 50, 40, 40); // Roda dianteira
    fill(100); // Calota
    ellipse(-30, 50, 20, 20);
    ellipse(30, 50, 20, 20);

    // Chaminé (escapamento)
    fill(80);
    rect(20, -40, 10, 20, 3);
    fill(60); // Sombra da chaminé
    rect(20, -40, 5, 20, 3);

    // Faróis
    fill(255, 255, 100); // Luz amarela
    ellipse(-40, 20, 10, 10);
    ellipse(40, 20, 10, 10);

    pop(); // Restaura as configurações de desenho
}

// --- CENA DE COLHEITA (jogando) ---
function drawHarvestScene() {
    // Desenha as plantações de milho
    for (let corn of corns) {
        if (!corn.collected) { // Desenha apenas milhos não coletados
            drawRealisticCorn(corn.x, corn.y, corn.health);
        }
    }

    // Move e desenha o trator (jogador)
    if (selectedTractor !== null) {
        let tr = tractors[selectedTractor];
        let targetX = constrain(mouseX, 50, 750); // Limita o movimento do trator
        let targetY = constrain(mouseY, 110, 350);
        // Movimento suave do trator
        farmer.x = lerp(farmer.x, targetX, 0.3);
        farmer.y = lerp(farmer.y, targetY, 0.3);
        drawTractor(farmer.x, farmer.y, tr);

        // Barra de vida do trator
        drawTractorHealthBar(farmer.x, farmer.y - 60, farmer.health);
    }

    // Desenha gafanhotos
    for (let e of enemies) {
        drawEnemy(e);
    }
    // Desenha corvos
    for (let c of crows) {
        drawCrow(c);
    }
}

// --- Desenha o milho com detalhes e barra de vida ---
function drawRealisticCorn(x, y, health) {
    push();
    translate(x, y);
    // Animação de balanço do milho
    cornOscillation += 0.02;
    let sway = sin(cornOscillation + x) * 3;
    rotate(radians(sway));

    // Haste com textura
    stroke(40, 120, 40); // Verde escuro
    strokeWeight(6); // Haste mais grossa
    line(0, 40, 0, 0);
    stroke(30, 100, 30, 150); // Detalhe da haste para profundidade
    line(-1, 30, -1, 5);
    line(1, 35, 1, 10);

    // Folhas com curvatura
    noStroke();
    fill(30, 100, 30);
    ellipse(-15, 25, 20, 40);
    ellipse(15, 25, 20, 40);
    ellipse(-10, 10, 15, 30);
    ellipse(10, 10, 15, 30);
    // Adicionando um pouco de sombra para dar volume às folhas
    fill(20, 80, 20, 180);
    arc(-15, 25, 20, 40, PI / 2, PI + PI / 2, CHORD);
    arc(15, 25, 20, 40, -PI / 2, PI / 2, CHORD);

    // Espiga detalhada
    fill(255, 230, 0); // Cor base da espiga
    let rows = 6;
    let cols = 4;
    let seedW = 12; // Largura do grão
    let seedH = 18; // Altura do grão
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let xPos = (col - (cols - 1) / 2) * (seedW * 0.8);
            let yPos = (row * seedH * 0.7) - 15;
            fill(255, 215, 0); // Cor dos grãos (amarelo ouro)
            ellipse(xPos, -yPos, seedW, seedH);
            // Sombra para os grãos
            fill(200, 180, 0);
            arc(xPos, -yPos, seedW, seedH, PI / 2, PI + PI / 2, CHORD);
        }
    }

    // Barra de vida do milho (aparece se estiver danificado)
    if (health < 100) {
        noStroke();
        fill(255, 0, 0, 150); // Cor vermelha semi-transparente
        rect(-25, -40, 50, 5); // Fundo da barra
        fill(0, 255, 0, 150); // Cor verde da vida
        rect(-25, -40, map(health, 0, 100, 0, 50), 5); // Preenchimento da vida
    }

    pop(); // Restaura as configurações de desenho
}

// --- Desenha a barra de vida do trator ---
function drawTractorHealthBar(x, y, health) {
    push();
    translate(x, y);
    noStroke();
    fill(255, 0, 0, 150); // Vermelho (fundo da barra)
    rect(-25, -5, 50, 10);
    fill(0, 255, 0, 150); // Verde (vida atual)
    // Mapeia a vida atual (0 a 30) para a largura da barra (0 a 50)
    rect(-25, -5, map(health, 0, 30, 0, 50), 10);
    pop();
}

// --- Lógica de atualização do jogo (movimentos, ataques, condições) ---
function updateGame() {
    if (startTime === 0) startTime = millis(); // Inicia o timer se for a primeira vez

    // Dificuldade progressiva: adiciona inimigos e aumenta a velocidade a cada 15 segundos
    let elapsedSeconds = floor((millis() - startTime) / 1000);
    if (elapsedSeconds > 0 && elapsedSeconds % 15 === 0 && frameCount % 60 === 0) {
        // Adiciona mais gafanhotos
        if (enemies.length < 10) { // Limita o número de gafanhotos
            enemies.push({
                x: random(500, width - 50),
                y: random(100, height - 100),
                speed: random(0.5, 1.0), // Gafanhotos ficam mais rápidos
                targetCorn: null,
                type: 'grasshopper'
            });
        }
        // Adiciona mais corvos
        if (crows.length < 5) { // Limita o número de corvos
            crows.push({
                x: random(width),
                y: random(0, 50),
                speed: random(1.5, 2.5), // Corvos ficam mais rápidos
                targetFarmer: true,
                wingOscillation: random(TWO_PI)
            });
        }
    }

    // Lógica de colheita: verifica se o trator está perto do milho
    for (let corn of corns) {
        if (!corn.collected && dist(farmer.x, farmer.y, corn.x, corn.y) < 40) {
            corn.collected = true;
            collected++;
        }
    }

    // Lógica dos Gafanhotos: atacam milhos
    for (let e of enemies) {
        // Se o alvo não existe, foi coletado ou destruído, busca um novo milho
        if (!e.targetCorn || e.targetCorn.collected || e.targetCorn.health <= 0) {
            let uncollected = corns.filter(c => !c.collected && c.health > 0);
            if (uncollected.length > 0) {
                e.targetCorn = random(uncollected);
            } else {
                e.targetCorn = null; // Não há mais milho saudável para atacar
            }
        }
        if (e.targetCorn) {
            // Move o gafanhoto em direção ao milho alvo
            let dx = e.targetCorn.x - e.x;
            let dy = e.targetCorn.y - e.y;
            let distToCorn = dist(e.x, e.y, e.targetCorn.x, e.targetCorn.y);
            if (distToCorn > 10) { // Se não estiver muito perto, se move
                e.x += (dx / distToCorn) * e.speed;
                e.y += (dy / distToCorn) * e.speed;
            } else {
                // Gafanhoto no milho, causa dano
                e.targetCorn.health -= 0.5; // Dano gradual ao milho
                if (e.targetCorn.health <= 0) {
                    e.targetCorn.collected = true; // Milho destruído (não pode ser mais coletado)
                    e.targetCorn = null; // Gafanhoto busca novo alvo
                }
            }
        }
    }

    // Lógica dos Corvos: atacam o fazendeiro (trator)
    for (let c of crows) {
        let dx = farmer.x - c.x;
        let dy = farmer.y - c.y;
        let distToFarmer = dist(c.x, c.y, farmer.x, farmer.y);
        if (distToFarmer > 30) { // Se não estiver muito perto, se move
            c.x += (dx / distToFarmer) * c.speed;
            c.y += (dy / distToFarmer) * c.speed;
        } else {
            // Corvo atingiu o fazendeiro, causa dano ao trator
            farmer.health -= 0.1; // Dano gradual ao trator
            if (farmer.health <= 0) {
                gameState = 'gameOver'; // Jogo termina se o trator for destruído
                return; // Sai da função para evitar mais atualizações
            }
        }
        c.wingOscillation += 0.1; // Animação das asas do corvo
    }

    // Condição de vitória: todos os milhos saudáveis foram coletados
    let remainingHealthyCorn = corns.filter(c => !c.collected && c.health > 0).length;
    if (remainingHealthyCorn === 0 && collected === totalCorn) { // Todos os milhos originais foram coletados ou destruídos, e o contador de "coletados" atingiu o total original.
        gameState = 'win';
        return;
    }
    // Condição de derrota (tempo)
    let elapsed = millis() - startTime;
    if (elapsed > timeLimit) {
        gameState = 'gameOver';
        return;
    }
    // Condição de derrota adicional: todos os milhos foram destruídos e não há mais para coletar
    if (remainingHealthyCorn === 0 && collected < totalCorn) {
        gameState = 'gameOver';
        return;
    }
}

// --- Desenha o timer e os contadores na tela ---
function drawTimer() {
    let elapsed = millis() - startTime;
    let timeLeft = max(0, floor((timeLimit - elapsed) / 1000)); // Tempo restante em segundos
    fill(0);
    textSize(20);
    text(`Tempo restante: ${timeLeft}s`, width - 140, 30);
    text(`Milhos colhidos: ${collected} / ${totalCorn}`, width - 140, 60);

    let healthyCorn = corns.filter(c => c.health > 0 && !c.collected).length;
    text(`Milhos saudáveis: ${healthyCorn}`, width - 140, 90); // Mostra milhos saudáveis restantes na lavoura
}

// --- Desenha o inimigo Gafanhoto ---
function drawEnemy(e) {
    push();
    translate(e.x, e.y);
    fill(80, 150, 20); // Cor do corpo (verde)
    ellipse(0, 0, 25, 15); // Corpo oval

    // Detalhes da asa
    fill(100, 180, 40, 200); // Verde mais claro e semi-transparente
    ellipse(5, 0, 10, 30); // Asa principal
    ellipse(-5, 0, 10, 25); // Asa secundária

    stroke(0);
    strokeWeight(1);
    line(-10, 5, -15, 15); // Perna 1
    line(0, 5, 0, 18); // Perna 2
    line(10, 5, 15, 15); // Perna 3
    noStroke();

    // Olhos
    fill(0);
    ellipse(-8, -5, 3, 3);
    ellipse(8, -5, 3, 3);
    pop();
}

// --- Desenha o inimigo Corvo ---
function drawCrow(c) {
    push();
    translate(c.x, c.y);
    // Movimento de balanço do corpo
    rotate(sin(c.wingOscillation * 2) * 0.2);

    // Corpo do corvo
    fill(40); // Cor preta/cinza escura
    ellipse(0, 0, 40, 25); // Corpo oval

    // Asas com movimento
    let wingAngle = sin(c.wingOscillation) * PI / 6;
    fill(30);
    push();
    translate(-15, -5);
    rotate(-wingAngle);
    ellipse(-20, 0, 40, 15); // Asa esquerda
    pop();

    push();
    translate(15, -5);
    rotate(wingAngle);
    ellipse(20, 0, 40, 15); // Asa direita
    pop();

    // Cabeça
    fill(50);
    ellipse(0, -15, 20, 20); // Cabeça redonda

    // Bico
    fill(255, 200, 0); // Amarelo para o bico
    triangle(0, -15, 10, -10, -10, -10);

    // Olhos
    fill(255);
    ellipse(-5, -18, 5, 5);
    ellipse(5, -18, 5, 5);
    fill(0);
    ellipse(-5, -18, 2, 2);
    ellipse(5, -18, 2, 2);

    pop();
}

// --- Tela de Game Over ---
function drawGameOver() {
    fill(0);
    textSize(48);
    text("Fim de Jogo!", width / 2, height / 2 - 40);
    textSize(28);
    text("A colheita foi perdida ou o trator foi danificado.", width / 2, height / 2);
    drawButton(width / 2 - 110, height / 2 + 80, 220, 50, "Reiniciar");
}

// --- CUTSCENES DE VITÓRIA ---
function drawCutscene() {
    // Cutscene 1: Trator levando o milho para a cidade
    if (cutsceneState === 'deliver') {
        // Céu e chão da cidade
        for (let i = 0; i <= height - 80; i++) {
            let inter = map(i, 0, height - 80, 0, 1);
            let c = lerpColor(color(135, 206, 250), color(0, 100, 200), inter);
            stroke(c);
            line(0, i, width, i);
        }
        noStroke();

        fill(180); // Cor da estrada
        rect(0, height - 80, width, 80);
        fill(34, 139, 34); // Cor da grama
        rect(0, height - 160, width, 80);

        // Desenha casas
        drawHouse(600, height - 160);
        drawHouse(700, height - 160);
        drawHouse(650, height - 220);

        // Move o trator para a direita
        let tr = tractors[selectedTractor];
        tractorCityX += tr.speed / 3;
        tractorCityY = lerp(tractorCityY, height - 110, 0.05); // Trator desce suavemente para a estrada
        drawTractor(tractorCityX, tractorCityY, tr);

        fill(30);
        textSize(24);
        text("Levando o milho para a cidade...", width / 2, 40);

        // Transição para a próxima cutscene quando o trator sai da tela
        if (tractorCityX > width + 50) { // Ajustado para sair completamente
            cutsceneState = 'fair';
            cutsceneTimer = 0;
        }
    }
    // Cutscene 2: Feira da Colheita em Irati
    else if (cutsceneState === 'fair') {
        background(220, 210, 180); // Cor de fundo mais clara para a feira

        drawFairScene(); // Desenha os detalhes da feira

        fill(80, 40, 0); // Cor do texto
        textSize(28);
        text("Feira da Colheita de Irati - Moradores Festejando!", width / 2, 40);

        cutsceneTimer += deltaTime; // Atualiza o timer da cutscene
        let jump = sin(cutsceneTimer / 200) * 15; // Animação de "pulo" para os cidadãos

        // Desenha cidadãos festejando
        drawCitizen(200, height - 120 + jump);
        drawCitizen(320, height - 120 + jump / 1.5);
        drawCitizen(440, height - 120 + jump * 0.8);
        drawCitizen(560, height - 120 + jump / 2);

        // Botão para voltar ao menu
        drawButton(width / 2 - 110, height - 70, 220, 50, "Voltar ao Menu");
    }
}

// --- Desenha uma casa simples ---
function drawHouse(x, y) {
    fill(200, 120, 70); // Corpo da casa (marrom claro)
    rect(x, y + 40, 80, 60);
    fill(150, 80, 40); // Telhado (marrom escuro)
    triangle(x - 10, y + 40, x + 40, y, x + 90, y + 40);
    fill(100, 60, 30); // Porta
    rect(x + 30, y + 70, 20, 30);
    fill(0); // Janela
    rect(x + 10, y + 50, 15, 15);
    rect(x + 55, y + 50, 15, 15);
}

// --- Desenha a cena da feira com detalhes ---
function drawFairScene() {
    // Barracas de feira com cores e texturas
    fill(255, 180, 180); // Barraca 1 - Rosa claro
    rect(150, height - 170, 120, 60, 10);
    fill(180, 255, 180); // Barraca 2 - Verde claro
    rect(290, height - 170, 120, 60, 10);
    fill(180, 180, 255); // Barraca 3 - Azul claro
    rect(430, height - 170, 120, 60, 10);
    fill(255, 255, 180); // Barraca 4 - Amarelo claro
    rect(570, height - 170, 120, 60, 10);

    // Balcões das barracas com textura
    fill(139, 69, 19); // Marrom
    rect(150, height - 110, 120, 15, 5);
    rect(290, height - 110, 120, 15, 5);
    rect(430, height - 110, 120, 15, 5);
    rect(570, height - 110, 120, 15, 5);
    stroke(80, 40, 0); // Linhas para simular textura de madeira
    strokeWeight(1);
    line(150, height - 105, 270, height - 105);
    line(290, height - 105, 410, height - 105);
    line(430, height - 105, 550, height - 105);
    line(570, height - 105, 690, height - 105);
    noStroke();

    // Adicionando "produtos" nas barracas (frutas/vegetais simulados)
    fill(255, 0, 0); // Maçãs
    ellipse(180, height - 140, 15, 15);
    ellipse(200, height - 130, 15, 15);
    fill(0, 180, 0); // Brócolis
    ellipse(320, height - 140, 20, 20);
    ellipse(345, height - 130, 20, 20);
    fill(255, 200, 0); // Laranjas
    ellipse(460, height - 140, 18, 18);
    ellipse(485, height - 135, 18, 18);
    fill(150, 0, 150); // Uvas
    ellipse(600, height - 140, 12, 12);
    ellipse(610, height - 130, 12, 12);
    ellipse(620, height - 140, 12, 12);

    // Decorações da feira
    drawBunting(width / 2, 80, 150, 10); // Bandeirolas
    // Balões com cordão e leve brilho
    fill(255, 100, 100, 200); // Vermelho claro
    ellipse(100, 100, 30, 40);
    fill(255, 200, 200, 100); // Brilho
    ellipse(95, 95, 10, 10);
    stroke(0);
    strokeWeight(1);
    line(100, 120, 100, 160);

    fill(100, 100, 255, 200); // Azul claro
    ellipse(700, 110, 30, 40);
    fill(200, 200, 255, 100); // Brilho
    ellipse(695, 105, 10, 10);
    line(700, 130, 700, 170);
    noStroke();

    // Pequenas árvores/arbustos para ambientar
    fill(34, 139, 34); // Verde escuro
    ellipse(100, height - 100, 40, 40);
    ellipse(700, height - 100, 40, 40);
    fill(20, 100, 20); // Sombra nos arbustos
    arc(100, height - 100, 40, 40, PI / 2, PI + PI / 2, CHORD);
    arc(700, height - 100, 40, 40, PI / 2, PI + PI / 2, CHORD);
}

// --- Desenha bandeirinhas de festa ---
function drawBunting(x, y, totalWidth, numFlags) {
    let flagWidth = totalWidth / numFlags;
    let flagHeight = 20;
    for (let i = 0; i < numFlags; i++) {
        let flagX = x - totalWidth / 2 + i * flagWidth;
        let flagY = y;
        let colors = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0]]; // Cores variadas
        fill(colors[i % colors.length]);
        // Triângulos com um pouco de curvatura
        beginShape();
        vertex(flagX, flagY);
        vertex(flagX + flagWidth / 2, flagY + flagHeight);
        vertex(flagX + flagWidth, flagY);
        endShape(CLOSE);
    }
    stroke(0);
    strokeWeight(2);
    line(x - totalWidth / 2, y, x + totalWidth / 2, y); // Linha para as bandeiras
    noStroke();
}

// --- Desenha um cidadão (personagem simples) ---
function drawCitizen(x, y) {
    // Corpo
    fill(255, 220, 180); // Cor da pele
    ellipse(x, y, 30, 50); // Corpo oval
    fill(100, 150, 250); // Roupa (azul claro)
    rect(x - 15, y - 10, 30, 40, 5); // Camisa

    // Cabeça
    fill(255, 200, 160);
    ellipse(x, y - 30, 30, 30);

    // Braços
    fill(255, 220, 180);
    ellipse(x - 18, y + 5, 10, 25); // Braço esquerdo
    ellipse(x + 18, y + 5, 10, 25); // Braço direito

    // Pernas
    fill(100, 50, 50); // Calça (marrom)
    rect(x - 10, y + 30, 8, 20, 3);
    rect(x + 2, y + 30, 8, 20, 3);

    // Olhos
    fill(0);
    ellipse(x - 7, y - 32, 5, 5);
    ellipse(x + 7, y - 32, 5, 5);

    // Boca
    fill(255);
    arc(x, y - 25, 10, 5, 0, PI);
}

// --- Controle dos cliques do mouse ---
function mousePressed() {
    if (gameState === 'menu') {
        // Clica em "Selecionar Trator"
        if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height / 2 - 20 && mouseY < height / 2 + 30) {
            gameState = 'tractorSelection';
        }
        // Clica em "Começar Colheita" (só se um trator estiver selecionado)
        else if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height / 2 + 40 && mouseY < height / 2 + 90 && selectedTractor !== null) {
            startTime = millis(); // Inicia o timer do jogo
            gameState = 'playing';
        }
        // Clica em "Como Jogar"
        else if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height / 2 + 100 && mouseY < height / 2 + 150) {
            gameState = 'howToPlay';
        }
        // Clica em "Créditos"
        else if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height / 2 + 160 && mouseY < height / 2 + 210) {
            gameState = 'credits';
        }
    } else if (gameState === 'tractorSelection') {
        let startX = 130;
        let y = height / 2;
        // Seleciona um trator
        for (let i = 0; i < tractors.length; i++) {
            let x = startX + i * 200;
            if (mouseX > x - 75 && mouseX < x + 75 && mouseY > y - 75 && mouseY < y + 75) {
                selectedTractor = i; // Define o trator selecionado
                return;
            }
        }
        // Clica em "Voltar"
        if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height - 80 && mouseY < height - 30) {
            gameState = 'menu';
        }
    } else if (gameState === 'howToPlay' || gameState === 'credits') {
        // Clica em "Voltar" nas telas de instrução/créditos
        if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height - 80 && mouseY < height - 30) {
            gameState = 'menu';
        }
    } else if (gameState === 'win') {
        // Na tela final da feira, clica em "Voltar ao Menu"
        if (cutsceneState === 'fair') {
            if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height - 70 && mouseY < height - 20) {
                resetGame(); // Reinicia o jogo
            }
        }
    } else if (gameState === 'gameOver') {
        // Clica em "Reiniciar" na tela de Game Over
        if (mouseX > width / 2 - 110 && mouseX < width / 2 + 110 && mouseY > height / 2 + 80 && mouseY < height / 2 + 130) {
            resetGame(); // Reinicia o jogo
        }
    }
}