type inputMode =
  | Value
  | Corners
  | Center
  | Primary;

type position = {
  row: int,
  col: int,
};

type cell = {
  position,
  value: option(int),
  cornerNotes: Belt.Set.Int.t,
  centerNotes: Belt.Set.Int.t,
  isPrimary: bool,
  isSelected: bool,
  isIndirectlySelected: bool,
  isRowSelected: bool,
  isColSelected: bool,
  isCompleted: bool,
  hasError: bool,
};

let useCellData: int => cell;
let useSetSelected: (int, unit) => unit;
let useToggleSelection: (int, bool => bool) => unit;
let useSetSelectionFromInput: unit => Recoil.setter(option(int));
let useSetInputMode: unit => Recoil.setter(inputMode);
let useClearSelection: (unit, unit) => unit;
let useSetSolutions: unit => Recoil.setter(unit);
