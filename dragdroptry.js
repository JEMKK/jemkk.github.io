// drag-drop-images-palabras
// FUNCIONES GENÃ‰RICAS
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createElement(tag, className, attributes = {}) {
    const element = document.createElement(tag);
    element.className = className;
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}

// INICIALIZACIÃ“N DEL EJERCICIO
function initializeExercise() {
    // Crear zonas de drop
    const dropZonesContainer = document.getElementById('drop-zones-container');
    exerciseConfig.wordsData.forEach(item => {
        const itemDiv = createElement('div', exerciseConfig.classes.dropItem, {
            'data-word': item.word
        });
        
        const img = createElement('img', exerciseConfig.classes.image, {
            src: item.image,
            alt: item.word,
            'draggable': 'false'
        });
        
        // Prevenir dragstart en imÃ¡genes
        img.addEventListener('dragstart', (event) => {
            event.preventDefault();
            return false;
        });
        
        const dropZone = createElement('div', exerciseConfig.classes.dropZone, {
            'data-accept': item.word
        });
        
        itemDiv.appendChild(img);
        itemDiv.appendChild(dropZone);
        dropZonesContainer.appendChild(itemDiv);
    });

    // Crear palabras arrastrables
    const wordsContainer = document.getElementById('words-container');
    const shuffledWords = [...exerciseConfig.wordsData];
    shuffle(shuffledWords);
    
    shuffledWords.forEach(item => {
        const wordElement = createElement('div', exerciseConfig.classes.word, {
            'draggable': 'true',
            'data-word': item.word
        });
        wordElement.textContent = item.word;
        wordsContainer.appendChild(wordElement);
    });
}

initializeExercise();

// ********************************************************
// VARIABLES Y EVENTOS DEBEN INICIALIZARSE DESPUÃ‰S DE CREAR LOS ELEMENTOS
// ********************************************************
let draggedElement = null;
let placeholder = null;
let touchOffsetX = 0;
let touchOffsetY = 0;

// Seleccionar elementos DESPUÃ‰S de la creaciÃ³n dinÃ¡mica
const words = document.querySelectorAll('.word');
const dropZones = document.querySelectorAll('.drop-zone');

// FunciÃ³n para obtener zona de drop (debe declararse antes de usarse)
function getDropZoneFromTouch(touch) {
    for (const zone of dropZones) {
        const rect = zone.getBoundingClientRect();
        if (
            touch.clientX >= rect.left &&
                touch.clientX <= rect.right &&
                touch.clientY >= rect.top &&
                touch.clientY <= rect.bottom
        ) {
            return zone;
        }
    }
    return null;
}

// Manejo de eventos para palabras
words.forEach((word) => {
    // Almacenar posiciÃ³n inicial
    const rect = word.getBoundingClientRect();
    word.dataset.initialLeft = rect.left;
    word.dataset.initialTop = rect.top;

    // Eventos para drag (PC)
    word.addEventListener("dragstart", (event) => {
        draggedElement = word;
        event.dataTransfer.setData("text/plain", word.dataset.word);
        setTimeout(() => word.classList.add("dragging"), 0);
    });

    word.addEventListener("dragend", () => {
        if (draggedElement) {
            draggedElement.classList.remove("dragging");
            draggedElement = null;
        }
    });

    // Eventos para touch (mÃ³viles) - CORREGIDOS
    word.addEventListener("touchstart", (event) => {
        draggedElement = word;
        const touch = event.touches[0];
        const rect = word.getBoundingClientRect();
        
        // Calcular el offset del toque dentro del elemento
        touchOffsetX = touch.clientX - rect.left;
        touchOffsetY = touch.clientY - rect.top;

        // Crear marcador de posiciÃ³n
        placeholder = document.createElement("div");
        placeholder.classList.add("placeholder");
        placeholder.style.width = `${word.offsetWidth}px`;
        placeholder.style.height = `${word.offsetHeight}px`;
        word.parentNode.insertBefore(placeholder, word);

        word.classList.add("dragging");
        word.style.position = "fixed";
        word.style.left = `${touch.clientX - touchOffsetX}px`;
        word.style.top = `${touch.clientY - touchOffsetY}px`;
        word.style.pointerEvents = "none";
        word.style.zIndex = "1000";
        event.preventDefault();
    });

    word.addEventListener("touchmove", (event) => {
        if (!draggedElement) return;
        const touch = event.touches[0];
        draggedElement.style.left = `${touch.clientX - touchOffsetX}px`;
        draggedElement.style.top = `${touch.clientY - touchOffsetY}px`;
        event.preventDefault();
    });

    word.addEventListener("touchend", (event) => {
        if (!draggedElement) return;

        const touch = event.changedTouches[0];
        const dropZone = getDropZoneFromTouch(touch);

        if (dropZone) {
            handleDrop(dropZone, draggedElement.dataset.word, dropZone.dataset.accept);
        }

        // Restaurar estilos y eliminar marcador
        draggedElement.classList.remove("dragging");
        draggedElement.style.position = "";
        draggedElement.style.left = "";
        draggedElement.style.top = "";
        draggedElement.style.pointerEvents = "";
        draggedElement.style.zIndex = "";
        if (placeholder) placeholder.remove();
        draggedElement = null;
        placeholder = null;
        event.preventDefault();
    });
});

// Manejo de eventos para zonas de drop
dropZones.forEach((zone) => {
    zone.addEventListener("dragover", (event) => {
        event.preventDefault();
        zone.classList.add("hover");
    });

    zone.addEventListener("dragleave", () => {
        zone.classList.remove("hover");
    });

    zone.addEventListener("drop", (event) => {
        event.preventDefault();
        const draggedWord = event.dataTransfer.getData("text/plain");
        handleDrop(zone, draggedWord, zone.dataset.accept);
        zone.classList.remove("hover");
    });

    // Manejo tÃ¡ctil
    zone.addEventListener("touchstart", (event) => {
        if (draggedElement) {
            const touch = event.touches[0];
            const dropZone = getDropZoneFromTouch(touch);
            if (dropZone) {
                handleDrop(dropZone, draggedElement.dataset.word, dropZone.dataset.accept);
            }
        }
        event.preventDefault();
    });
});

// FunciÃ³n para manejar el drop
function handleDrop(zone, draggedWord, correctWord) {
    const wordElement = document.querySelector(`.word[data-word="${draggedWord}"]`);

    if (zone.textContent && zone.textContent !== draggedWord) {
        const wordInZone = zone.textContent;
        const wordInZoneElement = document.querySelector(`.word[data-word="${wordInZone}"]`);
        if (wordInZoneElement) {
            wordInZoneElement.style.visibility = "visible";
            wordInZoneElement.setAttribute("draggable", "true");
        }
    }

    if (draggedWord === correctWord) {
        zone.textContent = draggedWord;
        if (wordElement) wordElement.style.visibility = "hidden";
    } else {
        zone.textContent = draggedWord;
        zone.classList.add("incorrect");
        setTimeout(() => zone.classList.remove("incorrect"), 1000);
        if (wordElement) wordElement.style.visibility = "hidden";
    }
}

// BotÃ³n Check
// Registro de posiciones iniciales
const initialPositions = {};
words.forEach((word) => {
    const rect = word.getBoundingClientRect();
    initialPositions[word.dataset.word] = { left: rect.left, top: rect.top };
});

// Restaurar palabra mal colocada
function restoreWord(wordElement) {
    const wordPosition = initialPositions[wordElement.dataset.word];
    wordElement.style.visibility = 'visible';
    wordElement.setAttribute('draggable', 'true');
    wordElement.style.left = `${wordPosition.left}px`;
    wordElement.style.top = `${wordPosition.top}px`;
}

// Validar palabras y actualizar zonas
document.getElementById('checkButton').addEventListener('click', () => {
    let allCorrect = true;

    words.forEach((wordElement) => {
        const correctZone = document.querySelector(`.drop-zone[data-accept="${wordElement.dataset.word}"]`);
        if (correctZone && correctZone.textContent === wordElement.dataset.word) {
            correctZone.classList.add('correct'); // AÃ±adir clase aquÃ­
            correctZone.style.border = '1px solid green';
        } else {
            allCorrect = false;
            correctZone?.classList.remove('correct'); // Remover si estaba marcado
            restoreWord(wordElement);
        }
    });

    dropZones.forEach((zone) => {
        if (zone.textContent && zone.textContent !== zone.dataset.accept) {
            zone.textContent = '';
            zone.style.border = '2px solid red';
            zone.classList.remove('correct'); // Remover clase si es incorrecto
        } else if (!zone.textContent) {
            zone.style.border = '1px dashed #aaa';
            zone.classList.remove('correct');
        }
    });

    const checkButton = document.getElementById('checkButton');
    if (allCorrect) {
        checkButton.textContent = 'Well done!';
        checkButton.classList.add('disabled');

        let count = 0;
        const interval = setInterval(() => {
            checkButton.style.visibility = checkButton.style.visibility === 'hidden' ? 'visible' : 'hidden';
            count++;
            if (count >= 6) {
                clearInterval(interval);
                checkButton.style.visibility = 'visible';
                checkButton.disabled = true;
                checkButton.style.cursor = 'default';
            }
        }, 300);

    }
});

// BotÃ³n "More exercises"
const navButton = document.getElementById('nav-button');
if (navButton) {
    navButton.addEventListener('click', () => {
        const url = navButton.getAttribute('data-url');
        window.location.href = url;
    });
}  
