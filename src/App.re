[@bs.module]
external styles: {
  .
  "container": string,
  "controlsContainer": string,
  "sudokuContainer": string,
} =
  "./App.module.css";

[@react.component]
let make = () => {
  let setSelectionValue = SudokuState.useSetSelectionFromInput();
  let setInputMode = SudokuState.useSetInputMode();
  let clearSelection = SudokuState.useClearSelection();
  let solveSoduku = SudokuState.useSetSolutions();

  React.useEffect3(
    () => {
      let handleKeyboardEvent = event => {
        switch (event->Webapi.Dom.KeyboardEvent.key) {
        | "1"
        | "2"
        | "3"
        | "4"
        | "5"
        | "6"
        | "7"
        | "8"
        | "9" =>
          setSelectionValue(_ =>
            Some(int_of_string(event->Webapi.Dom.KeyboardEvent.key))
          )
        | "Backspace" => setSelectionValue(_ => None)
        | "z" => setInputMode(_ => SudokuState.Value)
        | "x" => setInputMode(_ => SudokuState.Corners)
        | "c" => setInputMode(_ => SudokuState.Center)
        | "*" => setInputMode(_ => SudokuState.Primary)
        | "S" => solveSoduku(_ => ())
        | _ => ()
        };
      };
      Webapi.Dom.document
      |> Webapi.Dom.Document.addKeyDownEventListener(handleKeyboardEvent);
      Some(
        () =>
          Webapi.Dom.document
          |> Webapi.Dom.Document.removeKeyDownEventListener(
               handleKeyboardEvent,
             ),
      );
    },
    (setInputMode, setSelectionValue, solveSoduku),
  );

  let gameRef = React.useRef(Js.Nullable.null);
  React.useEffect2(
    () => {
      let deselectCells = event => {
        switch (gameRef.current->Js.Nullable.toOption) {
        | None => ()
        | Some(element) =>
          let target = event->Webapi.Dom.MouseEvent.target;
          if (!(
                element
                |> Webapi.Dom.Element.contains(
                     Webapi.Dom.EventTarget.unsafeAsElement(target),
                   )
              )) {
            clearSelection();
          };
        };
      };
      Webapi.Dom.document
      |> Webapi.Dom.Document.addClickEventListener(deselectCells);
      Some(
        () =>
          Webapi.Dom.document
          |> Webapi.Dom.Document.removeClickEventListener(deselectCells),
      );
    },
    (gameRef, clearSelection),
  );

  <div className={styles##container}>
    <main
      className={styles##sudokuContainer}
      ref={ReactDOMRe.Ref.domRef(gameRef)}>
      {Belt.List.make(9 * 9, None)
       ->Belt.List.mapWithIndex((idx, _) =>
           <SudokuCell key={string_of_int(idx)} id=idx />
         )
       ->Belt.List.toArray
       ->React.array}
    </main>
    <aside className={styles##controlsContainer} />
  </div>;
};
