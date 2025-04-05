document.addEventListener('DOMContentLoaded', () => {
    const NUMBER_OF_GUESSES = 6;
    const WORD_LENGTH = 5;
    let guessesRemaining = NUMBER_OF_GUESSES;
    let currentGuess = [];
    let nextLetter = 0;
    let rightGuessString = WORDS[Math.floor(Math.random() * WORDS.length)];
    console.log(rightGuessString);

    // Create the game board
    function initBoard() {
        let board = document.getElementById("board");

        for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
            let row = document.createElement("div");
            row.className = "board-row";

            for (let j = 0; j < WORD_LENGTH; j++) {
                let box = document.createElement("div");
                box.className = "tile";
                row.appendChild(box);
            }

            board.appendChild(row);
        }
    }

    function shadeKeyBoard(letter, color) {
        for (const elem of document.getElementsByTagName("button")) {
            if (elem.textContent === letter) {
                let oldColor = elem.style.backgroundColor;
                if (oldColor === 'rgb(106, 170, 100)') {
                    return;
                }

                if (oldColor === 'rgb(201, 180, 88)' && color !== 'rgb(106, 170, 100)') {
                    return;
                }

                elem.style.backgroundColor = color;
                elem.style.color = 'white';
                break;
            }
        }
    }

    function deleteLetter() {
        let row = document.getElementsByClassName("board-row")[NUMBER_OF_GUESSES - guessesRemaining];
        let box = row.children[nextLetter - 1];
        box.textContent = "";
        box.classList.remove("pop");
        currentGuess.pop();
        nextLetter -= 1;
    }

    function checkGuess() {
        let row = document.getElementsByClassName("board-row")[NUMBER_OF_GUESSES - guessesRemaining];
        let guessString = '';
        let rightGuess = Array.from(rightGuessString);

        for (const val of currentGuess) {
            guessString += val;
        }

        if (guessString.length != WORD_LENGTH) {
            toastr("Not enough letters!");
            return;
        }

        if (!VALID_GUESSES.includes(guessString)) {
            toastr("Not in word list!");
            return;
        }

        let letterCount = {};
        for (let i = 0; i < rightGuess.length; i++) {
            let letter = rightGuess[i];
            if (letterCount[letter]) {
                letterCount[letter] += 1;
            } else {
                letterCount[letter] = 1;
            }
        }

        // First pass: mark correct letters
        let checkArray = Array(WORD_LENGTH).fill("");
        for (let i = 0; i < WORD_LENGTH; i++) {
            let letter = currentGuess[i];
            let box = row.children[i];
            let delay = 250 * i;

            if (rightGuess[i] === letter) {
                checkArray[i] = "correct";
                letterCount[letter] -= 1;
            }
        }

        // Second pass: mark present and absent letters
        for (let i = 0; i < WORD_LENGTH; i++) {
            let letter = currentGuess[i];
            let box = row.children[i];
            let delay = 250 * i;

            setTimeout(() => {
                if (checkArray[i] === "correct") {
                    box.style.backgroundColor = "rgb(106, 170, 100)";
                    box.style.borderColor = "rgb(106, 170, 100)";
                    shadeKeyBoard(letter, "rgb(106, 170, 100)");
                } else if (rightGuess.includes(letter) && letterCount[letter] > 0) {
                    box.style.backgroundColor = "rgb(201, 180, 88)";
                    box.style.borderColor = "rgb(201, 180, 88)";
                    shadeKeyBoard(letter, "rgb(201, 180, 88)");
                    letterCount[letter] -= 1;
                } else {
                    box.style.backgroundColor = "rgb(120, 124, 126)";
                    box.style.borderColor = "rgb(120, 124, 126)";
                    shadeKeyBoard(letter, "rgb(120, 124, 126)");
                }
                box.style.color = "white";
            }, delay);
        }

        if (guessString === rightGuessString) {
            toastr("Magnificent!");
            guessesRemaining = 0;
            return;
        } else {
            guessesRemaining -= 1;
            currentGuess = [];
            nextLetter = 0;

            if (guessesRemaining === 0) {
                toastr("Game Over! The word was " + rightGuessString);
            }
        }
    }

    function insertLetter(pressedKey) {
        if (nextLetter === WORD_LENGTH) {
            return;
        }

        pressedKey = pressedKey.toUpperCase();
        let row = document.getElementsByClassName("board-row")[NUMBER_OF_GUESSES - guessesRemaining];
        let box = row.children[nextLetter];
        box.textContent = pressedKey;
        box.classList.add("pop");
        currentGuess.push(pressedKey);
        nextLetter += 1;
    }

    function toastr(message) {
        let toast = document.getElementById("toast");
        toast.textContent = message;
        toast.className = "show";
        setTimeout(() => {
            toast.className = toast.className.replace("show", "");
        }, 1000);
    }

    document.addEventListener("keyup", (e) => {
        if (guessesRemaining === 0) {
            return;
        }

        let pressedKey = String(e.key);
        if (pressedKey === "Backspace" && nextLetter !== 0) {
            deleteLetter();
            return;
        }

        if (pressedKey === "Enter") {
            checkGuess();
            return;
        }

        let found = pressedKey.match(/[a-z]/gi);
        if (!found || found.length > 1) {
            return;
        }

        insertLetter(pressedKey);
    });

    document.getElementById("keyboard-container").addEventListener("click", (e) => {
        const target = e.target;
        
        if (!target.matches("button")) {
            return;
        }
        
        let key = target.dataset.key;
        
        if (key === "enter") {
            checkGuess();
            return;
        }
        
        if (key === "del") {
            deleteLetter();
            return;
        }
        
        insertLetter(key);
    });

    initBoard();
}); 