document.addEventListener('DOMContentLoaded', () => {
    const NUMBER_OF_GUESSES = 6;
    const WORD_LENGTH = 5;
    
    // Convert all words to uppercase at the start
    const UPPERCASE_WORDS = WORDS.map(word => word.toUpperCase());
    const VALID_GUESSES = UPPERCASE_WORDS;
    
    let guessesRemaining = NUMBER_OF_GUESSES;
    let currentGuess = [];
    let nextLetter = 0;
    let rightGuessString = UPPERCASE_WORDS[Math.floor(Math.random() * UPPERCASE_WORDS.length)];
    let isAIPlaying = false;
    console.log("Secret word:", rightGuessString); // Log the secret word for debugging

    // Letter frequency analysis for English language
    const LETTER_FREQ = {
        'A': 8.2, 'B': 1.5, 'C': 2.8, 'D': 4.3, 'E': 13, 'F': 2.2, 'G': 2.0, 'H': 6.1,
        'I': 7.0, 'J': 0.15, 'K': 0.77, 'L': 4.0, 'M': 2.4, 'N': 6.7, 'O': 7.5, 'P': 1.9,
        'Q': 0.095, 'R': 6.0, 'S': 6.3, 'T': 9.1, 'U': 2.8, 'V': 0.98, 'W': 2.4, 'X': 0.15,
        'Y': 2.0, 'Z': 0.074
    };

    // Mode selection handling
    document.getElementById('play-self').addEventListener('click', () => {
        document.getElementById('mode-selection').style.display = 'none';
        document.querySelector('.game-container').style.display = 'flex';
        isAIPlaying = false;
        initBoard();
    });

    document.getElementById('watch-ai').addEventListener('click', () => {
        document.getElementById('mode-selection').style.display = 'none';
        document.querySelector('.game-container').style.display = 'flex';
        isAIPlaying = true;
        initBoard();
        playAI();
    });

    document.getElementById('back-to-menu').addEventListener('click', () => {
        location.reload();
    });

    // Advanced AI solver implementation
    async function playAI() {
        let possibleWords = [...UPPERCASE_WORDS];
        let guessCount = 0;
        
        // Calculate initial optimal starting word
        let startWord = findOptimalStartingWord(UPPERCASE_WORDS);
        console.log("AI starting with:", startWord);
        
        try {
            // First guess
            await makeGuessAndProcess(startWord, guessCount);
            guessCount++;
            
            // Continue guessing until solved or out of guesses
            while (guessesRemaining > 0 && guessCount < NUMBER_OF_GUESSES) {
                // Get the last row with our guess
                let lastRow = document.getElementsByClassName("board-row")[guessCount - 1];
                let pattern = [];
                
                // Extract the pattern from the colors
                for (let i = 0; i < WORD_LENGTH; i++) {
                    let box = lastRow.children[i];
                    let color = window.getComputedStyle(box).backgroundColor;
                    
                    if (color === 'rgb(106, 170, 100)') { // green
                        pattern.push('correct');
                    } else if (color === 'rgb(201, 180, 88)') { // yellow
                        pattern.push('present');
                    } else { // grey
                        pattern.push('absent');
                    }
                }
                
                // Get the guess we just made
                let lastGuess = '';
                for (let i = 0; i < WORD_LENGTH; i++) {
                    lastGuess += lastRow.children[i].textContent;
                }
                
                // Check if we won
                if (lastGuess === rightGuessString) {
                    console.log("AI won!");
                    break;
                }
                
                // Filter possible words based on the pattern
                possibleWords = filterWords(possibleWords, lastGuess, pattern);
                console.log(`After guess ${guessCount}, ${possibleWords.length} words remain`);
                
                // Choose next guess using information theory
                let nextGuess = findOptimalNextGuess(possibleWords, pattern);
                console.log(`AI next guess: ${nextGuess}`);
                
                // Make the next guess
                await makeGuessAndProcess(nextGuess, guessCount);
                guessCount++;
            }
        } catch (error) {
            console.error("Error in AI play:", error);
        }
    }
    
    // Helper function to make a guess and wait for processing
    async function makeGuessAndProcess(word, guessIndex) {
        return new Promise(async (resolve) => {
            // Clear current state
            currentGuess = [];
            nextLetter = 0;
            
            // Type each letter with delay
            for (let i = 0; i < word.length; i++) {
                await new Promise(r => setTimeout(r, 200));
                insertLetter(word[i]);
            }
            
            // Wait before submitting
            await new Promise(r => setTimeout(r, 300));
            
            // Submit and wait for animations to complete
            checkGuess(() => {
                console.log(`Guess ${guessIndex + 1} complete:`, word);
                setTimeout(resolve, 700); // Wait additional time after guess is processed
            });
        });
    }

    function findOptimalStartingWord(wordList) {
        // Calculate word scores based on letter frequency and position
        let wordScores = new Map();
        
        for (let word of wordList) {
            let score = 0;
            let usedLetters = new Set();
            
            // Analyze each letter in the word
            for (let i = 0; i < word.length; i++) {
                let letter = word[i];
                if (!usedLetters.has(letter)) {
                    // Add letter frequency score
                    score += LETTER_FREQ[letter];
                    
                    // Bonus for common letter positions (e.g., 'S' at start, 'E' at end)
                    if (i === 0 && 'SCBTRP'.includes(letter)) score += 2;
                    if (i === 4 && 'ESDY'.includes(letter)) score += 2;
                    
                    usedLetters.add(letter);
                }
            }
            
            // Penalty for repeated letters in starting word
            if (usedLetters.size < word.length) {
                score *= 0.8;
            }
            
            wordScores.set(word, score);
        }
        
        // Return the word with the highest score
        return Array.from(wordScores.entries())
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    function findOptimalNextGuess(possibleWords, lastPattern) {
        if (possibleWords.length <= 2) {
            return possibleWords[0];
        }

        // Calculate information gain for each possible guess
        let wordScores = new Map();
        
        for (let candidateWord of possibleWords) {
            let score = 0;
            let patternDistribution = new Map();
            
            // Simulate each possible pattern this guess could generate
            for (let possibleAnswer of possibleWords) {
                let pattern = simulateGuess(candidateWord, possibleAnswer);
                let patternKey = pattern.join(',');
                patternDistribution.set(patternKey, (patternDistribution.get(patternKey) || 0) + 1);
            }
            
            // Calculate entropy (information gain) for this guess
            for (let [_, count] of patternDistribution) {
                let probability = count / possibleWords.length;
                score -= probability * Math.log2(probability); // entropy formula
            }
            
            // Add letter frequency score as a tiebreaker
            let letterScore = 0;
            let usedLetters = new Set();
            for (let letter of candidateWord) {
                if (!usedLetters.has(letter)) {
                    letterScore += LETTER_FREQ[letter];
                    usedLetters.add(letter);
                }
            }
            
            score = score * 10 + letterScore / 100; // Weighted combination
            wordScores.set(candidateWord, score);
        }
        
        // Return the word with the highest information gain
        return Array.from(wordScores.entries())
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    function simulateGuess(guess, answer) {
        let pattern = Array(WORD_LENGTH).fill('absent');
        let letterCount = {};
        
        // Count letters in answer
        for (let letter of answer) {
            letterCount[letter] = (letterCount[letter] || 0) + 1;
        }
        
        // First pass: mark correct letters
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guess[i] === answer[i]) {
                pattern[i] = 'correct';
                letterCount[guess[i]]--;
            }
        }
        
        // Second pass: mark present letters
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (pattern[i] !== 'correct' && 
                letterCount[guess[i]] > 0) {
                pattern[i] = 'present';
                letterCount[guess[i]]--;
            }
        }
        
        return pattern;
    }

    function filterWords(words, lastGuess, pattern) {
        return words.filter(word => {
            let letterCount = {};
            // Count letters in the word
            for (let letter of word) {
                letterCount[letter] = (letterCount[letter] || 0) + 1;
            }
            
            // First check correct positions
            for (let i = 0; i < WORD_LENGTH; i++) {
                if (pattern[i] === 'correct' && word[i] !== lastGuess[i]) {
                    return false;
                }
                if (pattern[i] === 'correct') {
                    letterCount[lastGuess[i]]--;
                }
            }
            
            // Then check present letters
            for (let i = 0; i < WORD_LENGTH; i++) {
                let guessLetter = lastGuess[i];
                
                if (pattern[i] === 'present') {
                    // Letter must exist somewhere else
                    if (!letterCount[guessLetter] || word[i] === guessLetter) {
                        return false;
                    }
                    letterCount[guessLetter]--;
                }
                else if (pattern[i] === 'absent') {
                    // Letter shouldn't exist anymore in remaining positions
                    if (letterCount[guessLetter] > 0) {
                        return false;
                    }
                }
            }
            
            return true;
        });
    }

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

    async function makeAIGuess(word) {
        // Clear the current guess
        currentGuess = [];
        nextLetter = 0;
        
        // Type each letter with a delay
        for (let letter of word) {
            await new Promise(resolve => setTimeout(resolve, 300));
            insertLetter(letter);
        }
        
        // Wait before submitting
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Submit the guess and wait for animations
        return new Promise(resolve => {
            checkGuess(resolve);
        });
    }

    function checkGuess(callback = null) {
        let row = document.getElementsByClassName("board-row")[NUMBER_OF_GUESSES - guessesRemaining];
        let guessString = '';
        let rightGuess = Array.from(rightGuessString);

        for (const val of currentGuess) {
            guessString += val;
        }

        if (guessString.length != WORD_LENGTH) {
            toastr("Not enough letters!");
            if (callback) callback();
            return;
        }

        if (!VALID_GUESSES.includes(guessString)) {
            toastr("Not in word list!");
            if (callback) callback();
            return;
        }

        let letterCount = {};
        for (let i = 0; i < rightGuess.length; i++) {
            let letter = rightGuess[i];
            letterCount[letter] = (letterCount[letter] || 0) + 1;
        }

        // First pass: mark correct letters
        let checkArray = Array(WORD_LENGTH).fill("");
        for (let i = 0; i < WORD_LENGTH; i++) {
            let letter = currentGuess[i];
            if (rightGuess[i] === letter) {
                checkArray[i] = "correct";
                letterCount[letter]--;
            }
        }

        // Second pass: mark present and absent letters
        let animationPromises = [];
        for (let i = 0; i < WORD_LENGTH; i++) {
            let letter = currentGuess[i];
            let box = row.children[i];
            let delay = 250 * i;

            const promise = new Promise(resolve => {
                setTimeout(() => {
                    box.style.color = 'white';
                    if (checkArray[i] === "correct") {
                        box.style.backgroundColor = "rgb(106, 170, 100)";
                        box.style.borderColor = "rgb(106, 170, 100)";
                        shadeKeyBoard(letter, "rgb(106, 170, 100)");
                    } else if (rightGuess.includes(letter) && letterCount[letter] > 0) {
                        box.style.backgroundColor = "rgb(201, 180, 88)";
                        box.style.borderColor = "rgb(201, 180, 88)";
                        shadeKeyBoard(letter, "rgb(201, 180, 88)");
                        letterCount[letter]--;
                    } else {
                        box.style.backgroundColor = "rgb(120, 124, 126)";
                        box.style.borderColor = "rgb(120, 124, 126)";
                        shadeKeyBoard(letter, "rgb(120, 124, 126)");
                    }
                    resolve();
                }, delay);
            });
            animationPromises.push(promise);
        }

        // Wait for all animations to complete
        Promise.all(animationPromises).then(() => {
            if (guessString === rightGuessString) {
                setTimeout(() => {
                    toastr("Magnificent!");
                    guessesRemaining = 0;
                    if (callback) callback();
                }, 500);
            } else {
                guessesRemaining -= 1;
                currentGuess = [];
                nextLetter = 0;

                if (guessesRemaining === 0) {
                    setTimeout(() => {
                        toastr("Game Over! The word was " + rightGuessString);
                        if (callback) callback();
                    }, 500);
                } else {
                    if (callback) {
                        setTimeout(callback, 500);
                    }
                }
            }
        });
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
        if (isAIPlaying || guessesRemaining === 0) {
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
        if (isAIPlaying) {
            return;
        }
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

    // Don't automatically init board - wait for mode selection
}); 