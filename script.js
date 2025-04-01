document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    // Abas
    const tabButtonsContainer = document.querySelector('.tab-buttons');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Conteúdo da Aba Manual
    const manualControls = document.getElementById('manualControls'); // O fieldset em si
    const startNumInput = document.getElementById('startNum');
    const operationSelect = document.getElementById('operation');
    const valueNumInput = document.getElementById('valueNum');
    const executeBtn = document.getElementById('executeBtn');

    // Conteúdo da Aba Gerador
    const problemGeneratorSection = document.getElementById('problemGeneratorSection'); // O fieldset
    const difficultySelect = document.getElementById('difficulty');
    const generateProblemBtn = document.getElementById('generateProblemBtn');
    const problemDisplay = document.getElementById('problemDisplay');
    const userAnswerInput = document.getElementById('userAnswer');
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
            if (pane.id === targetTabId + 'Content') { // Assume ID do pane como "tabIdContent"
                pane.classList.add('active');
            }
        });

        // Resetar estado ao trocar de aba
        if (targetTabId === 'manual') {
             resetProblemUI(); // Limpa a área do gerador se for para a aba manual
             // Opcional: Pode resetar os inputs manuais também se desejar
             // startNumInput.value = 0;
             // valueNumInput.value = 1;
             // updateMarkerPosition(0, false); // Reseta marcador
        } else if (targetTabId === 'generator') {
             // Limpa textos de resultado/explicação da aba manual
             equationDisplay.textContent = 'Equação: --';
             explanationDisplay.textContent = 'Gere um problema ou volte para Exploração Manual.';
             finalResultDisplay.textContent = '?';
             // Garante que o marcador esteja visível no último estado do gerador ou resete
             if (currentProblem) {
                 updateMarkerPosition(currentProblem.start, false);
             } else {
                 updateMarkerPosition(0, false); // Ou reseta para zero se não houver problema
             }
        }
    }


    // --- Funções Principais --- (A maioria permanece igual)

    function drawNumberLine() { /* ... (código inalterado) ... */
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

    function updateMarkerPosition(number, animate = true) { /* ... (código inalterado) ... */
        const clampedNumber = Math.max(minNum, Math.min(maxNum, number));
        const range = maxNum - minNum;
        let positionPercent = 0;
        if (range !== 0) {
            positionPercent = ((clampedNumber - minNum) / range) * 100;
        }

        if (animate) {
            marker.style.transition = 'left 1s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        } else {
            marker.style.transition = 'none'; // Sem animação para resets
        }
        marker.style.left = `${positionPercent}%`;

        // Reabilitar animação após um instante se foi desabilitada
        if (!animate) {
            setTimeout(() => {
                 marker.style.transition = 'left 1s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
            }, 50);
        }
        currentPosition = number;
    }

    function handleOperation(start, opType, val, showExplanation = true) { /* ... (código inalterado) ... */
        let effectiveValue = 0;
        let operationSymbol = '';
        let explanation = '';
        let finalNum = start;
        let displayValue = Math.abs(val); // Valor para mostrar na equação

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
                finalNum = start + effectiveValue; // Subtrair
                equationDisplay.textContent = `Equação: ${start} ${operationSymbol} ${displayValue} = ?`;
                break;
            case 'sub_neg':
                effectiveValue = displayValue; // Subtrair negativo -> somar positivo
                operationSymbol = '-';
                explanation = `Subtrair um negativo (-${displayValue}) é o oposto de subtrair um positivo! É o mesmo que SOMAR ${displayValue}. Movemos ${displayValue} unidades para a DIREITA!`;
                finalNum = start - (-displayValue); // Calcular corretamente
                equationDisplay.textContent = `Equação: ${start} ${operationSymbol} (-${displayValue}) = ?`;
                break;
        }

        if (showExplanation) {
            explanationDisplay.textContent = `Explicação: ${explanation}`;
        } else {
             explanationDisplay.textContent = 'Explicação aparecerá após verificar a resposta.';
        }


        // Atualiza a posição do marcador (inicia a animação)
        updateMarkerPosition(finalNum, showExplanation); // Anima só se for mostrar explicação

        // Mostra o resultado final APÓS a animação (se houver)
        const delay = showExplanation ? 800 : 0;
        setTimeout(() => {
            finalResultDisplay.textContent = finalNum;
            if(equationDisplay.textContent.includes('?')) {
                equationDisplay.textContent = equationDisplay.textContent.replace('?', finalNum);
            }
        }, delay);

        return finalNum; // Retorna o resultado calculado
    }

    function calculateResult(start, opType, val) { /* ... (código inalterado) ... */
        switch (opType) {
            case 'add_pos': return start + val;
            case 'add_neg': return start + (-val);
            case 'sub_pos': return start - val;
            case 'sub_neg': return start - (-val);
            default: return start;
        }
    }

    function generateProblem() { /* ... (lógica interna inalterada, apenas ajustes na UI) ... */
        const level = parseInt(difficultySelect.value);
        let start, val, opType, answer;
        let problemText = '';

        // Limpa UI anterior do gerador
        resetProblemUI();
        // Não precisa mais desabilitar controles manuais, pois estão em outra aba

        // Lógica de geração por nível (INALTERADA)
        switch (level) {
             case 1: // Básico: +/- sem cruzar zero
                opType = Math.random() < 0.5 ? 'add_pos' : 'sub_pos';
                if (Math.random() < 0.5) { // Lado Positivo
                    start = getRandomInt(1, maxNum - 1);
                    val = getRandomInt(1, start > 0 ? start : 1); // Garante que não cruze zero na subtração, minimo 1
                     if (opType === 'add_pos') val = getRandomInt(1, maxNum - start);
                     else if (start - val <= 0 && start > 0) val = getRandomInt(1, start > 0 ? start -1: 1); // Evita ir a zero ou negativo
                } else { // Lado Negativo
                    start = getRandomInt(minNum + 1, -1);
                     val = getRandomInt(1, Math.abs(start) > 0 ? Math.abs(start) : 1); // Garante que não cruze zero
                     if (opType === 'add_pos') val = getRandomInt(1, Math.abs(minNum - start));
                     else if(start + val >= 0 && start < 0) val = getRandomInt(1, Math.abs(start)>0 ? Math.abs(start)-1 : 1); // Evita ir a zero ou positivo

                     // Simplificando: Operação no lado negativo para não cruzar zero
                     opType = 'add_neg'; // Ex: -3 + (-2)
                     val = getRandomInt(1, Math.abs(minNum - start));
                     if (start + (-val) > -1) { // Se cruzar zero, ajusta
                          val = getRandomInt(1, Math.abs(start) > 0 ? Math.abs(start) : 1);
                     }
                }
                // Forçar operações simples no nível 1 para não cruzar zero
                 if (start > 0) { // Lado positivo
                     opType = Math.random() < 0.5 ? 'add_pos' : 'sub_pos';
                     if (opType === 'sub_pos') { val = getRandomInt(1, start); } // Garante valor <= start
                     else { val = getRandomInt(1, maxNum - start); } // Garante não exceder maxNum
                 } else if (start < 0) { // Lado negativo
                     opType = Math.random() < 0.5 ? 'add_neg' : 'sub_neg'; // Adicionar negativo (esquerda) ou Subtrair negativo (direita)
                     if (opType === 'add_neg') { val = getRandomInt(1, Math.abs(minNum - start)); } // Garante não exceder minNum
                     else { val = getRandomInt(1, Math.abs(start)); } // Garante não cruzar zero para direita
                 } else { // start === 0
                      opType = Math.random() < 0.5 ? 'add_pos' : 'add_neg';
                      val = getRandomInt(1, 10);
                 }

                break;
             case 2: // Cruzando Zero
                 start = getRandomInt(minNum + 3, maxNum - 3); // Evita extremos
                 // Garante que cruze o zero
                 if (start > 0) { // Se positivo, precisa subtrair mais que o start
                     opType = Math.random() < 0.5 ? 'sub_pos': 'add_neg';
                     val = getRandomInt(start + 1, start + 5);
                 } else { // Se negativo, precisa somar mais que o |start|
                     opType = Math.random() < 0.5 ? 'add_pos': 'sub_neg';
                     val = getRandomInt(Math.abs(start) + 1, Math.abs(start) + 5);
                 }
                 break;
             case 3: // Adicionando Negativos (+ (-))
                start = getRandomInt(minNum + 5, maxNum);
                val = getRandomInt(1, 10);
                opType = 'add_neg';
                break;
             case 4: // Subtraindo Negativos (- (-))
                start = getRandomInt(minNum, maxNum - 5);
                val = getRandomInt(1, 10);
                opType = 'sub_neg';
                break;
             case 5: // Misto (todas as operações)
             default:
                start = getRandomInt(minNum + 2, maxNum - 2);
                val = getRandomInt(1, 10);
                const opTypes = ['add_pos', 'add_neg', 'sub_pos', 'sub_neg'];
                opType = opTypes[getRandomInt(0, 3)];
                break;
        }


        // Recalcula a resposta final
        answer = calculateResult(start, opType, val);

        // Formata o texto do problema (INALTERADO)
        let opSymbol = '';
        let valueText = '';
        switch (opType) {
            case 'add_pos': opSymbol = '+'; valueText = val; break;
            case 'add_neg': opSymbol = '+'; valueText = `(${-val})`; break;
            case 'sub_pos': opSymbol = '-'; valueText = val; break;
            case 'sub_neg': opSymbol = '-'; valueText = `(${-val})`; break;
        }
        problemText = `Resolva: ${start} ${opSymbol} ${valueText} = ?`;

        // Armazena o problema atual
        currentProblem = { start, operation: opType, value: val, answer };

        // Atualiza a UI do gerador
        problemDisplay.textContent = problemText;
        updateMarkerPosition(start, false); // Posiciona marcador no início, sem animar
        finalResultDisplay.textContent = '?'; // Limpa resultado compartilhado
        equationDisplay.textContent = `Começando em: ${start}`; // Mostra início no compartilhado
        explanationDisplay.textContent = 'Digite sua resposta e clique em Verificar.';
        checkAnswerBtn.disabled = false;
        userAnswerInput.disabled = false;
        userAnswerInput.focus();
    }

    function checkAnswer() { /* ... (lógica interna inalterada, UI changes) ... */
        if (!currentProblem) return;

        const userAnswer = parseInt(userAnswerInput.value);

        if (isNaN(userAnswer)) {
            feedbackDisplay.textContent = "Por favor, digite um número como resposta.";
            feedbackDisplay.className = 'feedback-area feedback-incorrect';
            return;
        }

        if (userAnswer === currentProblem.answer) {
            feedbackDisplay.textContent = "Correto! 🎉 Veja a explicação na reta numérica.";
            feedbackDisplay.className = 'feedback-area feedback-correct';
            handleOperation(currentProblem.start, currentProblem.operation, currentProblem.value, true);
        } else {
            feedbackDisplay.textContent = `Incorreto. A resposta certa era ${currentProblem.answer}. Veja como chegar lá.`;
            feedbackDisplay.className = 'feedback-area feedback-incorrect';
            handleOperation(currentProblem.start, currentProblem.operation, currentProblem.value, true);
        }

        // Desabilita campos de resposta após verificar
        checkAnswerBtn.disabled = true;
        userAnswerInput.disabled = true;
        // Não precisa reabilitar controles manuais aqui
        generateProblemBtn.focus();
    }

    function resetProblemUI() { /* ... (código inalterado) ... */
        problemDisplay.textContent = 'Clique em "Gerar Novo Problema"';
        userAnswerInput.value = '';
        userAnswerInput.disabled = true;
        checkAnswerBtn.disabled = true;
        feedbackDisplay.textContent = '';
        feedbackDisplay.className = 'feedback-area';
        // Não limpa mais eq/expl/result aqui, pois são compartilhados
        currentProblem = null;
     }


    // --- Inicialização ---
    drawNumberLine();
    // Define a aba inicial ativa (manual)
    switchTab('manual'); // Garante que a aba manual esteja ativa no início
    currentPosition = parseInt(startNumInput.value) || 0;
    updateMarkerPosition(currentPosition, false);
    finalResultDisplay.textContent = currentPosition;
    equationDisplay.textContent = `Começando em: ${currentPosition}`;
    explanationDisplay.textContent = 'Use o controle manual ou mude para a aba Gerador de Problemas.';
    // resetProblemUI(); // Reset é chamado dentro do switchTab inicial


    // --- Event Listeners ---

    // Troca de Abas
    tabButtonsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            const targetTab = e.target.dataset.tab;
            switchTab(targetTab);
        }
    });


    // Controle Manual (Aba Manual)
    executeBtn.addEventListener('click', () => {
        const startNum = parseInt(startNumInput.value) || 0;
        const operation = operationSelect.value;
        const value = parseInt(valueNumInput.value);

         if (isNaN(value) || value <= 0) {
            alert("Por favor, insira um valor positivo maior que zero para a operação manual.");
            valueNumInput.value = 1;
            return;
         }
        // Não precisa mais limpar a área de problema, a troca de aba faz isso
        updateMarkerPosition(startNum, false);
        handleOperation(startNum, operation, value, true);
    });
    startNumInput.addEventListener('input', () => {
         const startNum = parseInt(startNumInput.value) || 0;
         updateMarkerPosition(startNum, false);
         finalResultDisplay.textContent = startNum;
         equationDisplay.textContent = `Começando em: ${startNum}`;
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

    // Responsividade (sem mudanças aqui)
    window.addEventListener('resize', () => {
        drawNumberLine();
        // Determina a posição correta baseada na aba ativa
        const activeTabId = document.querySelector('.tab-button.active').dataset.tab;
        if (activeTabId === 'manual') {
            currentPosition = parseInt(startNumInput.value) || 0;
        } else if (currentProblem) {
             currentPosition = currentProblem.start; // Ou a posição final do problema anterior, se preferir
        } else {
            currentPosition = 0; // Default
        }
        updateMarkerPosition(currentPosition, false);
    });

});