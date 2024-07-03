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
    let draggedElement = null;

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
        setTimeout(() => {
            instructions.style.opacity = 0;
        }, 10000); // Il testo scompare dopo 10 secondi
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
        cell.addEventListener('dragleave', dragLeave);
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
        e.target.classList.add('dragging');
        if (!timerStarted) {
            timerStarted = true;
        }
    }

    function dragOver(e) {
        e.preventDefault();
        e.target.classList.add('drop-target');
    }

    function dragLeave(e) {
        e.target.classList.remove('drop-target');
    }

    function drop(e) {
        e.preventDefault();
        e.target.classList.remove('drop-target');
        const sourceIndex = e.dataTransfer.getData('text/plain');
        const target = e.target;
        if (target.classList.contains('cell')) {
            const targetIndex = target.dataset.index;
            const sourceCell = document.querySelector(`.cell[data-index='${sourceIndex}']`);
            
            // Swap the content of the source cell and target cell
            [sourceCell.textContent, target.textContent] = [target.textContent, sourceCell.textContent];

            // Highlight source and target cells
            sourceCell.classList.add('highlight');
            target.classList.add('highlight');

            setTimeout(() => {
                sourceCell.classList.remove('highlight');
                target.classList.remove('highlight');
            }, 1000);

            // Increment move count and update display
            moveCount++;
            moveCounter.textContent = `Mosse: ${moveCount}`;

            // Remove dragging class
            sourceCell.classList.remove('dragging');
        }
        checkWin();
    }

    function touchStart(e) {
        if (!timerStarted) {
            timerStarted = true;
        }
        const touch = e.touches[0];
        draggedElement = e.target;
        draggedElement.classList.add('dragging');
        draggedElement.dataset.draggingIndex = draggedElement.dataset.index;
        e.preventDefault();
    }

    function touchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (target && target.classList.contains('cell') && target !== draggedElement) {
            target.classList.add('drop-target');
        }
    }

    function touchEnd(e) {
        const touch = e.changedTouches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if (draggedElement && target && target.classList.contains('cell')) {
            if (target !== draggedElement) {
                const targetIndex = target.dataset.index;
                const sourceIndex = draggedElement.dataset.draggingIndex;
                const sourceCell = document.querySelector(`.cell[data-index='${sourceIndex}']`);

                // Swap the content of the source cell and target cell
                [sourceCell.textContent, target.textContent] = [target.textContent, sourceCell.textContent];

                // Highlight source and target cells
                sourceCell.classList.add('highlight');
                target.classList.add('highlight');

                setTimeout(() => {
                    sourceCell.classList.remove('highlight');
                    target.classList.remove('highlight');
                }, 1000);

                draggedElement.classList.remove('dragging');
                draggedElement.removeAttribute('data-dragging-index');

                // Increment move count and update display
                moveCount++;
                moveCounter.textContent = `Mosse: ${moveCount}`;

                // Remove drop target class
                target.classList.remove('drop-target');
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

    // Disable scrolling on touch devices
    document.body.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    // Start the first game
    startGame();
});
