document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    // Abas
    const tabButtonsContainer = document.querySelector('.tab-buttons');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Conteúdo da Aba Manual
    const manualControls = document.getElementById('manualControls'); // O fieldset em si
    const startNumInput = document.getElementById('startNum'); // Agora type="text"
    const operationSelect = document.getElementById('operation');
    const valueNumInput = document.getElementById('valueNum'); // type="number"
    const executeBtn = document.getElementById('executeBtn');

    // Conteúdo da Aba Gerador
    const problemGeneratorSection = document.getElementById('problemGeneratorSection'); // O fieldset
    const difficultySelect = document.getElementById('difficulty');
    const generateProblemBtn = document.getElementById('generateProblemBtn');
    const problemDisplay = document.getElementById('problemDisplay');
    const userAnswerInput = document.getElementById('userAnswer'); // Agora type="text"
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');
    const feedbackDisplay = document.getElementById('feedback');

    // Visualização e Resultados (Compartilhados)
    const numberLineContainer = document.getElementById('numberLineContainer');
    const ticksContainer = document.getElementById('ticks');
    const marker = document.getElementById('marker');
    const equationDisplay = document.getElementById('equation');
    const explanationDisplay = document.getElementById('explanation');
    const finalResultDisplay = document.getElementById('finalResult');

    // --- Configurações e Estado ---
    const minNum = -15;
    const maxNum = 15;
    let currentPosition = 0;
    let currentProblem = null; // Armazena o problema gerado { start, operation, value, answer }

    // --- Funções Auxiliares ---
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Analisa o valor de um elemento input (type=text) como um inteiro.
     * Mostra um alerta se a entrada não for um número inteiro válido.
     * @param {HTMLInputElement} inputElement O elemento input a ser lido.
     * @param {number} defaultValue O valor a ser retornado em caso de erro ou vazio.
     * @returns {number} O número inteiro parseado ou o valor padrão.
     */
    function parseInputAsInt(inputElement, defaultValue = 0) {
        const rawValue = inputElement.value.trim();

        if (rawValue === '') {
            return defaultValue; // Retorna padrão se vazio
        }

        // Regex: Opcional '-', seguido por um ou mais dígitos. Nenhum outro caractere permitido.
        if (!/^-?\d+$/.test(rawValue)) {
             alert(`Valor inválido: "${rawValue}". Por favor, insira apenas números inteiros (ex: 5, -3, 0).`);
             inputElement.value = defaultValue.toString(); // Reseta o input para o padrão
             return defaultValue;
        }
        const parsed = parseInt(rawValue, 10);

        // Verifica se o parseInt resultou em NaN (pode acontecer com strings muito grandes que passam no regex)
        if (isNaN(parsed)) {
            alert(`Valor inválido ou muito grande: "${rawValue}". Usando ${defaultValue}.`);
            inputElement.value = defaultValue.toString();
             return defaultValue;
        }

        return parsed;
    }


    // --- Funções de Abas ---
    function switchTab(targetTabId) {
        tabButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.tab === targetTabId) {
                button.classList.add('active');
            }
        });

        tabPanes.forEach(pane => {
            pane.classList.remove('active');
            if (pane.id === targetTabId + 'Content') {
                pane.classList.add('active');
            }
        });

        // Resetar estado ao trocar de aba
        if (targetTabId === 'manual') {
             resetProblemUI();
             // Reseta a visualização para o valor atual do input manual
             const manualStartVal = parseInputAsInt(startNumInput, 0);
             updateMarkerPosition(manualStartVal, false);
             finalResultDisplay.textContent = manualStartVal;
             equationDisplay.textContent = `Começando em: ${manualStartVal}`;
             explanationDisplay.textContent = 'Escolha uma operação e clique em "Mover!"';

        } else if (targetTabId === 'generator') {
             // Limpa textos relacionados à operação manual anterior
             if (!currentProblem) { // Se não houver problema ativo, limpa tudo
                equationDisplay.textContent = 'Equação: --';
                explanationDisplay.textContent = 'Gere um problema ou volte para Exploração Manual.';
                finalResultDisplay.textContent = '?';
                updateMarkerPosition(0, false); // Reseta marcador para 0 se não houver problema
             } else { // Se houver problema ativo, mostra o estado inicial dele
                 updateMarkerPosition(currentProblem.start, false);
                 equationDisplay.textContent = `Começando em: ${currentProblem.start}`;
                 explanationDisplay.textContent = 'Digite sua resposta e clique em Verificar.';
                 finalResultDisplay.textContent = '?'; // Resultado ainda não calculado
             }
        }
    }


    // --- Funções Principais ---

    function drawNumberLine() {
        ticksContainer.innerHTML = '';
        const range = maxNum - minNum;
        const containerWidth = numberLineContainer.offsetWidth;

        for (let i = minNum; i <= maxNum; i++) {
            const positionPercent = ((i - minNum) / range) * 100;
            const tickMark = document.createElement('div');
            tickMark.classList.add('tick-mark');
            tickMark.style.left = `${positionPercent}%`;
            const tickLabel = document.createElement('div');
            tickLabel.classList.add('tick-label');
            tickLabel.textContent = i;
            tickLabel.style.left = `${positionPercent}%`;
            if (i === 0) {
                tickMark.classList.add('zero');
                tickLabel.classList.add('zero');
            }
            ticksContainer.appendChild(tickMark);
            ticksContainer.appendChild(tickLabel);
        }
    }

    function updateMarkerPosition(number, animate = true) {
        const clampedNumber = Math.max(minNum, Math.min(maxNum, number));
        const range = maxNum - minNum;
        let positionPercent = 0;
        if (range !== 0) {
            positionPercent = ((clampedNumber - minNum) / range) * 100;
        }

        if (animate) {
            marker.style.transition = 'left 1s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        } else {
            marker.style.transition = 'none';
        }
        marker.style.left = `${positionPercent}%`;

        if (!animate) {
            setTimeout(() => {
                 marker.style.transition = 'left 1s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
            }, 50);
        }
        currentPosition = number; // Atualiza a posição lógica apenas aqui
    }

    function handleOperation(start, opType, val, showExplanation = true) {
        let effectiveValue = 0;
        let operationSymbol = '';
        let explanation = '';
        let finalNum = start;
        let displayValue = Math.abs(val);

        switch (opType) {
            case 'add_pos':
                effectiveValue = displayValue;
                operationSymbol = '+';
                explanation = `Adicionar ${displayValue} significa mover ${displayValue} unidades para a DIREITA.`;
                finalNum = start + effectiveValue;
                equationDisplay.textContent = `Equação: ${start} ${operationSymbol} ${displayValue} = ?`;
                break;
            case 'add_neg':
                effectiveValue = -displayValue;
                operationSymbol = '+';
                explanation = `Adicionar um negativo (-${displayValue}) é o mesmo que subtrair ${displayValue}. Movemos ${displayValue} unidades para a ESQUERDA.`;
                finalNum = start + effectiveValue;
                equationDisplay.textContent = `Equação: ${start} ${operationSymbol} (${effectiveValue}) = ?`;
                break;
            case 'sub_pos':
                effectiveValue = -displayValue;
                operationSymbol = '-';
                explanation = `Subtrair ${displayValue} significa mover ${displayValue} unidades para a ESQUERDA.`;
                finalNum = start + effectiveValue;
                equationDisplay.textContent = `Equação: ${start} ${operationSymbol} ${displayValue} = ?`;
                break;
            case 'sub_neg':
                effectiveValue = displayValue;
                operationSymbol = '-';
                explanation = `Subtrair um negativo (-${displayValue}) é o oposto de subtrair um positivo! É o mesmo que SOMAR ${displayValue}. Movemos ${displayValue} unidades para a DIREITA!`;
                finalNum = start - (-displayValue);
                equationDisplay.textContent = `Equação: ${start} ${operationSymbol} (-${displayValue}) = ?`;
                break;
        }

        if (showExplanation) {
            explanationDisplay.textContent = `Explicação: ${explanation}`;
        } else {
             explanationDisplay.textContent = 'Explicação aparecerá após verificar a resposta.';
        }

        updateMarkerPosition(finalNum, showExplanation);

        const delay = showExplanation ? 800 : 0;
        setTimeout(() => {
            finalResultDisplay.textContent = finalNum;
            if(equationDisplay.textContent.includes('?')) {
                equationDisplay.textContent = equationDisplay.textContent.replace('?', finalNum);
            }
        }, delay);

        return finalNum;
    }

    function calculateResult(start, opType, val) {
        switch (opType) {
            case 'add_pos': return start + val;
            case 'add_neg': return start + (-val);
            case 'sub_pos': return start - val;
            case 'sub_neg': return start - (-val);
            default: return start;
        }
    }

    function generateProblem() {
        const level = parseInt(difficultySelect.value);
        let start, val, opType, answer;
        let problemText = '';

        resetProblemUI();

        // Lógica de geração por nível (Simplificada e corrigida para evitar cruzar zero no Nível 1)
        switch (level) {
            case 1: // Básico: +/- sem cruzar zero
                 start = getRandomInt(minNum + 1, maxNum - 1); // Evita min/max
                 if (start === 0) start = getRandomInt(1, 5) * (Math.random() < 0.5 ? 1 : -1); // Evita começar no zero

                 if (start > 0) { // Lado positivo
                     opType = Math.random() < 0.5 ? 'add_pos' : 'sub_pos';
                     if (opType === 'sub_pos') {
                         val = getRandomInt(1, start); // Garante valor <= start para não cruzar zero
                         if (start - val === 0 && start !== 0) val = getRandomInt(1, start > 1 ? start - 1 : 1); // Evita resultado 0 se não começou em 0
                     } else {
                         val = getRandomInt(1, maxNum - start); // Garante não exceder maxNum
                     }
                 } else { // Lado negativo (start < 0)
                      opType = Math.random() < 0.5 ? 'add_neg' : 'sub_neg'; // Mover esquerda ou direita sem cruzar zero
                      if (opType === 'add_neg') { // Mover mais para esquerda
                          val = getRandomInt(1, Math.abs(minNum - start));
                      } else { // Mover para direita (subtrair negativo)
                           val = getRandomInt(1, Math.abs(start)); // Garante não cruzar zero
                           if (start - (-val) === 0 && start !== 0) val = getRandomInt(1, Math.abs(start) > 1 ? Math.abs(start) - 1 : 1); // Evita resultado 0
                      }
                 }
                break;
            case 2: // Cruzando Zero
                 start = getRandomInt(minNum + 3, maxNum - 3);
                 if (start === 0) start = getRandomInt(1, 3) * (Math.random() < 0.5 ? 1 : -1); // Evita começar no zero

                 if (start > 0) { // Precisa subtrair mais que 'start' ou adicionar negativo > 'start'
                     opType = Math.random() < 0.5 ? 'sub_pos': 'add_neg';
                     val = getRandomInt(start + 1, start + 5); // Garante cruzar
                 } else { // Precisa somar mais que |start| ou subtrair negativo > |start|
                     opType = Math.random() < 0.5 ? 'add_pos': 'sub_neg';
                     val = getRandomInt(Math.abs(start) + 1, Math.abs(start) + 5); // Garante cruzar
                 }
                 break;
            case 3: // Adicionando Negativos (+ (-)) -> Pode ou não cruzar zero
                start = getRandomInt(minNum + 2, maxNum); // Pode começar mais perto do min
                val = getRandomInt(1, 10);
                opType = 'add_neg';
                break;
            case 4: // Subtraindo Negativos (- (-)) -> Pode ou não cruzar zero
                start = getRandomInt(minNum, maxNum - 2); // Pode começar mais perto do max
                val = getRandomInt(1, 10);
                opType = 'sub_neg';
                break;
            case 5: // Misto (todas as operações)
            default:
                start = getRandomInt(minNum + 1, maxNum - 1);
                 if (start === 0) start = 1; // Evita start 0 para ter mais variedade
                val = getRandomInt(1, 10);
                const opTypes = ['add_pos', 'add_neg', 'sub_pos', 'sub_neg'];
                opType = opTypes[getRandomInt(0, 3)];

                // Evitar resultados triviais no modo misto, se possível (ex: 5 + (-5))
                 if (calculateResult(start, opType, val) === 0 && start !== 0) {
                     val = getRandomInt(1, 8); // Tenta um valor diferente
                 }

                break;
        }


        answer = calculateResult(start, opType, val);

        // Formata o texto do problema
        let opSymbol = '';
        let valueText = '';
        switch (opType) {
            case 'add_pos': opSymbol = '+'; valueText = val; break;
            case 'add_neg': opSymbol = '+'; valueText = `(${-val})`; break; // Mostra o negativo explicitamente
            case 'sub_pos': opSymbol = '-'; valueText = val; break;
            case 'sub_neg': opSymbol = '-'; valueText = `(${-val})`; break; // Mostra o negativo explicitamente
        }
        problemText = `Resolva: ${start} ${opSymbol} ${valueText} = ?`;

        currentProblem = { start, operation: opType, value: val, answer };

        // Atualiza a UI do gerador e compartilhada
        problemDisplay.textContent = problemText;
        updateMarkerPosition(start, false);
        finalResultDisplay.textContent = '?';
        equationDisplay.textContent = `Começando em: ${start}`;
        explanationDisplay.textContent = 'Digite sua resposta e clique em Verificar.';
        checkAnswerBtn.disabled = false;
        userAnswerInput.disabled = false;
        userAnswerInput.focus();
    }

    function checkAnswer() {
        if (!currentProblem) return;

        // Usa a função de parse robusta
        const userAnswer = parseInputAsInt(userAnswerInput, NaN); // Passa NaN como padrão para poder checar depois

        // Se parseInputAsInt retornou NaN (ou seja, falhou e não mostrou alerta antes), trata aqui.
        if (isNaN(userAnswer)) {
             if (userAnswerInput.value.trim() !== '') { // Só mostra se tinha algo digitado
                 feedbackDisplay.textContent = "Por favor, digite um número válido como resposta.";
                 feedbackDisplay.className = 'feedback-area feedback-incorrect';
             } else {
                  feedbackDisplay.textContent = "Por favor, digite uma resposta.";
                  feedbackDisplay.className = 'feedback-area feedback-incorrect';
             }
            return;
        }

        // Compara a resposta parseada com a resposta correta
        if (userAnswer === currentProblem.answer) {
            feedbackDisplay.textContent = "Correto! 🎉 Veja a explicação na reta numérica.";
            feedbackDisplay.className = 'feedback-area feedback-correct';
            handleOperation(currentProblem.start, currentProblem.operation, currentProblem.value, true);
        } else {
            feedbackDisplay.textContent = `Incorreto. A resposta certa era ${currentProblem.answer}. Veja como chegar lá.`;
            feedbackDisplay.className = 'feedback-area feedback-incorrect';
            handleOperation(currentProblem.start, currentProblem.operation, currentProblem.value, true);
        }

        checkAnswerBtn.disabled = true;
        userAnswerInput.disabled = true;
        generateProblemBtn.focus();
    }

     function resetProblemUI() {
        problemDisplay.textContent = 'Clique em "Gerar Novo Problema"';
        userAnswerInput.value = '';
        userAnswerInput.disabled = true;
        checkAnswerBtn.disabled = true;
        feedbackDisplay.textContent = '';
        feedbackDisplay.className = 'feedback-area';
        currentProblem = null;
        // Não limpa mais eq/expl/result aqui diretamente, pois switchTab cuida disso.
     }


    // --- Inicialização ---
    drawNumberLine();
    switchTab('manual'); // Define a aba inicial e atualiza a UI
    // A linha abaixo não é mais necessária, pois switchTab('manual') já faz isso
    // currentPosition = parseInputAsInt(startNumInput, 0);
    // updateMarkerPosition(currentPosition, false);
    // finalResultDisplay.textContent = currentPosition;
    // equationDisplay.textContent = `Começando em: ${currentPosition}`;
    // explanationDisplay.textContent = 'Use o controle manual ou mude para a aba Gerador de Problemas.';


    // --- Event Listeners ---

    // Troca de Abas
    tabButtonsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button') && !e.target.classList.contains('active')) {
            const targetTab = e.target.dataset.tab;
            switchTab(targetTab);
        }
    });


    // Controle Manual (Aba Manual)
    executeBtn.addEventListener('click', () => {
        // Validação robusta com parseInputAsInt
        const startNum = parseInputAsInt(startNumInput, 0);
        const operation = operationSelect.value;
        // Validação específica para valueNum (ainda type=number, mas garante positivo)
        const valueRaw = parseInt(valueNumInput.value || "1", 10);
        const value = Math.max(1, isNaN(valueRaw) ? 1 : valueRaw); // Garante que seja >= 1
        if (valueRaw <= 0 || isNaN(valueRaw)) {
             alert("O valor da operação deve ser um número positivo maior que zero.");
             valueNumInput.value = '1';
             // Não precisa retornar aqui, pois 'value' já foi corrigido para 1
        }

        updateMarkerPosition(startNum, false); // Garante que o marcador está onde o input diz
        handleOperation(startNum, operation, value, true);
    });

    // Atualiza a posição do marcador enquanto digita no campo manual
    startNumInput.addEventListener('input', () => {
         const rawValue = startNumInput.value.trim();
         let displayValue = '?';
         let posValue = currentPosition; // Mantém a posição antiga se inválido

         // Tenta parsear apenas para atualizar visualização, sem alerta imediato
         if (/^-?\d+$/.test(rawValue) || rawValue === '' || rawValue === '-') {
             const parsed = parseInt(rawValue, 10);
             if (!isNaN(parsed)) {
                 displayValue = parsed;
                 posValue = parsed;
             } else if (rawValue === '' || rawValue === '-') {
                 displayValue = rawValue; // Mostra '-' ou nada enquanto digita
                 posValue = 0; // Ou mantém a anterior? Decide. Vamos resetar pra 0.
             }
         } // Se não for número, if ou '-', mantém o valor anterior (não atualiza display)

         updateMarkerPosition(posValue, false);
         finalResultDisplay.textContent = displayValue;
         equationDisplay.textContent = `Começando em: ${displayValue}`;
         explanationDisplay.textContent = 'Escolha uma operação e clique em "Mover!"';
    });

    // Gerador de Problemas (Aba Gerador)
    generateProblemBtn.addEventListener('click', generateProblem);
    checkAnswerBtn.addEventListener('click', checkAnswer);
    userAnswerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !checkAnswerBtn.disabled) {
            checkAnswer();
        }
    });

    // Responsividade
    window.addEventListener('resize', () => {
        drawNumberLine();
        // Recalcula a posição atual baseada no estado da UI
        const activeTabId = document.querySelector('.tab-button.active').dataset.tab;
        let positionToUpdate = 0;
        if (activeTabId === 'manual') {
            positionToUpdate = parseInputAsInt(startNumInput, currentPosition); // Usa posição atual se inválido
        } else if (currentProblem) {
             // Decide se mostra o início do problema ou a posição final atual
             // Vamos manter a posição final calculada (currentPosition)
             positionToUpdate = currentPosition;
        } else {
            positionToUpdate = 0; // Default
        }
         updateMarkerPosition(positionToUpdate, false);
    });

});
