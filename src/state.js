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
  const { row, column } = calcPostion(id);
  const currentValue = get(valueWithID(id));
  const foundErrors = [];

  POSITIONS.forEach(i => {
    // Check sibling row for dups
    const rowCheckID = row * 9 + i;
    if (rowCheckID !== id) {
      const rowCheckValue = get(valueWithID(rowCheckID));
      if (rowCheckValue === currentValue) {
        foundErrors.push(rowCheckID);
      }
    }
    // Check sibling column for dups
    const colCheckID = i * 9 + column;
    if (colCheckID !== id) {
      const colCheckValue = get(valueWithID(colCheckID));
      if (colCheckValue === currentValue) {
        foundErrors.push(colCheckID);
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

const errorsAtom = atom({
  key: 'errors',
  default: [],
});

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
    return {
      position: calcPostion(id),
      value: get(validatedValueWithID(id)),
      cornerNotes: get(cornerNotesWithID(id)),
      centerNotes: get(centerNotesWithID(id)),
      background: get(backgroundWithID(id)),
      isSelected: get(selectionAtom).includes(id),
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
