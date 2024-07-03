document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('gameBoard');
    const moveCounter = document.getElementById('moveCounter');
    const timerBar = document.getElementById('timerBar');
    const minMovesCounter = document.getElementById('minMovesCounter');
    const message = document.getElementById('message');
    const summary = document.getElementById('summary');
    const instructions = document.getElementById('instructions');
    let moveCount = 0;
    let timerInterval;
    let gameIndex = 0;
    let gamesData = [];
    let timerStarted = false;

    const MAX_GAMES = 3;

    function startGame() {
        moveCount = 0;
        message.textContent = '';
        moveCounter.textContent = `Mosse: ${moveCount}`;
        summary.textContent = '';
        board.innerHTML = '';

        let numbers = generateNumbers();
        let shuffledNumbers = shuffle(numbers);

        // Calculate the minimum moves needed to solve the puzzle
        const minMoves = calculateMinMoves(shuffledNumbers);
        minMovesCounter.textContent = `Mosse necessarie per risolvere il puzzle: ${minMoves}`;

        // Create the grid cells with operators
        for (let i = 0; i < 3; i++) {
            createCell(shuffledNumbers[i * 3]);
            createOperator('+');
            createCell(shuffledNumbers[i * 3 + 1]);
            createOperator('=');
            createCell(shuffledNumbers[i * 3 + 2]);
        }

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
        cell.classList.add('cell');
        cell.textContent = num;
        cell.draggable = true;
        cell.dataset.index = board.childElementCount;
        cell.addEventListener('dragstart', dragStart);
        cell.addEventListener('dragover', dragOver);
        cell.addEventListener('drop', drop);
        cell.addEventListener('touchstart', touchStart, { passive: false });
        cell.addEventListener('touchmove', touchMove, { passive: false });
        cell.addEventListener('touchend', touchEnd, { passive: false });
        board.appendChild(cell);
    }

    function createOperator(operator) {
        let operatorCell = document.createElement('div');
        operatorCell.classList.add('operator');
        operatorCell.textContent = operator;
        board.appendChild(operatorCell);
    }

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.index);
        if (!timerStarted) {
            timerStarted = true;
            instructions.style.display = 'none';
        }
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function drop(e) {
        e.preventDefault();
        const sourceIndex = e.dataTransfer.getData('text/plain');
        const target = e.target;
        if (target.classList.contains('cell')) {
            const targetIndex = target.dataset.index;
            const sourceCell = document.querySelector(`.cell[data-index='${sourceIndex}']`);
            
            // Swap the content of the source cell and target cell
            [sourceCell.textContent, target.textContent] = [target.textContent, sourceCell.textContent];

            // Increment move count and update display
            moveCount++;
            moveCounter.textContent = `Mosse: ${moveCount}`;
        }
        checkWin();
    }

    function touchStart(e) {
        if (!timerStarted) {
            timerStarted = true;
            instructions.style.display = 'none';
        }
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target.classList.contains('cell')) {
            e.target.classList.add('dragging');
            e.target.dataset.draggingIndex = e.target.dataset.index;
        }
        e.preventDefault();
    }

    function touchMove(e) {
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const draggingElement = document.querySelector('.dragging');
        if (draggingElement && target && target.classList.contains('cell')) {
            if (target !== draggingElement) {
                const targetIndex = target.dataset.index;
                const sourceIndex = draggingElement.dataset.draggingIndex;
                const sourceCell = document.querySelector(`.cell[data-index='${sourceIndex}']`);
                
                // Swap the content of the source cell and target cell
                [sourceCell.textContent, target.textContent] = [target.textContent, sourceCell.textContent];
                
                draggingElement.classList.remove('dragging');
                draggingElement.removeAttribute('data-dragging-index');
                
                // Increment move count and update display
                moveCount++;
                moveCounter.textContent = `Mosse: ${moveCount}`;
                checkWin();
            }
        }
        e.preventDefault();
    }

    function touchEnd(e) {
        const draggingElement = document.querySelector('.dragging');
        if (draggingElement) {
            draggingElement.classList.remove('dragging');
            draggingElement.removeAttribute('data-dragging-index');
        }
        e.preventDefault();
    }

    function checkWin() {
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

        if (correct) {
            clearInterval(timerInterval);
            message.textContent = 'Puzzle Risolto';
            gamesData.push({
                minMoves: parseInt(minMovesCounter.textContent.match(/\d+/)[0]),
                actualMoves: moveCount,
                timeSpent: 120 - (parseInt(timerBar.style.width) * 120 / 100)
            });

            gameIndex++;
            if (gameIndex < MAX_GAMES) {
                setTimeout(startGame, 1000); // Start next game after 1 second
            } else {
                showSummary();
            }
        }
    }

    function startTimer() {
        let timeRemaining = 120; // 2 minutes in seconds

        timerInterval = setInterval(() => {
            timeRemaining--;
            let progress = (120 - timeRemaining) / 120 * 100;
            timerBar.style.width = `${progress}%`;

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                alert('Tempo scaduto!');
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
                    <td>${game.timeSpent.toFixed(1)}</td>
                </tr>
            `;
        });

        summaryHtml += `
                </tbody>
            </table>
        `;
        summary.innerHTML = summaryHtml;
    }

    // Start the first game
    startGame();
});
