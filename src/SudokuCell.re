[@bs.module] external styles: Js.Dict.t(string) = "./SudokuCell.module.css";

let getStyle = prop => styles->Js.Dict.unsafeGet(prop);
let cellWidth = 56;
let cellHeight = 56;

module CellCenters = {
  [@react.component]
  let make = (~centers) => {
    let centerText =
      centers
      ->Belt.Set.Int.toList
      ->Belt.List.sort((a, b) => a - b)
      ->Belt.List.map(string_of_int)
      ->String.concat("", _);
    <div className={getStyle("centerText")}>
      {React.string(centerText)}
    </div>;
  };
};

module CellCorners = {
  [@react.component]
  let make = (~corners) => {
    let renderCorner = (idx, c) =>
      <div key=c className={getStyle({j|corner-$idx|j})}>
        {React.string(c)}
      </div>;
    corners
    ->Belt.Set.Int.toList
    ->Belt.List.sort((a, b) => a - b)
    ->Belt.List.map(string_of_int)
    ->Belt.List.mapWithIndex(renderCorner)
    ->Belt.List.toArray
    ->React.array;
  };
};

[@react.component]
let make = (~id) => {
  let cell = SudokuState.useCellData(id);
  let row = cell.position.row;
  let col = cell.position.col;
  let setSelected = SudokuState.useSetSelected(id);
  let toggleSelection = SudokuState.useToggleSelection(id);
  let onClick =
    React.useCallback2(
      (e: ReactEvent.Mouse.t) =>
        if (e->ReactEvent.Mouse.metaKey || e->ReactEvent.Mouse.ctrlKey) {
          toggleSelection(s => !s);
        } else {
          setSelected();
        },
      (setSelected, toggleSelection),
    );

  let containerClassName =
    Classnames.make([
      getStyle({j|row-$row|j}),
      getStyle({j|col-$col|j}),
      getStyle("cell"),
      getStyle("primary")->Classnames.ifTrue(cell.isPrimary),
      getStyle("selected")->Classnames.ifTrue(cell.isSelected),
      getStyle("row-or-col-selected")
      ->Classnames.ifTrue(
          !cell.isSelected && (cell.isRowSelected || cell.isColSelected),
        ),
      getStyle("indirectly-selected")
      ->Classnames.ifTrue(cell.isIndirectlySelected),
      getStyle("completed")->Classnames.ifTrue(cell.isCompleted),
      getStyle("error")->Classnames.ifTrue(cell.hasError),
    ]);

  <div className=containerClassName onClick>
    {switch (cell.value) {
     | None => <CellCorners corners={cell.cornerNotes} />
     | Some(value) =>
       <div className={getStyle("value")}> {React.int(value)} </div>
     }}
  </div>;
};
