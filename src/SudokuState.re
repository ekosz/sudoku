open SudokuUtils;

let cornerNotesWithID =
  memoizeByInt(id => {
    Recoil.atom({key: {j|cornerNotes.$id|j}, default: Belt.Set.Int.empty})
  });

let toggleCornerNoteWithID =
  memoizeByInt(id => {
    Recoil.selectorWithWrite({
      key: {j|toggleCornerNote:$id|j},
      get: ({get: _get}) => 0, // Getter never called
      set: ({get, set}, newValue) => {
        let corners = get(cornerNotesWithID(id));
        if (corners->Belt.Set.Int.has(newValue)) {
          set(
            cornerNotesWithID(id),
            corners->Belt.Set.Int.remove(newValue),
          );
        } else {
          set(cornerNotesWithID(id), corners->Belt.Set.Int.add(newValue));
        };
      },
    })
  });

let centerNotesWithID =
  memoizeByInt(id => {
    Recoil.atom({key: {j|centerNotes.$id|j}, default: Belt.Set.Int.empty})
  });

let toggleCenterNoteWithID =
  memoizeByInt(id => {
    Recoil.selectorWithWrite({
      key: {j|toggleCenterNote:$id|j},
      get: ({get: _get}) => 0, // Getter never called
      set: ({get, set}, newValue) => {
        let centers = get(centerNotesWithID(id));
        if (centers->Belt.Set.Int.has(newValue)) {
          set(
            centerNotesWithID(id),
            centers->Belt.Set.Int.remove(newValue),
          );
        } else {
          set(centerNotesWithID(id), centers->Belt.Set.Int.add(newValue));
        };
      },
    })
  });

let primariesAtom =
  Recoil.atom({key: "primaries", default: Belt.Set.Int.empty});

let valueWithID =
  memoizeByInt(id => {
    Recoil.atom({key: {j|value:$id|j}, default: (None: option(int))})
  });

let isValidValue = (newValue): bool =>
  switch (newValue) {
  | Some(value) =>
    if (value > 0 || value < 10) {
      true;
    } else {
      false;
    }
  | None => true
  };

let validatedValueWithID =
  memoizeByInt(id => {
    Recoil.selectorWithWrite({
      key: {j|validatedValue:$id|j},
      get: ({get}) => get(valueWithID(id)),
      set: ({get, set}, newValue) =>
        if (!get(primariesAtom)->Belt.Set.Int.has(id)
            && isValidValue(newValue)) {
          set(valueWithID(id), newValue);
        },
    })
  });

let primaryWithID =
  memoizeByInt(id =>
    Recoil.selectorWithWrite({
      key: {j|primaryWithID:$id|j},
      get: ({get: _get}) => None,
      set: ({get, set}, newValue) => {
        set(validatedValueWithID(id), newValue);
        set(primariesAtom, get(primariesAtom)->Belt.Set.Int.add(id));
      },
    })
  );

type inputMode =
  | Value
  | Corners
  | Center
  | Primary;
let inputModeAtom = Recoil.atom({key: "inputMode", default: Value});

let valueCounts =
  Recoil.selector({
    key: "valueCounts",
    get: ({get}) => {
      Belt.List.make(9 * 9, None)
      ->Belt.List.reduceWithIndex(
          Belt.Map.Int.empty,
          (acc, _item, idx) => {
            let maybeValue = get(validatedValueWithID(idx));
            switch (maybeValue) {
            | None => acc
            | Some(value) =>
              switch (acc->Belt.Map.Int.get(value)) {
              | None => acc->Belt.Map.Int.set(value, 1)
              | Some(currentCount) =>
                acc->Belt.Map.Int.set(value, currentCount + 1)
              }
            };
          },
        );
    },
  });

let calcID = (row, col) => row * 9 + col;
let calcErrors = (~get, ~nextID) => {
  // First build map of Value -> list(ID)
  Belt.List.make(9, None)
  ->Belt.List.reduceWithIndex(
      Belt.Map.Int.empty,
      (acc, _, idx) => {
        let id = nextID(idx);
        let maybeValue = get(validatedValueWithID(id));
        switch (maybeValue) {
        | None => acc
        | Some(value) =>
          switch (acc->Belt.Map.Int.get(value)) {
          | Some(current) => acc->Belt.Map.Int.set(value, [id, ...current])
          | None => acc->Belt.Map.Int.set(value, [id])
          }
        };
      },
    )
  ->Belt.Map.Int.reduce([], (acc, _key, value) =>
      if (Belt.List.length(value) > 1) {
        Belt.List.concat(acc, value);
      } else {
        acc;
      }
    );
};

let errors =
  Recoil.selector({
    key: "errors",
    get: ({get}) => {
      let nineList = Belt.List.make(9, None);
      nineList->Belt.List.reduceWithIndex(Belt.Set.Int.empty, (acc, _, i) => {
        Belt.List.concatMany([|
          // Row
          calcErrors(~get, ~nextID=colIdx => calcID(i, colIdx)),
          // Column
          calcErrors(~get, ~nextID=rowIdx => calcID(rowIdx, i)),
          // Box
          calcErrors(~get, ~nextID=boxIdx =>
            calcID(boxIdx / 3 + i / 3, boxIdx mod 3 + i mod 3)
          ),
        |])
        ->Belt.List.reduce(acc, (acc, error) => acc->Belt.Set.Int.add(error))
      });
    },
  });

let selectionAtom =
  Recoil.atom({key: "selection", default: Belt.Set.Int.empty});

let selectionFromInput =
  Recoil.selectorWithWrite({
    key: "selectionFromInput",
    get: ({get: _get}) => {
      None;
          // This should not be called as this selector is only for mass setting
    },
    set: ({get, set}, newMaybeValue) => {
      let currentSelection = get(selectionAtom);
      switch (newMaybeValue) {
      | Some(newValue) =>
        let inputMode = get(inputModeAtom);
        currentSelection->Belt.Set.Int.forEach(id =>
          switch (inputMode) {
          | Value => set(validatedValueWithID(id), newMaybeValue)
          | Corners => set(toggleCornerNoteWithID(id), newValue)
          | Center => set(toggleCenterNoteWithID(id), newValue)
          | Primary => set(primaryWithID(id), newMaybeValue)
          }
        );
      | None =>
        currentSelection->Belt.Set.Int.forEach(s => {
          switch (get(validatedValueWithID(s))) {
          | Some(_) => set(validatedValueWithID(s), None)
          | None =>
            set(cornerNotesWithID(s), Belt.Set.Int.empty);
            set(centerNotesWithID(s), Belt.Set.Int.empty);
          }
        })
      };
    },
  });

let mapHasValueEq = (map, key, value) => {
  switch (map->Belt.Map.Int.get(key)) {
  | None => false
  | Some(x) => x == value
  };
};

type position = {
  row: int,
  col: int,
};
let calcPostion = id => {row: id / 9, col: id mod 9};
type cell = {
  position,
  value: option(int),
  cornerNotes: Belt.Set.Int.t,
  centerNotes: Belt.Set.Int.t,
  isPrimary: bool,
  isSelected: bool,
  isCompleted: bool,
  hasError: bool,
};
let cellWithID =
  memoizeByInt(id =>
    Recoil.selector({
      key: {j|cell:$id|j},
      get: ({get}) => (
        {
          let value = get(validatedValueWithID(id));

          {
            position: calcPostion(id),
            value,
            cornerNotes: get(cornerNotesWithID(id)),
            centerNotes: get(centerNotesWithID(id)),
            isSelected: get(selectionAtom)->Belt.Set.Int.has(id),
            isPrimary: get(primariesAtom)->Belt.Set.Int.has(id),
            isCompleted:
              switch (value) {
              | None => false
              | Some(x) => get(valueCounts)->mapHasValueEq(x, 9)
              },
            hasError: get(errors)->Belt.Set.Int.has(id),
          };
        }: cell
      ),
    })
  );

let useCellData = id => Recoil.useRecoilValue(cellWithID(id));
let useSetCellValue = id =>
  Recoil.useSetRecoilState(validatedValueWithID(id));
let useSetCornerNotes = id =>
  Recoil.useSetRecoilState(cornerNotesWithID(id));
let useSetCenterNotes = id =>
  Recoil.useSetRecoilState(centerNotesWithID(id));
let useSetInputMode = () => Recoil.useSetRecoilState(inputModeAtom);
let useClearSelection = () => {
  let setSelected = Recoil.useSetRecoilState(selectionAtom);
  () => setSelected(_ => Belt.Set.Int.empty);
};
let useSetSelected = id => {
  let setSelected = Recoil.useSetRecoilState(selectionAtom);
  () => setSelected(_ => Belt.Set.Int.fromArray([|id|]));
};
let useToggleSelection = id => {
  let (selection, setSelection) = Recoil.useRecoilState(selectionAtom);
  isSelected => {
    let newValue: bool = isSelected(selection->Belt.Set.Int.has(id));
    if (newValue && !selection->Belt.Set.Int.has(id)) {
      setSelection(xs => xs->Belt.Set.Int.add(id));
    } else if (!newValue && selection->Belt.Set.Int.has(id)) {
      setSelection(xs => xs->Belt.Set.Int.remove(id));
    };
  };
};
let useSetSelectionFromInput = () =>
  Recoil.useSetRecoilState(selectionFromInput);
