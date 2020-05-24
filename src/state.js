import {
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState
} from 'recoil';
import { memoize, addItem, removeItem } from './utils';

// To be used as an argument of Array.prototype.filter
const removeDups = (x, idx, arr) => arr.indexOf(x) === idx;

/** Sudoku Helpers */
const POSITIONS = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8]);

// Memoize func for perf
const calcPostion = (() => {
  const cache = {};
  return (id) => {
    if (cache[id]) return cache[id];
    const column = id % 9;
    const row = Math.floor(id / 9);
    const p = { row, column };
    cache[id] = p;
    return p;
  };
})();
const calcID = (() => {
  const cache = {};
  return (position) => {
    const key = JSON.stringify(position);
    if (cache[key]) return cache[key];
    const { row, column } = position;
    const id = row * 9 + column;
    cache[key] = id;
    return id;
  };
})();

const cornerNotesWithID = memoize(id => atom({
  key: `cornerNotes:${id}`,
  default: [],
}));

const toggleCornerNoteWithID = memoize(id => selector({
  key: `toggleCornerNote:${id}`,
  get: () => null,
  set: ({ get, set }, newValue) => {
    const corners = get(cornerNotesWithID(id));
    if (corners.includes(newValue)) {
      set(cornerNotesWithID(id), removeItem(corners, corners.indexOf(newValue)));
    } else {
      set(cornerNotesWithID(id), addItem(corners, newValue));
    }
  },
}));

const centerNotesWithID = memoize(id => atom({
  key: `centerNotes:${id}`,
  default: [],
}));

const toggleCenterNoteWithID = memoize(id => selector({
  key: `toggleCenterNote:${id}`,
  get: () => null,
  set: ({ get, set }, newValue) => {
    const centers = get(centerNotesWithID(id));
    if (centers.includes(newValue)) {
      set(centerNotesWithID(id), removeItem(centers, centers.indexOf(newValue)));
    } else {
      set(centerNotesWithID(id), addItem(centers, newValue));
    }
  },
}));

const valueWithID = memoize(id => atom({
  key: `value:${id}`,
  default: null,
}));

const findErrors = ({ id, get }) => {
  // TODO: Check the box for the id as well as columns and rows
  const { row, column } = calcPostion(id);
  const boxRowOffset = 3 * Math.floor(row / 3);
  const boxColOffset = 3 * Math.floor(column / 3);
  const currentValue = get(valueWithID(id));
  const foundErrors = [];

  POSITIONS.forEach(i => {
    // Check sibling row for dups
    const rowCheckID = calcID({ row, column: i });
    if (rowCheckID !== id) {
      const rowCheckValue = get(valueWithID(rowCheckID));
      if (rowCheckValue === currentValue) {
        foundErrors.push(rowCheckID);
      }
    }
    // Check sibling column for dups
    const colCheckID = calcID({ column, row: i });
    if (colCheckID !== id) {
      const colCheckValue = get(valueWithID(colCheckID));
      if (colCheckValue === currentValue) {
        foundErrors.push(colCheckID);
      }
    }

    // Check values in the same box for dups
    const boxCheckID = calcID({
      row:  Math.floor(i / 3) + boxRowOffset,
      column: i % 3 + boxColOffset
    });
    if (boxCheckID !== id) {
      const boxCheckValue = get(valueWithID(boxCheckID));
      if (boxCheckValue === currentValue) {
        foundErrors.push(boxCheckID);
      }
    }
  });

  return foundErrors;
};

const validatedValueWithID = memoize(id => selector({
  key: `validatedValue:${id}`,
  get: ({ get }) => get(valueWithID(id)),
  set: ({ get, set }, newValue) => {
    if (![null, 1, 2, 3, 4, 5, 5, 6, 7, 8, 9].includes(newValue)) return;
    if (get(primariesAtom).includes(id)) return;
    set(valueWithID(id), newValue);
    if (newValue == null && get(errorsAtom).includes(id)) {
      set(errorsAtom, removeItem(get(errorsAtom), get(errorsAtom).indexOf(id)));
    }

    // Remove errors that are no longer an issue
    set(
      errorsAtom,
      get(errorsAtom).filter(errID => findErrors({ id: errID, get }).length > 0)
    );
    // If we have a new value, check to see if that value created new errors
    if (newValue != null) {
      const foundErrors = findErrors({ id, get });
      if (foundErrors.length > 0) {
        foundErrors.push(id);
        set(errorsAtom, get(errorsAtom).concat(foundErrors).filter(removeDups));
      }
    }
  },
}));

const valueCounts = selector({
  key: 'valueCounts',
  get: ({ get }) => {
    return Array.from(new Array(9 * 9)).reduce((acc, _, idx) => {
      const value = get(validatedValueWithID(idx));
      if (value == null) return acc;
      if (acc[value] == null) {
        return { ...acc, [value]: 1 };
      }
      return { ...acc, [value]: acc[value] + 1 };
    }, {});
  },
});

const errorsAtom = atom({
  key: 'errors',
  default: [],
});

const primariesAtom = atom({
  key: 'primaries',
  default: [],
});

const primaryWithID = memoize(id => selector({
  get: () => null,
  set: ({ set }, newValue) => {
    set(validatedValueWithID(id), newValue);
    set(primariesAtom, xs => addItem(xs, id));
  },
}));

const backgroundWithID = memoize(id => atom({
  key: `background:${id}`,
  default: 'default',
}));

const inputModeAtom = atom({
  key: 'inputMode',
  default: 'value'
});

const selectionAtom = atom({
  key: 'selection',
  default: [],
});

const selectionBackground = selector({
  key: 'selectionBackground',
  get: ({ get }) => {
    // This should not be called as this selector is only for mass setting
    const currentSelection = get(selectionAtom);
    currentSelection.forEach(s => get(backgroundWithID(s)));
    return null;
  },
  set: ({ get, set }, newValue) => {
    const currentSelection = get(selectionAtom);
    currentSelection.forEach(s => set(backgroundWithID(s), newValue));
  },
});

const selectionFromInput = selector({
  key: 'selectionFromInput',
  get: ({ get }) => {
    // This should not be called as this selector is only for mass setting
    return null;
  },
  set: ({ get, set }, newValue) => {
    const currentSelection = get(selectionAtom);
    if (newValue != null) {
      const inputMode = get(inputModeAtom);
      let atomToSet;
      switch (inputMode) {
        case 'value':
          atomToSet = validatedValueWithID;
          break;
        case 'corners':
          atomToSet = toggleCornerNoteWithID;
          break;
        case 'center':
          atomToSet = toggleCenterNoteWithID;
          break;
        case 'primary':
          atomToSet = primaryWithID;
          break;
        default:
          throw new Error('Invalid input mode');
      }
      currentSelection.forEach(s => set(atomToSet(s), newValue));
    } else {
      currentSelection.forEach(s => {
        const hasValue = get(validatedValueWithID(s)) != null;
        if (hasValue) {
          set(validatedValueWithID(s), null);
        } else {
          set(cornerNotesWithID(s), []);
          set(centerNotesWithID(s), []);
        }
      });
    }
  },
});

const cellWithID = memoize(id => selector({
  key: `cell:${id}`,
  get: ({ get }) => {
    const value = get(validatedValueWithID(id));
    return {
      position: calcPostion(id),
      value,
      cornerNotes: get(cornerNotesWithID(id)),
      centerNotes: get(centerNotesWithID(id)),
      background: get(backgroundWithID(id)),
      isSelected: get(selectionAtom).includes(id),
      isPrimary: get(primariesAtom).includes(id),
      isCompleted: get(valueCounts)[value] === 9,
      hasError: get(errorsAtom).includes(id),
    }
  },
}));

export const useCellData = (id) => useRecoilValue(cellWithID(id));
export const useSetCellValue = (id) => useSetRecoilState(validatedValueWithID(id));
export const useSetCornerNotes = (id) => useSetRecoilState(cornerNotesWithID(id));
export const useSetCenterNotes = (id) => useSetRecoilState(centerNotesWithID(id));
export const useSetInputMode = () => useSetRecoilState(inputModeAtom);
export const useSetSelected = (id) => {
  const setSelected = useSetRecoilState(selectionAtom);
  return () => setSelected([id]);
}
export const useToggleSelection = (id) => {
  const [selection, setSelection] = useRecoilState(selectionAtom);
  return (isSelected) => {
    let newValue;
    if (typeof isSelected === 'function') {
      newValue = isSelected(selection.includes(id));
    } else {
      newValue = isSelected;
    }
    if (newValue !== true && newValue !== false) {
      throw new Error('Must call setSelected with boolean');
    }
    if (newValue && !selection.includes(id)) {
      setSelection(addItem(selection, id));
    } else if (!newValue && selection.includes(id)) {
      setSelection(removeItem(selection, selection.indexOf(id)))
    }
  };
};
export const useSetSelectionBackground = () => useSetRecoilState(selectionBackground);
export const useSetSelectionFromInput = () => useSetRecoilState(selectionFromInput);
