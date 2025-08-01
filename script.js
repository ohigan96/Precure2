// プレイヤー状態をまとめた配列（1～2体）
let players = [];
// 敵の状態も配列（1～2体）
let enemies = [];
let battleLogLive = [];
let sessionLogs = [];

let turnOrder = [];
let currentTurnIndex = 0;
let isPlayerTurn = true;
let gameEnded = false;

console.log(document.getElementById("playerNameLabel"));

// キャラ選択時の表示切り替えは HTML の設定（multiple）
function showSection(sectionIds) {
    const all = ["startMenu", "gameUI", "logPanel", "sessionLogPanel", "restartMenu", "instructionsPanel", "enemyListPanel", "characterListPanel", "precureImg"];
    all.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.display = sectionIds.includes(id) ? "block" : "none";
    });
}

function startGame() {
    const playerName = document.getElementById("playerInput").value.trim();
    const select = document.getElementById("characterSelect");
    const opts = Array.from(select.selectedOptions).filter(o => o.value);
    if (!playerName) { alert("名前を入力してください！"); return; }
    if (opts.length === 0 || opts.length > 2) {
        alert("キャラクターを1～2人選んでね！"); return;
    }

    // プレイヤー配列にステータス生成
    players = opts.map((o, i) => getCharacterStatus(
        o.value,
        playerName
    ));

    enemies = generateEnemies(opts.length);

    battleLogLive = [];
    document.getElementById("battleLog").innerHTML = "";

    updateDisplay();
    showSection(["gameUI", "logPanel"]);

    const label = document.getElementById("playerNameLabel");
    if (label) {
        label.textContent = players[0].userName;
    }


    const classLabel = document.getElementById("charClassLabel");

    if (classLabel) {
        const nameMap = {
            sky: "キュアスカイ",
            prism: "キュアプリズム",
            wing: "キュアウイング",
            butterfly: "キュアバタフライ",
            majesty: "キュアマジェスティ",
            elle: "エルちゃん",
            shalala: "シャララ隊長"
        };

        classLabel.textContent = opts
            .map(o => nameMap[o.value] || "？？？")
            .join(" & ");
    }
    setupSpecialButtons(opts.map(o => o.value));

    gameEnded = false;
    setupTurnOrder();
    isPlayerTurn = players.includes(turnOrder[0]);
}

// 敵生成
function generateEnemies(n) {
    const types = ["カバトン", "バッタモンダー", "ミノトン", "カイゼリン", "スキアヘッド", "カイザー"];
    const shuffled = types.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n).map(name => getEnemyTemplate(name));
}

// キャラクター生成
function getCharacterStatus(type, name) {
    const map = {
        sky: [150, 50], prism: [90, 25], wing: [100, 45],
        butterfly: [110, 30], majesty: [120, 65],
        elle: [60, 25], shalala: [300, 100]
    };
    const charNameMap = {
        sky: "キュアスカイ",
        prism: "キュアプリズム",
        wing: "キュアウイング",
        butterfly: "キュアバタフライ",
        majesty: "キュアマジェスティ",
        elle: "エルちゃん",
        shalala: "シャララ隊長"
    };
    const [hp, att] = map[type];
    return {
        type,
        name: charNameMap[type] || "？？？",  // キャラ名（表示用）
        userName: name, // 入力したプレイヤー名
        hp,
        maxHP: hp,
        attack: att,
        defending: false,
        potionUsed: false
    };
}

function getEnemyTemplate(sel) {
    const map = {
        カバトン: [80, 30], バッタモンダー: [100, 20], ミノトン: [130, 45],
        カイゼリン: [90, 35], スキアヘッド: [250, 50], カイザー: [800, 80]
    };
    const [hp, att] = map[sel];
    return { name: sel, hp, maxHP: hp, attack: att };
}

function log(msg) {
    const p = document.createElement("p");
    p.textContent = msg;
    document.getElementById("battleLog").appendChild(p);
    const lp = document.getElementById("battleLog");
    lp.scrollTop = lp.scrollHeight;
    battleLogLive.push(msg);
}

function updateDisplay() {
    const statusArea = document.querySelector(".statusArea");
    statusArea.innerHTML = ""; // リセット

    const charNameMap = {
        sky: "キュアスカイ",
        prism: "キュアプリズム",
        wing: "キュアウイング",
        butterfly: "キュアバタフライ",
        majesty: "キュアマジェスティ",
        elle: "エルちゃん",
        shalala: "シャララ隊長"
    };
    const maxLen = Math.max(players.length, enemies.length);

    for (let i = 0; i < maxLen; i++) {
        const statusBox = document.createElement("div");
        statusBox.className = "statusBox";

        // プレイヤー
        const pl = players[i];
        const playerDiv = document.createElement("div");
        playerDiv.className = "playerDiv";
        if (pl) {
            const charName = charNameMap[pl.type] || "？？？";
            playerDiv.innerHTML = `
        <p>${charName} HP: <span id="playerHP${i}">${pl.hp}</span></p>
        <div class="playerStatus">
          <img src="img/${pl.type}.png" width="80" height="80">
          <div class="hp-bar">
            <div id="playerHPBar${i}" class="bar-fill high" style="width:100%">100%</div>
          </div>
        </div>`;
        }

        // 敵
        const en = enemies[i];
        const enemyDiv = document.createElement("div");
        enemyDiv.className = "enemyDiv";
        if (en) {
            enemyDiv.innerHTML = `
        <p>${en.name} (敵) HP: <span id="enemyHP${i}">${en.hp}</span></p>
        <div class="enemyStatus">
          <div class="hp-bar">
            <div id="enemyHPBar${i}" class="bar-fill high" style="width:100%">100%</div>
          </div>
          <img src="img/${en.name}.png" width="80" height="80">
        </div>`;
        }

        statusBox.appendChild(playerDiv);
        statusBox.appendChild(enemyDiv);
        statusArea.appendChild(statusBox);

        if (pl) updateBar(pl, `playerHPBar${i}`, `playerHP${i}`);
        if (en) updateBar(en, `enemyHPBar${i}`, `enemyHP${i}`);
    }
    updateSpecialButtonsState();
}

function updateBar(ent, barId, textId) {
    const percent = Math.floor(ent.hp / ent.maxHP * 100);
    const bar = document.getElementById(barId);
    bar.style.width = percent + "%";
    bar.textContent = percent + "%";
    bar.classList.remove("high", "mid", "low");
    if (percent > 50) bar.classList.add("high");
    else if (percent > 20) bar.classList.add("mid");
    else bar.classList.add("low");
    document.getElementById(textId).textContent = ent.hp;
}

function shuffleTurnOrder() {
    return [...players, ...enemies].sort(() => Math.random() - 0.5);
}

// プレイヤー攻撃ボタンから呼ばれる
function playerAttack() {
    if (!isPlayerTurn || gameEnded) return;

    const attacker = turnOrder[currentTurnIndex];
    if (!attacker || attacker.hp <= 0) return;

    const targets = enemies.filter(e => e.hp > 0);
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    const hitChance = Math.random();

    if (hitChance < 0.2) {
        log(`${attacker.name} の攻撃 → ${target.name} はかわした！`);
    } else {
        const dmg = getAttackDamage(attacker.attack);
        target.hp = Math.max(0, target.hp - dmg);
        log(`${attacker.name} の攻撃 → ${target.name} に ${dmg} ダメージ！`);
    }

    updateDisplay();
    checkEnd();
    isPlayerTurn = false;
    nextTurn();
}

// 敵の攻撃（自動）
function enemyAttack(attacker) {
    const targets = players.filter(p => p.hp > 0);
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];

    // 最低ダメージ15、最大ダメージattacker.attack
    const minDmg = 15;
    const maxDmg = attacker.attack;
    let dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;

    if (Math.random() < 0.1) {
        dmg = Math.floor(dmg * 1.8);
        log(`⚠️ ${target.name} に ${attacker.name} の痛恨の一撃！`);
    }

    target.hp = Math.max(0, target.hp - dmg);
    log(`${attacker.name} の攻撃 → ${target.name} に ${dmg} ダメージ！`);

    updateDisplay();
    checkEnd();
}

// 1体ずつターン処理
function nextTurn() {
    if (gameEnded) return;

    currentTurnIndex++;
    if (currentTurnIndex >= turnOrder.length) {
        setupTurnOrder();
    }

    const nextEntity = turnOrder[currentTurnIndex];
    if (!nextEntity || nextEntity.hp <= 0) {
        nextTurn(); // 死亡キャラスキップ
        return;
    }

    if (players.includes(nextEntity)) {
        isPlayerTurn = true;
    } else {
        isPlayerTurn = false;
        setTimeout(() => {
            enemyAttack(nextEntity);
            nextTurn();
        }, 700);
    }
}

// 攻撃順シャッフル
function setupTurnOrder() {
    const alivePlayers = players.filter(p => p.hp > 0);
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    const others = [...alivePlayers.slice(1), ...aliveEnemies].sort(() => Math.random() - 0.5);
    turnOrder = [alivePlayers[0], ...others];
    currentTurnIndex = 0;
    isPlayerTurn = true;
}

function defendAction() {
    // 全プレイヤー防御フラグ ON
    players.forEach(p => p.defending = true);
    log("全員が防御態勢！");
    isPlayerTurn = false;
    nextTurn();
}

function usePotion() {
    players.forEach(p => {
        if (!p.potionUsed && p.hp > 0) {
            p.hp = Math.min(p.maxHP, p.hp + 25);
            p.potionUsed = true;
            log(`${p.name} はポーション使用！ HPが25増えた！`);
            document.getElementById("potionButton").disabled = true;
        }
    });
    // setTimeout(playerAttack, 600);
    updateDisplay();
    // プレイヤーのターンを終了し、次のターンへ
    isPlayerTurn = false;
    nextTurn();
}

function setupSpecialButtons(types) {
    document.querySelectorAll(".special-button").forEach(btn => {
        btn.style.display = "none";
        btn.disabled = true;
    });
    types.forEach(t => {
        const btn = document.getElementById(`${t}-special`);
        if (btn) {
            btn.style.display = "inline-block";
            btn.disabled = false;
        }
    });
}

function playerSkill(ev) {
    if (gameEnded) return;

    const btnId = ev.target.id; // 例: "sky-special"
    const characterType = btnId.replace("-special", "");

    // プレイヤーの中から、そのtypeのキャラを探す
    const attacker = players.find(p => p.type === characterType && p.hp > 0);

    if (!attacker) {
        log(`⚠️ そのキャラクターは使用できません（HP 0 または未参加）。`);
        return;
    }

    // 必殺技を撃つキャラをターンキャラに強制指定
    const attackerIndex = turnOrder.findIndex(p => p === attacker);
    if (attackerIndex === -1) {
        log(`⚠️ ${attacker.name} はこのターンでは行動できません`);
        return;
    }

    currentTurnIndex = attackerIndex;
    isPlayerTurn = true;

    const targetEnemies = [...enemies.filter(e => e.hp > 0)];
    if (targetEnemies.length === 0) return;

    const skillType = Math.random() < 0.7 ? "single" : "multi";
    if (skillType === "single") {
        const target = targetEnemies[Math.floor(Math.random() * targetEnemies.length)];
        const dmg = Math.floor(Math.random() * 51) + 100;
        target.hp = Math.max(0, target.hp - dmg);
        log(`🌟 ${attacker.name} の必殺技！ → ${target.name} に ${dmg} ダメージ！`);
    } else {
        targetEnemies.forEach(en => {
            const dmg = Math.floor(Math.random() * 31) + 100;
            en.hp = Math.max(0, en.hp - dmg);
            log(`🌟 ${attacker.name} の必殺技！ → ${en.name} に ${dmg} ダメージ！`);
        });
    }

    updateDisplay();
    checkEnd();
    isPlayerTurn = false;
    nextTurn();
}

document.querySelectorAll(".special-button").forEach(btn => {
    btn.addEventListener("click", playerSkill);
});

function updateSpecialButtonsState() {
    players.forEach(p => {
        const btn = document.getElementById(`${p.type}-special`);
        if (btn) {
            btn.disabled = p.hp <= 0;
        }
    });
}

// 終了チェック
function checkEnd() {
    if (gameEnded) return;

    if (enemies.every(e => e.hp <= 0)) {
        log("🎉 勝利！プリキュアチーム（プレイヤー）の勝ち！");
        gameEnded = true;
    } else if (players.every(p => p.hp <= 0)) {
        log("💀 敗北…敵の勝利。");
        gameEnded = true;
    }

    if (gameEnded) {
        sessionLogs.push(battleLogLive.join("\n"));
        displaySessionLogs();
        showSection(["restartMenu", "sessionLogPanel"]);
    }
}

function displaySessionLogs() {
    const currentIndex = sessionLogs.length - 1;
    // セッションログを表示する親要素を取得
    const sessionLogPanel = document.getElementById("sessionLogPanel");
    sessionLogPanel.innerHTML = "";

    // セッション全体の見出し
    const title = document.createElement("h3");
    title.textContent = "セッション履歴";

    title.classList.add("session-title");

    sessionLogPanel.appendChild(title);

    sessionLogs.forEach((log, index) => {
        const logContainer = document.createElement("div");
        logContainer.classList.add("log-container");

        const headerRow = document.createElement("div");
        headerRow.classList.add("log-header");

        const logTitle = document.createElement("h4");
        logTitle.textContent = `戦闘${index + 1}`;

        // 表示／非表示トグルボタン
        const toggleButton = document.createElement("button");
        toggleButton.textContent = "▼ 非表示";

        const logContent = document.createElement("pre");
        logContent.classList.add("log-content");
        logContent.textContent = log;

        // logContent.style.display を "none" に設定（初期状態）しておく
        logContent.style.display = (index === currentIndex) ? "block" : "none";  // 現在のインデックスだけ表示
        toggleButton.textContent = (index === currentIndex) ? "▼ 非表示" : "▶ 表示";  // ボタンも連動

        toggleButton.addEventListener("click", () => {
            const isHidden = logContent.style.display === "none";
            logContent.style.display = isHidden ? "block" : "none";
            toggleButton.textContent = isHidden ? "▼ 非表示" : "▶ 表示";
        });

        // タイトルとボタンをヘッダー行に追加
        headerRow.appendChild(logTitle);
        headerRow.appendChild(toggleButton);

        // ヘッダーとログ本文を1つのログブロックにまとめる
        logContainer.appendChild(headerRow);
        logContainer.appendChild(logContent);
        sessionLogPanel.appendChild(logContainer);
    });
    sessionLogPanel.style.display = "block";
}

function restartGame() {
    document.getElementById("playerInput").value = "";
    // 戦闘ログを空にする
    battleLogLive = [];
    document.getElementById("battleLog").value = "";
    // Select2 の選択状態を解除
    $('#characterSelect').val(null).trigger('change');

    showSection(["startMenu", "precureImg"]);
    document.getElementById("potionButton").disabled = false;
    players.forEach(p => p.potionUsed = false);
}

window.addEventListener("DOMContentLoaded", () => {
    setupInputEnterKey();
});

function setupInputEnterKey() {
    document.getElementById("playerInput").addEventListener("keydown", e => {
        if (e.key === "Enter") startGame();
    });
}

function getAttackDamage(base) {
    const crit = Math.random() < 0.05;
    let min = 15;
    let max = base;

    if (base < min) {
        min = base;
    }

    const dmg = Math.floor(Math.random() * (max - min + 1)) + min;
    const finalDmg = crit ? Math.floor(dmg * 1.8) : dmg;

    if (crit) log("⚡ 会心の一撃！");
    return finalDmg;
}

// ログ保存
function downloadSessionLog() {
    // ログを「=== 次戦 ===」という区切りで1つの文字列にする
    const fullLog = sessionLogs.join("\n\n=== 次戦 ===\n\n");
    // 文字列をBlobに変換
    const blob = new Blob([fullLog], { type: "text/plain" });
    // Blobから一時的なURLを生成
    const url = URL.createObjectURL(blob);
    // ダウンロード用のリンク要素を作成
    const link = document.createElement("a");
    link.href = url;
    link.download = "session_log.txt";
    // リンクを自動的にクリックしてダウンロード
    link.click();
    // 使用後のURLオブジェクトを解放
    URL.revokeObjectURL(url);
}

// 操作説明の表示・非表示をトグルする関数
function showInstructions() {
    const panel = document.getElementById("instructionsPanel");

    // トグル処理
    if (panel.style.display === "block") {
        panel.style.display = "none";
        return;
    }

    // 説明テキスト
    const instructions = `
◆ ゲーム操作の説明 ◆

🔰 ゲームの流れ：
1. 名前を入力して、好きなキャラクターを選びます。
2. 「ゲーム開始」ボタンを押します。
3. 敵がランダムに登場します。
4. 下記の行動から選択してターンを進めます。

🎮 プレイヤーの行動：
🗡 攻撃する：敵にダメージを与える。時々「会心の一撃」で大ダメージ！
🛡 防御する：敵の攻撃を避けやすくなり、回避成功時は少し回復します。
🥝 ポーション：HPが20回復（1回のみ使用可能）
👊🏻 必殺技：プリキュアのみ表示される。

👾 敵の行動：
敵は毎ターン攻撃を仕掛けてきます。
稀に「痛恨の一撃」で大ダメージを受けることも…

📜 その他の機能：
- 戦闘ログがリアルタイムで表示されます。
- プレイ履歴はセッションログとして記録されます。
- 戦闘後は「再戦」や「ログ保存」ができます。
`;

    // 表示処理
    panel.textContent = instructions;
    panel.style.display = "block";

    // 表示パネル切り替え
    showSection(["startMenu", "instructionsPanel", "precureImg"]);
}

// 敵情報表示
function showEnemyList() {
    // パネルの要素を取得
    const panel = document.getElementById("enemyListPanel");

    // トグル処理
    if (panel.style.display === "block") {
        panel.style.display = "none";
        return;
    }

    const enemyInfo = `
◆ 敵の種類一覧 ◆

カバトン：
HP: 50 / 攻撃力: 30
アンダーグ帝国の暴れん坊。
強いやつこそが正しいと思っている。口癖は「オレ、TUEEE！」

バッタモンダー：
HP: 80 / 攻撃力: 20
アンダーグ帝国のひねくれもの。じつはすごくプライドが高い。

ミノトン：
HP: 140 / 攻撃力: 50
アンダーグ帝国の武人。プリキュアに正々堂々と戦いを挑んでくる。

カイゼリン：
HP: 100 / 攻撃力: 24
現在のアンダーグ帝国の支配者。300年前の恨みを晴らすため、
プリンセスであるエルちゃんやプリキュアに襲いかかる。

スキアヘッド：
HP: 300 / 攻撃力: 80
何を考えているかわからない、冷たく恐ろしい存在。
ただ一言唱えるだけでアンダーグ・エナジーを様々な形で行使できる。

カイザー：
HP: 1000 / 攻撃力: 100
300年前におけるアンダーグ帝国の前代皇帝で、カイゼリンの父。
「力が全て」を豪語する傲岸不遜な暴君。

それぞれ異なる戦術が求められるよ！
`;
    // テキスト内容をパネルに表示
    panel.textContent = enemyInfo;
    panel.style.display = "block";

    // 表示パネル切り替え
    showSection(["startMenu", "enemyListPanel", "precureImg"]);
}

// キャラクター情報表示
function showCharacterList() {
    // パネルの要素を取得
    const panel = document.getElementById("characterListPanel");

    // 表示されていれば非表示
    if (panel.style.display === "block") {
        panel.style.display = "none";
        return;
    }

    const characterInfo = `
◆ キャラクターの種類一覧 ◆

🩵キュアスカイ：
HP: 150 / 攻撃力: 50
運動神経抜群なスカイランドの女の子。
幼いころピンチから救ってくれた憧れの人のようなヒーローになるため、
まじめに一生懸命に日々鍛錬中！口癖は「ヒーローの出番です！」

🤍キュアプリズム：
HP: 90 / 攻撃力: 25
優しく思いやりのある女の子。
料理や自然についての知識もたくさんもっていて物知り。あだ名は「ましろん」

🧡キュアウイング：
HP: 100 / 攻撃力: 45
鳥型の妖精・プニバード族の12歳の男の子。
高く飛ぶことはできないが人の姿になることができる種族に生まれた。

🩷キュアバタフライ：
HP: 110 / 攻撃力: 30
常に全力で、誰とでもすぐに仲良くなれるましろの幼馴染。
おしゃれで楽しいコトが大好きな頼りになる明るいお姉さん。
「アゲてくよ！」が口癖。

💜キュアマジェスティ：
HP: 100 / 攻撃力: 65
スカイランドの王女であるエルちゃんが変身するプリキュア。
みんなを守りたいと強く願った時、その祈りに答えるように姿を現した。
淑女らしい落ち着いた雰囲気になり、優雅なふるまいを見せる。

🥰エルちゃん：
HP: 60 / 攻撃力: 25
まだまだ幼いスカイランドの王女さま。
「ぷいきゅあ～！」の叫び声と共にプリキュア変身アイテムである
スカイトーンを生み出すなど未知数の力を持つ。

⚔️シャララ隊長：
HP: 300 / 攻撃力: 100
絶対的なカリスマ性と「スカイランド最強の剣士」の称号に相応しい実力を兼ね備えた、
国民から真のヒーローと慕われている存在。
キュアスカイの憧れのヒーローでもある。
`;
    // テキスト内容をパネルに表示
    panel.textContent = characterInfo;
    panel.style.display = "block";
    // 表示パネル切り替え
    showSection(["startMenu", "characterListPanel", "precureImg"]);
}

$(document).ready(function () {
    $('#characterSelect').select2({
        placeholder: "好きなキャラを選んでね！",
        allowClear: true,
        closeOnSelect: false,
        tags: false
    });

    $('#characterSelect').on('select2:select', function () {
        setTimeout(() => {
            const selected = $(this).val();
            if (selected && selected.length > 2) {
                $(this).val(selected.slice(0, 2)).trigger('change');
                alert('選択できるのは2人までです！');
            }
        }, 0);
    });
});