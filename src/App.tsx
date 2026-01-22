import { useState } from 'react';
import './App.css';

interface HistoryEntry {
  expression: string;
  result: string;
  brokenResult: string;
}

interface Level {
  id: number;
  target: number;
  rule: string;
  hint: string;
}

const levels: Level[] = [
  // Easy
  { id: 1, target: 50, rule: "offByOne", hint: "So close, yet so far..." },
  { id: 2, target: 142, rule: "plusHundred", hint: "There's a constant intruder..." },
  { id: 3, target: 64, rule: "doubled", hint: "Everything feels inflated..." },
  { id: 4, target: 58, rule: "reverseDigits", hint: "Mirror, mirror..." },
  { id: 5, target: 75, rule: "complementTo100", hint: "The glass is half empty..." },
  // Medium
  { id: 6, target: 25, rule: "halved", hint: "Only getting part of the picture..." },
  { id: 7, target: 735, rule: "stuckFive", hint: "An uninvited guest at the end..." },
  { id: 8, target: 20, rule: "swapPlusAndTimes", hint: "Imposters among the operators..." },
  { id: 9, target: -42, rule: "negated", hint: "Through the looking glass..." },
  { id: 10, target: 52, rule: "digitRotation", hint: "The end comes to the beginning..." },
  // Medium-Hard
  { id: 11, target: 99, rule: "timesThree", hint: "Third time's the charm..." },
  { id: 12, target: 24, rule: "digitProduct", hint: "Digits working together..." },
  { id: 13, target: 50, rule: "sumOfSquares", hint: "Each digit has power..." },
  { id: 14, target: 9, rule: "digitalRoot", hint: "Reduce until you can't..." },
  { id: 15, target: 16, rule: "collatz", hint: "Even and odd play different games..." },
  // Hard
  { id: 16, target: 18, rule: "digitSum", hint: "Compression at its finest..." },
  { id: 17, target: 27, rule: "kaprekar", hint: "Chaos and order collide..." },
  { id: 18, target: 64, rule: "onesComplement", hint: "Every digit has an opposite..." },
  { id: 19, target: 7, rule: "modulo13", hint: "A baker's dozen leaves something behind..." },
  { id: 20, target: 169, rule: "squared", hint: "Find the root of the problem..." },
];

const App: React.FC = () => {
  const [currentExpression, setCurrentExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameWon, setGameWon] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<number[]>(() => {
    const saved = localStorage?.getItem('completedLevels');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHint, setShowHint] = useState(false);

  const level = levels.find(l => l.id === currentLevel) || levels[0];

  // Rule implementations
  const applyRule = (result: number, rule: string): string => {
    switch (rule) {
      case 'offByOne':
        return (result + 1).toString();

      case 'plusHundred':
        return (result + 100).toString();

      case 'doubled':
        return (result * 2).toString();

      case 'reverseDigits':
        { const str = result.toString();
        const isNegative = str.startsWith('-');
        const digits = isNegative ? str.slice(1) : str;
        const reversed = digits.split('').reverse().join('');
        return isNegative ? '-' + reversed : reversed; }

      case 'complementTo100':
        return (100 - result).toString();

      case 'halved':
        return Math.round(result / 2).toString();

      case 'stuckFive':
        return result.toString() + '5';

      case 'swapPlusAndTimes':
        // Handled in evaluateExpression
        return result.toString();

      case 'negated':
        return (-result).toString();

      case 'digitRotation':
        { const str = Math.abs(result).toString();
        if (str.length < 2) return result.toString();
        const rotated = str.slice(1) + str[0];
        return result < 0 ? '-' + rotated : rotated; }

      case 'timesThree':
        return (result * 3).toString();

      case 'digitProduct':
        { const absStr = Math.abs(result).toString();
        const product = absStr.split('').reduce((acc, d) => acc * parseInt(d), 1);
        return result < 0 ? (-product).toString() : product.toString(); }

      case 'sumOfSquares':
        { const absStr = Math.abs(result).toString();
        const sum = absStr.split('').reduce((acc, d) => acc + parseInt(d) ** 2, 0);
        return result < 0 ? (-sum).toString() : sum.toString(); }

      case 'digitalRoot':
        { const abs = Math.abs(result);
        if (abs < 10) {
          return (result < 0 ? -abs * 2 : abs * 2).toString();
        }
        let n = abs;
        while (n >= 10) {
          n = n.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);
        }
        return result < 0 ? (-n).toString() : n.toString(); }

      case 'collatz':
        { const n = Math.abs(result);
        const next = n % 2 === 0 ? n / 2 : 3 * n + 1;
        return result < 0 ? (-next).toString() : next.toString(); }

      case 'digitSum':
        { const absStr = Math.abs(result).toString();
        const sum = absStr.split('').reduce((acc, d) => acc + parseInt(d), 0);
        return result < 0 ? (-sum).toString() : sum.toString(); }

      case 'kaprekar':
        { const absStr = Math.abs(result).toString().padStart(2, '0');
        const digits = absStr.split('');
        const desc = digits.slice().sort((a, b) => b.localeCompare(a)).join('');
        const asc = digits.slice().sort().join('');
        const diff = parseInt(desc) - parseInt(asc);
        return result < 0 ? (-diff).toString() : diff.toString(); }

      case 'onesComplement':
        { const str = result.toString();
        const isNegative = str.startsWith('-');
        const digits = isNegative ? str.slice(1) : str;
        const complemented = digits.split('').map(d => (9 - parseInt(d)).toString()).join('');
        return isNegative ? '-' + complemented : complemented; }

      case 'modulo13':
        { const abs = Math.abs(result);
        if (abs < 13) {
          return (result < 0 ? -(abs + 13) : abs + 13).toString();
        }
        const mod = abs % 13;
        return result < 0 ? (-mod).toString() : mod.toString(); }

      case 'squared':
        return (result * result).toString();

      default:
        return result.toString();
    }
  };

  const evaluateExpression = (expr: string): number => {
    try {
      if (level.rule === 'swapPlusAndTimes') {
        expr = expr.replace(/\+/g, '§').replace(/\*/g, '+').replace(/§/g, '*');
      }
      return Function('"use strict"; return (' + expr + ')')();
    } catch {
      return 0;
    }
  };

  const handleButtonClick = (value: string) => {
    if (gameWon) return;

    if (value === 'C') {
      setCurrentExpression('');
      setDisplay('0');
    } else if (value === '=') {
      if (currentExpression) {
        const realResult = evaluateExpression(currentExpression);
        const brokenResult = applyRule(realResult, level.rule);
        
        const historyEntry: HistoryEntry = {
          expression: currentExpression,
          result: realResult.toString(),
          brokenResult: brokenResult
        };
        
        setHistory(prev => [...prev, historyEntry]);
        setDisplay(brokenResult);
        setCurrentExpression('');
        
        // Check win condition
        if (parseInt(brokenResult) === level.target) {
          setGameWon(true);
          if (!completedLevels.includes(currentLevel)) {
            const newCompleted = [...completedLevels, currentLevel];
            setCompletedLevels(newCompleted);
            localStorage?.setItem('completedLevels', JSON.stringify(newCompleted));
          }
        }
      }
    } else {
      if (display === '0' && /\d/.test(value)) {
        setCurrentExpression(value);
        setDisplay(value);
      } else {
        const newExpression = currentExpression + value;
        setCurrentExpression(newExpression);
        setDisplay(newExpression);
      }
    }
  };

  const resetLevel = () => {
    setCurrentExpression('');
    setDisplay('0');
    setHistory([]);
    setGameWon(false);
    setShowHint(false);
  };

  const nextLevel = () => {
    if (currentLevel < levels.length) {
      setCurrentLevel(prev => prev + 1);
      resetLevel();
    }
  };

  const selectLevel = (levelId: number) => {
    // Only allow selection if level is unlocked
    if (levelId === 1 || completedLevels.includes(levelId - 1)) {
      setCurrentLevel(levelId);
      resetLevel();
    }
  };

  const isLevelUnlocked = (levelId: number): boolean => {
    return levelId === 1 || completedLevels.includes(levelId - 1);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Broken Calculator</h1>
        <p>Something's wrong with this calculator... Can you reach the target?</p>
      </header>

      <div className="game-container">
        <div className="level-info">
          <div className="level-header">
            <h2>Level {level.id}</h2>
            <div className="hint-section">
              {!showHint ? (
                <button onClick={() => setShowHint(true)} className="hint-btn">
                  Show Hint
                </button>
              ) : (
                <div className="hint-text">
                  <strong>Hint:</strong> {level.hint}
                </div>
              )}
            </div>
          </div>
          <div className="target">
            Target: <span className="target-number">{level.target}</span>
            {gameWon && <span className="victory">Solved!</span>}
          </div>
        </div>

        <div className="calculator">
          <div className="display">
            <div className="expression">{currentExpression || 'Enter calculation...'}</div>
            <div className="result">{display}</div>
          </div>

          <div className="buttons">
            <button onClick={() => handleButtonClick('C')} className="btn clear">C</button>
            <button onClick={() => handleButtonClick('/')} className="btn operator">÷</button>
            <button onClick={() => handleButtonClick('*')} className="btn operator">×</button>
            <button onClick={() => handleButtonClick('-')} className="btn operator">-</button>

            <button onClick={() => handleButtonClick('7')} className="btn number">7</button>
            <button onClick={() => handleButtonClick('8')} className="btn number">8</button>
            <button onClick={() => handleButtonClick('9')} className="btn number">9</button>
            <button onClick={() => handleButtonClick('+')} className="btn operator">+</button>

            <button onClick={() => handleButtonClick('4')} className="btn number">4</button>
            <button onClick={() => handleButtonClick('5')} className="btn number">5</button>
            <button onClick={() => handleButtonClick('6')} className="btn number">6</button>
            <button onClick={() => handleButtonClick('=')} className="btn equals">=</button>

            <button onClick={() => handleButtonClick('1')} className="btn number">1</button>
            <button onClick={() => handleButtonClick('2')} className="btn number">2</button>
            <button onClick={() => handleButtonClick('3')} className="btn number">3</button>

            <button onClick={() => handleButtonClick('0')} className="btn number zero">0</button>
            <button onClick={() => handleButtonClick('.')} className="btn number">.</button>
          </div>
        </div>

        <div className="controls">
          <button onClick={resetLevel} className="control-btn reset">Reset Level</button>
          {gameWon && currentLevel < levels.length && (
            <button onClick={nextLevel} className="control-btn next">Next Level</button>
          )}
        </div>

        <div className="history">
          <h3>History</h3>
          <div className="history-list">
            {history.length === 0 ? (
              <p className="no-history">No calculations yet...</p>
            ) : (
              history.map((entry, index) => (
                <div key={index} className="history-entry">
                  <span className="expression">{entry.expression} =</span>
                  <span className="broken-result">{entry.brokenResult}</span>
                  <span className="real-result" title={`Real result: ${entry.result}`}>
                    (Actually: {entry.result})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="level-selector">
          <h3>Levels</h3>
          <div className="level-buttons">
            {levels.map(lvl => {
              const isUnlocked = isLevelUnlocked(lvl.id);
              const isCompleted = completedLevels.includes(lvl.id);
              const isActive = currentLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => selectLevel(lvl.id)}
                  className={`level-btn ${isActive ? 'active' : ''} ${isCompleted && !isActive ? 'completed' : ''} ${!isUnlocked ? 'locked' : ''}`}
                  disabled={!isUnlocked}
                  title={!isUnlocked ? 'Complete previous level to unlock' : ''}
                >
                  {lvl.id}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;