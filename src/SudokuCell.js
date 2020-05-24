import * as React from 'react';

import { useCellData, useSetSelected, useToggleSelection } from './state';
import { calcBorderValues, cx } from './utils';
import styles from './SudokuCell.module.css';

const CELL_WIDTH  = 56;
const CELL_HEIGHT = 56;

export default function SudokuCell({ id }) {
  const cell = useCellData(id);
  const setSelected = useSetSelected(id);
  const toggleSelection = useToggleSelection(id);
  const onClick = React.useCallback(e => {
    if (e.metaKey || e.ctrlKey) {
      toggleSelection(s => !s);
    } else {
      setSelected();
    }
  }, [setSelected, toggleSelection]);

  const top = cell.position.row * CELL_HEIGHT;
  const left = cell.position.column * CELL_WIDTH;
  const borders = calcBorderValues(cell.position, cell.hasError);

  const containerClassName = cx([styles.container, {
    [styles.primary]: cell.isPrimary,
    [styles.selected]: cell.isSelected,
    [styles.completed]: cell.isCompleted,
    [styles.error]: cell.hasError,
  }]);

  return (
    <div
      className={containerClassName}
      style={{ top, left, height: CELL_HEIGHT, width: CELL_WIDTH, ...borders }}
      onClick={onClick}
    >
      {cell.value != null
        ? <div className={styles.value}>{cell.value}</div>
        : <><CellCorners corners={cell.cornerNotes} /><CellCenters centers={cell.centerNotes} /></>
      }
    </div>
  );
}

function CellCenters({ centers }) {
  const centerText = [...centers].sort().join('');
  return <div className={styles.centerText}>{centerText}</div>
}

function CellCorners({ corners }) {
  const renderCorner = (c, idx) => <div key={c} className={styles[`corner-${idx}`]}>{c}</div>;
  return [...corners].sort().map(renderCorner);
}
