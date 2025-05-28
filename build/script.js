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
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const closeHelpBtn = helpModal.querySelector('.close-help');
const winModal = document.getElementById('winModal');
const loseModal = document.getElementById('loseModal');
const continueButton = document.getElementById('continueButton');

let deck = []; 
let playerHand = []; 
let botDeck = []; 
let botCards = []; 
let gameData = {}; 
let playedCardsThisTurn = []; 
let discardPile = []; 
let specialDeck = []; 
let jokers = []; 
let money = 10; 
let isPlayerTurn = true;
let cardsToDefend = [];
let tableCards = []; 

helpButton.addEventListener('click', () => {
    helpModal.style.display = 'block';
});

closeHelpBtn.addEventListener('click', () => {
    helpModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === helpModal) {
        helpModal.style.display = 'none';
    }
});

function showWinModal() {
    isPlayerTurn = false;
    setPlayerCardsClickable(false);
    winModal.style.display = 'block';
}

function showLoseModal() {
    isPlayerTurn = false;
    setPlayerCardsClickable(false);
    loseModal.style.display = 'block';
}

continueButton.addEventListener('click', function() {
    winModal.style.display = 'none';
    restartGame();
});

function playerDrawCards() {
    if (playerHand.length >= 6) return; 

    const cardsToDraw = Math.min(6 - playerHand.length, deck.length);

    for (let i = 0; i < cardsToDraw; i++) {
        const cardData = deck.pop(); 
        playerHand.push(cardData);  
        const cardElement = createCard(cardData, false);
        hand.appendChild(cardElement);
    }
    updateCounts(); 
    logGameState();  
}

function onPlayerCardClick(card) {

    if (isCardDefendable(card)) {

        moveCardToTable(card);
    }
    updateActionButton()
}

function isCardDefendable(card) {
    const botCard = getBotCard(); 
    return (card.rank > botCard.rank || card.suit === botCard.suit);
}

function moveCardToTable(card) {

    playerHand = playerHand.filter(c => c !== card);
    tableCards.push(card);
    updateTableDisplay();
    updatePlayerHandDisplay();
    updateActionButton(); 
}

function removeBotCard() {
    const botCard = getBotCard(); 
    botHand = botHand.filter(c => c !== botCard);


    updateBotHandDisplay();
}

function moveCardsToDiscard() {
    discardPile.push(...tableCards);
    tableCards = []; 
    updateDiscardDisplay();
    updateTableDisplay();
}

function updateTableDisplay() {
    const tableElement = document.getElementById("table");
    tableElement.innerHTML = ""; 
    tableCards.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.innerText = `${card.rank} of ${card.suit}`;
        tableElement.appendChild(cardElement);
    });
    updateActionButton()
}

function botDrawCards() {

    if (botCards.length < 6 && botDeck.length > 0) {
        const cardsToDraw = Math.min(6 - botCards.length, botDeck.length);


        botDeckImageElement.classList.add('deck-moving');


        botDeckImageElement.addEventListener('animationend', () => {
            botDeckImageElement.classList.remove('deck-moving');
        });


        for (let i = 0; i < cardsToDraw; i++) {
            const cardData = botDeck.pop();
            botCards.push(cardData);


            const cardElement = createCard(cardData, true);
            botHand.appendChild(cardElement);


            cardElement.classList.add('card-moving');

   
            cardElement.addEventListener('animationend', () => {
                cardElement.classList.remove('card-moving');
            });
        }

        updateCounts();
        logGameState();
    }
}

function updateActionButton() {
    const takeBtn = document.getElementById('take-cards-btn');
    const endTurnBtn = document.getElementById('end-turn-btn');
    const tableBotCards = Array.from(document.querySelectorAll('.table-card[data-origin="bot"]'));
    const tablePlayerCards = Array.from(document.querySelectorAll('.table-card[data-origin="player"]'));

    takeBtn.style.display = 'none';
    endTurnBtn.style.display = 'none';

    if (tableBotCards.length > 0) {
        const allDefended = tableBotCards.every(card => card.dataset.defended === 'true');

        if (!allDefended) {
            if (isPlayerTurn) {
                takeBtn.style.display = 'block';
                takeBtn.onclick = takeCards;
            } else {
                takeBtn.style.display = 'none';
                endTurnBtn.style.display = 'none';
            }
        } else {
            if (isPlayerTurn) {
                endTurnBtn.style.display = 'block';
                endTurnBtn.onclick = endTurn;
            } else {
                takeBtn.style.display = 'none';
                endTurnBtn.style.display = 'none';
            }
        }
    }
    checkWinConditions();
}

function takeCards() {
    const tableCards = Array.from(document.querySelectorAll('.table-card[data-origin="bot"]'));
    tableCards.forEach(card => {
        const cardData = {
            suit: card.dataset.suit,
            rang: card.dataset.rang,
            src: card.dataset.src
        };
        playerHand.push(cardData); 
        hand.appendChild(createCard(cardData, false));
        card.remove(); 
    });

    isPlayerTurn = false;
    setPlayerCardsClickable(false); 
    updateCounts();
    logGameState(); 
    updateTurnButtonsVisibility(); 
    setTimeout(botAttack, 1000); 

    checkWinConditions();
}

function endTurn() {
    moveCardsToDiscard();
    playedCardsThisTurn = [];
    isPlayerTurn = false;
    setPlayerCardsClickable(false);
    updateCounts();
    logGameState();
    updateActionButton();
    setTimeout(botAttack, 1000);
    updateActionButton();
    playerDrawCards()

    checkWinConditions();

}

function updateTurnButtonsVisibility() {
    const tableCards = document.querySelectorAll('.table-card');
    const turnButtons = document.querySelector('.turn-buttons');

    if (tableCards.length > 0) {
        turnButtons.style.display = 'flex';
        updateActionButton();
    } else {
        turnButtons.style.display = 'none';
    }
}


function updatePlayerHandDisplay() {
    hand.innerHTML = ""; 
    playerHand.forEach(cardData => {
        const cardElement = createCard(cardData, false);
        hand.appendChild(cardElement);
    });
}

function updateBotHandDisplay() {
    const botHandElement = document.getElementById("bot-hand"); 
    botHandElement.innerHTML = ""; 
    botHand.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.innerText = `${card.rank} of ${card.suit}`; 
        botHandElement.appendChild(cardElement);
    });
}


function updateDiscardDisplay() {
    const discardElement = document.getElementById("discard-pile"); 
    discardElement.innerHTML = ""; 
    discardPile.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.innerText = `${card.rank} of ${card.suit}`;
        discardElement.appendChild(cardElement);
    });
}


function getBotCard() {
    return botHand[0]; 
}


let currentDiscardPage = 0;
const CARDS_PER_PAGE = 6;

let currentDeckPage = 0;
const DECK_CARDS_PER_PAGE = 6;

document.getElementById('end-turn-btn').addEventListener('click', () => {
    if (isPlayerTurn) {
        endTurn();
    }
});


document.getElementById('take-cards-btn').addEventListener('click', () => {
    moveAllCardsOnTableToHand();

});



document.getElementById('startButton').addEventListener('click', async function () {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    
    document.getElementById('difficultyModal').style.display = 'block';
});

document.getElementById('easy-bot').addEventListener('click', function() {
    document.getElementById('difficultyModal').style.display = 'none';
    document.getElementById('shopModal').style.display = 'block';
    loadShopCards();
});

document.getElementById('medium-bot').addEventListener('click', function() {
    document.getElementById('difficultyModal').style.display = 'none';
    document.getElementById('shopModal').style.display = 'block';
    loadShopCards();
});

document.getElementById('hard-bot').addEventListener('click', function() {
    document.getElementById('difficultyModal').style.display = 'none';
    document.getElementById('shopModal').style.display = 'block';
    loadShopCards();
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
        const containerCommon = document.querySelector('.shop-row_common');
        const containerSpecial = document.querySelector('.shop-row_special');

        containerCommon.innerHTML = '<div class="loading">Загрузка карт...</div>';
        containerSpecial.innerHTML = '<div class="loading">Загрузка карт...</div>';

        const response = await fetch('./cards.json?v=' + Date.now());

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.cards || !Array.isArray(data.cards)) {
            throw new Error('Invalid JSON structure');
        }

        if (data.cards.length < 6) {
            throw new Error('Not enough cards in JSON');
        }

        const randomCardsCommon = getRandomCards(data.cards, 6);
        console.log('Selected common cards:', randomCardsCommon);

        containerCommon.style.opacity = '0';
        setTimeout(() => {
            containerCommon.innerHTML = '';
            displayShopCards(randomCardsCommon, 1); 
            containerCommon.style.opacity = '1';
        }, 300);


        const randomCardsSpecial = getRandomCards(data.cards, 6);
        console.log('Selected special cards:', randomCardsSpecial);

        containerSpecial.style.opacity = '0';
        setTimeout(() => {
            containerSpecial.innerHTML = '';
            displayShopCards(randomCardsSpecial, 2); 
            containerSpecial.style.opacity = '1';
        }, 300);


        const containerJokers = document.querySelector('.shop-row_jokers');
        containerJokers.innerHTML = '<div class="loading">Загрузка джокеров...</div>';

        const jokers = data.jokers || [];

        setTimeout(() => {
            containerJokers.innerHTML = '';
            displayShopJokers(jokers);
        }, 300);

    } catch (error) {
        console.error('Ошибка загрузки магазина:', error);
        alert(`Ошибка загрузки магазина: ${error.message}`);
        setTimeout(loadShopCards, 2000);
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

function displayShopCards(cards, priceMultiplier) {
    const container = document.querySelector(priceMultiplier === 1 ? '.shop-row_common' : '.shop-row_special');
    container.innerHTML = '';

    cards.forEach((card, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'shop-card-container';
        cardElement.dataset.index = index;

        const img = document.createElement('img');
        img.className = 'shop-card';
        img.src = card.src;
        img.dataset.price = priceMultiplier === 1 ? card.price : 2;

        // Для специального ряда добавляем случайный тип карты (50% золотая, 50% стеклянная)
        if (priceMultiplier === 2) {
            const isGolden = Math.random() < 0.5;
            if (isGolden) {
                img.classList.add('golden'); // Добавляем класс для золотых карт
                img.dataset.cardType = 'golden';
            } else {
                img.classList.add('glass'); // Добавляем класс для стеклянных карт
                img.dataset.cardType = 'glass';
            }
        }

        const price = document.createElement('div');
        price.className = 'shop-card-price';
        price.textContent = `${img.dataset.price}$`; 

        img.addEventListener('click', () => purchaseCard(card, img.dataset.price, img.dataset.cardType));

        cardElement.append(img, price);
        container.appendChild(cardElement);
    });

    console.log('Cards displayed:', cards.length);
}

function displayShopJokers(jokers) {
    const container = document.querySelector('.shop-row_jokers');
    container.innerHTML = '';

    jokers.forEach((joker, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'shop-card-container';
        cardElement.dataset.index = index;

        const img = document.createElement('img');
        img.className = 'shop-card joker-card';
        img.src = joker.src;
        img.dataset.price = 3;
        img.dataset.jokerId = joker.id;

        const price = document.createElement('div');
        price.className = 'shop-card-price';
        price.textContent = '3$';

        img.addEventListener('click', () => purchaseJoker(joker));

        cardElement.append(img, price);
        container.appendChild(cardElement);
    });

    console.log('Jokers displayed:', jokers.length);
}

function purchaseCard(card, price, cardType) {
    price = parseInt(price, 10);

    if (money >= price) {
        money -= price;

        const purchasedCard = { ...card, cardType };
        specialDeck = [...specialDeck, purchasedCard];

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

function purchaseJoker(joker) {
    if (money >= 3) {
        money -= 3;

        jokers.push(joker);
        initJokersPanel();

        updateMoneyDisplay();

        const container = document.querySelector('.shop-row_jokers');
        const cardElements = container.querySelectorAll('.shop-card-container');
        cardElements.forEach(el => {
            const img = el.querySelector('img');
            if (parseInt(img.dataset.jokerId, 10) === joker.id) {
                el.style.transform = 'scale(0)';
                setTimeout(() => el.remove(), 300);
            }
        });
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

    isPlayerTurn = true;
    dealInitialCards(6);
    updateCounts();
    initDiscardModal();
    initDeckModal();
    initSpecialDeckModal();
    logGameState();
    initJokersPanel();
}

function checkWinConditions() {
    // Проверяем победу игрока (у бота нет карт в руке и колоде)
    if (botCards.length === 0 && botDeck.length === 0) {
        showLoseModal();
        return true;
    }

    // Проверяем победу бота (у игрока нет карт в руке и колоде)
    if (playerHand.length === 0 && deck.length === 0) {
        showWinModal();
        return true;
    }

    // Если у игрока нет карт, но есть карты в колоде - добираем
    if (playerHand.length === 0 && deck.length > 0) {
        playerDrawCards();
    }

    // Если у бота нет карт, но есть карты в колоде - добираем
    if (botCards.length === 0 && botDeck.length > 0) {
        botDrawCards();
    }

    return false;
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

function drawFromSpecialDeckToHand() {
    if (specialDeck.length === 0) return;

    const randomIndex = Math.floor(Math.random() * specialDeck.length);
    const cardData = specialDeck[randomIndex];

    specialDeck.splice(randomIndex, 1);

    playerHand.push(cardData);
    hand.appendChild(createCard(cardData, false));

    updateCounts();
    updateSpecialDeckDisplay();

    if (document.getElementById('special-deck-modal').style.display === 'block') {
        showSpecialDeckModal();
    }

    logGameState();
}

function initSpecialDeckModal() {
    const modal = document.getElementById('special-deck-modal');
    const closeBtn = modal.querySelector('.close-special');
    const drawBtn = modal.querySelector('#draw-special-card');

    specialDeckImageElement.addEventListener('click', () => {
        if (specialDeck.length > 0) {
            showSpecialDeckModal();
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    drawBtn.addEventListener('click', () => {
        drawFromSpecialDeckToHand();
    });

    document.body.appendChild(modal);
}

function showSpecialDeckModal() {
    const modal = document.getElementById('special-deck-modal');
    const container = modal.querySelector('.special-cards');
    const drawBtn = modal.querySelector('#draw-special-card');
    const counter = modal.querySelector('.deck-counter');

    container.innerHTML = '';

    specialDeck.forEach(cardData => {
        const card = document.createElement('img');
        card.src = cardData.src;
        card.alt = `Карта: ${cardData.suit} ${cardData.rang}`;
        card.classList.add('card-in-deck');

        if (cardData.cardType === 'golden') {
            card.classList.add('golden'); 
        } else if (cardData.cardType === 'glass') {
            card.classList.add('glass'); 
        }

        container.appendChild(card);
    });

    drawBtn.disabled = specialDeck.length === 0;
    counter.textContent = `Карт: ${specialDeck.length}`;
    modal.style.display = 'block';
}

function updateSpecialDeckDisplay() {
    const container = document.querySelector('#special-deck-count');
    if (container) container.textContent = specialDeck.length;
}


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

        if (cardData.cardType === 'golden') {
            card.classList.add('golden');
        } else if (cardData.cardType === 'glass') {
            card.classList.add('glass');
        }
    }

    card.alt = `Карта: ${cardData.suit} ${cardData.rang}`;
    card.dataset.suit = cardData.suit;
    card.dataset.rang = cardData.rang;
    card.dataset.src = cardData.src;
    if (cardData.cardType) {
        card.dataset.cardType = cardData.cardType;
    }

    return card;
}

function canAddCardToTable(card) {
    const botCards = tableCards.filter(c => c.owner === 'bot');
    const playerCards = tableCards.filter(c => c.owner === 'player');

    if (playerCards.length >= botCards.length) {
        return false; 
    }

    for (const botCard of botCards) {
        const isDefended = playerCards.some(pc => pc.defends === botCard.id);
        if (!isDefended && canDefendCard(card, botCard)) {
            return true;
        }
    }
    return false;
}

function onPlayerCardClick(card) {
    if (canAddCardToTable(card)) {
        moveCardToTable(card);
    }
}


function playCard(card) {
    if (!isPlayerTurn) {
        alert("Сейчас ход бота!");
        return;
    }

    if (card.dataset.cardType === 'golden') {
        money += 1;
        alert("Золотая карта атакует!/n + 1$");
        updateMoneyDisplay();
    }

    const cardRank = card.dataset.rang;
    const cardSuit = card.dataset.suit;

    if (playedCardsThisTurn.length === 0) {
        addCardToTable(card);
        playedCardsThisTurn.push({
            rang: cardRank,
            suit: cardSuit,
            src: card.dataset.src,
            cardType: card.dataset.cardType
        });
        updateTurnButtonsVisibility();
        return;
    }

    const canAdd = playedCardsThisTurn.some(playedCard =>
        playedCard.rang === cardRank);

    if (canAdd && table.children.length < 6) {
        addCardToTable(card);
        playedCardsThisTurn.push({
            rang: cardRank,
            suit: cardSuit,
            src: card.dataset.src,
            cardType: card.dataset.cardType
        });
        updateTurnButtonsVisibility();
    }
}

function TurnAlert() {
    if (isPlayerTurn) {
        alert('Можно выложить:\n- Карты того же ранга\n');
    }
}

function updateTurnButtonsVisibility() {
    const tableCards = document.querySelectorAll('.table-card');
    const turnButtons = document.querySelector('.turn-buttons');
    const takeBtn = document.getElementById('take-cards-btn');
    const endTurnBtn = document.getElementById('end-turn-btn');

    if (tableCards.length > 0) {
        turnButtons.style.display = 'flex';

        takeBtn.style.display = !isPlayerTurn ? 'block' : 'none';
        endTurnBtn.style.display = isPlayerTurn ? 'block' : 'none';
    } else {
        turnButtons.style.display = 'none';
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

    const allRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
    const allSuits = ['hearts', 'diamonds', 'clubs', 'spades'];


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


    table.insertBefore(newCard, table.firstChild);

    card.remove();

    const cardIndex = playerHand.findIndex(c =>
        c.suit === card.dataset.suit && c.rang === card.dataset.rang
    );
    if (cardIndex !== -1) {
        playerHand.splice(cardIndex, 1);
    }

    logGameState();
    updateDeckCounts();

    // Прокрутка к новой карте (опционально)
    newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    if (defendingCard.suit === trumpSuit && attackingCard.suit !== trumpSuit) {
        return true;
    }
    if (defendingCard.suit === trumpSuit && attackingCard.suit === trumpSuit) {
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
        const attackRankIndex = ranks.indexOf(attackingCard.rang);
        const defendRankIndex = ranks.indexOf(defendingCard.rang);
        return defendRankIndex > attackRankIndex;
    }

    if (defendingCard.suit === attackingCard.suit) {
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
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

function takeCards() {
    const tableCards = Array.from(document.querySelectorAll('.table-card'));
    tableCards.forEach(card => {
        const cardData = {
            suit: card.dataset.suit,
            rang: card.dataset.rang,
            src: card.dataset.src
        };
        playerHand.push(cardData);
        hand.appendChild(createCard(cardData, false));
        card.remove();
    });

    playedCardsThisTurn = [];
    // После взятия карт ход переходит боту
    isPlayerTurn = false;
    setPlayerCardsClickable(false);
    updateCounts();
    logGameState();
    updateTurnButtonsVisibility();
    updateActionButton();
    playerDrawCards()
    setTimeout(botAttack, 1000);
}

// Запуск игры. !!До инициализации бота!!
loadGame();

document.getElementById('end-turn-btn').addEventListener('click', () => {
    botDefend();
    playedCardsThisTurn = [];
});

function botDefend() {
    const tableCards = Array.from(document.querySelectorAll('.table-card'));
    let success = true;
    let cardsToDiscard = [];

    for (let tableCardEl of tableCards) {
        const attackCard = {
            suit: tableCardEl.dataset.suit,
            rang: tableCardEl.dataset.rang,
            src: tableCardEl.dataset.src
        };

        const canDefend = botCards.some(botCard => canBeat(attackCard, botCard));
        if (!canDefend) {
            success = false;
            break;
        }
    }


    if (success) {
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
            }
        }

        discardPile.push(...cardsToDiscard);
        updateDiscardPileVisual();

        const tableCardElements = document.querySelectorAll('.table-card');
        tableCardElements.forEach(card => card.remove());

        isPlayerTurn = false;
        setTimeout(botAttack, 1000); 
    } else {
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

        isPlayerTurn = true;
        setPlayerCardsClickable(true);
        highlightDefendableCards(); 
    }

    playerDrawCards();
    botDrawCards();
    playedCardsThisTurn = [];
    updateCounts();
    logGameState();
    updateTurnButtonsVisibility();
    updateActionButton();
    checkWinConditions();
}

function setPlayerCardsClickable(clickable) {
    const playerCards = document.querySelectorAll('.hand .card');
    playerCards.forEach(card => {
        if (clickable) {
            card.style.pointerEvents = 'auto';
            card.style.opacity = '1';
            card.onclick = () => {
                if (isPlayerTurn) playCard(card);
                else if (card.classList.contains('defendable')) {
                    defendCard(card);
                }
            };
        } else {
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.7';
            card.onclick = null; 
        }
    });
}

function highlightDefendableCards() {
    const tableCards = Array.from(document.querySelectorAll('.table-card[data-origin="bot"]'));
    const playerCards = document.querySelectorAll('.hand .card');

    playerCards.forEach(card => {
        card.classList.remove('defendable');
        card.onclick = null;
    });

    cardsToDefend = [...tableCards];

    if (tableCards.length === 0) return;

    playerCards.forEach(playerCard => {
        const playerCardData = {
            suit: playerCard.dataset.suit,
            rang: playerCard.dataset.rang
        };

        const defendableCards = tableCards
            .filter(botCard => botCard.dataset.defended !== 'true')
            .map(botCard => ({
                element: botCard,
                data: {
                    suit: botCard.dataset.suit,
                    rang: botCard.dataset.rang
                }
            }))
            .filter(botCard => canBeat(botCard.data, playerCardData));

        if (defendableCards.length > 0) {
            playerCard.classList.add('defendable');
            playerCard.dataset.defendsAgainst = JSON.stringify(
                defendableCards.map(c => c.element.dataset.rang + c.element.dataset.suit)
            );
            playerCard.onclick = () => defendCard(playerCard);
        }
    });
}

function defendCard(card) {
    const tableCards = Array.from(document.querySelectorAll('.table-card[data-origin="bot"]'));
    const playerCardData = {
        suit: card.dataset.suit,
        rang: card.dataset.rang,
        src: card.dataset.src
    };

    try {
        const defendsAgainst = JSON.parse(card.dataset.defendsAgainst || '[]');
        const botCard = tableCards.find(c =>
            defendsAgainst.includes(c.dataset.rang + c.dataset.suit) &&
            c.dataset.defended !== 'true'
        );

        if (botCard) {
            const defenseCard = document.createElement('img');
            defenseCard.src = playerCardData.src;
            defenseCard.alt = `Карта: ${playerCardData.suit} ${playerCardData.rang}`;
            defenseCard.classList.add('card', 'table-card', 'defense-card');
            defenseCard.dataset.suit = playerCardData.suit;
            defenseCard.dataset.rang = playerCardData.rang;
            defenseCard.dataset.src = playerCardData.src;
            defenseCard.dataset.origin = 'player';
            defenseCard.dataset.defends = botCard.dataset.rang + botCard.dataset.suit;

            const botCardRect = botCard.getBoundingClientRect();
            const tableRect = table.getBoundingClientRect();
            defenseCard.style.position = 'absolute';
            defenseCard.style.left = (botCardRect.left - tableRect.left + 15) + 'px';
            defenseCard.style.top = (botCardRect.top - tableRect.top - 10) + 'px';
            defenseCard.style.zIndex = '5';

            table.appendChild(defenseCard);

            const cardIndex = playerHand.findIndex(c =>
                c.suit === playerCardData.suit && c.rang === playerCardData.rang);
            if (cardIndex !== -1) {
                playerHand.splice(cardIndex, 1);
            }
            card.remove();

            botCard.dataset.defended = 'true';
        }
    } catch (e) {
        console.error('Error processing defend action:', e);
    }

    checkAllDefended();
    updateActionButton();
}

function checkAllDefended() {
    const tableCards = Array.from(document.querySelectorAll('.table-card[data-origin="bot"]'));
    const allDefended = tableCards.every(card => card.dataset.defended === 'true');

    if (allDefended && tableCards.length > 0) {
        const cardsToDiscard = [];

        document.querySelectorAll('.table-card').forEach(card => {
            // Проверяем стеклянные карты (25% шанс удаления)
            if (card.dataset.cardType === 'glass' && Math.random() < 0.25) {
                console.log('Стеклянная карта разбилась при сбросе!');
                return; // Пропускаем добавление в сброс
            }

            cardsToDiscard.push({
                suit: card.dataset.suit,
                rang: card.dataset.rang,
                src: card.dataset.src,
                cardType: card.dataset.cardType
            });
            card.remove();
        });

        discardPile.push(...cardsToDiscard);
        updateDiscardPileVisual();

        isPlayerTurn = true;
        setPlayerCardsClickable(true);
        highlightDefendableCards();
        updateTurnButtonsVisibility();
        playedCardsThisTurn = [];
    }
}

function defendCard(card) {
    const tableCards = Array.from(document.querySelectorAll('.table-card[data-origin="bot"]'));
    const playerCardData = {
        suit: card.dataset.suit,
        rang: card.dataset.rang,
        src: card.dataset.src,
        cardType: card.dataset.cardType
    };

    try {
        const defendsAgainst = JSON.parse(card.dataset.defendsAgainst || '[]');
        const botCard = tableCards.find(c =>
            defendsAgainst.includes(c.dataset.rang + c.dataset.suit) &&
            c.dataset.defended !== 'true'
        );

        if (botCard) {
            if (card.dataset.cardType === 'glass' && Math.random() < 0.25) {
                console.log('Стеклянная карта разбилась при отбитии!');
                alert("Стеклянная карта разбилась при отбитии!");
                const cardIndex = playerHand.findIndex(c =>
                    c.suit === playerCardData.suit && c.rang === playerCardData.rang);
                if (cardIndex !== -1) {
                    playerHand.splice(cardIndex, 1);
                }
                card.remove();
                checkAllDefended();
                updateActionButton();
                return;
            }

            const defenseCard = document.createElement('img');
            defenseCard.src = playerCardData.src;
            defenseCard.alt = `Карта: ${playerCardData.suit} ${playerCardData.rang}`;
            defenseCard.classList.add('card', 'table-card', 'defense-card');
            if (playerCardData.cardType === 'golden') defenseCard.classList.add('golden');
            if (playerCardData.cardType === 'glass') defenseCard.classList.add('glass');
            defenseCard.dataset.suit = playerCardData.suit;
            defenseCard.dataset.rang = playerCardData.rang;
            defenseCard.dataset.src = playerCardData.src;
            defenseCard.dataset.origin = 'player';
            defenseCard.dataset.defends = botCard.dataset.rang + botCard.dataset.suit;
            if (playerCardData.cardType) {
                defenseCard.dataset.cardType = playerCardData.cardType;
            }

            const botCardRect = botCard.getBoundingClientRect();
            const tableRect = table.getBoundingClientRect();
            defenseCard.style.position = 'absolute';
            defenseCard.style.left = (botCardRect.left - tableRect.left + 15) + 'px';
            defenseCard.style.top = (botCardRect.top - tableRect.top - 10) + 'px';
            defenseCard.style.zIndex = '5';

            table.appendChild(defenseCard);

            const cardIndex = playerHand.findIndex(c =>
                c.suit === playerCardData.suit && c.rang === playerCardData.rang);
            if (cardIndex !== -1) {
                playerHand.splice(cardIndex, 1);
            }
            card.remove();

            botCard.dataset.defended = 'true';
        }
    } catch (e) {
        console.error('Error processing defend action:', e);
    }

    checkAllDefended();
    updateActionButton();
}

function botAttack() {

    botDrawCards();

    updateActionButton();
    if (botCards.length === 0) {
        isPlayerTurn = true;
        setPlayerCardsClickable(true);
        updateTurnButtonsVisibility();
        return;
    }

    if (isPlayerTurn === false) {
        // 1. Собираем статистику по рангам в руке бота
        const rankStats = {};
        botCards.forEach(card => {
            rankStats[card.rang] = (rankStats[card.rang] || 0) + 1;
        });

        // 2. Выбираем ранг с максимальным количеством карт (минимум 2 карты)
        let bestRank = '';
        let maxCount = 1; // Минимум 2 карты одного ранга
        for (const [rank, count] of Object.entries(rankStats)) {
            if (count > maxCount) {
                bestRank = rank;
                maxCount = count;
            }
        }

        let cardsToPlay = [];

        // 3. Если есть ранг с 2+ картами, выбираем все карты этого ранга (но не более 6)
        if (maxCount >= 2) {
            cardsToPlay = botCards.filter(card => card.rang === bestRank).slice(0, 6);
        } else {
            // 4. Если нет рангов с 2+ картами, выбираем случайную карту
            const randomCard = botCards[Math.floor(Math.random() * botCards.length)];
            cardsToPlay = [randomCard];
        }

        // 5. Выкладываем карты на стол
        const cardsToRemove = [];
        cardsToPlay.forEach(cardData => {
            const cardIndex = botCards.findIndex(c =>
                c.rang === cardData.rang && c.suit === cardData.suit);

            if (cardIndex !== -1) {
                const newCard = document.createElement('img');
                newCard.src = cardData.src;
                newCard.alt = `Карта: ${cardData.suit} ${cardData.rang}`;
                newCard.classList.add('card', 'table-card', 'bot-attack-card');
                newCard.dataset.suit = cardData.suit;
                newCard.dataset.rang = cardData.rang;
                newCard.dataset.src = cardData.src;
                newCard.dataset.origin = 'bot';

                table.appendChild(newCard);
                cardsToRemove.push(cardIndex);
                playedCardsThisTurn.push(cardData);

                setTimeout(() => newCard.classList.remove('bot-attack-card'), 500);
            }
        });

        // 6. Удаляем карты из руки бота (в обратном порядке, чтобы индексы не сдвигались)
        cardsToRemove.sort((a, b) => b - a).forEach(index => {
            botCards.splice(index, 1);
            botHand.children[index].remove();
        });

        // 7. Передаем ход игроку для отбития
        isPlayerTurn = true;
        setPlayerCardsClickable(true);
        highlightDefendableCards();
        updateCounts();
        logGameState();
        updateTurnButtonsVisibility();
        playerDrawCards()
        updateActionButton();
        checkWinConditions();

    }
    checkWinConditions();
}

function updateDiscardPileVisual() {
    discardCountElement.textContent = discardPile.length;

    if (discardPile.length > 0) {
        discardPileElement.src = discardPile[discardPile.length - 1].src;
    } else {
        discardPileElement.src = gameData.cardBack;
    }

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

function initJokersPanel() {
    const container = document.querySelector('.jokers-container');
    container.innerHTML = ''; 

    jokers.forEach(joker => {
        const jokerCard = document.createElement('img');
        jokerCard.className = 'joker-card-panel';
        jokerCard.src = joker.src;
        jokerCard.title = `Джокер #${joker.id}`;
        jokerCard.style.cursor = 'pointer';
        jokerCard.dataset.jokerId = joker.id;

        jokerCard.addEventListener('click', () => useJoker(joker));
        container.appendChild(jokerCard);
    });

    if (jokers.length === 0) {
        container.style.opacity = '0';
    } else {
        container.style.opacity = '1';
    }
}

function useJoker(joker) {
    console.log(`Использован джокер: ${joker.id}`);

    if (playerHand.length === 0) {
        alert('У вас нет карт в руке для замены.');
        return;
    }

    let newSuit = null;
    switch (joker.id) {
        case 1:
            newSuit = 'clubs';    // трефы
            break;
        case 2:
            newSuit = 'spades';   // пики
            break;
        case 3:
            newSuit = 'hearts';   // червы
            break;
        case 4:
            newSuit = 'diamonds'; // бубны
            break;
        default:
            alert(`Джокер с id=${joker.id} пока не реализован.`);
            return;
    }

    const newHand = playerHand.map(card => {
        const newCard = { ...card };
        newCard.suit = newSuit;
        const newSrc = gameData.cards.find(c =>
            c.rang === card.rang && c.suit === newSuit)?.src;
        if (newSrc) {
            newCard.src = newSrc;
        }
        return newCard;
    });

    playerHand = newHand;

    updatePlayerHandDisplay();

    alert(`Все карты в руке заменены на масть ${newSuit}.`);

    jokers = jokers.filter(j => j.id !== joker.id);
    initJokersPanel(); 
}

function restartGame() {
    // Сохраняем важные данные
    const savedSpecialDeck = [...specialDeck];
    const savedJokers = [...jokers];
    const savedMoney = money;

    // Полностью перезагружаем игру
    initGame();

    // Восстанавливаем сохраненные данные
    specialDeck = savedSpecialDeck;
    jokers = savedJokers;
    money = savedMoney;

    // Обновляем отображение
    updateSpecialDeckDisplay();
    initJokersPanel();
    updateMoneyDisplay();

    // Показываем магазин для новой игры
    document.getElementById('shopModal').style.display = 'block';
    loadShopCards();
}