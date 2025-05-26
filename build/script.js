const hand = document.querySelector('.hand');
const table = document.querySelector('.table');
const deckCountElement = document.getElementById('deck-count');
const deckImageElement = document.getElementById('deck-image');
const botHand = document.querySelector('.bot-hand');
const botDeckImageElement = document.getElementById('bot-deck-image');
const botDeckCountElement = document.getElementById('bot-deck-count');
const discardPileElement = document.getElementById('discard-pile');
const discardCountElement = document.getElementById('discard-count');
const specialDeckImageElement = document.getElementById('special-deck-image');
const specialDeckCountElement = document.getElementById('special-deck-count');


let deck = []; // Колода игрока (52 карты)
let playerHand = []; // Карты в руке игрока
let botDeck = []; // Колода бота (52 карты)
let botCards = []; // Карты в руке бота
let gameData = {}; // Данные из JSON
let playedCardsThisTurn = []; // Карты, выложенные игроком в текущем ходе
let discardPile = []; // Массив для хранения сброшенных карт
let specialDeck = []; // Массив особой колоды. Покрытия карт убрано на время, пока не будет реализован простой подкидной Дурак
let jokers = []; // Массив для хранения джокеров
let money = 10; // Начальная сумма денег


let currentDiscardPage = 0;
const CARDS_PER_PAGE = 6;

let currentDeckPage = 0;
const DECK_CARDS_PER_PAGE = 6;


document.getElementById('startButton').addEventListener('click', async function () {

    document.getElementById('mainMenu').style.display = 'none';


    document.getElementById('gameContainer').style.display = 'block';


    document.getElementById('shopModal').style.display = 'block';

    try {

        await loadShopCards();
        updateMoneyDisplay();
    } catch (error) {
        console.error('Ошибка инициализации:', error);

    }
});

document.getElementById('shareButton').addEventListener('click', copyGameLink);

document.querySelector('.close-shop').addEventListener('click', function () {
    document.getElementById('shopModal').style.display = 'none';
    startGame();
});

document.querySelector('.special-deck-container').addEventListener('click', function () {
    const modal = document.getElementById('special-deck-modal');
    const container = modal.querySelector('.special-cards');

    container.innerHTML = specialDeck.map(card => `
        <div class="deck-card">
            <img src="${card.src}" class="card-in-deck" 
                 alt="${card.rang} ${card.suit}">
        </div>
    `).join('');

    modal.style.display = 'block';
});

// Закрытие модалок
document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').style.display = 'none';
    });
});

document.querySelector('.close-special').addEventListener('click', function () {
    document.getElementById('special-deck-modal').style.display = 'none';
});

window.onclick = function (event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
    if (event.target.className === 'modal deck-modal') {
        event.target.style.display = 'none';
    }
}

function showCopyNotification(success) {
    const notification = document.getElementById('copyNotification');
    notification.textContent = success ? 'Ссылка скопирована!' : 'Ошибка копирования!';
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

function copyGameLink() {
    const url = window.location.href;


    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.opacity = 0;
    document.body.appendChild(textArea);
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        showCopyNotification(successful);
    } catch (err) {
        showCopyNotification(false);
    }

    document.body.removeChild(textArea);
}

async function loadShopCards() {
    try {
        const container = document.querySelector('.shop-row_common');
        container.innerHTML = '<div class="loading">Загрузка карт...</div>';
        try {

            const container = document.querySelector('.shop-row_common');
            if (!container) {
                throw new Error('Shop container not found');
            }


            const response = await fetch('./cards.json?v=' + Date.now());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }


            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Invalid content type');
            }


            const data = await response.json();
            if (!data.cards || !Array.isArray(data.cards)) {
                throw new Error('Invalid JSON structure');
            }


            if (data.cards.length < 6) {
                throw new Error('Not enough cards in JSON');
            }


            const randomCards = getRandomCards(data.cards, 6);
            console.log('Selected cards:', randomCards);

            // Проверка DOM перед рендером
            if (!document.querySelector('.shop-row_common')) {
                throw new Error('Container destroyed before render');
            }


            container.style.opacity = '0';
            setTimeout(() => {
                container.innerHTML = '';
                displayShopCards(randomCards);
                container.style.opacity = '1';
            }, 300);

        } catch (error) {
            console.error('Full error stack:', error);
            alert(`Ошибка загрузки магазина: ${error.message}`);
            // Перезагрузка магазина при ошибке
            setTimeout(loadShopCards, 2000);
        }
    } catch (error) {
        container.innerHTML = '<div class="error">Ошибка загрузки магазина</div>';
    }
}

function openShop() {
    document.body.style.overflow = 'hidden';
    document.getElementById('shopModal').style.display = 'block';
}

function closeShop() {
    document.body.style.overflow = 'auto';
    document.getElementById('shopModal').style.display = 'none';
}



function displayShopCards(cards) {
    const container = document.querySelector('.shop-row_common');
    container.innerHTML = '';

    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'shop-card-container';
        cardElement.dataset.index = index;

        const img = document.createElement('img');
        img.className = 'shop-card';
        img.src = card.src;
        img.dataset.price = card.price;

        const price = document.createElement('div');
        price.className = 'shop-card-price';
        price.textContent = `${img.dataset.price}$`;

        // Обработчик покупки
        img.addEventListener('click', () => purchaseCard(card, img.dataset.price));

        cardElement.append(img, price);
        container.appendChild(cardElement);
    });

    console.log('Cards displayed:', cards.length);
}

function purchaseCard(card, price) {
    if (money >= price) {
        money -= price;


        specialDeck = [...specialDeck, card];


        updateMoneyDisplay();
        updateSpecialDeckDisplay();


        const cardElement = event.target.closest('.shop-card-container');
        cardElement.style.transform = 'scale(0)';
        setTimeout(() => cardElement.remove(), 300);


        document.querySelector('.shop-row_common').style.justifyContent = 'flex-start';
        setTimeout(() => {
            document.querySelector('.shop-row_common').style.justifyContent = 'center';
        }, 50);
    } else {
        alert('Недостаточно средств!');
    }
}

function getRandomCards(cardsArray, count) {

    const shuffled = [...cardsArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
}


let trumpSuit = '';
const SUITS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
};

// Логирование состояния игры
function logGameState() {
    console.group('Текущее состояние игры');

    console.log('--- Игрок ---');
    console.log(`Карт в колоде: ${deck.length}`);
    console.log('Карты в руке:', playerHand.map(c => `${c.rang} ${c.suit}`));

    console.log('--- Бот ---');
    console.log(`Карт в колоде: ${botDeck.length}`);
    console.log('Карты в руке:', botCards.map(c => `${c.rang} ${c.suit}`));

    console.groupEnd();
}

// Загрузка игры
function loadGame() {
    fetch('./cards.json')
        .then(response => response.json())
        .then(data => {
            gameData = data;
            initGame();
        })
        .catch(error => console.error('Ошибка загрузки:', error));
}

function updateMoneyDisplay() {
    document.getElementById('money-amount').textContent = money;
    document.getElementById('shop-money-amount').textContent = money;
}

// Инициализация игры
function initGame() {

    const randomSuit = Object.keys(SUITS)[Math.floor(Math.random() * 4)];
    trumpSuit = randomSuit;


    deckImageElement.src = gameData.cardBack;
    botDeckImageElement.src = gameData.cardBack;
    discardPileElement.src = gameData.cardBack;

    const trumpElement = document.getElementById('trump-suit');
    trumpElement.textContent = SUITS[trumpSuit];
    trumpElement.className = `trump-suit ${trumpSuit}`;

    deck = shuffleArray([...gameData.cards]);
    botDeck = shuffleArray([...gameData.cards]);
    discardPile = [];
    updateMoneyDisplay();

    specialDeck = [];
    specialDeckImageElement.src = gameData.cardBack;
    specialDeckCountElement.textContent = '0';


    dealInitialCards(6);
    updateCounts();
    initDiscardModal();
    initDeckModal();
    initSpecialDeckModal();
    logGameState();
    initJokersPanel();
}


function updateCounts() {
    deckCountElement.textContent = deck.length;
    botDeckCountElement.textContent = botDeck.length;
    discardCountElement.textContent = discardPile.length;
    specialDeckCountElement.textContent = specialDeck.length;
}

function addToSpecialDeck(cardData) {
    specialDeck.push(cardData);
    updateCounts();
}


function drawFromSpecialDeck() {
    if (specialDeck.length > 0) {
        const cardData = specialDeck.pop();
        updateCounts();
        return cardData;
    }
    return null;
}


function initSpecialDeckModal() {
    const modal = document.createElement('div');
    modal.id = 'special-deck-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Карты в особой колоде</h3>
            <div class="cards-container"></div>
            <div class="deck-counter">Карт: 0</div>
        </div>
    `;
    document.body.appendChild(modal);

    specialDeckImageElement.addEventListener('click', () => {
        if (specialDeck.length > 0) {
            showSpecialDeckModal();
        }
    });

    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
}


function initSpecialDeckModal() {
    const modal = document.createElement('div');
    modal.id = 'special-deck-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Карты в особой колоде</h3>
            <div class="cards-container"></div>
            <div class="deck-counter">Карт: 0</div>
        </div>
    `;
    document.body.appendChild(modal);

    specialDeckImageElement.addEventListener('click', () => {
        if (specialDeck.length > 0) {
            showSpecialDeckModal();
        }
    });

    modal.querySelector('.close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

function showSpecialDeckModal() {
    const modal = document.getElementById('special-deck-modal');
    const container = modal.querySelector('.cards-container');
    const counter = modal.querySelector('.deck-counter');

    container.innerHTML = '';

    specialDeck.forEach(cardData => {
        const card = document.createElement('img');
        card.src = gameData.cardBack;
        card.alt = `Карта: ${cardData.suit} ${cardData.rang}`;
        card.classList.add('card-in-deck');
        container.appendChild(card);
    });

    counter.textContent = `Карт: ${specialDeck.length}`;
    modal.style.display = 'block';
}

function updateSpecialDeckDisplay() {
    const container = document.querySelector('#special-deck-count');
    if (container) container.textContent = specialDeck.length;
}

// Раздача начальных карт
function dealInitialCards(count) {
    // Игроку
    playerHand = deck.splice(0, count).map(c => ({ ...c }));
    playerHand.forEach(cardData => {
        hand.appendChild(createCard(cardData, false));
    });

    // Боту
    botCards = botDeck.splice(0, count).map(c => ({ ...c }));
    botCards.forEach(cardData => {
        botHand.appendChild(createCard(cardData, true));
    });
}

// Создание карты (isBot = true для карт бота)
function createCard(cardData, isBot) {
    const card = document.createElement('img');

    if (isBot) {
        card.src = gameData.cardBack;
        card.classList.add('bot-card');
        card.style.cursor = 'not-allowed';
    } else {
        card.src = cardData.src;
        card.classList.add('card');
        card.addEventListener('click', () => playCard(card));
    }


    card.alt = `Карта: ${cardData.suit} ${cardData.rang}`;
    card.dataset.suit = cardData.suit;
    card.dataset.rang = cardData.rang;
    card.dataset.src = cardData.src;

    return card;
}


function playCard(card) {
    const cardRank = card.dataset.rang;
    const cardSuit = card.dataset.suit;


    if (playedCardsThisTurn.length === 0) {
        addCardToTable(card);
        playedCardsThisTurn.push({
            rang: cardRank,
            suit: cardSuit,
            src: card.dataset.src
        });
        updateEndTurnButtonVisibility();
        return;
    }


    const canAdd = playedCardsThisTurn.some(playedCard =>
        playedCard.rang === cardRank ||
        (cardSuit === trumpSuit && playedCard.suit === trumpSuit)
    );

    if (canAdd && table.children.length < 6) {
        addCardToTable(card);
        playedCardsThisTurn.push({
            rang: cardRank,
            suit: cardSuit,
            src: card.dataset.src
        });
        updateEndTurnButtonVisibility();
    } else {
        alert('Можно выложить:\n- Карты того же ранга\n');
    }
}

function initDeckModal() {
    const modal = document.getElementById('deck-modal');
    const closeBtn = modal.querySelector('.close');
    const leftBtn = modal.querySelector('.scroll-btn.left');
    const rightBtn = modal.querySelector('.scroll-btn.right');


    deckImageElement.addEventListener('click', () => {
        if (deck.length > 0) {
            showDeckModal();
        }
    });


    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });


    leftBtn.addEventListener('click', () => {
        if (currentDeckPage > 0) {
            currentDeckPage--;
            updateDeckView();
        }
    });

    rightBtn.addEventListener('click', () => {
        if ((currentDeckPage + 1) * DECK_CARDS_PER_PAGE < deck.length) {
            currentDeckPage++;
            updateDeckView();
        }
    });
}


function showDeckModal() {
    const modal = document.getElementById('deck-modal');
    currentDeckPage = 0;
    updateDeckView();
    modal.style.display = 'block';
}


function updateDeckView() {
    const modal = document.getElementById('deck-modal');
    const container = modal.querySelector('.cards-container');
    const counter = modal.querySelector('.deck-counter');

    container.innerHTML = '';

    // Полный набор карт для сортированного отображения
    const allRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    const allSuits = ['hearts', 'diamonds', 'clubs', 'spades'];

    // Сортировка карт в колоде по масти и рангу
    const sortedDeck = [...deck].sort((a, b) => {
        if (a.suit !== b.suit) {
            return allSuits.indexOf(a.suit) - allSuits.indexOf(b.suit);
        }
        return allRanks.indexOf(a.rang) - allRanks.indexOf(b.rang);
    });


    const cardMatrix = {};
    allSuits.forEach(suit => {
        cardMatrix[suit] = {};
        allRanks.forEach(rank => {
            cardMatrix[suit][rank] = null;
        });
    });


    sortedDeck.forEach(card => {
        cardMatrix[card.suit][card.rang] = card;
    });


    let visibleCards = 0;
    allSuits.forEach(suit => {
        allRanks.forEach(rank => {
            const cardData = cardMatrix[suit][rank];
            const card = document.createElement('div');
            card.className = 'deck-card';

            if (cardData) {

                const cardImg = document.createElement('img');
                cardImg.src = cardData.src;
                cardImg.alt = `${rank} ${suit}`;
                cardImg.className = 'card-in-deck';
                card.appendChild(cardImg);
                visibleCards++;
            } else {

                const cardPlaceholder = document.createElement('div');
                cardPlaceholder.className = 'card-placeholder';
                cardPlaceholder.textContent = `${SUITS[suit]}${rank}`;
                card.appendChild(cardPlaceholder);
            }

            container.appendChild(card);
        });
    });

    counter.textContent = `Карт в колоде: ${deck.length}`;


    modal.querySelector('.scroll-btn.left').style.display = 'none';
    modal.querySelector('.scroll-btn.right').style.display = 'none';
}



function addCardToTable(card) {
    const newCard = card.cloneNode(true);
    newCard.classList.add('table-card');
    table.appendChild(newCard);
    card.remove();


    const cardIndex = playerHand.findIndex(c =>
        c.suit === card.dataset.suit && c.rang === card.dataset.rang
    );
    if (cardIndex !== -1) {
        playerHand.splice(cardIndex, 1);
    }

    logGameState();
    updateDeckCounts();
}




function updateDeckCounts() {
    deckCountElement.textContent = deck.length;
    botDeckCountElement.textContent = botDeck.length;
}


function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function canBeat(attackingCard, defendingCard) {
    // Если защищающая карта - козырь, а атакующая - нет
    if (defendingCard.suit === trumpSuit && attackingCard.suit !== trumpSuit) {
        return true;
    }
    // Если обе карты козырные
    if (defendingCard.suit === trumpSuit && attackingCard.suit === trumpSuit) {
        const ranks = ['6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
        const attackRankIndex = ranks.indexOf(attackingCard.rang);
        const defendRankIndex = ranks.indexOf(defendingCard.rang);
        return defendRankIndex > attackRankIndex;
    }
    // Если масти совпадают (не козырные)
    if (defendingCard.suit === attackingCard.suit) {
        const ranks = ['6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
        const attackRankIndex = ranks.indexOf(attackingCard.rang);
        const defendRankIndex = ranks.indexOf(defendingCard.rang);
        return defendRankIndex > attackRankIndex;
    }
    return false;
}


function updateEndTurnButtonVisibility() {
    requestAnimationFrame(() => {
        const tableCards = document.querySelectorAll('.table-card');
        const endTurnButton = document.querySelector('.end-turn-button');

        if (tableCards.length > 0) {
            endTurnButton.style.display = 'block';
        } else {
            endTurnButton.style.display = 'none';
        }
    });
}



// Запуск игры. !!До инициализации бота!!
loadGame();


document.getElementById('end-turn-btn').addEventListener('click', () => {
    botTurn();
    playedCardsThisTurn = [];
});

//Переделать!
function botTurn() {
    const tableCards = Array.from(document.querySelectorAll('.table-card'));
    let success = true;
    let cardsToDiscard = [];

    for (let tableCardEl of tableCards) {
        const attackCard = {
            suit: tableCardEl.dataset.suit,
            rang: tableCardEl.dataset.rang,
            src: tableCardEl.dataset.src
        };

        const defenseCardIndex = botCards.findIndex(botCard => canBeat(attackCard, botCard));

        if (defenseCardIndex !== -1) {
            const defenseCard = botCards[defenseCardIndex];
            cardsToDiscard.push(attackCard, defenseCard);


            const botCardEl = botHand.children[defenseCardIndex];
            const newCard = botCardEl.cloneNode(true);
            newCard.classList.add('table-card');
            table.appendChild(newCard);


            botCards.splice(defenseCardIndex, 1);
            botCardEl.remove();
        } else {
            success = false;
            break;
        }
    }

    if (!success) {

        tableCards.forEach(card => {
            const cardData = {
                suit: card.dataset.suit,
                rang: card.dataset.rang,
                src: card.dataset.src
            };
            botCards.push(cardData);
            botHand.appendChild(createCard(cardData, true));
            card.remove();
        });
    } else {

        discardPile.push(...cardsToDiscard);
        updateDiscardPileVisual();


        const tableCardElements = document.querySelectorAll('.table-card');
        tableCardElements.forEach(card => card.remove());
    }

    playedCardsThisTurn = [];
    updateCounts();
    logGameState();
    updateEndTurnButtonVisibility();
}


function updateDiscardPileVisual() {
    // Обновляем счетчик
    discardCountElement.textContent = discardPile.length;

    // Показываем верхнюю карту в сбросе
    if (discardPile.length > 0) {
        discardPileElement.src = discardPile[discardPile.length - 1].src;
    } else {
        discardPileElement.src = gameData.cardBack;
    }

    // Принудительно обновляем модальное окно
    if (document.getElementById('discard-modal').style.display === 'block') {
        updateDiscardView();
    }
}


function initDiscardModal() {
    const modal = document.getElementById('discard-modal');
    const closeBtn = document.querySelector('.close');
    const leftBtn = document.querySelector('.scroll-btn.left');
    const rightBtn = document.querySelector('.scroll-btn.right');


    discardPileElement.addEventListener('click', () => {
        if (discardPile.length > 0) {
            showDiscardModal();
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });


    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    leftBtn.addEventListener('click', () => {
        if (currentDiscardPage > 0) {
            currentDiscardPage--;
            updateDiscardView();
        }
    });

    rightBtn.addEventListener('click', () => {
        if ((currentDiscardPage + 1) * CARDS_PER_PAGE < discardPile.length) {
            currentDiscardPage++;
            updateDiscardView();
        }
    });
}


function showDiscardModal() {
    const modal = document.getElementById('discard-modal');
    currentDiscardPage = 0;
    updateDiscardView();
    modal.style.display = 'block';
}

function updateDiscardView() {
    const container = document.querySelector('#discard-modal .cards-container');
    const counter = document.querySelector('#discard-modal .discard-counter');

    container.innerHTML = '';

    const startIdx = currentDiscardPage * CARDS_PER_PAGE;
    const endIdx = Math.min(startIdx + CARDS_PER_PAGE, discardPile.length);
    const cardsToShow = discardPile.slice(startIdx, endIdx);

    cardsToShow.forEach(cardData => {
        const card = document.createElement('img');
        card.src = cardData.src; // Исправлено: было cardData.source
        card.alt = `${cardData.rang} ${cardData.suit}`;
        card.classList.add('discard-card');
        container.appendChild(card);
    });


    counter.textContent = `${startIdx + 1}-${endIdx} из ${discardPile.length}`;

    document.querySelector('#discard-modal .scroll-btn.left').style.visibility =
        currentDiscardPage > 0 ? 'visible' : 'hidden';
    document.querySelector('#discard-modal .scroll-btn.right').style.visibility =
        endIdx < discardPile.length ? 'visible' : 'hidden';
}

// Функция инициализации панели джокеров
function initJokersPanel() {
    //добавление джокеров (агружать из JSON)
    jokers = [

    ];

    const container = document.querySelector('.jokers-container');
    container.innerHTML = '';

    jokers.forEach(joker => {
        const jokerCard = document.createElement('div');
        jokerCard.className = 'joker-card';
        jokerCard.textContent = joker.name;
        jokerCard.title = joker.effect;

        jokerCard.addEventListener('click', () => useJoker(joker));
        container.appendChild(jokerCard);
    });
}

// Функция использования джокера
function useJoker(joker) {
    console.log(`Использован джокер: ${joker.name}`);
    // Здесь можно добавить логику применения эффекта джокера
    alert(`Активирован эффект: ${joker.effect}`);

    // Удаляем использованный джокер
    jokers = jokers.filter(j => j.id !== joker.id);
    initJokersPanel();
}