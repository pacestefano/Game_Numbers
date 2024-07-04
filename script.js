document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('gameBoard');
    const timerBar = document.getElementById('timerBar');
    const timerText = document.getElementById('timerText');
    const minMovesContainer = document.getElementById('minMovesContainer');
    const movesContainer = document.getElementById('movesContainer');
    const minMovesCounter = document.getElementById('minMovesCounter');
    const movesCounter = document.getElementById('movesCounter');
    const message = document.getElementById('message');
    const summary = document.getElementById('summary');
    const instructions = document.getElementById('instructions');
    const nextGameButton = document.getElementById('nextGameButton');
    const retryButton = document.getElementById('retryButton');
    const timeoutMessage = document.getElementById('timeoutMessage');
    const moveSound = document.getElementById('moveSound');
    const winSound = document.getElementById('winSound');
    const timeoutSound = document.getElementById('timeoutSound');
    const loseSound = document.getElementById('loseSound');
    const undoButton = document.getElementById('undoButton');

    let moveCount = 0;
    let timerInterval;
    let gameIndex = 0;
    let gamesData = [];
    let timerStarted = false;
    let draggedElement = null;
    let totalMoves;
    let moveHistory = [];
    let gameOver = false;

    const MAX_GAMES = 3;

    function startGame() {
        console.log("Starting game..."); // Debug
        moveCount = 0;
        moveHistory = [];
        gameOver = false;
        if (message) message.textContent = '';
        if (timeoutMessage) timeoutMessage.style.display = 'none';
        if (retryButton) retryButton.style.display = 'none';
        if (summary) summary.textContent = '';
        if (nextGameButton) nextGameButton.style.display = 'none';
        if (board) {
            board.innerHTML = '';
            board.classList.remove('win-animation');
        }
        if (timerText) timerText.textContent = '120 secondi';
        if (timerBar) timerBar.style.width = '100%';
        if (movesContainer) movesContainer.innerHTML = '';
        if (minMovesContainer) minMovesContainer.innerHTML = '';
        if (movesCounter) movesCounter.textContent = '0';
        if (minMovesCounter) minMovesCounter.textContent = '0';

        if (undoButton) {
            undoButton.classList.remove('active');
            undoButton.style.backgroundColor = '#d3d3d3';
            undoButton.style.cursor = 'not-allowed';
        }

        let numbers = generateNumbers();
        let shuffledNumbers = shuffle(numbers);
        console.log("Generated numbers:", numbers); // Debug

        const minMoves = calculateMinMoves(shuffledNumbers);
        if (minMovesCounter) minMovesCounter.textContent = minMoves;
        totalMoves = minMoves;
        for (let i = 0; i < minMoves; i++) {
            let circle = document.createElement('div');
            circle.classList.add('circle', 'min-moves');
            minMovesContainer.appendChild(circle);
        }

        for (let i = 0; i < 3; i++) {
            createCell(shuffledNumbers[i * 3]);
            createOperator('+');
            createCell(shuffledNumbers[i * 3 + 1]);
            createOperator('=');
            createCell(shuffledNumbers[i * 3 + 2]);
        }
        console.log("Grid populated"); // Debug

        startTimer();
    }

    function generateNumbers() {
        let numbers = [];
        while (numbers.length < 9) {
            let A = Math.floor(Math.random() * 9) + 1;
            let B = Math.floor(Math.random() * 9) + 1;
            let C = A + B;
            if (C <= 9) {
                numbers.push(A, B, C);
            }
        }
        console.log("Generated numbers:", numbers); // Debug
        return numbers.slice(0, 9);
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function createCell(num) {
        let cell = document.createElement('div');
        console.log("Creating cell with number:", num); // Debug
        cell.classList.add('cell');
        cell.textContent = num;
        cell.draggable = true;
        cell.dataset.index = board.childElementCount;
        cell.addEventListener('dragstart', dragStart);
        cell.addEventListener('dragover', dragOver);
        cell.addEventListener('dragleave', dragLeave);
        cell.addEventListener('drop', drop);
        cell.addEventListener('touchstart', touchStart, { passive: false });
        cell.addEventListener('touchmove', touchMove, { passive: false });
        cell.addEventListener('touchend', touchEnd, { passive: false });
        if (board) board.appendChild(cell);
    }

    function createOperator(operator) {
        let operatorCell = document.createElement('div');
        operatorCell.classList.add('operator');
        operatorCell.textContent = operator;
        if (board) board.appendChild(operatorCell);
    }

    function dragStart(e) {
        if (gameOver) return;
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        e.target.classList.add('dragging');
        if (!timerStarted) {
            timerStarted = true;
        }

        if (undoButton) {
            undoButton.classList.add('active');
            undoButton.style.backgroundColor = '#4caf50';
            undoButton.style.cursor = 'pointer';
        }
    }

    function dragOver(e) {
        e.preventDefault();
        if (gameOver) return;
        e.target.classList.add('drop-target');
    }

    function dragLeave(e) {
        e.target.classList.remove('drop-target');
    }

    function drop(e) {
        e.preventDefault();
        if (gameOver) return;
        e.target.classList.remove('drop-target');
        const sourceIndex = e.dataTransfer.getData('text/plain');
        const target = e.target;
        if (target.classList.contains('cell')) {
            const targetIndex = target.dataset.index;
            const sourceCell = document.querySelector(`.cell[data-index='${sourceIndex}']`);

            saveMoveState();

            [sourceCell.textContent, target.textContent] = [target.textContent, sourceCell.textContent];

            sourceCell.classList.add('highlight');
            target.classList.add('highlight');

            setTimeout(() => {
                sourceCell.classList.remove('highlight');
                target.classList.remove('highlight');
            }, 1000);

            moveCount++;
            movesCounter.textContent = moveCount;
            let circle = document.createElement('div');
            circle.classList.add('circle', 'moves');
            if (moveCount > totalMoves) {
                circle.style.backgroundColor = 'red';
            }
            movesContainer.appendChild(circle);

            sourceCell.classList.remove('dragging');

            moveSound.play();
        }
        checkWin();
    }

    function touchStart(e) {
        if (gameOver) return;
        if (!timerStarted) {
            timerStarted = true;
        }
        const touch = e.touches[0];
        draggedElement = e.target;
        draggedElement.classList.add('dragging');
        draggedElement.dataset.draggingIndex = draggedElement.dataset.index;
        e.preventDefault();

        if (undoButton) {
            undoButton.classList.add('active');
            undoButton.style.backgroundColor = '#4caf50';
            undoButton.style.cursor = 'pointer';
        }
    }

    function touchMove(e) {
        e.preventDefault();
        if (gameOver) return;
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.classList.contains('cell') && target !== draggedElement) {
            target.classList.add('drop-target');
        }
    }

    function touchEnd(e) {
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (gameOver) return;
        if (draggedElement && target && target.classList.contains('cell')) {
            if (target !== draggedElement) {
                const targetIndex = target.dataset.index;
                const sourceIndex = draggedElement.dataset.draggingIndex;
                const sourceCell = document.querySelector(`.cell[data-index='${sourceIndex}']`);

                saveMoveState();

                [sourceCell.textContent, target.textContent] = [target.textContent, sourceCell.textContent];

                sourceCell.classList.add('highlight');
                target.classList.add('highlight');

                setTimeout(() => {
                    sourceCell.classList.remove('highlight');
                    target.classList.remove('highlight');
                }, 1000);

                draggedElement.classList.remove('dragging');
                draggedElement.removeAttribute('data-dragging-index');

                moveCount++;
                movesCounter.textContent = moveCount;
                let circle = document.createElement('div');
                circle.classList.add('circle', 'moves');
                if (moveCount > totalMoves) {
                    circle.style.backgroundColor = 'red';
                }
                movesContainer.appendChild(circle);

                target.classList.remove('drop-target');

                moveSound.play();

                checkWin();
            }
        }
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement.removeAttribute('data-dragging-index');
            draggedElement = null;
        }
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
        e.preventDefault();
    }

    function saveMoveState() {
        const cells = Array.from(document.querySelectorAll('.cell')).map(cell => cell.textContent);
        moveHistory.push({ cells, moveCount });
    }

    window.undoMove = function undoMove() {
        if (moveHistory.length === 0) return;

        const lastState = moveHistory.pop();
        const cells = document.querySelectorAll('.cell');
        lastState.cells.forEach((value, index) => {
            cells[index].textContent = value;
        });

        moveCount = lastState.moveCount;
        movesCounter.textContent = moveCount;

        if (movesContainer.lastChild) {
            movesContainer.removeChild(movesContainer.lastChild);
        }

        if (moveCount <= totalMoves) {
            movesContainer.querySelectorAll('.circle.moves').forEach(circle => {
                circle.style.backgroundColor = '#ffeb3b';
            });
        }

        checkWin(true);

        if (message && moveCount <= totalMoves) {
            message.textContent = '';
            gameOver = false;
        }
    }

    function checkWin(isUndo = false) {
        const cells = document.querySelectorAll('.cell');
        const values = Array.from(cells).map(cell => parseInt(cell.textContent));

        let correct = true;
        for (let i = 0; i < 3; i++) {
            const cell1 = cells[i * 3];
            const cell2 = cells[i * 3 + 1];
            const cell3 = cells[i * 3 + 2];

            if (values[i * 3] + values[i * 3 + 1] === values[i * 3 + 2]) {
                cell1.classList.add('correct');
                cell2.classList.add('correct');
                cell3.classList.add('correct');
            } else {
                cell1.classList.remove('correct');
                cell2.classList.remove('correct');
                cell3.classList.remove('correct');
                correct = false;
            }
        }

        if (correct && !isUndo) {
            if (moveCount <= totalMoves) {
                clearInterval(timerInterval);
                if (message) message.textContent = 'Puzzle Risolto';
                board.classList.add('win-animation');
                setTimeout(() => {
                    board.classList.remove('win-animation');
                    if (nextGameButton) nextGameButton.style.display = 'block';
                }, 1000);

                winSound.play();

                gamesData.push({
                    minMoves: parseInt(minMovesCounter.textContent),
                    actualMoves: moveCount,
                    timeSpent: 120 - parseInt(timerText.textContent)
                });

                gameIndex++;
                if (gameIndex < MAX_GAMES) {
                    setTimeout(startGame, 1000);
                } else {
                    showSummary();
                }
            }
        } else if (!isUndo && moveCount > totalMoves) {
            gameOver = true;
            if (message) message.textContent = 'Numero massimo di mosse superato. Annulla le ultime mosse e riprova.';
            loseSound.play();
        }
    }

    function startTimer() {
        let timeRemaining = 120;

        timerInterval = setInterval(() => {
            timeRemaining--;
            let progress = (timeRemaining / 120) * 100;
            if (timerBar) timerBar.style.width = `${progress}%`;
            if (timerText) timerText.textContent = `${timeRemaining} secondi`;

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                if (timeoutMessage) timeoutMessage.style.display = 'block';
                if (retryButton) retryButton.style.display = 'block';
                gameOver = true;

                timeoutSound.play();
            }
        }, 1000);
    }

    function calculateMinMoves(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        let moves = 0;
        const visited = new Array(arr.length).fill(false);

        for (let i = 0; i < arr.length; i++) {
            if (visited[i] || sorted[i] === arr[i]) continue;

            let cycleSize = 0;
            let x = i;
            while (!visited[x]) {
                visited[x] = true;
                x = arr.indexOf(sorted[x]);
                cycleSize++;
            }

            if (cycleSize > 0) {
                moves += (cycleSize - 1);
            }
        }

        return moves;
    }

    function showSummary() {
        let summaryHtml = `
            <h3>Riepilogo delle Partite</h3>
            <table>
                <thead>
                    <tr>
                        <th>Partita</th>
                        <th>Mosse Minime Necessarie</th>
                        <th>Mosse Effettive</th>
                        <th>Tempo Impiegato (secondi)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        gamesData.forEach((game, index) => {
            summaryHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${game.minMoves}</td>
                    <td>${game.actualMoves}</td>
                    <td>${game.timeSpent}</td>
                </tr>
            `;
        });

        summaryHtml += `
                </tbody>
            </table>
        `;
        if (summary) summary.innerHTML = summaryHtml;
    }

    document.body.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    startGame();
});
