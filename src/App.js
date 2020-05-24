import * as React from 'react';
import { useSetSelectionFromInput, useSetInputMode, useSetSelected } from './state';
import SudokuCell from './SudokuCell';
import styles from './App.module.css';

function App() {
  const setSelectionValue = useSetSelectionFromInput();
  const setInputMode = useSetInputMode();
  const setSelected = useSetSelected();

  React.useEffect(() => {
    function handleKeyboardEvent(event) {
      switch (event.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          setSelectionValue(parseInt(event.key, 10));
          break;
        case 'Backspace':
          setSelectionValue(null);
          break;
        case 'z':
          setInputMode('value');
          break;
        case 'x':
          setInputMode('corners');
          break;
        case 'c':
          setInputMode('center');
          break;
        case '*':
          setInputMode('primary');
          break;
        default:
          console.log(event);
      }
    }
    document.addEventListener('keydown', handleKeyboardEvent);
    return () => document.removeEventListener('keydown', handleKeyboardEvent);
  }, [setInputMode, setSelectionValue]);

  const gameRef = React.useRef(null);
  React.useEffect(() => {
    function deselectCells(event) {
      if (gameRef.current && !gameRef.current.contains(event.target)) {
        setSelected([]);
      }
    }
    document.addEventListener('click', deselectCells);
    return () => document.removeEventListener('click', deselectCells);
  }, [gameRef, setSelected]);

  return (
    <div className={styles.container}>
      <main className={styles.sudokuContainer} ref={gameRef}>
        {Array.from(new Array(9 * 9)).map((_, idx) => (
          <SudokuCell key={idx} id={idx} />
        ))}
      </main>
      <aside className={styles.controlsContainer}>
      </aside>
    </div>
  );
}

export default App;
